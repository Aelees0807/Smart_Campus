// Simple test to check admin user
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAdmin() {
  console.log('\n=== CHECKING ADMIN USER ===\n');
  
  // Check if admin exists
  const { data: admin, error } = await supabase
    .from('users')
    .select('*')
    .eq('custom_id', 'ADM001')
    .single();
  
  if (error) {
    console.log('❌ ERROR:', error.message);
    console.log('\n🔧 FIX: The admin user does NOT exist!');
    console.log('   Run this SQL in Supabase SQL Editor:\n');
    console.log(`INSERT INTO users (custom_id, full_name, email, password, role, department)
VALUES (
  'ADM001',
  'System Admin',
  'admin@campus.edu',
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8cR2FxnpFiOJqknBx1xk0BkBk3p1yG',
  'Admin',
  'Administration'
) ON CONFLICT (custom_id) DO NOTHING;`);
    return;
  }
  
  console.log('✅ Admin user EXISTS!');
  console.log('   User ID:', admin.custom_id);
  console.log('   Name:', admin.full_name);
  console.log('   Email:', admin.email);
  console.log('   Role:', admin.role);
  console.log('\n=== TESTING PASSWORD ===\n');
  
  // Test password hash
  const testPassword = 'admin123';
  const isMatch = await bcrypt.compare(testPassword, admin.password);
  
  if (isMatch) {
    console.log('✅ Password "admin123" matches! Login should work.');
  } else {
    console.log('❌ Password does NOT match!');
    console.log('   The password hash in database is incorrect.');
    console.log('\n🔧 FIX: Update the admin password with this SQL:\n');
    const correctHash = await bcrypt.hash('admin123', 10);
    console.log(`UPDATE users
SET password = '${correctHash}'
WHERE custom_id = 'ADM001';`);
  }
  
  console.log('\n=== ALL USERS IN DATABASE ===\n');
  const { data: allUsers } = await supabase.from('users').select('custom_id, full_name, role');
  allUsers.forEach((u, i) => console.log(`${i+1}. ${u.custom_id} - ${u.full_name} (${u.role})`));
  console.log('');
}

checkAdmin().catch(console.error);
