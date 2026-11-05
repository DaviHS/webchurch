CREATE TABLE IF NOT EXISTS ministry_permissions (
  id serial PRIMARY KEY,
  ministry_id integer NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  function_id integer REFERENCES functions(id) ON DELETE CASCADE,
  permission varchar(40) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ministry_permissions_unique ON ministry_permissions (ministry_id, COALESCE(function_id, 0), permission);
CREATE INDEX IF NOT EXISTS ministry_permissions_ministry_idx ON ministry_permissions (ministry_id);
