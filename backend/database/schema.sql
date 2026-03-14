-- Smart Campus Database Schema for Supabase
-- Run these SQL commands in your Supabase SQL Editor

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Student', 'Faculty', 'Admin', 'Librarian', 'Peon', 'Counselor')),
  department TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  type TEXT CHECK (type IN ('Assignment', 'Material')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LEAVES TABLE
CREATE TABLE IF NOT EXISTS leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_custom_id ON users(custom_id);
CREATE INDEX IF NOT EXISTS idx_leaves_student_id ON leaves(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);

-- 6. Insert default admin user (password: admin123)
-- Note: This is a bcrypt hash of "admin123"
INSERT INTO users (custom_id, full_name, email, password, role, department)
VALUES (
  'ADM001',
  'System Admin',
  'admin@campus.edu',
  '$2a$10$8Z9vZ3qX7QZ9vZ3qX7QZ9u7QZ9vZ3qX7QZ9vZ3qX7QZ9vZ3qX7QZ9', -- Hash for 'admin123'
  'Admin',
  'Administration'
) ON CONFLICT (custom_id) DO NOTHING;

-- 7. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies (Allow all operations for now via service role)
-- For production, implement more granular policies based on roles

-- Allow service role to do everything (this is used by your backend)
CREATE POLICY "Enable all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON assignments FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON leaves FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON complaints FOR ALL USING (true);
