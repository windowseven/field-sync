CREATE TABLE IF NOT EXISTS token_blacklist (
  jti VARCHAR(64) PRIMARY KEY,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
