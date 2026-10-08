-- =====================================================
-- Organization / tenant isolation foundation
-- =====================================================
-- Keeps one D1 database while separating HAMARR and Manzur Bros by
-- organization. Existing rows are backfilled into HAMARR.

CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO organizations (id, slug, name, is_active, created_at, updated_at)
VALUES
  ('hamarr', 'hamarr', 'HAMARR', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manzur', 'manzur', 'Manzur Bros', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE organization_memberships (
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'instructor', 'student')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'rejected')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  student_id TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE platform_admins (
  user_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE branches ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'hamarr';

-- D1 keeps foreign keys enabled and does not provide a safe way to rebuild
-- this heavily-referenced table without rewriting inbound FK targets or
-- triggering ON DELETE actions. Keep the existing student primary key and
-- legacy email uniqueness intact (cross-organization duplicate student email is
-- intentionally unsupported until a dependency-complete safe rebuild).
ALTER TABLE students ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'hamarr';

ALTER TABLE belt_exams ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'hamarr';
ALTER TABLE notifications ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'hamarr';
ALTER TABLE settings ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'hamarr';

DROP INDEX IF EXISTS idx_branches_single_main;
DROP INDEX IF EXISTS idx_settings_owner_section;
DROP INDEX IF EXISTS idx_settings_owner_section_branch;
DROP INDEX IF EXISTS idx_settings_branch;

CREATE UNIQUE INDEX idx_branches_org_single_main
  ON branches(organization_id)
  WHERE is_main = 1;
CREATE INDEX idx_branches_organization_active
  ON branches(organization_id, is_active, name);
CREATE INDEX IF NOT EXISTS idx_students_email
  ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_discipline
  ON students(discipline);
CREATE INDEX IF NOT EXISTS idx_students_is_active
  ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_deleted_at
  ON students(deleted_at);
CREATE INDEX IF NOT EXISTS idx_students_created_by
  ON students(created_by);
CREATE INDEX IF NOT EXISTS idx_students_instructor_id
  ON students(instructor_id);
CREATE INDEX IF NOT EXISTS idx_students_branch
  ON students(branch_id, deleted_at, is_active);
CREATE INDEX idx_students_organization_branch
  ON students(organization_id, branch_id, deleted_at, is_active);
CREATE INDEX idx_settings_organization_owner_section_branch
  ON settings(organization_id, owner_id, section, branch_id);
CREATE UNIQUE INDEX idx_settings_organization_owner_section
  ON settings(organization_id, owner_id, section)
  WHERE branch_id IS NULL;
CREATE UNIQUE INDEX idx_settings_organization_owner_section_branch_unique
  ON settings(organization_id, owner_id, section, branch_id)
  WHERE branch_id IS NOT NULL;
CREATE INDEX idx_belt_exams_organization_date
  ON belt_exams(organization_id, exam_date, status);
CREATE INDEX idx_notifications_organization_user
  ON notifications(organization_id, user_id, read, created_at);
CREATE INDEX idx_organization_memberships_user
  ON organization_memberships(user_id, organization_id, status, is_active);
CREATE INDEX idx_organization_memberships_role
  ON organization_memberships(organization_id, role, status, is_active);
CREATE UNIQUE INDEX idx_branches_id_organization
  ON branches(id, organization_id);
CREATE UNIQUE INDEX idx_students_id_organization
  ON students(id, organization_id);

-- Keep tenant relationships valid even if a future API path forgets an
-- organization predicate. SQLite/D1 has no PostgreSQL-style RLS, so these
-- write-time invariants complement application authorization.
CREATE TRIGGER trg_org_membership_student_tenant_insert
BEFORE INSERT ON organization_memberships
WHEN NEW.student_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = NEW.student_id
      AND s.organization_id = NEW.organization_id
  )
BEGIN
  SELECT RAISE(ABORT, 'organization membership student tenant mismatch');
END;

