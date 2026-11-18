-- Additive security-only migration; no existing business rows are changed.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket TEXT PRIMARY KEY,
  window_end INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK(attempts > 0)
);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window_end
  ON auth_rate_limits(window_end);
