CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    energy INTEGER CHECK (energy >= 1 AND energy <= 5),
    notes TEXT,
    lessons_learned TEXT,
    mistakes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
