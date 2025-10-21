-- Add parent_course_id to classes to group recurring course occurrences
ALTER TABLE classes ADD COLUMN parent_course_id TEXT;

-- Optional index for faster lookups by parent_course_id and created_by
CREATE INDEX IF NOT EXISTS idx_classes_parent_course_created_by ON classes(parent_course_id, created_by);
