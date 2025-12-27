-- Add instructor_id column to students table
ALTER TABLE students ADD COLUMN instructor_id TEXT REFERENCES users(id);
