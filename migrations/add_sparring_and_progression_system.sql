-- Migration: Sparring sessions, tournaments and belt progression tracking
-- Adds two new tables that power the Sparring Tracker, the revamped Belt
-- Testing dashboard and the automatic belt-exam-ready notifications.

-- =====================================================
-- Sparring Sessions
-- One row represents N sparring rounds logged for a student
-- (a quick "+1" creates a row with sessions_count = 1).
-- =====================================================
CREATE TABLE IF NOT EXISTS sparring_sessions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  class_id TEXT,
  instructor_id TEXT,
  sessions_count INTEGER NOT NULL DEFAULT 1,
  session_date TEXT NOT NULL,
  intensity TEXT,                   -- light | medium | hard (optional)
  partner_name TEXT,                -- optional free-form
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (instructor_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sparring_student
  ON sparring_sessions(student_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_sparring_class
  ON sparring_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sparring_date
  ON sparring_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sparring_instructor_date
  ON sparring_sessions(instructor_id, session_date);

-- =====================================================
-- Tournament Participations
-- =====================================================
CREATE TABLE IF NOT EXISTS tournament_participations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  tournament_date TEXT NOT NULL,
  belt_at_time TEXT,                -- belt the student wore
  placement TEXT,                   -- gold | silver | bronze | participation | etc.
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_student
  ON tournament_participations(student_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tournament_date
  ON tournament_participations(tournament_date);