CREATE TRIGGER trg_org_membership_student_tenant_update
BEFORE UPDATE OF organization_id, student_id ON organization_memberships
WHEN NEW.student_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = NEW.student_id
      AND s.organization_id = NEW.organization_id
  )
BEGIN
  SELECT RAISE(ABORT, 'organization membership student tenant mismatch');
END;

CREATE TRIGGER trg_students_branch_tenant_insert
BEFORE INSERT ON students
WHEN NOT EXISTS (
  SELECT 1 FROM branches b
  WHERE b.id = NEW.branch_id
    AND b.organization_id = NEW.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'student branch tenant mismatch');
END;

CREATE TRIGGER trg_students_branch_tenant_update
BEFORE UPDATE OF organization_id, branch_id ON students
WHEN NOT EXISTS (
  SELECT 1 FROM branches b
  WHERE b.id = NEW.branch_id
    AND b.organization_id = NEW.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'student branch tenant mismatch');
END;

CREATE TRIGGER trg_students_instructor_tenant_insert
BEFORE INSERT ON students
WHEN NEW.instructor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.organization_id = NEW.organization_id
      AND om.user_id = NEW.instructor_id
      AND om.role IN ('admin', 'instructor')
      AND om.status = 'active'
      AND om.is_active = 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.instructor_id
  )
BEGIN
  SELECT RAISE(ABORT, 'student instructor tenant mismatch');
END;

CREATE TRIGGER trg_students_instructor_tenant_update
BEFORE UPDATE OF organization_id, instructor_id ON students
WHEN NEW.instructor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.organization_id = NEW.organization_id
      AND om.user_id = NEW.instructor_id
      AND om.role IN ('admin', 'instructor')
      AND om.status = 'active'
      AND om.is_active = 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.instructor_id
  )
BEGIN
  SELECT RAISE(ABORT, 'student instructor tenant mismatch');
END;

CREATE TRIGGER trg_branch_staff_tenant_insert
BEFORE INSERT ON branch_staff
WHEN NOT EXISTS (
  SELECT 1
  FROM branches b
  WHERE b.id = NEW.branch_id
    AND (
      EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.organization_id = b.organization_id
          AND om.user_id = NEW.user_id
          AND om.role IN ('admin', 'instructor')
          AND om.status = 'active'
          AND om.is_active = 1
      )
      OR EXISTS (
        SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.user_id
      )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'branch staff tenant mismatch');
END;

CREATE TRIGGER trg_branch_staff_tenant_update
BEFORE UPDATE OF branch_id, user_id ON branch_staff
WHEN NOT EXISTS (
  SELECT 1
  FROM branches b
  WHERE b.id = NEW.branch_id
    AND (
      EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.organization_id = b.organization_id
          AND om.user_id = NEW.user_id
          AND om.role IN ('admin', 'instructor')
          AND om.status = 'active'
          AND om.is_active = 1
      )
      OR EXISTS (
        SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.user_id
      )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'branch staff tenant mismatch');
END;

CREATE TRIGGER trg_settings_branch_tenant_insert
BEFORE INSERT ON settings
WHEN (
  NOT EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.organization_id = NEW.organization_id
      AND om.user_id = NEW.owner_id
      AND om.status = 'active'
      AND om.is_active = 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.owner_id
  )
)
OR (
  NEW.branch_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM branches b
    WHERE b.id = NEW.branch_id
      AND b.organization_id = NEW.organization_id
  )
)
BEGIN
  SELECT RAISE(ABORT, 'settings tenant mismatch');
END;

CREATE TRIGGER trg_settings_branch_tenant_update
BEFORE UPDATE OF owner_id, organization_id, branch_id ON settings
WHEN (
  NOT EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.organization_id = NEW.organization_id
      AND om.user_id = NEW.owner_id
      AND om.status = 'active'
      AND om.is_active = 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.owner_id
  )
)
OR (
  NEW.branch_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM branches b
    WHERE b.id = NEW.branch_id
      AND b.organization_id = NEW.organization_id
  )
)
BEGIN
  SELECT RAISE(ABORT, 'settings tenant mismatch');
