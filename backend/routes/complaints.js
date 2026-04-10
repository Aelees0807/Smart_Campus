const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/complaints/all - Fetch ALL complaints (for Librarian/Peon dashboards)
// Query params: category, status, exclude_category, department (filters by student's department)
router.get('/complaints/all', async (req, res) => {
  try {
    const { category, status, exclude_category, department } = req.query;

    let query = supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) query = query.ilike('category', category);
    if (exclude_category) query = query.neq('category', exclude_category);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    // Fetch student names for all complaints
    const studentIds = [...new Set(data.map(c => c.student_id))];
    let studentsMap = {};
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('users')
        .select('custom_id, full_name, department, class')
        .in('custom_id', studentIds);
      if (students) {
        students.forEach(s => { studentsMap[s.custom_id] = s; });
      }
    }

    let enriched = data.map(c => ({
      ...c,
      _id: c.id,
      student_name: studentsMap[c.student_id]?.full_name || c.student_id,
      student_department: studentsMap[c.student_id]?.department || '—',
      student_class: studentsMap[c.student_id]?.class || '—',
    }));

    // Filter by department if specified (for department-wise peons)
    if (department) {
      enriched = enriched.filter(c => c.student_department === department);
    }

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching all complaints:', err);
    res.status(500).json({ success: false, message: 'Error fetching complaints' });
  }
});

// PUT /api/complaints/:id/status - Update complaint status (Librarian/Peon)
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const { data, error } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({ success: true, message: `Complaint status updated to ${status}`, data });
  } catch (err) {
    console.error('Error updating complaint status:', err.message || err);
    res.status(500).json({ success: false, message: 'Error updating complaint status: ' + (err.message || 'Unknown error') });
  }
});

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
    const { studentId, category, description, attachments } = req.body;

    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        student_id: studentId,
        category,
        description,
        attachments,
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
    const { category, description, status, attachments } = req.body;

    const updateData = {};
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (attachments !== undefined) updateData.attachments = attachments;

    console.log(`[Complaints] Updating complaint ${id} with:`, updateData);

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('[Complaints] Supabase error:', error);
      throw error;
    }

    console.log(`[Complaints] Update result:`, data);
    res.json({ success: true, message: 'Complaint updated successfully', data });
  } catch (err) {
    console.error('Error updating complaint:', err.message || err);
    res.status(500).json({ success: false, message: 'Error updating complaint: ' + (err.message || 'Unknown error') });
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
