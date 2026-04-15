-- Migration: Add instructor_id column to classes table
-- Purpose: Fix access control - classes.instructor stores a name string,
-- but permission checks compare it against user IDs (UUIDs).
-- This adds a proper instructor_id FK column and backfills from users table.

-- Step 1: Add instructor_id column
ALTER TABLE classes ADD COLUMN instructor_id TEXT REFERENCES users(id);

-- Step 2: Backfill instructor_id from users.name → users.id
-- Match the instructor name string to a user record
UPDATE classes
SET instructor_id = (
  SELECT u.id FROM users u
  WHERE u.name = classes.instructor
  AND u.role IN ('admin', 'instructor')
  LIMIT 1
)
WHERE instructor_id IS NULL;

-- Step 3: For any classes where the name didn't match a user, fall back to created_by
UPDATE classes
SET instructor_id = created_by
WHERE instructor_id IS NULL AND created_by IS NOT NULL;

-- Step 4: Create index on instructor_id
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);
