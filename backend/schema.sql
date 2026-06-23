CREATE TABLE IF NOT EXISTS users (
    id           SERIAL PRIMARY KEY,
    azure_id     VARCHAR(200) UNIQUE NOT NULL,
    email        VARCHAR(200),
    display_name VARCHAR(200),
    is_admin     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login   TIMESTAMPTZ
);
