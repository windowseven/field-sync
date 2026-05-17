-- 001-initial-schema.sql
-- Creates all core tables with IF NOT EXISTS guards.
-- This migration is idempotent — safe to run multiple times.

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  verification_code VARCHAR(10),
  verification_expires TIMESTAMP NULL,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'supervisor', 'team_leader', 'field_agent') NOT NULL,
  team VARCHAR(255) NULL,
  avatar VARCHAR(255),
  location_sharing_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  status ENUM('online', 'offline', 'idle') DEFAULT 'offline',
  session_started_at TIMESTAMP NULL,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_locations (
  user_id VARCHAR(36) PRIMARY KEY,
  lat DOUBLE NOT NULL,
  lng DOUBLE NOT NULL,
  accuracy DOUBLE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_location_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  lat DOUBLE NOT NULL,
  lng DOUBLE NOT NULL,
  accuracy DOUBLE,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_recorded (user_id, recorded_at DESC)
);

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'paused', 'draft', 'archived') NOT NULL DEFAULT 'draft',
  progress INT DEFAULT 0,
  start_date DATE,
  deadline DATE,
  location VARCHAR(255),
  target_submissions INT DEFAULT 0,
  total_submissions INT DEFAULT 0,
  last_opened TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  boundaries JSON,
  assignment_mode ENUM('individual', 'group') DEFAULT 'individual',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  leader_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  session_started_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forms (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  form_schema JSON NOT NULL,
  status ENUM('draft', 'published') DEFAULT 'draft',
  assigned_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  zone_id VARCHAR(36),
  assigned_to VARCHAR(36),
  form_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  deadline TIMESTAMP,
  mode ENUM('individual', 'group') DEFAULT 'individual',
  status ENUM('draft', 'pending', 'in-progress', 'completed') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  assigned_by VARCHAR(36),
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  zone_id VARCHAR(36),
  data JSON NOT NULL,
  location JSON,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS help_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('help', 'meeting', 'assistance') NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  response_from VARCHAR(36),
  response_at TIMESTAMP NULL,
  response_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (response_from) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(255) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(36),
  target_name VARCHAR(255),
  category ENUM('user', 'team', 'zone', 'form', 'task', 'project', 'security', 'auth', 'system', 'submission') DEFAULT 'system',
  detail TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('info', 'alert', 'warning', 'success', 'task', 'form', 'help-request', 'help', 'message', 'system', 'submission', 'audit', 'team', 'location', 'project', 'security') DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('unread', 'read') DEFAULT 'unread',
  link VARCHAR(255),
  broadcast_id VARCHAR(36),
  sender_id VARCHAR(36),
  sender_name VARCHAR(255),
  project_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(36) PRIMARY KEY,
  bio TEXT,
  preferred_theme ENUM('light', 'dark', 'system') DEFAULT 'system',
  preferred_language VARCHAR(10) DEFAULT 'en',
  preferred_timezone VARCHAR(100) DEFAULT 'UTC',
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT TRUE,
  notification_sms BOOLEAN DEFAULT FALSE,
  notification_team_updates BOOLEAN DEFAULT TRUE,
  notification_form_submissions BOOLEAN DEFAULT TRUE,
  notification_system_alerts BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_by VARCHAR(36),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('announcement', 'maintenance', 'alert') DEFAULT 'announcement',
  audience VARCHAR(50) NOT NULL,
  sent_by VARCHAR(36),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS broadcast_deliveries (
  broadcast_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  status ENUM('unread', 'read') DEFAULT 'unread',
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  PRIMARY KEY (broadcast_id, user_id),
  FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emergency_actions (
  id VARCHAR(36) PRIMARY KEY,
  control_key VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  reason TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invite_links (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  role ENUM('team_leader', 'field_user') NOT NULL,
  project_id VARCHAR(36) NULL,
  team VARCHAR(255),
  max_uses INT DEFAULT 10,
  uses INT DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  status ENUM('active', 'expired', 'maxed', 'deleted') DEFAULT 'active',
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS email_invites (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role ENUM('team_leader', 'field_user') NOT NULL,
  project_id VARCHAR(36) NULL,
  team VARCHAR(255),
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status ENUM('pending', 'accepted', 'expired', 'cancelled') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS team_messages (
  id VARCHAR(36) PRIMARY KEY,
  team_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team_messages_team (team_id, created_at DESC)
);

CREATE TABLE IF NOT EXISTS sub_zone_assignments (
  id VARCHAR(36) PRIMARY KEY,
  zone_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  boundaries JSON,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sub_zone_zone (zone_id),
  INDEX idx_sub_zone_user (user_id)
);

CREATE TABLE IF NOT EXISTS field_issues (
  id VARCHAR(36) PRIMARY KEY,
  team_id VARCHAR(36) NOT NULL,
  reported_by VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  affected_zone_id VARCHAR(36) NULL,
  status ENUM('active', 'redirected', 'paused', 'resumed', 'resolved') DEFAULT 'active',
  response_note TEXT NULL,
  redirect_zone_id VARCHAR(36) NULL,
  resolved_by VARCHAR(36) NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_field_issues_team (team_id, status),
  INDEX idx_field_issues_created (created_at DESC)
);

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'responded', 'archived') DEFAULT 'new',
  admin_response TEXT NULL,
  responded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status_created (status, created_at DESC),
  INDEX idx_email (email)
);
