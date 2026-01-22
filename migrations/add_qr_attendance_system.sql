-- =====================================================
-- QR-Based Attendance System Migration
-- =====================================================
-- This migration adds support for QR code-based check-ins
-- and enhances the attendance tracking system.
-- =====================================================

-- QR Codes table: Stores generated QR codes for classes/locations
CREATE TABLE IF NOT EXISTS attendance_qr_codes (
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
  FOREIGN KEY (instructor_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Index for fast QR code lookups
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON attendance_qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_instructor ON attendance_qr_codes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON attendance_qr_codes(is_active);

-- Add new columns to attendance table for QR check-ins
-- check_in_method: 'manual' | 'qr' | 'geofence'
-- qr_code_id: Reference to the QR code used (if applicable)
-- device_info: Optional device fingerprint for fraud prevention
ALTER TABLE attendance ADD COLUMN check_in_method TEXT DEFAULT 'manual';
ALTER TABLE attendance ADD COLUMN qr_code_id TEXT REFERENCES attendance_qr_codes(id);
ALTER TABLE attendance ADD COLUMN device_info TEXT;
ALTER TABLE attendance ADD COLUMN latitude REAL;
ALTER TABLE attendance ADD COLUMN longitude REAL;

-- Index for check-in method analytics
CREATE INDEX IF NOT EXISTS idx_attendance_method ON attendance(check_in_method);
