CREATE TABLE macro_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(500) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    country VARCHAR(10),
    impact VARCHAR(10),
    actual VARCHAR(50),
    forecast VARCHAR(50),
    previous VARCHAR(50),
    currency VARCHAR(10),
    fetched_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_macro_events_date ON macro_events(event_date);
