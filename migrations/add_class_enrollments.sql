-- Migration: Add class_enrollments table
-- Date: 2025-10-13
-- Description: Create many-to-many relationship between classes and students

-- Create class enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  enrolled_at TEXT NOT NULL,
  enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK(enrollment_status IN ('active', 'dropped', 'completed')),
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE(class_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON class_enrollments(enrollment_status);
