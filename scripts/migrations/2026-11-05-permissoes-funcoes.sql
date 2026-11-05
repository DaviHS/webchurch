CREATE TABLE IF NOT EXISTS function_permissions (
  function_id integer NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
  permission varchar(40) NOT NULL,
  PRIMARY KEY (function_id, permission)
);
