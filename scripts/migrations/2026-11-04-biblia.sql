CREATE TABLE IF NOT EXISTS bible_versions (
  id           serial PRIMARY KEY,
  code         varchar(10)  NOT NULL UNIQUE,
  name         varchar(100) NOT NULL,
  language     varchar(5)   NOT NULL,
  publisher    varchar(100),
  license_note text,
  is_active    boolean      NOT NULL DEFAULT true,
  created_at   timestamp    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bible_books (
  id        integer PRIMARY KEY,
  testament varchar(2)  NOT NULL,
  name_pt   varchar(50) NOT NULL,
  abbrev_pt varchar(10) NOT NULL,
  name_en   varchar(50) NOT NULL,
  chapters  integer     NOT NULL
);

CREATE TABLE IF NOT EXISTS bible_verses (
  version_id integer NOT NULL REFERENCES bible_versions(id) ON DELETE CASCADE,
  book_id    integer NOT NULL REFERENCES bible_books(id),
  chapter    integer NOT NULL,
  verse      integer NOT NULL,
  text       text    NOT NULL,
  PRIMARY KEY (version_id, book_id, chapter, verse)
);
