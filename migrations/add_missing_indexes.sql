-- Add missing indexes for foreign key columns and composite queries
-- P3-07: Performance optimization

CREATE INDEX IF NOT EXISTS idx_students_created_by ON students(created_by);
CREATE INDEX IF NOT EXISTS idx_students_instructor_id ON students(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_created_by ON classes(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_student_date ON payments(student_id, date);
