CREATE TABLE long_term_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(200) NOT NULL,
    category      VARCHAR(30)  NOT NULL,
    status        VARCHAR(30)  NOT NULL,
    asset         VARCHAR(80),
    horizon       VARCHAR(50),
    thesis        TEXT,
    trigger_plan  TEXT,
    invalidation  TEXT,
    notes         TEXT,
    target_date   DATE,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_long_term_entries_user_id ON long_term_entries(user_id);
CREATE INDEX idx_long_term_entries_user_category ON long_term_entries(user_id, category);
