/**
 * Server-side belt progression helpers.
 * Mirrors `src/lib/beltProgression.ts` so both runtimes stay in sync.
 *
 * Centralised here so backend endpoints (`/api/sparring`,
 * `/api/student/progression`, `/api/students/:id/progression`) always evaluate
 * the same rules and emit the same belt-ready notification.
 */

import { Env } from '../types/index';
import { ensureNotificationsSchema, withNotificationsTable } from './notifications';

export const BASE_CLASSES_REQUIRED = 100;
export const BASE_SPARRING_REQUIRED = 50;
export const BASE_TOURNAMENTS_OPTIONAL = 1;

const BELT_LADDERS: Record<string, readonly string[]> = {
  'Brazilian Jiu-Jitsu': ['White', 'Blue', 'Purple', 'Brown', 'Black', 'Red/White', 'Red', 'Black/Red'],
  'Brazilian Jiu-Jitsu Gi': ['White', 'Blue', 'Purple', 'Brown', 'Black', 'Red/White', 'Red', 'Black/Red'],
  'Brazilian Jiu-Jitsu No-Gi': ['White', 'Blue', 'Purple', 'Brown', 'Black', 'Red/White', 'Red', 'Black/Red'],
  'Brazilian Jiu-Jitsu Kids': ['White', 'Gray', 'Yellow', 'Orange', 'Green'],
  Karate: ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'],
  Taekwondo: ['White', 'Yellow', 'Green', 'Blue', 'Red', 'Black'],
  Kickboxing: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  'Muay Thai': ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  MMA: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  Jiujitsu: ['White', 'Blue', 'Purple', 'Brown', 'Black', 'Red/White', 'Red', 'Black/Red'],
  Boxing: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
  'Kenpo Karate': ['White', 'Yellow', 'Orange', 'Purple', 'Blue', 'Green', 'Brown', 'Black'],
  Weightlifting: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
};

const DEFAULT_LADDER: readonly string[] = [
  'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black',
];

export interface ProgressionRequirements {
  classes: number;
  sparrings: number;
  tournaments: number;
  tournamentsOptional: true;
}

export interface ProgressionEvaluation {
  tierIndex: number;
  currentBelt: string;
  nextBelt: string | null;
  requirements: ProgressionRequirements;
  attended: { classes: number; sparrings: number; tournaments: number };
  remaining: { classes: number; sparrings: number; tournaments: number };
  percent: { classes: number; sparrings: number; overall: number };
  readyForExam: boolean;
  status: 'on-track' | 'almost-there' | 'ready-for-exam' | 'final-belt';
}

function ladderFor(discipline: string): readonly string[] {
  return BELT_LADDERS[discipline] ?? DEFAULT_LADDER;
}

export function getTierIndex(currentBelt: string, discipline: string): number {
  const ladder = ladderFor(discipline);
  const idx = ladder.findIndex((b) => b.toLowerCase() === currentBelt.trim().toLowerCase());
  return idx === -1 ? 0 : idx;
}

export function getNextBelt(currentBelt: string, discipline: string): string | null {
  const ladder = ladderFor(discipline);
  const idx = getTierIndex(currentBelt, discipline);
  return idx >= ladder.length - 1 ? null : ladder[idx + 1];
}

export function getRequirementsForTier(tier: number): ProgressionRequirements {
  const safe = Math.max(0, Math.floor(tier));
  const m = 2 ** safe;
  return {
    classes: BASE_CLASSES_REQUIRED * m,
    sparrings: BASE_SPARRING_REQUIRED * m,
    tournaments: BASE_TOURNAMENTS_OPTIONAL * m,
    tournamentsOptional: true,
  };
}

function clampPercent(v: number): number {
  if (!Number.isFinite(v) || v < 0) return 0;
  if (v > 100) return 100;
  return Math.round(v);
}

export interface ProgressionInput {
  currentBelt: string;
  discipline: string;
  classesAttended: number;
  sparringSessions: number;
  tournamentsAttended: number;
}

