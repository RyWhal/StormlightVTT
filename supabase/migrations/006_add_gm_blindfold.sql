-- Add GM blindfold session flag
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS is_blindfolded BOOLEAN DEFAULT FALSE;
