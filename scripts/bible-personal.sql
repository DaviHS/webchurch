ALTER TABLE users ADD COLUMN IF NOT EXISTS bible_version varchar(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bible_book integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bible_chapter integer;
CREATE TABLE IF NOT EXISTS bible_marks (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id integer NOT NULL REFERENCES bible_books(id),
  chapter integer NOT NULL,
  verse integer NOT NULL,
  color varchar(10),
  note text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id, chapter, verse)
);
CREATE INDEX IF NOT EXISTS bible_marks_user_updated_idx ON bible_marks (user_id, updated_at);
