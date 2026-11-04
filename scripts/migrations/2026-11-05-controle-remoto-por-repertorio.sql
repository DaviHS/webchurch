ALTER TABLE presentation_sessions
  ADD COLUMN IF NOT EXISTS deck_key varchar(100) NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS presentation_sessions_user_deck_unique
  ON presentation_sessions (user_id, deck_key);
