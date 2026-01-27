-- Migration: Belt Examination System
-- Description: Creates tables for managing belt examinations and student assignments

-- Belt Exams table
CREATE TABLE IF NOT EXISTS belt_exams (
    id TEXT PRIMARY KEY,
    belt_level TEXT NOT NULL,
    exam_date TEXT NOT NULL,
    exam_time TEXT NOT NULL,
    location TEXT NOT NULL,
    examiner_id TEXT NOT NULL,
    discipline TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
    max_candidates INTEGER DEFAULT 20,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (examiner_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Exam Assignments table (students assigned to exams)
CREATE TABLE IF NOT EXISTS exam_assignments (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned', -- assigned, completed, passed, failed, absent
    result TEXT, -- pass, fail
    score INTEGER,
    feedback TEXT,
    assigned_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (exam_id) REFERENCES belt_exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(exam_id, student_id)
);

-- Student Belt History table
CREATE TABLE IF NOT EXISTS student_belt_history (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    from_belt TEXT NOT NULL,
    to_belt TEXT NOT NULL,
    exam_id TEXT,
    promotion_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES belt_exams(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_belt_exams_date ON belt_exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_belt_exams_status ON belt_exams(status);
CREATE INDEX IF NOT EXISTS idx_belt_exams_examiner ON belt_exams(examiner_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam ON exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_student ON exam_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_status ON exam_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_belt_history_student ON student_belt_history(student_id);
