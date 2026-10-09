/**
 * Idempotently ensures the sparring + tournament tables exist.
 * Mirrors `migrations/add_sparring_and_progression_system.sql` so freshly
 * provisioned D1 databases self-heal on first request.
 */

import { Env } from '../types/index';

type OperationalTable = 'sparring_sessions' | 'tournament_participations';

async function ensureTenantColumn(db: Env['DB'], table: OperationalTable): Promise<void> {
  try {
    await db.prepare(`ALTER TABLE ${table} ADD COLUMN organization_id TEXT`).run();
  } catch (error) {
    if (!/duplicate column name/i.test(error instanceof Error ? error.message : String(error))) {
      throw error;
    }
  }
  // All pre-multitenant historical operational rows were HAMARR rows.
  // Never create an organization or infer a tenant for new writes.
  await db.prepare(`UPDATE ${table} SET organization_id = 'hamarr'
    WHERE organization_id IS NULL
      AND EXISTS (SELECT 1 FROM organizations WHERE id = 'hamarr')`).run();
}

export async function ensureSparringSchema(db: Env['DB']): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sparring_sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
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

  await ensureTenantColumn(db, 'sparring_sessions');
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_organization_student ON sparring_sessions(organization_id, student_id, deleted_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_student ON sparring_sessions(student_id, deleted_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_class ON sparring_sessions(class_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_date ON sparring_sessions(session_date)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sparring_instructor_date ON sparring_sessions(instructor_id, session_date)`).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS tournament_participations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
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

  await ensureTenantColumn(db, 'tournament_participations');
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tournament_organization_student ON tournament_participations(organization_id, student_id, deleted_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tournament_student ON tournament_participations(student_id, deleted_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tournament_date ON tournament_participations(tournament_date)`).run();
}
