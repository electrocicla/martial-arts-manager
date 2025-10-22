-- Create a unique partial index to enforce uniqueness of generated recurring sessions
-- This prevents inserting duplicate sessions with the same parent_course_id, date, time and creator
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_parent_date_time_unique
ON classes(parent_course_id, date, time, created_by)
WHERE parent_course_id IS NOT NULL;