export function evaluateProgression(input: ProgressionInput): ProgressionEvaluation {
  const tierIndex = getTierIndex(input.currentBelt, input.discipline);
  const nextBelt = getNextBelt(input.currentBelt, input.discipline);
  const requirements = getRequirementsForTier(tierIndex);

  const attended = {
    classes: Math.max(0, Math.floor(input.classesAttended)),
    sparrings: Math.max(0, Math.floor(input.sparringSessions)),
    tournaments: Math.max(0, Math.floor(input.tournamentsAttended)),
  };

  const remaining = {
    classes: Math.max(0, requirements.classes - attended.classes),
    sparrings: Math.max(0, requirements.sparrings - attended.sparrings),
    tournaments: Math.max(0, requirements.tournaments - attended.tournaments),
  };

  const percent = {
    classes: clampPercent((attended.classes / requirements.classes) * 100),
    sparrings: clampPercent((attended.sparrings / requirements.sparrings) * 100),
    overall: clampPercent(
      ((attended.classes + attended.sparrings) /
        (requirements.classes + requirements.sparrings)) * 100
    ),
  };

  const isFinal = nextBelt === null;
  const readyForExam = !isFinal &&
    attended.classes >= requirements.classes &&
    attended.sparrings >= requirements.sparrings;

  let status: ProgressionEvaluation['status'];
  if (isFinal) status = 'final-belt';
  else if (readyForExam) status = 'ready-for-exam';
  else if (percent.overall >= 80) status = 'almost-there';
  else status = 'on-track';

  return { tierIndex, currentBelt: input.currentBelt, nextBelt, requirements, attended, remaining, percent, readyForExam, status };
}

interface StudentProgressionRow {
  id: string;
  name: string;
  belt: string;
  discipline: string;
  instructor_id: string | null;
}

interface CountRow { value: number }

/**
 * Fetches the raw counts for a student and returns the evaluated progression.
 * Returns null when the student does not exist.
 */
export async function fetchStudentProgression(
  db: Env['DB'],
  studentId: string
): Promise<{ student: StudentProgressionRow; evaluation: ProgressionEvaluation } | null> {
  const student = await db.prepare(
    'SELECT id, name, belt, discipline, instructor_id FROM students WHERE id = ? AND deleted_at IS NULL'
  ).bind(studentId).first<StudentProgressionRow>();

  if (!student) return null;

  const classes = await db.prepare(
    'SELECT COUNT(*) AS value FROM attendance WHERE student_id = ? AND attended = 1'
  ).bind(studentId).first<CountRow>();

  const sparrings = await db.prepare(
    'SELECT COALESCE(SUM(sessions_count), 0) AS value FROM sparring_sessions WHERE student_id = ? AND deleted_at IS NULL'
  ).bind(studentId).first<CountRow>();

  const tournaments = await db.prepare(
    'SELECT COUNT(*) AS value FROM tournament_participations WHERE student_id = ? AND deleted_at IS NULL'
  ).bind(studentId).first<CountRow>();

  const evaluation = evaluateProgression({
    currentBelt: student.belt ?? 'White',
    discipline: student.discipline ?? '',
    classesAttended: classes?.value ?? 0,
    sparringSessions: sparrings?.value ?? 0,
    tournamentsAttended: tournaments?.value ?? 0,
  });

  return { student, evaluation };
}

interface BeltReadyNotificationOptions {
  db: Env['DB'];
  studentId: string;
  studentName: string;
  currentBelt: string;
  nextBelt: string;
  instructorId: string | null;
}

/**
 * Sends a single "belt ready" notification to the student's instructor.
 * Idempotent: the action_type + metadata combination is unique per student tier.
 */
export async function notifyInstructorOfReadiness(
  options: BeltReadyNotificationOptions
): Promise<void> {
  const { db, studentId, studentName, currentBelt, nextBelt, instructorId } = options;
  if (!instructorId) return;

  await ensureNotificationsSchema(db);

  const metadata = JSON.stringify({
    student_id: studentId,
    student_name: studentName,
    current_belt: currentBelt,
    target_belt: nextBelt,
  });

  await withNotificationsTable(db, async () => {
    const existing = await db.prepare(
      `SELECT id FROM notifications
        WHERE user_id = ?
          AND action_type = 'belt_exam_ready'
          AND metadata = ?
          AND read = 0`
    ).bind(instructorId, metadata).first<{ id: string }>();

    if (existing) return;

    const id = crypto.randomUUID();
    const message = `${studentName} has completed all the requirements to test for ${nextBelt} belt.`;

    await db.prepare(
      `INSERT INTO notifications (
        id, user_id, message, type, read, created_at,
        requires_confirmation, action_type, metadata
      ) VALUES (?, ?, ?, ?, 0, ?, 0, 'belt_exam_ready', ?)`
    ).bind(
      id,
      instructorId,
      message,
      'belt_exam_ready',
      new Date().toISOString(),
      metadata,
    ).run();
  });
}
