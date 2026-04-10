const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

// POST /api/login - User authentication
router.post('/login', async (req, res) => {
  const { userId, password } = req.body;

  try {
    // Fetch user by custom_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('custom_id', userId)
      .single();

    if (error || !users) {
      return res.json({ success: false, message: 'Invalid User ID or Password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, users.password);

    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid User ID or Password' });
    }

    // Success
    res.json({
      success: true,
      role: users.role,
      name: users.full_name,
      department: users.department || null,
      message: 'Login successful'
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
