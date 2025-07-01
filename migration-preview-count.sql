-- Migration to add preview_count column to existing users table
-- Run this if you already have a users table without the preview_count column

ALTER TABLE users ADD COLUMN preview_count INTEGER DEFAULT 0;