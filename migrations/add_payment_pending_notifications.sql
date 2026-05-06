-- Migration: extend notifications table to support forced-confirmation flows
--   (used by the admin "pending payment" workflow).
-- Idempotent: safe to run multiple times. SQLite ignores ADD COLUMN errors via
-- the application-level guard in functions/utils/notifications.ts.

ALTER TABLE notifications ADD COLUMN requires_confirmation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN confirmed_at TEXT;
ALTER TABLE notifications ADD COLUMN action_type TEXT;
ALTER TABLE notifications ADD COLUMN metadata TEXT;
ALTER TABLE notifications ADD COLUMN confirmation_notify_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_action_type ON notifications(action_type);
CREATE INDEX IF NOT EXISTS idx_notifications_requires_confirmation
  ON notifications(user_id, requires_confirmation, confirmed_at);
