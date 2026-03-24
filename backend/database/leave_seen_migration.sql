-- Migration: Add student_seen column to leaves table
-- This tracks whether the student has seen the counsellor's response (Approved/Rejected)

ALTER TABLE leaves ADD COLUMN student_seen BOOLEAN DEFAULT FALSE;

-- Mark all existing processed leaves as already seen to avoid showing old notifications
UPDATE leaves SET student_seen = true WHERE status IN ('Approved', 'Rejected');
