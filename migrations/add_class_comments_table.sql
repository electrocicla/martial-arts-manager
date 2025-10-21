-- Migration: add_class_comments_table.sql
-- Adds table to store comments for individual generated class sessions.

CREATE TABLE IF NOT EXISTS class_comments (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY(class_id) REFERENCES classes(id)
);

CREATE INDEX IF NOT EXISTS idx_class_comments_class_id ON class_comments(class_id);