END;

CREATE TRIGGER trg_classes_instructor_tenant_insert
BEFORE INSERT ON classes
WHEN NEW.instructor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM branches b
    WHERE b.id = NEW.branch_id
      AND (
        EXISTS (
          SELECT 1
          FROM organization_memberships om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = NEW.instructor_id
            AND om.role IN ('admin', 'instructor')
            AND om.status = 'active'
            AND om.is_active = 1
        )
        OR EXISTS (
          SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.instructor_id
        )
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'class instructor tenant mismatch');
END;

CREATE TRIGGER trg_classes_instructor_tenant_update
BEFORE UPDATE OF branch_id, instructor_id ON classes
WHEN NEW.instructor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM branches b
    WHERE b.id = NEW.branch_id
      AND (
        EXISTS (
          SELECT 1
          FROM organization_memberships om
          WHERE om.organization_id = b.organization_id
            AND om.user_id = NEW.instructor_id
            AND om.role IN ('admin', 'instructor')
            AND om.status = 'active'
            AND om.is_active = 1
        )
        OR EXISTS (
          SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.instructor_id
        )
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'class instructor tenant mismatch');
END;

CREATE TRIGGER trg_payments_tenant_insert
BEFORE INSERT ON payments
WHEN NOT EXISTS (
  SELECT 1
  FROM students s
  INNER JOIN branches b ON b.id = NEW.branch_id
  WHERE s.id = NEW.student_id
    AND s.organization_id = b.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'payment tenant mismatch');
END;

CREATE TRIGGER trg_payments_tenant_update
BEFORE UPDATE OF student_id, branch_id ON payments
WHEN NOT EXISTS (
  SELECT 1
  FROM students s
  INNER JOIN branches b ON b.id = NEW.branch_id
  WHERE s.id = NEW.student_id
    AND s.organization_id = b.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'payment tenant mismatch');
END;

CREATE TRIGGER trg_class_enrollments_tenant_insert
BEFORE INSERT ON class_enrollments
WHEN NOT EXISTS (
  SELECT 1
  FROM classes c
  INNER JOIN branches b ON b.id = c.branch_id
  INNER JOIN students s ON s.id = NEW.student_id
  WHERE c.id = NEW.class_id
    AND s.organization_id = b.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'class enrollment tenant mismatch');
END;

CREATE TRIGGER trg_class_enrollments_tenant_update
BEFORE UPDATE OF class_id, student_id ON class_enrollments
WHEN NOT EXISTS (
  SELECT 1
  FROM classes c
  INNER JOIN branches b ON b.id = c.branch_id
  INNER JOIN students s ON s.id = NEW.student_id
  WHERE c.id = NEW.class_id
    AND s.organization_id = b.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'class enrollment tenant mismatch');
END;

CREATE TRIGGER trg_attendance_tenant_insert
BEFORE INSERT ON attendance
WHEN NOT EXISTS (
  SELECT 1
  FROM classes c
  INNER JOIN branches b ON b.id = c.branch_id
  INNER JOIN students s ON s.id = NEW.student_id
  WHERE c.id = NEW.class_id
    AND s.organization_id = b.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'attendance tenant mismatch');
END;

CREATE TRIGGER trg_attendance_tenant_update
BEFORE UPDATE OF class_id, student_id ON attendance
WHEN NOT EXISTS (
  SELECT 1
  FROM classes c
  INNER JOIN branches b ON b.id = c.branch_id
  INNER JOIN students s ON s.id = NEW.student_id
  WHERE c.id = NEW.class_id
    AND s.organization_id = b.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'attendance tenant mismatch');
END;

CREATE TRIGGER trg_exam_assignments_tenant_insert
BEFORE INSERT ON exam_assignments
WHEN NOT EXISTS (
  SELECT 1
  FROM belt_exams e
  INNER JOIN students s ON s.id = NEW.student_id
  WHERE e.id = NEW.exam_id
    AND e.organization_id = s.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'exam assignment tenant mismatch');
