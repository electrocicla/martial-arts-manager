-- Add MercadoPago / payment-source tracking to payments table.
-- Idempotent for re-runs in dev.

-- 1) source column: 'manual' | 'mercadopago'
ALTER TABLE payments ADD COLUMN payment_source TEXT NOT NULL DEFAULT 'manual';

-- 2) external gateway payment id (e.g. MercadoPago payment id)
ALTER TABLE payments ADD COLUMN external_id TEXT;

-- 3) external_reference we generate when creating a preference
ALTER TABLE payments ADD COLUMN external_reference TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_source ON payments(payment_source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_external_reference ON payments(external_reference);
