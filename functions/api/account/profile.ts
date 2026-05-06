import type { D1PreparedStatement, Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { normalizeAvatarUrl } from '../../utils/avatar';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const ACCOUNT_PROFILE_SECTION = 'account_profile';

interface AccountProfileExtras {
  phone?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

interface AccountProfilePayload extends AccountProfileExtras {
  name?: string;
}

interface DisciplineAssignment {
  discipline: string;
  belt: string;
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: JSON_HEADERS,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readOptionalString(record: Record<string, unknown>, key: keyof AccountProfilePayload): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function parsePayload(value: unknown): AccountProfilePayload | null {
  if (!isRecord(value)) return null;

  return {
    name: readOptionalString(value, 'name'),
    phone: readOptionalString(value, 'phone'),
    date_of_birth: readOptionalString(value, 'date_of_birth'),
    emergency_contact_name: readOptionalString(value, 'emergency_contact_name'),
    emergency_contact_phone: readOptionalString(value, 'emergency_contact_phone'),
    notes: readOptionalString(value, 'notes'),
  };
}

function parseSettingsExtras(value: string | undefined): AccountProfileExtras {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!isRecord(parsed)) return {};

    return {
      phone: readOptionalString(parsed, 'phone'),
      date_of_birth: readOptionalString(parsed, 'date_of_birth'),
      emergency_contact_name: readOptionalString(parsed, 'emergency_contact_name'),
      emergency_contact_phone: readOptionalString(parsed, 'emergency_contact_phone'),
      notes: readOptionalString(parsed, 'notes'),
    };
  } catch {
    return {};
  }
}

function isDisciplineAssignment(value: unknown): value is DisciplineAssignment {
  return isRecord(value) && typeof value.discipline === 'string' && typeof value.belt === 'string';
}

function parseDisciplines(value: unknown): DisciplineAssignment[] {
  if (Array.isArray(value)) return value.filter(isDisciplineAssignment);
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isDisciplineAssignment) : [];
  } catch {
    return [];
  }
}

function hasStringValue(value: string | undefined): value is string {
  return typeof value === 'string';
}

function createStudentUpdate(env: Env, studentId: string, payload: AccountProfilePayload, now: string): D1PreparedStatement | null {
  let query = 'UPDATE students SET updated_at = ?';
  const params: (string | null)[] = [now];

  if (hasStringValue(payload.name)) {
    query += ', name = ?';
    params.push(payload.name.trim());
  }
  if (hasStringValue(payload.phone)) {
    query += ', phone = ?';
    params.push(payload.phone.trim());
  }
  if (hasStringValue(payload.date_of_birth)) {
    query += ', date_of_birth = ?';
    params.push(payload.date_of_birth.trim());
  }
  if (hasStringValue(payload.emergency_contact_name)) {
    query += ', emergency_contact_name = ?';
    params.push(payload.emergency_contact_name.trim());
  }
  if (hasStringValue(payload.emergency_contact_phone)) {
    query += ', emergency_contact_phone = ?';
    params.push(payload.emergency_contact_phone.trim());
  }
  if (hasStringValue(payload.notes)) {
    query += ', notes = ?';
    params.push(payload.notes.trim());
  }

  if (params.length === 1) return null;

  query += ' WHERE id = ?';
  params.push(studentId);

  return env.DB.prepare(query).bind(...params);
}

function createAccountSettingsUpsert(env: Env, ownerId: string, payload: AccountProfilePayload, now: string): D1PreparedStatement {
  const value = JSON.stringify({
    phone: payload.phone?.trim() ?? '',
    date_of_birth: payload.date_of_birth?.trim() ?? '',
    emergency_contact_name: payload.emergency_contact_name?.trim() ?? '',
    emergency_contact_phone: payload.emergency_contact_phone?.trim() ?? '',
    notes: payload.notes?.trim() ?? '',
  });

  return env.DB.prepare(
    `INSERT INTO settings (id, owner_id, section, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET value = ?, updated_at = ?`
  ).bind(`${ownerId}-${ACCOUNT_PROFILE_SECTION}`, ownerId, ACCOUNT_PROFILE_SECTION, value, now, now, value, now);
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return jsonResponse({ error: auth.error }, { status: 401 });
    }

    if (auth.user.student_id) {
      const student = await env.DB.prepare('SELECT * FROM students WHERE id = ?')
        .bind(auth.user.student_id)
        .first<Record<string, unknown>>();

      if (!student) {
        return jsonResponse({ error: 'Student profile not found' }, { status: 404 });
      }

      return jsonResponse({
        ...student,
        role: auth.user.role,
        avatar_url: normalizeAvatarUrl(student.avatar_url),
        disciplines: parseDisciplines(student.disciplines),
      });
    }

    const settingsRow = await env.DB.prepare('SELECT value FROM settings WHERE owner_id = ? AND section = ? LIMIT 1')
      .bind(auth.user.id, ACCOUNT_PROFILE_SECTION)
      .first<{ value: string }>();
    const extras = parseSettingsExtras(settingsRow?.value);
    const now = new Date().toISOString();

    return jsonResponse({
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      role: auth.user.role,
      avatar_url: normalizeAvatarUrl(auth.user.avatar_url),
      discipline: 'Not assigned',
      belt: 'Not assigned',
      disciplines: [],
      join_date: now,
      is_active: 1,
      created_at: now,
      updated_at: now,
      ...extras,
    });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return jsonResponse({ error: auth.error }, { status: 401 });
    }

    const payload = parsePayload(await request.json());
    if (!payload) {
      return jsonResponse({ error: 'Invalid profile payload' }, { status: 400 });
    }

    if (hasStringValue(payload.name) && payload.name.trim().length < 2) {
      return jsonResponse({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const statements: D1PreparedStatement[] = [];

    if (hasStringValue(payload.name)) {
      statements.push(
        env.DB.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?')
          .bind(payload.name.trim(), now, auth.user.id)
      );
    }

    if (auth.user.student_id) {
      const studentUpdate = createStudentUpdate(env, auth.user.student_id, payload, now);
      if (studentUpdate) statements.push(studentUpdate);
    } else {
      statements.push(createAccountSettingsUpsert(env, auth.user.id, payload, now));
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, { status: 500 });
  }
}