END;

CREATE TRIGGER trg_exam_assignments_tenant_update
BEFORE UPDATE OF exam_id, student_id ON exam_assignments
WHEN NOT EXISTS (
  SELECT 1
  FROM belt_exams e
  INNER JOIN students s ON s.id = NEW.student_id
  WHERE e.id = NEW.exam_id
    AND e.organization_id = s.organization_id
)
BEGIN
  SELECT RAISE(ABORT, 'exam assignment tenant mismatch');
END;

CREATE TRIGGER trg_student_belt_history_tenant_insert
BEFORE INSERT ON student_belt_history
WHEN NEW.exam_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM belt_exams e
    INNER JOIN students s ON s.id = NEW.student_id
    WHERE e.id = NEW.exam_id
      AND e.organization_id = s.organization_id
  )
BEGIN
  SELECT RAISE(ABORT, 'belt history tenant mismatch');
END;

CREATE TRIGGER trg_student_belt_history_tenant_update
BEFORE UPDATE OF exam_id, student_id ON student_belt_history
WHEN NEW.exam_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM belt_exams e
    INNER JOIN students s ON s.id = NEW.student_id
    WHERE e.id = NEW.exam_id
      AND e.organization_id = s.organization_id
  )
BEGIN
  SELECT RAISE(ABORT, 'belt history tenant mismatch');
END;

CREATE TRIGGER trg_attendance_qr_tenant_insert
BEFORE INSERT ON attendance_qr_codes
WHEN NOT EXISTS (
  SELECT 1
  FROM branches b
  WHERE b.id = NEW.branch_id
    AND (NEW.class_id IS NULL OR EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = NEW.class_id
        AND c.branch_id = NEW.branch_id
    ))
    AND (
      EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.organization_id = b.organization_id
          AND om.user_id = NEW.instructor_id
          AND om.role IN ('admin', 'instructor')
          AND om.status = 'active'
          AND om.is_active = 1
      )
      OR EXISTS (
        SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.instructor_id
      )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'attendance QR tenant mismatch');
END;

CREATE TRIGGER trg_attendance_qr_tenant_update
BEFORE UPDATE OF branch_id, class_id, instructor_id ON attendance_qr_codes
WHEN NOT EXISTS (
  SELECT 1
  FROM branches b
  WHERE b.id = NEW.branch_id
    AND (NEW.class_id IS NULL OR EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = NEW.class_id
        AND c.branch_id = NEW.branch_id
    ))
    AND (
      EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.organization_id = b.organization_id
          AND om.user_id = NEW.instructor_id
          AND om.role IN ('admin', 'instructor')
          AND om.status = 'active'
          AND om.is_active = 1
      )
      OR EXISTS (
        SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.instructor_id
      )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'attendance QR tenant mismatch');
END;

CREATE TRIGGER trg_student_branch_assignment_tenant_insert
BEFORE INSERT ON student_branch_assignments
WHEN NOT EXISTS (
  SELECT 1
  FROM students s
  INNER JOIN branches destination ON destination.id = NEW.branch_id
  WHERE s.id = NEW.student_id
    AND s.organization_id = destination.organization_id
    AND (
      NEW.source_branch_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM branches source
        WHERE source.id = NEW.source_branch_id
          AND source.organization_id = s.organization_id
      )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'student branch assignment tenant mismatch');
END;

CREATE TRIGGER trg_student_branch_assignment_tenant_update
BEFORE UPDATE OF student_id, branch_id, source_branch_id ON student_branch_assignments
WHEN NOT EXISTS (
  SELECT 1
  FROM students s
  INNER JOIN branches destination ON destination.id = NEW.branch_id
  WHERE s.id = NEW.student_id
    AND s.organization_id = destination.organization_id
    AND (
      NEW.source_branch_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM branches source
        WHERE source.id = NEW.source_branch_id
          AND source.organization_id = s.organization_id
      )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'student branch assignment tenant mismatch');
