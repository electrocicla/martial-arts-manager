-- Add disciplines column to students table
-- This allows students to have multiple disciplines with different belt ranks

ALTER TABLE students ADD COLUMN disciplines TEXT; -- JSON array of {discipline: string, belt: string}