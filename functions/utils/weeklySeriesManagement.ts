import type { D1Database, D1PreparedStatement } from '../types/index';
import { currentUtcDateKey, materializeWeeklyClasses, parseWeeklyPattern, type WeeklyPattern } from './weeklyRecurrence';

interface WeeklyParent {
  id: string;
  date: string;
  time: string;
  name: string;
  discipline: string;
  location: string;
  instructor: string;
  max_students: number;
  description: string | null;
  recurrence_pattern: string | null;
  is_active: number;
}

interface UpcomingSession {
  id: string;
  date: string;
  time: string;
  deleted_at: string | null;
  is_active: number;
  active_enrollments: number;
  attendance_records: number;
}

export interface WeeklySeriesChanges {
  name?: string;
  discipline?: string;
  date?: string;
  time?: string;
  location?: string;
  instructor?: string;
  maxStudents?: number;
  description?: string;
  recurrencePattern?: unknown;
  isActive?: boolean;
}

export class WeeklySeriesError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
    this.name = 'WeeklySeriesError';
  }
}

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function occursOn(date: string, startDate: string, pattern: WeeklyPattern): boolean {
  if (!isValidDateKey(date) || date < startDate || (pattern.endDate && date > pattern.endDate)) return false;
  return pattern.days.includes(new Date(date + 'T00:00:00Z').getUTCDay());
}

function changedText(value: unknown, fallback: string, label: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !value.trim() || value.length > 200) {
    throw new WeeklySeriesError(label + ' no es válido.');
  }
  return value.trim();
}

function parseUpdatePattern(value: unknown, fallback: string | null): { pattern: WeeklyPattern; json: string } {
  const json = value === undefined ? fallback : JSON.stringify(value);
  const pattern = parseWeeklyPattern(json ?? null);
  if (!pattern) throw new WeeklySeriesError('Selecciona al menos un día semanal válido.');
  if (value !== undefined && (typeof value !== 'object' || value === null || Array.isArray(value))) {
    throw new WeeklySeriesError('La recurrencia debe ser un objeto semanal.');
  }
  return { pattern, json: json ?? '' };
}

