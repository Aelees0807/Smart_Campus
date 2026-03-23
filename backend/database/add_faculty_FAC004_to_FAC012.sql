-- ========================================
-- ADD FACULTY FAC004 to FAC012
-- Run this in Supabase SQL Editor
-- Password for all: faculty123
-- Hash: $2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG
-- ========================================

-- ─── Computer Engineering (CE) ─────────────────────────────────
-- Existing: FAC001 (Dr. Sharma), FAC002 (Prof. Patel)
-- Adding 2 more to make total = 4

INSERT INTO users (custom_id, full_name, email, password, role, department, phone) VALUES
('FAC004', 'Dr. Mehta', 'mehta@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Computer Engineering', '9876543222'),
('FAC005', 'Prof. Joshi', 'joshi@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Computer Engineering', '9876543223')
ON CONFLICT (custom_id) DO NOTHING;

-- ─── Computer Science Engineering (CSE) ────────────────────────
-- Existing: FAC003 (Mr. Patel)
-- Adding 3 more to make total = 4

INSERT INTO users (custom_id, full_name, email, password, role, department, phone) VALUES
('FAC006', 'Dr. Desai', 'desai@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Computer Science Engineering', '9876543224'),
('FAC007', 'Prof. Shah', 'shah@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Computer Science Engineering', '9876543225'),
('FAC008', 'Dr. Trivedi', 'trivedi@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Computer Science Engineering', '9876543226')
ON CONFLICT (custom_id) DO NOTHING;

-- ─── Information Technology (IT) ───────────────────────────────
-- New department, adding 4 faculty

INSERT INTO users (custom_id, full_name, email, password, role, department, phone) VALUES
('FAC009', 'Dr. Raval', 'raval@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Information Technology', '9876543227'),
('FAC010', 'Prof. Bhatt', 'bhatt@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Information Technology', '9876543228'),
('FAC011', 'Dr. Parikh', 'parikh@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Information Technology', '9876543229'),
('FAC012', 'Prof. Pandya', 'pandya@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Information Technology', '9876543230')
ON CONFLICT (custom_id) DO NOTHING;

-- ========================================
-- SUMMARY
-- ========================================
-- Computer Engineering (CE):    FAC001, FAC002, FAC004, FAC005  (4 faculty)
-- Computer Science Eng (CSE):   FAC003, FAC006, FAC007, FAC008  (4 faculty)
-- Information Technology (IT):  FAC009, FAC010, FAC011, FAC012  (4 faculty)
--
-- Total new faculty added: 9 (FAC004 - FAC012)
-- All passwords: faculty123
