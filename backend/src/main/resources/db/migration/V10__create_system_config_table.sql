CREATE TABLE system_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
