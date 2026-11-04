CREATE TABLE IF NOT EXISTS presentation_sessions (
  id          serial PRIMARY KEY,
  code        varchar(4)   NOT NULL UNIQUE,
  user_id     integer      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       varchar(200) NOT NULL DEFAULT '',
  state       jsonb,
  outline     jsonb,
  outline_rev integer      NOT NULL DEFAULT 0,
  updated_at  timestamp    NOT NULL DEFAULT now(),
  expires_at  timestamp    NOT NULL
);

CREATE TABLE IF NOT EXISTS presentation_commands (
  id         serial PRIMARY KEY,
  session_id integer   NOT NULL REFERENCES presentation_sessions(id) ON DELETE CASCADE,
  command    jsonb     NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS presentation_commands_session_idx
  ON presentation_commands (session_id, id);
