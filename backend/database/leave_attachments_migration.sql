-- ========================================
-- LEAVE ATTACHMENTS MIGRATION
-- Run this in Supabase SQL Editor
-- Adds attachments column to leaves table
-- ========================================

ALTER TABLE leaves ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
