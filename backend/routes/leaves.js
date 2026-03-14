const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/leaves/:studentId - Fetch leaves by student ID
router.get('/leaves/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map id to _id for frontend compatibility
    const mappedData = data.map(item => ({ ...item, _id: item.id }));
    res.json(mappedData || []);
  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.status(500).json({ success: false, message: 'Error fetching leaves' });
  }
});

// POST /api/leaves - Create new leave application
router.post('/leaves', async (req, res) => {
  try {
    const { studentId, studentName, reason, date } = req.body;

    const { data, error } = await supabase
      .from('leaves')
      .insert([{
        student_id: studentId,
        student_name: studentName,
        reason,
        date,
        status: 'Pending'
      }])
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'Leave application submitted', data });
  } catch (err) {
    console.error('Error creating leave:', err);
    res.status(500).json({ success: false, message: 'Error creating leave' });
  }
});

// PUT /api/leaves/:id - Update leave application
router.put('/leaves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, date, status } = req.body;

    const updateData = {};
    if (reason) updateData.reason = reason;
    if (date) updateData.date = date;
    if (status) updateData.status = status;

    const { data, error } = await supabase
      .from('leaves')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'Leave updated successfully', data });
  } catch (err) {
    console.error('Error updating leave:', err);
    res.status(500).json({ success: false, message: 'Error updating leave' });
  }
});

// DELETE /api/leaves/:id - Delete leave application
router.delete('/leaves/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('leaves')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Leave deleted successfully' });
  } catch (err) {
    console.error('Error deleting leave:', err);
    res.status(500).json({ success: false, message: 'Error deleting leave' });
  }
});

module.exports = router;
