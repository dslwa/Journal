CREATE TABLE trades (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker         VARCHAR(20)  NOT NULL,
    direction      VARCHAR(10)  NOT NULL,
    entry_price    DOUBLE PRECISION NOT NULL,
    exit_price     DOUBLE PRECISION,
    position_size  DOUBLE PRECISION NOT NULL,
    opened_at      TIMESTAMP    NOT NULL,
    closed_at      TIMESTAMP,
    stop_loss      DOUBLE PRECISION,
    notes          TEXT,
    created_at     TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_trades_user_id ON trades(user_id);
