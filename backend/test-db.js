// Test script to check Supabase connection and database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testDatabase() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // Test 1: Check if users table exists
  console.log('1️⃣ Checking if users table exists...');
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log('❌ ERROR:', error.message);
      console.log('   This usually means the table does not exist!');
      console.log('   👉 You need to run schema.sql in Supabase SQL Editor\n');
      return;
    }
    
    console.log(`✅ Users table exists! Found ${count} users\n`);
    
    // Test 2: Check for admin user
    console.log('2️⃣ Checking for admin user (ADM001)...');
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('custom_id', 'ADM001')
      .single();
    
    if (adminError || !admin) {
      console.log('❌ Admin user NOT found!');
      console.log('   👉 Run schema.sql to create default admin user\n');
    } else {
      console.log('✅ Admin user found!');
      console.log('   User ID:', admin.custom_id);
      console.log('   Name:', admin.full_name);
      console.log('   Email:', admin.email);
      console.log('   Password Hash:', admin.password.substring(0, 20) + '...\n');
    }
    
    // Test 3: List all users
    if (data && data.length > 0) {
      console.log('3️⃣ All users in database:');
      data.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.custom_id} - ${user.full_name} (${user.role})`);
      });
      console.log('');
    }
    
    // Test 4: Check other tables
    console.log('4️⃣ Checking other tables...');
    const tables = ['assignments', 'leaves', 'complaints'];
    for (const table of tables) {
      const { error: tableError, count: tableCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (tableError) {
        console.log(`   ❌ ${table}: Does not exist`);
      } else {
        console.log(`   ✅ ${table}: Exists (${tableCount} rows)`);
      }
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testDatabase();
