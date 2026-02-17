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

-- Classes indexes
CREATE INDEX idx_classes_date ON classes(date);
CREATE INDEX idx_classes_discipline ON classes(discipline);
CREATE INDEX idx_classes_instructor ON classes(instructor);
CREATE INDEX idx_classes_is_active ON classes(is_active);
CREATE INDEX idx_classes_deleted_at ON classes(deleted_at);

-- Payments indexes
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);

-- Attendance indexes
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);