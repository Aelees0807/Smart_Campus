const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { sendEmail } = require('../utils/emailService');

// ⚠️ IMPORTANT: The counsellor route MUST be defined BEFORE the :studentId route
// because Express would otherwise match "counsellor" as a studentId parameter.

// GET /api/leaves/counsellor/:facultyId - Fetch leaves for students assigned to this counsellor
router.get('/leaves/counsellor/:facultyId', async (req, res) => {
  try {
    const { facultyId } = req.params;

    // First get all student IDs assigned to this counsellor
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('custom_id')
      .eq('role', 'Student')
      .eq('counsellor_id', facultyId);

    if (studentsError) throw studentsError;

    if (!students || students.length === 0) {
      return res.json([]);
    }

    const studentIds = students.map(s => s.custom_id);

    // Then fetch leaves for those students
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mappedData = (data || []).map(item => ({ ...item, _id: item.id }));
    res.json(mappedData);
  } catch (err) {
    console.error('Error fetching counsellor leaves:', err);
    res.status(500).json({ success: false, message: 'Error fetching leaves' });
  }
});

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
    const { studentId, studentName, reason, date, attachments } = req.body;

    const { data, error } = await supabase
      .from('leaves')
      .insert([{
        student_id: studentId,
        student_name: studentName,
        reason,
        date,
        status: 'Pending',
        attachments: attachments || []
      }])
      .select();

    if (error) throw error;

    // Send email notification to counsellor (fire-and-forget)
    try {
      const { data: student } = await supabase
        .from('users')
        .select('counsellor_id')
        .eq('custom_id', studentId)
        .single();

      if (student?.counsellor_id) {
        const { data: counsellor } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('custom_id', student.counsellor_id)
          .single();

        if (counsellor?.email) {
          sendEmail(
            counsellor.email,
            `📋 New Leave Application from ${studentName}`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
              <h2 style="color:#1a73e8;margin-bottom:16px">📋 New Leave Application</h2>
              <p>Dear ${counsellor.full_name},</p>
              <p><strong>${studentName}</strong> (${studentId}) has submitted a leave application.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f5f5f5"><strong>Date</strong></td><td style="padding:8px;border:1px solid #e0e0e0">${date}</td></tr>
                <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f5f5f5"><strong>Reason</strong></td><td style="padding:8px;border:1px solid #e0e0e0">${reason}</td></tr>
              </table>
              <p style="color:#666;font-size:13px">Please login to Smart Campus to approve or reject this request.</p>
              <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
              <p style="color:#999;font-size:12px">This is an automated notification from Smart Campus.</p>
            </div>`
          );
        }
      }
    } catch (emailErr) {
      console.error('Email notification error (leave submit):', emailErr.message);
    }

    res.json({ success: true, message: 'Leave application submitted', data });
  } catch (err) {
    console.error('Error creating leave:', err);
    res.status(500).json({ success: false, message: 'Error creating leave' });
  }
});

// PUT /api/leaves/mark-seen/:studentId - Mark all processed leaves as seen by student
router.put('/leaves/mark-seen/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabase
      .from('leaves')
      .update({ student_seen: true })
      .eq('student_id', studentId)
      .in('status', ['Approved', 'Rejected'])
      .eq('student_seen', false)
      .select();

    if (error) throw error;

    res.json({ success: true, message: 'Leaves marked as seen', count: (data || []).length });
  } catch (err) {
    console.error('Error marking leaves as seen:', err);
    res.status(500).json({ success: false, message: 'Error marking leaves as seen' });
  }
});

// PUT /api/leaves/:id - Update leave application
router.put('/leaves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, date, status, attachments } = req.body;

    const updateData = {};
    if (reason) updateData.reason = reason;
    if (date) updateData.date = date;
    if (status) updateData.status = status;
    if (attachments !== undefined) updateData.attachments = attachments;

    // When status changes to Approved/Rejected, also reset student_seen so student gets notified
    if (status === 'Approved' || status === 'Rejected') {
      updateData.student_seen = false;
    }

    const { data, error } = await supabase
      .from('leaves')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    // Send email notification to student when leave is approved/rejected
    if ((status === 'Approved' || status === 'Rejected') && data && data.length > 0) {
      try {
        const leave = data[0];
        const { data: student } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('custom_id', leave.student_id)
          .single();

        if (student?.email) {
          const statusColor = status === 'Approved' ? '#1e8e3e' : '#d93025';
          const statusEmoji = status === 'Approved' ? '✅' : '❌';
          sendEmail(
            student.email,
            `${statusEmoji} Your Leave has been ${status}`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
              <h2 style="color:${statusColor};margin-bottom:16px">${statusEmoji} Leave ${status}</h2>
              <p>Dear ${student.full_name},</p>
              <p>Your leave application has been <strong style="color:${statusColor}">${status}</strong> by your counsellor.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f5f5f5"><strong>Date</strong></td><td style="padding:8px;border:1px solid #e0e0e0">${leave.date}</td></tr>
                <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f5f5f5"><strong>Reason</strong></td><td style="padding:8px;border:1px solid #e0e0e0">${leave.reason}</td></tr>
                <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f5f5f5"><strong>Status</strong></td><td style="padding:8px;border:1px solid #e0e0e0;color:${statusColor};font-weight:bold">${status}</td></tr>
              </table>
              <p style="color:#666;font-size:13px">Login to Smart Campus to view more details.</p>
              <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
              <p style="color:#999;font-size:12px">This is an automated notification from Smart Campus.</p>
            </div>`
          );
        }
      } catch (emailErr) {
        console.error('Email notification error (leave status):', emailErr.message);
      }
    }

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
