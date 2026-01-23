-- =====================================================
-- Account Approval System Migration
-- =====================================================
-- Adds approval workflow for manually registered users
-- =====================================================

-- Add approval fields to users table
ALTER TABLE users ADD COLUMN is_approved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN approved_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN approved_at TEXT;
ALTER TABLE users ADD COLUMN registration_notes TEXT;

-- Index for filtering pending approvals
CREATE INDEX IF NOT EXISTS idx_users_approval ON users(is_approved, created_at);

-- Update existing users to be approved (retroactive approval for existing accounts)
UPDATE users SET is_approved = 1 WHERE is_approved = 0;
