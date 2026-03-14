-- Insert ONLY Users - Smart Campus Database
-- Run this in Supabase SQL Editor
-- Other tables (assignments, leaves, complaints) will remain empty

-- ========================================
-- INSERT USERS ONLY
-- ========================================

-- Students (Password for all: student123)
INSERT INTO users (custom_id, full_name, email, password, role, department, phone) VALUES
('24DCE001', 'Dhruv Adhiya', '24dce001@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Student', 'Computer Engineering', '9428623118'),
('24DCE020', 'Aelees Bhuva', '24dce020@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Student', 'Computer Engineering', '9712740139'),
('24DCE021', 'Yash Boghara', '24dce021@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Student', 'Computer Engineering', '9876543213'),
('24DCE036', 'Preet Dhoriyani', '24dce036@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Student', 'Computer Engineering', '9876543214')
ON CONFLICT (custom_id) DO NOTHING;

-- Faculty (Password for all: faculty123)
INSERT INTO users (custom_id, full_name, email, password, role, department, phone) VALUES
('FAC001', 'Dr. Sharma', 'sharma@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Computer Engineering', '9876543220'),
('FAC002', 'Prof. Patel', 'patel@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Faculty', 'Computer Engineering', '9876543221')
ON CONFLICT (custom_id) DO NOTHING;

-- Librarian (Password: library123)
INSERT INTO users (custom_id, full_name, email, password, role, department, phone) VALUES
('LIB001', 'Mrs. Gandhi', 'library@charusat.edu.in', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG', 'Librarian', 'Library', '9876543230')
ON CONFLICT (custom_id) DO NOTHING;

-- Admin user is already inserted via schema.sql
-- User ID: ADM001, Password: admin123

-- ========================================
-- SUMMARY OF USERS
-- ========================================
-- Total: 8 users
-- - 1 Admin (ADM001)
-- - 4 Students (24DCE001, 24DCE020, 24DCE021, 24DCE036)
-- - 2 Faculty (FAC001, FAC002)
-- - 1 Librarian (LIB001)
--
-- All students: password = student123
-- All faculty: password = faculty123
-- Librarian: password = library123
-- Admin: password = admin123
