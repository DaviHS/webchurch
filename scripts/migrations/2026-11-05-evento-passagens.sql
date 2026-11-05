CREATE TABLE IF NOT EXISTS event_passages (
  id serial PRIMARY KEY,
  event_id integer NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reference varchar(60) NOT NULL,
  version_code varchar(10) NOT NULL,
  placement varchar(6) NOT NULL DEFAULT 'after',
  "order" integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_passages_event_idx ON event_passages (event_id);
