/**
 * Idempotently ensures the sparring + tournament tables exist.
 * Mirrors `migrations/add_sparring_and_progression_system.sql` so freshly
 * provisioned D1 databases self-heal on first request.
 */

import { Env } from '../types/index';

export async function ensureSparringSchema(db: Env['DB']): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sparring_sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT,
      instructor_id TEXT,
      sessions_count INTEGER NOT NULL DEFAULT 1,
      session_date TEXT NOT NULL,
      intensity TEXT,
      partner_name TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `).run();

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_student ON sparring_sessions(student_id, deleted_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_class ON sparring_sessions(class_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_date ON sparring_sessions(session_date)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_instructor_date ON sparring_sessions(instructor_id, session_date)`).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS tournament_participations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      tournament_name TEXT NOT NULL,
      tournament_date TEXT NOT NULL,
      belt_at_time TEXT,
      placement TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `).run();

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tournament_student ON tournament_participations(student_id, deleted_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tournament_date ON tournament_participations(tournament_date)`).run();
}
