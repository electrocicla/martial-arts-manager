-- Multi-branch administration and data isolation.
-- Existing records are assigned to the immutable main branch.

PRAGMA defer_foreign_keys = ON;

CREATE TABLE branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_main INTEGER NOT NULL DEFAULT 0 CHECK(is_main IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

INSERT INTO branches (
  id, name, is_main, is_active, created_at, updated_at
) VALUES (
  'main', 'Sede Principal', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

CREATE TABLE branch_staff (
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (branch_id, user_id),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE student_branch_assignments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  source_branch_id TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  reason TEXT,
  assigned_by TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (source_branch_id) REFERENCES branches(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

ALTER TABLE students ADD COLUMN branch_id TEXT NOT NULL DEFAULT 'main';
ALTER TABLE classes ADD COLUMN branch_id TEXT NOT NULL DEFAULT 'main';
ALTER TABLE settings ADD COLUMN branch_id TEXT;
ALTER TABLE attendance_qr_codes ADD COLUMN branch_id TEXT NOT NULL DEFAULT 'main';

-- Production currently lacks the gateway columns present in the source schema.
-- Rebuild payments once so all existing rows are preserved and assigned to main.
CREATE TABLE payments_multi_branch (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  branch_id TEXT NOT NULL DEFAULT 'main',
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'pending', 'failed', 'refunded')),
  payment_method TEXT,
  payment_source TEXT NOT NULL DEFAULT 'manual',
  external_id TEXT,
  external_reference TEXT,
  receipt_url TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

INSERT INTO payments_multi_branch (
  id, student_id, branch_id, amount, date, type, notes, status,
  payment_method, payment_source, receipt_url, created_by, updated_by,
  created_at, updated_at, deleted_at
)
SELECT
  id, student_id, 'main', amount, date, type, notes, status,
  payment_method, 'manual', receipt_url, created_by, updated_by,
  created_at, updated_at, deleted_at
FROM payments;

DROP TABLE payments;
ALTER TABLE payments_multi_branch RENAME TO payments;

INSERT INTO branch_staff (branch_id, user_id, created_by, created_at)
SELECT 'main', id, id, CURRENT_TIMESTAMP
FROM users
WHERE role IN ('admin', 'instructor');

INSERT INTO student_branch_assignments (
  id, student_id, branch_id, started_at, assigned_by, created_at
)
SELECT
  'initial-main-' || id,
  id,
  'main',
  COALESCE(join_date, created_at),
  created_by,
  CURRENT_TIMESTAMP
FROM students
WHERE deleted_at IS NULL;

UPDATE settings SET branch_id = 'main' WHERE section IN ('dojo', 'payment', 'mercadopago');

CREATE UNIQUE INDEX idx_branches_single_main ON branches(is_main) WHERE is_main = 1;
CREATE INDEX idx_branches_active ON branches(is_active, name);
CREATE INDEX idx_branch_staff_user ON branch_staff(user_id, branch_id);
CREATE INDEX idx_student_branch_assignments_student ON student_branch_assignments(student_id, started_at);
CREATE INDEX idx_student_branch_assignments_branch_active ON student_branch_assignments(branch_id, ended_at);
CREATE UNIQUE INDEX idx_student_branch_assignments_active
  ON student_branch_assignments(student_id)
  WHERE ended_at IS NULL;
CREATE INDEX idx_students_branch ON students(branch_id, deleted_at, is_active);
CREATE INDEX idx_classes_branch_date ON classes(branch_id, date, deleted_at);
CREATE INDEX idx_settings_branch ON settings(owner_id, section, branch_id);
CREATE UNIQUE INDEX idx_settings_owner_section_branch
  ON settings(owner_id, section, branch_id)
  WHERE branch_id IS NOT NULL;
CREATE INDEX idx_qr_codes_branch ON attendance_qr_codes(branch_id, deleted_at, is_active);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX idx_payments_student_date ON payments(student_id, date);
CREATE INDEX idx_payments_branch_date ON payments(branch_id, date, deleted_at);
CREATE INDEX idx_payments_source ON payments(payment_source);
CREATE UNIQUE INDEX idx_payments_external_id ON payments(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_payments_external_reference ON payments(external_reference);
