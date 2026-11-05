CREATE TABLE IF NOT EXISTS audit_logs (
  id serial PRIMARY KEY,
  user_id integer,
  user_label varchar(150) NOT NULL,
  action varchar(100) NOT NULL,
  input jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at);
