-- FIX: Update Admin Password to "admin123"
-- Run this in Supabase SQL Editor if login is failing

-- This updates the admin user's password to the correct bcrypt hash for "admin123"
UPDATE users
SET password = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG'
WHERE custom_id = 'ADM001';

-- Verify the update
SELECT custom_id, full_name, role, email 
FROM users 
WHERE custom_id = 'ADM001';