END;

CREATE TRIGGER trg_student_branch_assignment_actor_tenant_insert
BEFORE INSERT ON student_branch_assignments
WHEN NEW.assigned_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM students s
    INNER JOIN organization_memberships om
      ON om.organization_id = s.organization_id
     AND om.user_id = NEW.assigned_by
     AND om.role IN ('admin', 'instructor')
     AND om.status = 'active'
     AND om.is_active = 1
    WHERE s.id = NEW.student_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.assigned_by
  )
BEGIN
  SELECT RAISE(ABORT, 'student branch assignment actor tenant mismatch');
END;

CREATE TRIGGER trg_student_branch_assignment_actor_tenant_update
BEFORE UPDATE OF student_id, assigned_by ON student_branch_assignments
WHEN NEW.assigned_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM students s
    INNER JOIN organization_memberships om
      ON om.organization_id = s.organization_id
     AND om.user_id = NEW.assigned_by
     AND om.role IN ('admin', 'instructor')
     AND om.status = 'active'
     AND om.is_active = 1
    WHERE s.id = NEW.student_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.assigned_by
  )
BEGIN
  SELECT RAISE(ABORT, 'student branch assignment actor tenant mismatch');
END;

CREATE TRIGGER trg_belt_exam_examiner_tenant_insert
BEFORE INSERT ON belt_exams
WHEN NOT EXISTS (
  SELECT 1
  FROM organization_memberships om
  WHERE om.organization_id = NEW.organization_id
    AND om.user_id = NEW.examiner_id
    AND om.role IN ('admin', 'instructor')
    AND om.status = 'active'
    AND om.is_active = 1
)
AND NOT EXISTS (
  SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.examiner_id
)
BEGIN
  SELECT RAISE(ABORT, 'belt exam examiner tenant mismatch');
END;

CREATE TRIGGER trg_belt_exam_examiner_tenant_update
BEFORE UPDATE OF organization_id, examiner_id ON belt_exams
WHEN NOT EXISTS (
  SELECT 1
  FROM organization_memberships om
  WHERE om.organization_id = NEW.organization_id
    AND om.user_id = NEW.examiner_id
    AND om.role IN ('admin', 'instructor')
    AND om.status = 'active'
    AND om.is_active = 1
)
AND NOT EXISTS (
  SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.examiner_id
)
BEGIN
  SELECT RAISE(ABORT, 'belt exam examiner tenant mismatch');
END;

CREATE TRIGGER trg_notification_tenant_insert
BEFORE INSERT ON notifications
WHEN NOT EXISTS (
  SELECT 1
  FROM organization_memberships om
  WHERE om.organization_id = NEW.organization_id
    AND om.user_id = NEW.user_id
)
AND NOT EXISTS (
  SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.user_id
)
BEGIN
  SELECT RAISE(ABORT, 'notification tenant mismatch');
END;

CREATE TRIGGER trg_notification_tenant_update
BEFORE UPDATE OF organization_id, user_id ON notifications
WHEN NOT EXISTS (
  SELECT 1
  FROM organization_memberships om
  WHERE om.organization_id = NEW.organization_id
    AND om.user_id = NEW.user_id
)
AND NOT EXISTS (
  SELECT 1 FROM platform_admins pa WHERE pa.user_id = NEW.user_id
)
BEGIN
  SELECT RAISE(ABORT, 'notification tenant mismatch');
END;

INSERT INTO organization_memberships (
  organization_id,
  user_id,
  role,
  status,
  is_active,
  student_id,
  approved_by,
  approved_at,
  created_at,
  updated_at
)
SELECT
  'hamarr',
  id,
  role,
  CASE
    WHEN is_active = 0 THEN 'rejected'
    WHEN is_approved = 1 THEN 'active'
    ELSE 'pending'
  END,
  is_active,
  student_id,
  approved_by,
  approved_at,
  created_at,
  updated_at
