import {
  buildAutoPaymentNote,
  DEFAULT_MONTHLY_PAYMENT_AMOUNT,
  extractDefaultMonthlyAmount,
  normalizePaymentDate,
  pickMostCommonAmount,
  type AutoPaymentReason,
} from '../../src/shared/paymentProvisioning';

interface StudentProvisionRow {
  id: string;
  join_date?: string | null;
  created_at: string;
  created_by?: string | null;
  instructor_id?: string | null;
  is_active: number;
  deleted_at?: string | null;
}

interface PaymentRecord {
  id: string;
}

interface SettingRow {
  value: string;
}

interface OwnerAmountRow {
  amount: number | string;
  usage_count: number | string;
}

export async function resolveOwnerDefaultMonthlyAmount(
  db: D1Database,
  ownerId?: string | null,
): Promise<number> {
  if (!ownerId) {
    return DEFAULT_MONTHLY_PAYMENT_AMOUNT;
  }

  const setting = await db.prepare(
    "SELECT value FROM settings WHERE owner_id = ? AND section = 'payment' LIMIT 1",
  ).bind(ownerId).first<SettingRow>().catch(() => null);

  if (setting?.value) {
    let parsedValue: unknown = setting.value;

    try {
      parsedValue = JSON.parse(setting.value);
    } catch {
      parsedValue = setting.value;
    }

    const configuredAmount = extractDefaultMonthlyAmount(parsedValue);
    if (configuredAmount !== null) {
      return configuredAmount;
    }
  }

  const { results } = await db.prepare(`
    SELECT p.amount, COUNT(*) AS usage_count
    FROM payments p
    INNER JOIN students s ON s.id = p.student_id
    WHERE p.deleted_at IS NULL
      AND s.deleted_at IS NULL
      AND p.type = 'monthly'
      AND (s.created_by = ? OR s.instructor_id = ?)
    GROUP BY p.amount
    ORDER BY usage_count DESC, p.amount DESC
  `).bind(ownerId, ownerId).all<OwnerAmountRow>();

  return pickMostCommonAmount(results, DEFAULT_MONTHLY_PAYMENT_AMOUNT);
}

export async function ensureStudentHasInitialPayment(
  db: D1Database,
  input: {
    studentId: string;
    actorUserId: string;
    reason?: AutoPaymentReason;
  },
): Promise<{ created: boolean; paymentId?: string; amount?: number; date?: string }> {
  const { studentId, actorUserId, reason = 'student-created' } = input;

  const student = await db.prepare(`
    SELECT id, join_date, created_at, created_by, instructor_id, is_active, deleted_at
    FROM students
    WHERE id = ?
    LIMIT 1
  `).bind(studentId).first<StudentProvisionRow>();

  if (!student || student.deleted_at || !student.is_active) {
    return { created: false };
  }

  const existingPayment = await db.prepare(`
    SELECT id
    FROM payments
    WHERE student_id = ?
      AND deleted_at IS NULL
    LIMIT 1
  `).bind(studentId).first<PaymentRecord>();

  if (existingPayment?.id) {
    return { created: false };
  }

  const ownerId = student.created_by || student.instructor_id || actorUserId;
  const amount = await resolveOwnerDefaultMonthlyAmount(db, ownerId);
  const paymentId = crypto.randomUUID();
  const now = new Date().toISOString();
  const paymentDate = normalizePaymentDate(student.join_date || student.created_at, new Date());

  await db.prepare(`
    INSERT INTO payments (
      id,
      student_id,
      amount,
      date,
      type,
      notes,
      status,
      created_by,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, 'monthly', ?, 'pending', ?, ?, ?)
  `).bind(
    paymentId,
    studentId,
    amount,
    paymentDate,
    buildAutoPaymentNote(reason),
    actorUserId,
    now,
    now,
  ).run();

  return {
    created: true,
    paymentId,
    amount,
    date: paymentDate,
  };
}