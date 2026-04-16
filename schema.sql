-- ===========================================
-- AUTHENTICATION & USER MANAGEMENT
-- ===========================================

-- Users table (for authentication)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'instructor', 'student')),
  student_id TEXT,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 0,
  approved_by TEXT,
  approved_at TEXT,
  registration_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Sessions table (for JWT refresh tokens)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  changes TEXT, -- JSON
  ip_address TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Settings table
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  section TEXT NOT NULL,
  value TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ===========================================
-- CORE BUSINESS ENTITIES
-- ===========================================

-- Students table
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  belt TEXT NOT NULL,
  discipline TEXT NOT NULL,
  disciplines TEXT, -- JSON array of {discipline: string, belt: string}
  join_date TEXT NOT NULL,
  date_of_birth TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  avatar_url TEXT,
  notes TEXT,
  instructor_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (instructor_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Classes table
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  instructor TEXT NOT NULL,
  instructor_id TEXT,
  max_students INTEGER NOT NULL,
  description TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_pattern TEXT, -- JSON: {frequency: 'weekly', days: [1,3,5], endDate: '...'}
  parent_course_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (instructor_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Payments table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'pending', 'failed', 'refunded')),
  payment_method TEXT,
  receipt_url TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Class enrollments table (many-to-many relationship)
CREATE TABLE class_enrollments (
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

-- Class comments table
CREATE TABLE class_comments (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Attendance table
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  attended INTEGER NOT NULL, -- 0 or 1
  check_in_time TEXT,
  check_in_method TEXT DEFAULT 'manual',
  qr_code_id TEXT,
  device_info TEXT,
  latitude REAL,
  longitude REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (qr_code_id) REFERENCES attendance_qr_codes(id),
  UNIQUE(class_id, student_id)
);

-- QR codes for attendance check-in
CREATE TABLE attendance_qr_codes (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL,
  class_id TEXT,                           -- NULL if it's a general location QR
  location TEXT NOT NULL,                  -- Training location name
  code TEXT UNIQUE NOT NULL,               -- Unique QR code value (UUID or similar)
  is_active INTEGER NOT NULL DEFAULT 1,    -- Whether this QR is currently valid
  valid_from TEXT,                         -- Optional: time window start
  valid_until TEXT,                        -- Optional: time window end
  check_in_radius_meters INTEGER,          -- Optional: geofence radius
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (instructor_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- ===========================================
-- BELT EXAMINATION SYSTEM
-- ===========================================

-- Belt exams table
CREATE TABLE belt_exams (
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

-- Exam assignments (students assigned to exams)
CREATE TABLE exam_assignments (
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

-- Student belt history
CREATE TABLE student_belt_history (
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

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_approval ON users(is_approved, created_at);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Settings indexes
CREATE UNIQUE INDEX idx_settings_owner_section ON settings(owner_id, section);

-- Students indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_discipline ON students(discipline);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_students_deleted_at ON students(deleted_at);

-- Classes indexes
CREATE INDEX idx_classes_date ON classes(date);
CREATE INDEX idx_classes_discipline ON classes(discipline);
CREATE INDEX idx_classes_instructor ON classes(instructor);
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_is_active ON classes(is_active);
CREATE INDEX idx_classes_deleted_at ON classes(deleted_at);
CREATE INDEX idx_classes_parent_course_created_by ON classes(parent_course_id, created_by);
CREATE UNIQUE INDEX idx_classes_parent_date_time_unique
  ON classes(parent_course_id, date, time, created_by)
  WHERE parent_course_id IS NOT NULL;

-- Payments indexes
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX idx_payments_student_date ON payments(student_id, date);

-- Class enrollments indexes
CREATE INDEX idx_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX idx_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX idx_enrollments_status ON class_enrollments(enrollment_status);

-- Class comments indexes
CREATE INDEX idx_class_comments_class_id ON class_comments(class_id);

-- Attendance indexes
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_method ON attendance(check_in_method);

-- QR codes indexes
CREATE INDEX idx_qr_codes_instructor ON attendance_qr_codes(instructor_id);
CREATE INDEX idx_qr_codes_code ON attendance_qr_codes(code);
CREATE INDEX idx_qr_codes_active ON attendance_qr_codes(is_active);
CREATE INDEX idx_qr_codes_deleted_at ON attendance_qr_codes(deleted_at);

-- Belt exams indexes
CREATE INDEX idx_belt_exams_date ON belt_exams(exam_date);
CREATE INDEX idx_belt_exams_examiner ON belt_exams(examiner_id);
CREATE INDEX idx_belt_exams_status ON belt_exams(status);

-- Exam assignments indexes
CREATE INDEX idx_exam_assignments_exam ON exam_assignments(exam_id);
CREATE INDEX idx_exam_assignments_student ON exam_assignments(student_id);
CREATE INDEX idx_exam_assignments_status ON exam_assignments(status);

-- Student belt history indexes
CREATE INDEX idx_student_belt_history_student ON student_belt_history(student_id);
-- ===========================================
-- AUTHENTICATION & USER MANAGEMENT
-- ===========================================

-- Users table (for authentication)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'instructor', 'student')),
  student_id TEXT,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Sessions table (for JWT refresh tokens)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  changes TEXT, -- JSON
  ip_address TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===========================================
-- CORE BUSINESS ENTITIES
-- ===========================================

-- Create students table
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  belt TEXT NOT NULL,
  discipline TEXT NOT NULL,
  disciplines TEXT, -- JSON array of {discipline: string, belt: string}
  join_date TEXT NOT NULL,
  date_of_birth TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  avatar_url TEXT,
  notes TEXT,
  instructor_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (instructor_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create classes table
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  instructor TEXT NOT NULL,
  instructor_id TEXT,
  max_students INTEGER NOT NULL,
  description TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_pattern TEXT, -- JSON: {frequency: 'weekly', days: [1,3,5], endDate: '...'}
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create payments table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'pending', 'failed', 'refunded')),
  payment_method TEXT,
  receipt_url TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create class enrollments table (many-to-many relationship)
CREATE TABLE class_enrollments (
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

-- Create attendance table
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  attended INTEGER NOT NULL, -- 0 or 1
  check_in_time TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(class_id, student_id)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Students indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_discipline ON students(discipline);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_students_deleted_at ON students(deleted_at);
CREATE INDEX idx_students_created_by ON students(created_by);
CREATE INDEX idx_students_instructor_id ON students(instructor_id);

-- Classes indexes
CREATE INDEX idx_classes_date ON classes(date);
CREATE INDEX idx_classes_discipline ON classes(discipline);
CREATE INDEX idx_classes_instructor ON classes(instructor);
CREATE INDEX idx_classes_is_active ON classes(is_active);
CREATE INDEX idx_classes_deleted_at ON classes(deleted_at);
CREATE INDEX idx_classes_created_by ON classes(created_by);

-- Payments indexes
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX idx_payments_student_date ON payments(student_id, date);

-- Attendance indexes
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);