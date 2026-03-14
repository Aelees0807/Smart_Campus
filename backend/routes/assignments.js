const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/assignments - Fetch all assignments
router.get('/assignments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map id to _id for frontend compatibility
    const mappedData = data.map(item => ({ ...item, _id: item.id }));
    res.json(mappedData || []);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ success: false, message: 'Error fetching assignments' });
  }
});

// POST /api/assignments - Create new assignment
router.post('/assignments', async (req, res) => {
  try {
    const { title, subject, description, dueDate, type } = req.body;

    const { data, error } = await supabase
      .from('assignments')
      .insert([{
        title,
        subject,
        description,
        due_date: dueDate,
        type
      }])
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'Assignment created successfully', data });
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).json({ success: false, message: 'Error creating assignment' });
  }
});

// DELETE /api/assignments/:id - Delete assignment
router.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ success: false, message: 'Error deleting assignment' });
  }
});

module.exports = router;
