const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/counsellor-students/:faculty_id - Get all students assigned to this counsellor
router.get('/counsellor-students/:faculty_id', async (req, res) => {
  try {
    const { faculty_id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('custom_id, full_name, email, department, class, batch, phone')
      .eq('role', 'Student')
      .eq('counsellor_id', faculty_id)
      .order('custom_id', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching counsellor students:', err);
    res.status(500).json({ success: false, message: 'Error fetching counsellor students' });
  }
});

// GET /api/student-counsellor/:student_id - Get the counsellor info for a student
router.get('/student-counsellor/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;

    // First get the student's counsellor_id
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('counsellor_id')
      .eq('custom_id', student_id)
      .single();

    if (studentError || !student || !student.counsellor_id) {
      return res.json({ success: false, message: 'No counsellor assigned' });
    }

    // Then get the counsellor's details
    const { data: counsellor, error: counsellorError } = await supabase
      .from('users')
      .select('custom_id, full_name, email, department, phone')
      .eq('custom_id', student.counsellor_id)
      .single();

    if (counsellorError || !counsellor) {
      return res.json({ success: false, message: 'Counsellor not found' });
    }

    res.json({ success: true, counsellor });
  } catch (err) {
    console.error('Error fetching student counsellor:', err);
    res.status(500).json({ success: false, message: 'Error fetching counsellor info' });
  }
});

module.exports = router;
