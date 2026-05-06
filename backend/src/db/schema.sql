-- Create Tables for FieldSync Professional

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_locations;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS help_requests;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS zones;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS forms;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users Table
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

-- Latest known location for each user (for live map)
CREATE TABLE IF NOT EXISTS user_locations (
  user_id VARCHAR(36) PRIMARY KEY,
  lat DOUBLE NOT NULL,
  lng DOUBLE NOT NULL,
  accuracy DOUBLE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GPS location history for route/path tracking
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

-- Projects Table
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

-- Zones Table
CREATE TABLE IF NOT EXISTS zones (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  boundaries JSON, -- Storing GPS coordinates/polygons
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Teams Table
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

-- Team Members Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS team_members (
  team_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Forms Table (Templates)
CREATE TABLE IF NOT EXISTS forms (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  form_schema JSON NOT NULL, -- Steps and fields definition
  status ENUM('draft', 'published') DEFAULT 'draft',
  assigned_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tasks Table
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

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  zone_id VARCHAR(36),
  data JSON NOT NULL, -- The actual responses
  location JSON, -- Lat/Lng of submission
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
);



-- Help Requests Table
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

-- Audit Logs Table
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

-- Notifications Table
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

-- User Preferences Table
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

-- Global App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_by VARCHAR(36),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Broadcasts Table
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

-- Broadcast Deliveries Table
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

-- Emergency Actions Table
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

-- Create indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_broadcasts_sent_at ON broadcasts(sent_at);
CREATE INDEX idx_broadcast_deliveries_user ON broadcast_deliveries(user_id);
CREATE INDEX idx_broadcast_deliveries_status ON broadcast_deliveries(status);
CREATE INDEX idx_broadcast_deliveries_broadcast ON broadcast_deliveries(broadcast_id);
CREATE INDEX idx_emergency_actions_created_at ON emergency_actions(created_at);

-- Performance indexes for scalability
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_submissions_project_id ON submissions(project_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_submissions_project_status ON submissions(project_id, status);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_teams_leader_id ON teams(leader_id);
CREATE INDEX idx_teams_project_id ON teams(project_id);
CREATE INDEX idx_zones_project_id ON zones(project_id);
CREATE INDEX idx_forms_project_id ON forms(project_id);
CREATE INDEX idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_help_requests_user_status ON help_requests(user_id, status);
CREATE INDEX idx_invite_links_code ON invite_links(code);
CREATE INDEX idx_invite_links_status ON invite_links(status);
CREATE INDEX idx_invite_links_project ON invite_links(project_id);
CREATE INDEX idx_email_invites_token ON email_invites(token);
CREATE INDEX idx_email_invites_email ON email_invites(email);
CREATE INDEX idx_email_invites_project ON email_invites(project_id);
CREATE INDEX idx_users_role_status ON users(role, status);
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

-- Email Invites Table
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

