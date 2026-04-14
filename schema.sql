CREATE TABLE IF NOT EXISTS transcriptions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    segments INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_created_at ON transcriptions(created_at DESC);