FROM users;

INSERT INTO branches (
  id,
  name,
  address,
  phone,
  email,
  notes,
  is_main,
  is_active,
  created_by,
  created_at,
  updated_at,
  organization_id
)
VALUES (
  'manzur-main',
  'Sede Principal Manzur Bros',
  NULL,
  NULL,
  NULL,
  'Initial Manzur Bros tenant branch. Address/contact can be configured by an organization admin.',
  1,
  1,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'manzur'
);

-- ALTER-added organization_id columns have no declared foreign keys.
CREATE TRIGGER trg_branches_org_exists BEFORE INSERT ON branches
WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE id=NEW.organization_id)
BEGIN SELECT RAISE(ABORT,'branch organization missing'); END;
CREATE TRIGGER trg_students_org_exists BEFORE INSERT ON students
WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE id=NEW.organization_id)
BEGIN SELECT RAISE(ABORT,'student organization missing'); END;

CREATE TRIGGER trg_belt_exams_org_exists BEFORE INSERT ON belt_exams
WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE id=NEW.organization_id)
BEGIN SELECT RAISE(ABORT,'exam organization missing'); END;
CREATE TRIGGER trg_notifications_org_exists BEFORE INSERT ON notifications
WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE id=NEW.organization_id)
BEGIN SELECT RAISE(ABORT,'notification organization missing'); END;
CREATE TRIGGER trg_settings_org_exists BEFORE INSERT ON settings
WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE id=NEW.organization_id)
BEGIN SELECT RAISE(ABORT,'settings organization missing'); END;

CREATE TRIGGER trg_branches_org_immutable BEFORE UPDATE OF organization_id ON branches
WHEN NEW.organization_id<>OLD.organization_id
BEGIN SELECT RAISE(ABORT,'branch organization immutable'); END;
CREATE TRIGGER trg_students_org_immutable BEFORE UPDATE OF organization_id ON students
WHEN NEW.organization_id<>OLD.organization_id
BEGIN SELECT RAISE(ABORT,'student organization immutable'); END;
CREATE TRIGGER trg_belt_exams_org_immutable BEFORE UPDATE OF organization_id ON belt_exams
WHEN NEW.organization_id<>OLD.organization_id
BEGIN SELECT RAISE(ABORT,'exam organization immutable'); END;

CREATE TRIGGER trg_notifications_org_exists_update BEFORE UPDATE OF organization_id ON notifications
WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE id=NEW.organization_id)
BEGIN SELECT RAISE(ABORT,'notification organization missing'); END;
CREATE TRIGGER trg_settings_org_exists_update BEFORE UPDATE OF organization_id ON settings
WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE id=NEW.organization_id)
BEGIN SELECT RAISE(ABORT,'settings organization missing'); END;
CREATE TRIGGER trg_organizations_no_delete BEFORE DELETE ON organizations
BEGIN SELECT RAISE(ABORT,'deactivate organization rather than deleting'); END;

-- add_multi_branch_system.sql ALTER-added classes.branch_id without a FK.
CREATE TRIGGER trg_classes_branch_exists_insert BEFORE INSERT ON classes
WHEN NOT EXISTS (SELECT 1 FROM branches WHERE id=NEW.branch_id)
BEGIN SELECT RAISE(ABORT,'class branch missing'); END;
CREATE TRIGGER trg_classes_branch_tenant_update BEFORE UPDATE OF branch_id ON classes
WHEN NOT EXISTS (SELECT 1 FROM branches WHERE id=NEW.branch_id)
OR EXISTS (
  SELECT 1 FROM branches old_branch JOIN branches new_branch ON new_branch.id=NEW.branch_id
  WHERE old_branch.id=OLD.branch_id AND old_branch.organization_id<>new_branch.organization_id
)
BEGIN SELECT RAISE(ABORT,'class branch tenant mismatch'); END;