/** Update only a template and its future sessions. Historical attendance and manual exceptions remain intact. */
export async function updateWeeklySeries(
  db: D1Database, branchId: string, parentId: string, actorId: string,
  changes: WeeklySeriesChanges, today = currentUtcDateKey(),
): Promise<void> {
  const parent = await db.prepare(`SELECT id, date, time, name, discipline, location, instructor,
    max_students, description, recurrence_pattern, is_active
    FROM classes WHERE id = ? AND branch_id = ? AND is_recurring = 1
      AND parent_course_id IS NULL AND deleted_at IS NULL`
  ).bind(parentId, branchId).first<WeeklyParent>();
  if (!parent) throw new WeeklySeriesError('La plantilla semanal no existe.', 404);

  const date = changedText(changes.date, parent.date, 'Fecha inicial');
  if (!isValidDateKey(date)) throw new WeeklySeriesError('La fecha inicial no es válida.');
  const time = changedText(changes.time, parent.time, 'Hora');
  if (!CLOCK.test(time)) throw new WeeklySeriesError('La hora debe tener formato HH:MM.');
  const previousPattern = parseWeeklyPattern(parent.recurrence_pattern);
  if (!previousPattern) throw new WeeklySeriesError('La recurrencia semanal existente no es válida.', 409);
  const { pattern, json } = parseUpdatePattern(changes.recurrencePattern, parent.recurrence_pattern);
  if (pattern.endDate && pattern.endDate < date) throw new WeeklySeriesError('La fecha de término es anterior al inicio.');
  const name = changedText(changes.name, parent.name, 'Nombre');
  const discipline = changedText(changes.discipline, parent.discipline, 'Disciplina');
  const location = changedText(changes.location, parent.location, 'Sede');
  const instructor = changedText(changes.instructor, parent.instructor, 'Instructor');
  const maxStudents = changes.maxStudents ?? parent.max_students;
  if (!Number.isInteger(maxStudents) || maxStudents < 1 || maxStudents > 500) throw new WeeklySeriesError('Los cupos deben estar entre 1 y 500.');
  if (changes.description !== undefined && (typeof changes.description !== 'string' || changes.description.length > 5000)) {
    throw new WeeklySeriesError('La descripción no es válida.');
  }
  if (changes.isActive !== undefined && typeof changes.isActive !== 'boolean') throw new WeeklySeriesError('Estado de horario inválido.');
  const description = changes.description === undefined ? parent.description : changes.description;
  const active = changes.isActive === undefined ? parent.is_active : Number(changes.isActive);
  const { results } = await db.prepare(`SELECT c.id, c.date, c.time, c.deleted_at, c.is_active,
      (SELECT COUNT(*) FROM class_enrollments e WHERE e.class_id = c.id AND e.enrollment_status = 'active') AS active_enrollments,
      (SELECT COUNT(*) FROM attendance a WHERE a.class_id = c.id) AS attendance_records
    FROM classes c WHERE c.parent_course_id = ? AND c.branch_id = ? AND c.date >= ?`
  ).bind(parentId, branchId, today).all<UpcomingSession>();
  const rows = selectManagedFutureSessions(results ?? [], parent.date, previousPattern);

  const plan = planFutureSeriesChanges(rows, date, time, pattern);
  if (plan.blocked.length > 0) {
    throw new WeeklySeriesError('Hay clases con alumnos inscritos o asistencias en días que se quitarían. Modifica esas sesiones individualmente antes de cambiar la plantilla.', 409);
  }
  if (plan.conflicts.length > 0) {
    throw new WeeklySeriesError('El nuevo horario coincide con una sesión existente o una excepción eliminada. Revisa las clases de ese día.', 409);
  }
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    db.prepare(`UPDATE classes SET name=?, discipline=?, date=?, time=?, location=?, instructor=?,
      max_students=?, description=?, recurrence_pattern=?, is_active=?, updated_by=?, updated_at=?
      WHERE id=? AND branch_id=? AND deleted_at IS NULL`).bind(
      name, discipline, date, time, location, instructor, maxStudents, description, json, active,
      actorId, now, parentId, branchId,
    ),
  ];
  for (const row of rows) {
    if (row.deleted_at !== null) continue;
    if (!occursOn(row.date, date, pattern)) {
      statements.push(db.prepare(`UPDATE classes SET deleted_at=?, updated_by=?, updated_at=?
        WHERE id=? AND branch_id=? AND deleted_at IS NULL`).bind(now, actorId, now, row.id, branchId));
    } else {
      statements.push(db.prepare(`UPDATE classes SET name=?, discipline=?, time=?, location=?, instructor=?,
        max_students=?, description=?, is_active=?, updated_by=?, updated_at=?
        WHERE id=? AND branch_id=? AND deleted_at IS NULL`).bind(
        name, discipline, time, location, instructor, maxStudents, description,
        changes.isActive === undefined ? row.is_active : active, actorId, now, row.id, branchId,
      ));
    }
  }
  await db.batch(statements);
  if (active === 1) await materializeWeeklyClasses(db, branchId, today);
}

/** Keep manually rescheduled off-pattern instances outside bulk edits; they are individual exceptions. */
export function selectManagedFutureSessions(
  rows: readonly UpcomingSession[], previousStartDate: string, previousPattern: WeeklyPattern,
): UpcomingSession[] {
  return rows.filter((row) => row.deleted_at !== null || occursOn(row.date, previousStartDate, previousPattern));
}

export function planFutureSeriesChanges(
  rows: readonly UpcomingSession[], startDate: string, targetTime: string, pattern: WeeklyPattern,
): { blocked: string[]; conflicts: string[] } {
  const blocked: string[] = [];
  const conflicts: string[] = [];
  for (const row of rows) {
    if (row.deleted_at !== null) continue;
    if (!occursOn(row.date, startDate, pattern)) {
      if (row.active_enrollments > 0 || row.attendance_records > 0) blocked.push(row.id);
    } else if (row.time !== targetTime && rows.some((other) =>
      other.id !== row.id && other.date === row.date && other.time === targetTime)) {
      conflicts.push(row.id);
    }
  }
  return { blocked, conflicts };
}
