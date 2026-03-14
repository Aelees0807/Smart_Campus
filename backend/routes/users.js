const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

// GET /api/users - Fetch all users
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// POST /api/users - Create new user
router.post('/users', async (req, res) => {
  try {
    const { custom_id, full_name, email, password, role, department, phone } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        custom_id,
        full_name,
        email,
        password: hashedPassword,
        role,
        department,
        phone
      }])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.json({ success: false, message: 'User ID or Email already exists' });
      }
      throw error;
    }

    res.json({ success: true, message: 'User created successfully', data });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, message: 'Error creating user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, password, role, department, phone } = req.body;

    const updateData = { full_name, email, role, department, phone };

    // Only hash and update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('custom_id', id)
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'User updated successfully', data });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('custom_id', id);

    if (error) throw error;

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

module.exports = router;
