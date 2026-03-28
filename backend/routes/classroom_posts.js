const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { sendEmail } = require('../utils/emailService');

// GET /api/classroom-posts/:classroom_id  — all posts for a classroom
router.get('/classroom-posts/:classroom_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classroom_posts')
      .select('*')
      .eq('classroom_id', req.params.classroom_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/classroom-posts  — create post
router.post('/classroom-posts', async (req, res) => {
  try {
    const { classroom_id, type, title, description, points, due_date, faculty_id, attachments } = req.body;
    
    // Default to empty array if no attachments provided
    const attachmentsData = attachments || [];

    const { data, error } = await supabase
      .from('classroom_posts')
      .insert([{ classroom_id, type, title, description, points: points || 0, due_date, faculty_id, attachments: attachmentsData }])
      .select();
    if (error) throw error;

    // Send email notification to all classroom members (fire-and-forget)
    try {
      // Fetch classroom info
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('name, faculty_id, faculty_name')
        .eq('id', classroom_id)
        .single();

      // Fetch enrolled students' emails
      const { data: enrollments } = await supabase
        .from('classroom_enrollments')
        .select('student_id')
        .eq('classroom_id', classroom_id);

      // Fetch co-teacher faculty IDs
      const { data: coTeachers } = await supabase
        .from('faculty_classroom_members')
        .select('faculty_id')
        .eq('classroom_id', classroom_id);

      // Collect all member IDs (students + co-teachers + owner), excluding the poster
      const memberIds = [];
      if (enrollments) {
        enrollments.forEach(e => memberIds.push(e.student_id));
      }
      if (coTeachers) {
        coTeachers.forEach(ct => {
          if (ct.faculty_id !== faculty_id) memberIds.push(ct.faculty_id);
        });
      }
      // Include classroom owner if they didn't post
      if (classroom && classroom.faculty_id !== faculty_id) {
        memberIds.push(classroom.faculty_id);
      }

      if (memberIds.length > 0) {
        // Fetch emails for all members
        const { data: members } = await supabase
          .from('users')
          .select('email')
          .in('custom_id', memberIds)
          .not('email', 'is', null);

        if (members && members.length > 0) {
          const emails = members.map(m => m.email).filter(Boolean);
          if (emails.length > 0) {
            const classroomName = classroom?.name || 'your classroom';
            const postType = type || 'Post';
            const dueDateHtml = due_date
              ? `<tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f5f5f5"><strong>Due Date</strong></td><td style="padding:8px;border:1px solid #e0e0e0">${due_date}</td></tr>`
              : '';

            sendEmail(
              emails,
              `📢 New ${postType} in ${classroomName}: ${title}`,
              `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px">
                <h2 style="color:#1a73e8;margin-bottom:16px">📢 New ${postType} in ${classroomName}</h2>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                  <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f5f5f5"><strong>Title</strong></td><td style="padding:8px;border:1px solid #e0e0e0">${title}</td></tr>
                  ${description ? `<tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f5f5f5"><strong>Description</strong></td><td style="padding:8px;border:1px solid #e0e0e0">${description}</td></tr>` : ''}
                  ${dueDateHtml}
                </table>
                <p style="color:#666;font-size:13px">Login to Smart Campus to view the full details.</p>
                <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
                <p style="color:#999;font-size:12px">This is an automated notification from Smart Campus.</p>
              </div>`
            );
          }
        }
      }
    } catch (emailErr) {
      console.error('Email notification error (classroom post):', emailErr.message);
    }

    res.json({ success: true, message: `${type} posted`, data: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// PUT /api/classroom-posts/:id  — update post
router.put('/classroom-posts/:id', async (req, res) => {
  try {
    const { title, description, points, due_date } = req.body;
    const { data, error } = await supabase
      .from('classroom_posts')
      .update({ title, description, points: points || 0, due_date })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, message: 'Post updated', data: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/classroom-posts/:id
router.delete('/classroom-posts/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('classroom_posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
