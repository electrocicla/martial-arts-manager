-- Additive D1 migration: preserve intentional instructor selection for pending academy enrollments.
-- Existing NULL requests are unassigned and remain visible to academy admins only.
ALTER TABLE organization_memberships
  ADD COLUMN requested_instructor_id TEXT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_org_memberships_pending_instructor
  ON organization_memberships(organization_id, requested_instructor_id, status, is_active)
  WHERE role = 'student';

-- Protect new selections even if another insertion path omits application validation.
CREATE TRIGGER IF NOT EXISTS trg_org_membership_requested_instructor_insert
BEFORE INSERT ON organization_memberships
WHEN NEW.requested_instructor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organization_memberships staff
    JOIN users u ON u.id = staff.user_id
    WHERE staff.organization_id = NEW.organization_id
      AND staff.user_id = NEW.requested_instructor_id
      AND staff.role IN ('admin', 'instructor')
      AND staff.status = 'active' AND staff.is_active = 1 AND u.is_active = 1
  )
BEGIN
  SELECT RAISE(ABORT, 'requested instructor is not active in organization');
END;

CREATE TRIGGER IF NOT EXISTS trg_org_membership_requested_instructor_update
BEFORE UPDATE OF organization_id, requested_instructor_id ON organization_memberships
WHEN NEW.requested_instructor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organization_memberships staff
    JOIN users u ON u.id = staff.user_id
    WHERE staff.organization_id = NEW.organization_id
      AND staff.user_id = NEW.requested_instructor_id
      AND staff.role IN ('admin', 'instructor')
      AND staff.status = 'active' AND staff.is_active = 1 AND u.is_active = 1
  )
BEGIN
  SELECT RAISE(ABORT, 'requested instructor is not active in organization');
END;
