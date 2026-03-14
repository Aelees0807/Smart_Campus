// reset-admin.js - Resets admin password directly via Supabase service role
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function resetAdmin() {
  console.log('\n=== RESETTING ADMIN PASSWORD ===\n');

  // Generate a fresh correct hash for "admin123"
  const newHash = await bcrypt.hash('admin123', 10);
  console.log('✅ Generated new bcrypt hash for "admin123"');
  console.log('   Hash:', newHash);

  // Update in Supabase
  const { data, error } = await supabase
    .from('users')
    .update({ password: newHash })
    .eq('custom_id', 'ADM001')
    .select('custom_id, full_name, role, email');

  if (error) {
    console.log('\n❌ UPDATE FAILED:', error.message);
    console.log('\n📋 Manual Fix — Run this SQL in Supabase SQL Editor:\n');
    console.log(`UPDATE users SET password = '${newHash}' WHERE custom_id = 'ADM001';`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('\n⚠️  No rows updated. Admin user with ID "ADM001" not found!');
    console.log('\n📋 To INSERT admin — Run this SQL in Supabase SQL Editor:\n');
    console.log(`INSERT INTO users (custom_id, full_name, email, password, role, department)
VALUES ('ADM001', 'System Admin', 'admin@campus.edu', '${newHash}', 'Admin', 'Administration')
ON CONFLICT (custom_id) DO UPDATE SET password = '${newHash}';`);
    return;
  }

  console.log('\n✅ Admin password RESET successfully!');
  console.log('   User:', data[0]);

  // Verify it works
  const { data: adminCheck } = await supabase.from('users').select('password').eq('custom_id', 'ADM001').single();
  const isMatch = await bcrypt.compare('admin123', adminCheck.password);
  console.log('\n🔐 Verification:', isMatch ? '✅ Password "admin123" now works!' : '❌ Still not matching');

  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log('   User ID  : ADM001');
  console.log('   Password : admin123');
  console.log('');
}

resetAdmin().catch(console.error);
