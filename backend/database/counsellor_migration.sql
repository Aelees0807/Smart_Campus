-- ========================================
-- COUNSELLOR MIGRATION
-- Run this in Supabase SQL Editor
-- Adds counsellor_id column and assigns students to faculty counsellors
-- ========================================

-- Step 1: Add counsellor_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS counsellor_id TEXT;

-- Step 2: Assign counsellors based on department + roll number
-- Each department has 4 faculty, 150 students split into 4 groups (~37 each)
-- Roll 001-037 → Faculty 1, Roll 038-074 → Faculty 2, Roll 075-112 → Faculty 3, Roll 113-150 → Faculty 4

-- ─── Computer Engineering ──────────────────────────────────────
-- FAC001 → Roll 001-037, FAC002 → Roll 038-074, FAC004 → Roll 075-112, FAC005 → Roll 113-150

UPDATE users SET counsellor_id = 'FAC001'
WHERE role = 'Student' AND department = 'Computer Engineering'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 1 AND 37;

UPDATE users SET counsellor_id = 'FAC002'
WHERE role = 'Student' AND department = 'Computer Engineering'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 38 AND 74;

UPDATE users SET counsellor_id = 'FAC004'
WHERE role = 'Student' AND department = 'Computer Engineering'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 75 AND 112;

UPDATE users SET counsellor_id = 'FAC005'
WHERE role = 'Student' AND department = 'Computer Engineering'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 113 AND 150;

-- ─── Computer Science Engineering ──────────────────────────────
-- FAC003 → Roll 001-037, FAC006 → Roll 038-074, FAC007 → Roll 075-112, FAC008 → Roll 113-150

UPDATE users SET counsellor_id = 'FAC003'
WHERE role = 'Student' AND department = 'Computer Science Engineering'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 1 AND 37;

UPDATE users SET counsellor_id = 'FAC006'
WHERE role = 'Student' AND department = 'Computer Science Engineering'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 38 AND 74;

UPDATE users SET counsellor_id = 'FAC007'
WHERE role = 'Student' AND department = 'Computer Science Engineering'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 75 AND 112;

UPDATE users SET counsellor_id = 'FAC008'
WHERE role = 'Student' AND department = 'Computer Science Engineering'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 113 AND 150;

-- ─── Information Technology ────────────────────────────────────
-- FAC009 → Roll 001-037, FAC010 → Roll 038-074, FAC011 → Roll 075-112, FAC012 → Roll 113-150

UPDATE users SET counsellor_id = 'FAC009'
WHERE role = 'Student' AND department = 'Information Technology'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 1 AND 37;

UPDATE users SET counsellor_id = 'FAC010'
WHERE role = 'Student' AND department = 'Information Technology'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 38 AND 74;

UPDATE users SET counsellor_id = 'FAC011'
WHERE role = 'Student' AND department = 'Information Technology'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 75 AND 112;

UPDATE users SET counsellor_id = 'FAC012'
WHERE role = 'Student' AND department = 'Information Technology'
  AND CAST(RIGHT(custom_id, 3) AS INTEGER) BETWEEN 113 AND 150;

-- ========================================
-- SUMMARY
-- ========================================
-- Computer Engineering:         FAC001(1-37), FAC002(38-74), FAC004(75-112), FAC005(113-150)
-- Computer Science Engineering: FAC003(1-37), FAC006(38-74), FAC007(75-112), FAC008(113-150)
-- Information Technology:       FAC009(1-37), FAC010(38-74), FAC011(75-112), FAC012(113-150)
