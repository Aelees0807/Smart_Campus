const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/complaints/:studentId - Fetch complaints by student ID
router.get('/complaints/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map id to _id for frontend compatibility
    const mappedData = data.map(item => ({ ...item, _id: item.id }));
    res.json(mappedData || []);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ success: false, message: 'Error fetching complaints' });
  }
});

// POST /api/complaints - Create new complaint
router.post('/complaints', async (req, res) => {
  try {
    const { studentId, category, description } = req.body;

    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        student_id: studentId,
        category,
        description,
        status: 'Open'
      }])
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'Complaint submitted', data });
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ success: false, message: 'Error creating complaint' });
  }
});

// PUT /api/complaints/:id - Update complaint
router.put('/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, status } = req.body;

    const updateData = {};
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (status) updateData.status = status;

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'Complaint updated successfully', data });
  } catch (err) {
    console.error('Error updating complaint:', err);
    res.status(500).json({ success: false, message: 'Error updating complaint' });
  }
});

// DELETE /api/complaints/:id - Delete complaint
router.delete('/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error('Error deleting complaint:', err);
    res.status(500).json({ success: false, message: 'Error deleting complaint' });
  }
});

module.exports = router;
