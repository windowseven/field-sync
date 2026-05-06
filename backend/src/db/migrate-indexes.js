import pool from '../config/database.js';
import logger from '../utils/logger.js';

const INDEXES = [
  'ALTER TABLE users ADD COLUMN session_started_at TIMESTAMP NULL',
  'ALTER TABLE users ADD COLUMN team VARCHAR(255) NULL',
  'ALTER TABLE invite_links ADD COLUMN project_id VARCHAR(36) NULL',
  'ALTER TABLE email_invites ADD COLUMN project_id VARCHAR(36) NULL',
  'CREATE INDEX IF NOT EXISTS idx_invite_links_project ON invite_links(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_email_invites_project ON email_invites(project_id)',
  'ALTER TABLE teams ADD COLUMN session_started_at TIMESTAMP NULL',
  `CREATE TABLE IF NOT EXISTS user_location_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    accuracy DOUBLE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_recorded (user_id, recorded_at DESC)
  )`,
  'CREATE INDEX idx_audit_logs_category ON audit_logs(category)',
  'CREATE INDEX idx_notifications_user_status ON notifications(user_id, status)',
  'CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC)',
  'CREATE INDEX idx_broadcast_deliveries_broadcast ON broadcast_deliveries(broadcast_id)',
  'CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to)',
  'CREATE INDEX idx_tasks_project_id ON tasks(project_id)',
  'CREATE INDEX idx_tasks_status ON tasks(status)',
  'CREATE INDEX idx_tasks_project_status ON tasks(project_id, status)',
  'CREATE INDEX idx_submissions_project_id ON submissions(project_id)',
  'CREATE INDEX idx_submissions_user_id ON submissions(user_id)',
  'CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at)',
  'CREATE INDEX idx_submissions_project_status ON submissions(project_id, status)',
  'CREATE INDEX idx_team_members_user_id ON team_members(user_id)',
  'CREATE INDEX idx_teams_leader_id ON teams(leader_id)',
  'CREATE INDEX idx_teams_project_id ON teams(project_id)',
  'CREATE INDEX idx_zones_project_id ON zones(project_id)',
  'CREATE INDEX idx_forms_project_id ON forms(project_id)',
  'CREATE INDEX idx_help_requests_user_id ON help_requests(user_id)',
  'CREATE INDEX idx_help_requests_status ON help_requests(status)',
  'CREATE INDEX idx_help_requests_user_status ON help_requests(user_id, status)',
  'CREATE INDEX idx_users_role_status ON users(role, status)',
  `CREATE TABLE IF NOT EXISTS team_messages (
    id VARCHAR(36) PRIMARY KEY,
    team_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_team_messages_team (team_id, created_at DESC)
  )`,
  `CREATE TABLE IF NOT EXISTS sub_zone_assignments (
    id VARCHAR(36) PRIMARY KEY,
    zone_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    boundaries JSON,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sub_zone_zone (zone_id),
    INDEX idx_sub_zone_user (user_id)
  )`,
  `ALTER TABLE zones ADD COLUMN assignment_mode ENUM('individual', 'group') DEFAULT 'individual'`,
  `CREATE TABLE IF NOT EXISTS field_issues (
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
  )`,
  `CREATE TABLE IF NOT EXISTS contact_inquiries (
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
  )`,
];

export const runMigration = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    logger.info('🔧 Running scalability migration...');

    for (const sql of INDEXES) {
      try {
        await connection.query(sql);
        const name = sql.match(/idx_\w+/)?.[0] || 'unknown';
        logger.info(`  ✅ Created index: ${name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_KEY' || err.code === 'ER_DUP_NAME' || err.message.includes('Duplicate')) {
          const name = sql.match(/idx_\w+/)?.[0] || 'unknown';
          logger.info(`  ⏭️  Index already exists: ${name}`);
        } else {
          logger.warn(`  ⚠️  Failed to create index: ${err.message}`);
        }
      }
    }

    logger.info('✅ Scalability migration complete.');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
  } finally {
    connection?.release?.();
  }
};

const isDirectRun = process.argv[1]?.endsWith('migrate-indexes.js');
if (isDirectRun) {
  runMigration().then(() => process.exit(0));
}
