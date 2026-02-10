-- Add soft-delete support for attendance QR codes
ALTER TABLE attendance_qr_codes ADD COLUMN deleted_at TEXT;

-- Optional index to speed up active lookups
CREATE INDEX IF NOT EXISTS idx_qr_codes_deleted_at ON attendance_qr_codes(deleted_at);
