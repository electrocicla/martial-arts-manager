-- =====================================================
-- Auto-approve Admin and Instructor Accounts
-- =====================================================
-- Ensures that all admin and instructor accounts are
-- automatically approved since they are trusted roles
-- =====================================================

-- Auto-approve all existing admin and instructor accounts
UPDATE users 
SET is_approved = 1 
WHERE (role = 'admin' OR role = 'instructor') 
  AND is_approved = 0;

-- Note: The application code (functions/utils/db.ts) has been updated
-- to auto-approve admin and instructor accounts upon creation
