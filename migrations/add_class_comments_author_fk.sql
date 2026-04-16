-- SQLite doesn't support ALTER TABLE ADD FOREIGN KEY
-- This is documented as a known limitation
-- The FK constraint is enforced at the application level
-- Adding an index to support the relationship
CREATE INDEX IF NOT EXISTS idx_class_comments_author_id ON class_comments(author_id);
