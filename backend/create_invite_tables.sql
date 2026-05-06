-- Create invitation tables
CREATE TABLE IF NOT EXISTS invite_links (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  role ENUM('team_leader', 'field_user') NOT NULL,
  team VARCHAR(255),
  max_uses INT DEFAULT 10,
  uses INT DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  status ENUM('active', 'expired', 'maxed', 'deleted') DEFAULT 'active',
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_invites (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role ENUM('team_leader', 'field_user') NOT NULL,
  team VARCHAR(255),
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status ENUM('pending', 'accepted', 'expired', 'cancelled') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);