import pool from '../config/database.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import { initializeDatabase } from './init.js';
import { pathToFileURL } from 'url';
import path from 'path';

// Mock data based on the frontend
export const seedDatabase = async ({ exitProcess = false, skipInitialize = false } = {}) => {
  let connection;
  let exitCode = 0;

  try {
    if (!skipInitialize) {
      await initializeDatabase({ allowDestructive: true });
    }

    connection = await pool.getConnection();
    logger.info('ðŸŒ± Starting database seeding...');

    // Hash password for all mock users
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Windowseven77.';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1. Seed Users
    const users = [
      // Admins
      { id: 'admin-001', name: 'System Admin', first_name: 'Admin', email: 'admin@fieldsync.io', role: 'admin' },
      { id: 'admin-002', name: 'Lespikius Junior', first_name: 'Lespikius', email: 'lespikiusjunior@gmail.com', role: 'admin' },
      { id: 'admin-003', name: 'Admin David', first_name: 'David', email: 'david@fieldsync.io', role: 'admin' },
      // Supervisors
      { id: 'sup-001', name: 'Supervisor Sarah', first_name: 'Sarah', email: 'sarah@fieldsync.io', role: 'supervisor' },
      { id: 'sup-002', name: 'Michael Okoth', first_name: 'Michael', email: 'michael@fieldsync.io', role: 'supervisor' },
      { id: 'sup-003', name: 'Aisha Hassan', first_name: 'Aisha', email: 'aisha@fieldsync.io', role: 'supervisor' },
      { id: 'sup-004', name: 'David Kim', first_name: 'David', email: 'davidk@fieldsync.io', role: 'supervisor' },
      { id: 'sup-005', name: 'Fatima Ali', first_name: 'Fatima', email: 'fatima@fieldsync.io', role: 'supervisor' },
      // Team Leaders
      { id: 'tl-001', name: 'Grace Kimani', first_name: 'Grace', email: 'grace.k@fieldsync.io', role: 'team_leader' },
      { id: 'tl-002', name: 'John Doe', first_name: 'John', email: 'john.doe@fieldsync.io', role: 'team_leader' },
      { id: 'tl-003', name: 'Jane Smith', first_name: 'Jane', email: 'jane.s@fieldsync.io', role: 'team_leader' },
      { id: 'tl-004', name: 'Mike Johnson', first_name: 'Mike', email: 'mike.j@fieldsync.io', role: 'team_leader' },
      { id: 'tl-005', name: 'Sarah Lee', first_name: 'Sarah', email: 'sarah.lee@fieldsync.io', role: 'team_leader' },
      // Field Agents (10+)
      { id: 'fa-001', name: 'John Mwangi', first_name: 'John', email: 'john.m@fieldsync.io', role: 'field_agent' },
      { id: 'fa-002', name: 'Mary Wanjiku', first_name: 'Mary', email: 'mary.w@fieldsync.io', role: 'field_agent' },
      { id: 'fa-003', name: 'Peter Ochieng', first_name: 'Peter', email: 'peter.o@fieldsync.io', role: 'field_agent' },
      { id: 'fa-004', name: 'Esther Njoki', first_name: 'Esther', email: 'esther.n@fieldsync.io', role: 'field_agent' },
      { id: 'fa-005', name: 'James Otieno', first_name: 'James', email: 'james.o@fieldsync.io', role: 'field_agent' },
      { id: 'fa-006', name: 'Rose Achieng', first_name: 'Rose', email: 'rose.a@fieldsync.io', role: 'field_agent' },
      { id: 'fa-007', name: 'Ahmed Yusuf', first_name: 'Ahmed', email: 'ahmed.y@fieldsync.io', role: 'field_agent' },
      { id: 'fa-008', name: 'Fatuma Ibrahim', first_name: 'Fatuma', email: 'fatuma.i@fieldsync.io', role: 'field_agent' },
      { id: 'fa-009', name: 'Kevin Maina', first_name: 'Kevin', email: 'kevin.m@fieldsync.io', role: 'field_agent' },
      { id: 'fa-010', name: 'Linda Cherono', first_name: 'Linda', email: 'linda.c@fieldsync.io', role: 'field_agent' },
      { id: 'fa-011', name: 'Samuel Kiprop', first_name: 'Samuel', email: 'samuel.k@fieldsync.io', role: 'field_agent' },
      { id: 'fa-012', name: 'Nancy Jebet', first_name: 'Nancy', email: 'nancy.j@fieldsync.io', role: 'field_agent' },
      { id: 'fa-013', name: 'Brian Omondi', first_name: 'Brian', email: 'brian.o@fieldsync.io', role: 'field_agent' },
      { id: 'fa-014', name: 'Grace Wairimu', first_name: 'Grace', email: 'grace.w@fieldsync.io', role: 'field_agent' },
      { id: 'fa-015', name: 'Tom Mburu', first_name: 'Tom', email: 'tom.m@fieldsync.io', role: 'field_agent' },
    ];

    for (const user of users) {
      await connection.query(
        'INSERT IGNORE INTO users (id, name, first_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.name, user.first_name, user.email, passwordHash, user.role, 'online']
      );
    }

    // 2. Seed Projects
    const projects = [
      {
        id: 'proj-nairobi-2026',
        name: 'Urban Survey — Nairobi',
        description: 'Comprehensive household and infrastructure survey across 12 zones in Nairobi County.',
        status: 'active',
        progress: 67,
        location: 'Nairobi, Kenya',
        target_submissions: 436,
        total_submissions: 292,
        start_date: '2026-03-01',
        deadline: '2026-06-30'
      },
      {
        id: 'proj-mombasa-2026',
        name: 'Coastal Infrastructure Audit',
        description: 'Mapping and audit of coastal infrastructure assets across Mombasa County.',
        status: 'active',
        progress: 34,
        location: 'Mombasa, Kenya',
        target_submissions: 260,
        total_submissions: 89,
        start_date: '2026-01-15',
        deadline: '2026-05-15'
      },
      {
        id: 'proj-kampala-2026',
        name: 'Outreach Program — Kampala',
        description: 'Community outreach and social service mapping in Kampala Central.',
        status: 'active',
        progress: 45,
        location: 'Kampala, Uganda',
        target_submissions: 500,
        total_submissions: 225,
        start_date: '2026-02-01',
        deadline: '2026-07-01'
      },
      {
        id: 'proj-nakuru-2026',
        name: 'Agricultural Survey — Nakuru',
        description: 'Farm productivity and irrigation assessment.',
        status: 'paused',
        progress: 22,
        location: 'Nakuru, Kenya',
        target_submissions: 320,
        total_submissions: 71,
        start_date: '2026-04-01',
        deadline: '2026-08-01'
      },
      {
        id: 'proj-dar-2026',
        name: 'Urban Planning — Dar es Salaam',
        description: 'Infrastructure and housing survey.',
        status: 'draft',
        progress: 5,
        location: 'Dar es Salaam, Tanzania',
        target_submissions: 380,
        total_submissions: 19,
        start_date: '2026-05-01',
        deadline: '2026-09-30'
      }
    ];

    for (const proj of projects) {
      await connection.query(
        'INSERT IGNORE INTO projects (id, name, description, status, progress, location, target_submissions, total_submissions, start_date, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [proj.id, proj.name, proj.description, proj.status, proj.progress, proj.location, proj.target_submissions, proj.total_submissions, proj.start_date, proj.deadline]
      );
    }

    // 3. Seed Zones (with GPS boundary polygons)
    const zones = [
      // Nairobi 12 zones (Alpha-Beta-Gamma-Delta groups)
      { id: 'zone-nai-alpha-1', project_id: 'proj-nairobi-2026', name: 'Alpha North', description: 'Northern residential sectors', boundaries: JSON.stringify([[-1.2700, 36.8050], [-1.2700, 36.8350], [-1.2850, 36.8350], [-1.2850, 36.8050]]) },
      { id: 'zone-nai-alpha-2', project_id: 'proj-nairobi-2026', name: 'Alpha Central', description: 'Central business districts', boundaries: JSON.stringify([[-1.2850, 36.8050], [-1.2850, 36.8350], [-1.3000, 36.8350], [-1.3000, 36.8050]]) },
      { id: 'zone-nai-alpha-3', project_id: 'proj-nairobi-2026', name: 'Alpha South', description: 'Southern commercial', boundaries: JSON.stringify([[-1.3000, 36.8050], [-1.3000, 36.8350], [-1.3150, 36.8350], [-1.3150, 36.8050]]) },
      { id: 'zone-nai-beta-1', project_id: 'proj-nairobi-2026', name: 'Beta East', description: 'Eastern suburbs', boundaries: JSON.stringify([[-1.2700, 36.8350], [-1.2700, 36.8650], [-1.2850, 36.8650], [-1.2850, 36.8350]]) },
      { id: 'zone-nai-beta-2', project_id: 'proj-nairobi-2026', name: 'Beta West', description: 'Western rural areas', boundaries: JSON.stringify([[-1.2700, 36.7750], [-1.2700, 36.8050], [-1.2850, 36.8050], [-1.2850, 36.7750]]) },
      { id: 'zone-nai-beta-3', project_id: 'proj-nairobi-2026', name: 'Beta CBD', description: 'Inner city markets', boundaries: JSON.stringify([[-1.2850, 36.8200], [-1.2850, 36.8400], [-1.2970, 36.8400], [-1.2970, 36.8200]]) },
      { id: 'zone-nai-gamma-1', project_id: 'proj-nairobi-2026', name: 'Gamma North Outskirts', description: 'Northern peri-urban', boundaries: JSON.stringify([[-1.2550, 36.7900], [-1.2550, 36.8400], [-1.2700, 36.8400], [-1.2700, 36.7900]]) },
      { id: 'zone-nai-gamma-2', project_id: 'proj-nairobi-2026', name: 'Gamma South Villages', description: 'Southern villages', boundaries: JSON.stringify([[-1.3150, 36.7900], [-1.3150, 36.8500], [-1.3350, 36.8500], [-1.3350, 36.7900]]) },
      { id: 'zone-nai-gamma-3', project_id: 'proj-nairobi-2026', name: 'Gamma East Highways', description: 'Highway corridors', boundaries: JSON.stringify([[-1.2850, 36.8650], [-1.2850, 36.9100], [-1.3100, 36.9100], [-1.3100, 36.8650]]) },
      { id: 'zone-nai-delta-1', project_id: 'proj-nairobi-2026', name: 'Delta West Farms', description: 'Western agriculture', boundaries: JSON.stringify([[-1.2850, 36.7500], [-1.2850, 36.7800], [-1.3150, 36.7800], [-1.3150, 36.7500]]) },
      { id: 'zone-nai-delta-2', project_id: 'proj-nairobi-2026', name: 'Delta Central Parks', description: 'Central green spaces', boundaries: JSON.stringify([[-1.2900, 36.8100], [-1.2900, 36.8300], [-1.3050, 36.8300], [-1.3050, 36.8100]]) },
      { id: 'zone-nai-delta-3', project_id: 'proj-nairobi-2026', name: 'Delta South Estates', description: 'Southern upscale', boundaries: JSON.stringify([[-1.3150, 36.8100], [-1.3150, 36.8500], [-1.3350, 36.8500], [-1.3350, 36.8100]]) },
      // Others
      { id: 'zone-mombasa-cbd', project_id: 'proj-mombasa-2026', name: 'Mombasa CBD', description: 'Island business district', boundaries: JSON.stringify([[-4.0400, 39.6600], [-4.0400, 39.6750], [-4.0520, 39.6750], [-4.0520, 39.6600]]) },
      { id: 'zone-kampala-central', project_id: 'proj-kampala-2026', name: 'Kampala Central', description: 'City core', boundaries: JSON.stringify([[0.3350, 32.5700], [0.3350, 32.5950], [0.3550, 32.5950], [0.3550, 32.5700]]) },
      { id: 'zone-nakuru-farms', project_id: 'proj-nakuru-2026', name: 'Nakuru Farms North', description: 'Dairy farms', boundaries: JSON.stringify([[-0.2700, 36.0500], [-0.2700, 36.0850], [-0.2950, 36.0850], [-0.2950, 36.0500]]) },
      { id: 'zone-dar-harbour', project_id: 'proj-dar-2026', name: 'Dar Harbour', description: 'Port area', boundaries: JSON.stringify([[-6.7850, 39.2000], [-6.7850, 39.2200], [-6.8050, 39.2200], [-6.8050, 39.2000]]) }
    ];

    for (const zone of zones) {
      await connection.query(
        'INSERT IGNORE INTO zones (id, project_id, name, description, boundaries) VALUES (?, ?, ?, ?, ?)',
        [zone.id, zone.project_id, zone.name, zone.description, zone.boundaries]
      );
    }

    // 4. Seed Teams
    const teams = [
      // Nairobi project teams
      { id: 'team-nai-alpha', project_id: 'proj-nairobi-2026', name: 'Team Alpha', leader_id: 'tl-001' },
      { id: 'team-nai-beta', project_id: 'proj-nairobi-2026', name: 'Team Beta', leader_id: 'tl-002' },
      { id: 'team-nai-gamma', project_id: 'proj-nairobi-2026', name: 'Team Gamma', leader_id: 'tl-003' },
      { id: 'team-nai-delta', project_id: 'proj-nairobi-2026', name: 'Team Delta', leader_id: 'tl-004' },
      { id: 'team-nai-epsilon', project_id: 'proj-nairobi-2026', name: 'Team Epsilon', leader_id: 'tl-005' },
      // Mombasa
      { id: 'team-mom-1', project_id: 'proj-mombasa-2026', name: 'Mombasa Port Team', leader_id: 'tl-001' },
      { id: 'team-mom-2', project_id: 'proj-mombasa-2026', name: 'Mombasa Old Town', leader_id: 'tl-002' },
      // Kampala
      { id: 'team-kam-1', project_id: 'proj-kampala-2026', name: 'Kampala Central', leader_id: 'tl-003' },
      // Nakuru
      { id: 'team-nak-1', project_id: 'proj-nakuru-2026', name: 'Nakuru Farms', leader_id: 'tl-004' },
      // Dar
      { id: 'team-dar-1', project_id: 'proj-dar-2026', name: 'Dar Harbour Team', leader_id: 'tl-005' }
    ];

    for (const team of teams) {
      await connection.query(
        'INSERT IGNORE INTO teams (id, project_id, name, leader_id) VALUES (?, ?, ?, ?)',
        [team.id, team.project_id, team.name, team.leader_id]
      );
    }

    // 5. Seed Team Members
    const teamMembers = [
      // Nairobi teams
      { team_id: 'team-nai-alpha', user_id: 'fa-001' },
      { team_id: 'team-nai-alpha', user_id: 'fa-002' },
      { team_id: 'team-nai-alpha', user_id: 'fa-003' },
      { team_id: 'team-nai-alpha', user_id: 'fa-004' },
      { team_id: 'team-nai-beta', user_id: 'fa-005' },
      { team_id: 'team-nai-beta', user_id: 'fa-006' },
      { team_id: 'team-nai-beta', user_id: 'fa-007' },
      { team_id: 'team-nai-gamma', user_id: 'fa-008' },
      { team_id: 'team-nai-gamma', user_id: 'fa-009' },
      { team_id: 'team-nai-delta', user_id: 'fa-010' },
      { team_id: 'team-nai-delta', user_id: 'fa-011' },
      { team_id: 'team-nai-epsilon', user_id: 'fa-012' },
      { team_id: 'team-nai-epsilon', user_id: 'fa-013' },
      // Others abbreviated
      { team_id: 'team-mom-1', user_id: 'fa-014' },
      { team_id: 'team-mom-2', user_id: 'fa-015' },
      { team_id: 'team-kam-1', user_id: 'fa-001' },
      { team_id: 'team-nak-1', user_id: 'fa-002' },
      { team_id: 'team-dar-1', user_id: 'fa-003' }
    ];

    for (const tm of teamMembers) {
      await connection.query(
        'INSERT IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)',
        [tm.team_id, tm.user_id]
      );
    }

    // 6. Seed Forms
    const forms = [
      // Nairobi project forms
      {
        id: 'form-nai-hh1',
        project_id: 'proj-nairobi-2026',
        title: 'Household Survey V1',
        description: 'Demographics and housing.',
        form_schema: JSON.stringify([
          { id: 's1', title: 'Household Info', fields: [{id:'hh-id', type:'text'}, {id:'head-name', type:'text'}] },
          { id: 's2', title: 'Infrastructure', fields: [{id:'water', type:'select', options:['Yes','No']}] }
        ]),
        status: 'published'
      },
      {
        id: 'form-nai-infra1',
        project_id: 'proj-nairobi-2026',
        title: 'Infrastructure Check',
        description: 'Road and utility survey.',
        form_schema: JSON.stringify([{ id: 's1', title: 'Assets', fields: [{id:'asset-id', type:'text'}] }]),
        status: 'published'
      },
      {
        id: 'form-nai-health1',
        project_id: 'proj-nairobi-2026',
        title: 'Health Access Survey',
        description: 'Healthcare access data.',
        form_schema: JSON.stringify([{ id: 's1', title: 'Health', fields: [{id:'clinic-distance', type:'number'}] }]),
        status: 'draft'
      },
      {
        id: 'form-mom-port1',
        project_id: 'proj-mombasa-2026',
        title: 'Port Asset Audit',
        description: 'Coastal port infrastructure.',
        form_schema: JSON.stringify([{ id: 's1', title: 'Port', fields: [{id:'dock-id', type:'text'}] }]),
        status: 'published'
      },
      {
        id: 'form-kam-outreach1',
        project_id: 'proj-kampala-2026',
        title: 'Community Outreach',
        description: 'Social services.',
        form_schema: JSON.stringify([{ id: 's1', title: 'Services', fields: [{id:'service-type', type:'select'}] }]),
        status: 'published'
      },
      // More
      {
        id: 'form-nak-farm1',
        project_id: 'proj-nakuru-2026',
        title: 'Farm Survey',
        description: 'Agriculture data.',
        form_schema: JSON.stringify([{ id: 's1', title: 'Farm', fields: [{id:'crop-type', type:'text'}] }]),
        status: 'published'
      },
      {
        id: 'form-dar-urban1',
        project_id: 'proj-dar-2026',
        title: 'Urban Planning Survey',
        description: 'Housing survey.',
        form_schema: JSON.stringify([{ id: 's1', title: 'Housing', fields: [{id:'house-type', type:'select'}] }]),
        status: 'draft'
      }
    ];

    for (const form of forms) {
      await connection.query(
        'INSERT IGNORE INTO forms (id, project_id, title, description, form_schema, status) VALUES (?, ?, ?, ?, ?, ?)',
        [form.id, form.project_id, form.title, form.description, form.form_schema, form.status]
      );
    }

    // 7. Seed Tasks
    const tasks = [
      // Matching mockTasksData + more, mixed statuses
      {
        id: 'task-nai-1',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-alpha-1',
        assigned_to: 'fa-001',
        form_id: 'form-nai-hh1',
        title: 'Zone Alpha North - Household Survey',
        description: 'Complete survey of 50 households in Alpha North.',
        status: 'in-progress',
        priority: 'high',
        assigned_by: 'tl-001'
      },
      {
        id: 'task-nai-2',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-beta-1',
        assigned_to: 'fa-002',
        form_id: 'form-nai-infra1',
        title: 'Review yesterday submissions',
        description: 'Check and approve 15 pending forms from Beta East.',
        status: 'pending',
        priority: 'medium',
        assigned_by: 'tl-002'
      },
      {
        id: 'task-nai-3',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-gamma-1',
        assigned_to: 'fa-003',
        form_id: 'form-nai-health1',
        title: 'Zone Gamma North - Health check',
        description: 'Health access survey in Gamma North.',
        status: 'completed',
        priority: 'low',
        assigned_by: 'tl-003'
      },
      {
        id: 'task-mom-1',
        project_id: 'proj-mombasa-2026',
        zone_id: 'zone-mombasa-cbd',
        assigned_to: 'fa-004',
        form_id: 'form-mom-port1',
        title: 'Water source mapping - Sector 3',
        description: 'Map water sources in Mombasa CBD Sector 3.',
        status: 'pending',
        priority: 'high',
        assigned_by: 'tl-001'
      },
      {
        id: 'task-kam-1',
        project_id: 'proj-kampala-2026',
        zone_id: 'zone-kampala-central',
        assigned_to: 'fa-005',
        form_id: 'form-kam-outreach1',
        title: 'Community leader interviews',
        description: 'Interview 10 community leaders.',
        status: 'in-progress',
        priority: 'medium',
        assigned_by: 'tl-003'
      },
      // 10+ more
      {
        id: 'task-nai-4',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-alpha-2',
        assigned_to: 'fa-006',
        form_id: 'form-nai-hh1',
        title: 'Alpha Central asset audit',
        description: 'Infrastructure assets.',
        status: 'pending',
        priority: 'medium',
        assigned_by: 'tl-001'
      },
      {
        id: 'task-nai-5',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-beta-2',
        assigned_to: 'fa-007',
        form_id: 'form-nai-infra1',
        title: 'Beta West road survey',
        description: 'Road conditions.',
        status: 'completed',
        priority: 'low',
        assigned_by: 'tl-002'
      },
      {
        id: 'task-mom-2',
        project_id: 'proj-mombasa-2026',
        zone_id: 'zone-mombasa-cbd',
        assigned_to: 'fa-008',
        form_id: 'form-mom-port1',
        title: 'Port dock inspection',
        description: 'Dock structures.',
        status: 'in-progress',
        priority: 'high',
        assigned_by: 'tl-001'
      },
      {
        id: 'task-nak-1',
        project_id: 'proj-nakuru-2026',
        zone_id: 'zone-nakuru-farms',
        assigned_to: 'fa-009',
        form_id: 'form-nak-farm1',
        title: 'Farm irrigation check',
        description: 'Irrigation systems.',
        status: 'pending',
        priority: 'medium',
        assigned_by: 'tl-004'
      },
      {
        id: 'task-dar-1',
        project_id: 'proj-dar-2026',
        zone_id: 'zone-dar-harbour',
        assigned_to: 'fa-010',
        form_id: 'form-dar-urban1',
        title: 'Harbour housing survey',
        description: 'Housing conditions.',
        status: 'draft',
        priority: 'low',
        assigned_by: 'tl-005'
      },
      {
        id: 'task-nai-6',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-gamma-2',
        assigned_to: 'fa-011',
        form_id: 'form-nai-health1',
        title: 'Gamma South health survey',
        description: 'Village health.',
        status: 'in-progress',
        priority: 'high',
        assigned_by: 'tl-003'
      },
      {
        id: 'task-nai-7',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-delta-1',
        assigned_to: 'fa-012',
        form_id: 'form-nai-infra1',
        title: 'Delta West farm roads',
        description: 'Farm access roads.',
        status: 'pending',
        priority: 'medium',
        assigned_by: 'tl-004'
      },
      {
        id: 'task-mom-3',
        project_id: 'proj-mombasa-2026',
        zone_id: 'zone-mombasa-cbd',
        assigned_to: 'fa-013',
        form_id: 'form-mom-port1',
        title: 'Old Town mapping',
        description: 'Historical assets.',
        status: 'completed',
        priority: 'low',
        assigned_by: 'tl-002'
      },
      {
        id: 'task-kam-2',
        project_id: 'proj-kampala-2026',
        zone_id: 'zone-kampala-central',
        assigned_to: 'fa-014',
        form_id: 'form-kam-outreach1',
        title: 'Outreach follow-up',
        description: 'Follow-up visits.',
        status: 'in-progress',
        priority: 'medium',
        assigned_by: 'tl-003'
      },
      {
        id: 'task-nak-2',
        project_id: 'proj-nakuru-2026',
        zone_id: 'zone-nakuru-farms',
        assigned_to: 'fa-015',
        form_id: 'form-nak-farm1',
        title: 'Crop yield survey',
        description: 'Yield data.',
        status: 'pending',
        priority: 'high',
        assigned_by: 'tl-004'
      }
    ];

    for (const task of tasks) {
      await connection.query(
        'INSERT IGNORE INTO tasks (id, project_id, zone_id, assigned_to, form_id, title, description, status, priority, assigned_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [task.id, task.project_id, task.zone_id, task.assigned_to, task.form_id, task.title, task.description, task.status, task.priority, task.assigned_by]
      );
    }

    // 8. Seed Expanded Notifications + New Data
function getNotificationLink(userId) {
  if (userId.startsWith('admin-')) return '/admin/notifications';
  if (userId.startsWith('sup-')) return '/supervisor/notifications';
  if (userId.startsWith('tl-')) return '/teamleader/notifications';
  return '/user/notifications';
}

const notifications = [
  { id: 'notif-fa-welcome', user_id: 'fa-001', type: 'system', title: 'Welcome to FieldSync', message: 'Get started with your first task.', link: '/user/tasks', status: 'read' },
  { id: 'notif-tl-sub-1', user_id: 'tl-002', type: 'submission', title: 'New Submission', message: 'fa-002 submitted form-nai-infra1.', link: '/teamleader/forms', status: 'unread' },
  { id: 'notif-sup-team-1', user_id: 'sup-003', type: 'team', title: 'Team Member Offline', message: 'fa-008 offline for 30min in Mombasa.', link: '/supervisor/teams', status: 'read' },
  { id: 'notif-fa-help-1', user_id: 'fa-005', type: 'help', title: 'Help Request Accepted', message: 'Your help request accepted by TL.', link: '/user/help', status: 'unread' },
  { id: 'notif-tl-form-1', user_id: 'tl-004', type: 'form', title: 'Form Published', message: 'New farm survey form-nak-farm1 published.', link: '/teamleader/forms', status: 'unread' },
  { id: 'notif-sup-audit-1', user_id: 'sup-002', type: 'audit', title: 'Security Audit', message: 'Failed login attempt logged from unknown IP.', link: '/supervisor/audit', status: 'read' },
  { id: 'notif-fa-deadline-1', user_id: 'fa-006', type: 'task', title: 'Deadline Approaching', message: 'Alpha Central audit due tomorrow.', link: '/user/tasks', status: 'unread' },
  { id: 'notif-tl-loc-1', user_id: 'tl-001', type: 'location', title: 'Team Location Update', message: 'fa-011 entered assigned zone.', link: '/teamleader/map', status: 'read' },
  { id: 'notif-sup-proj-1', user_id: 'sup-001', type: 'project', title: 'Project Progress', message: 'Nairobi survey reached 67% progress.', link: '/supervisor/projects', status: 'unread' },
  { id: 'notif-fa-approved-1', user_id: 'fa-007', type: 'submission', title: 'Approved', message: 'Your Beta West road survey approved.', link: '/user/forms', status: 'read' },
  { id: 'notif-tl-battery-1', user_id: 'tl-002', type: 'alert', title: 'Low Battery Alert', message: 'fa-005 battery low during survey.', link: '/teamleader/map', status: 'unread' },
  { id: 'notif-sup-maint-1', user_id: 'sup-004', type: 'system', title: 'Maintenance', message: 'System maintenance scheduled tonight.', link: '/supervisor/notifications', status: 'read' },
  { id: 'notif-fa-newhelp-1', user_id: 'fa-012', type: 'help', title: 'New Help Request', message: 'Team member requests assistance in Delta.', link: '/user/help', status: 'unread' },
  { id: 'notif-tl-reject-1', user_id: 'tl-003', type: 'form', title: 'Form Rejected', message: 'Health survey rejected - missing data.', link: '/teamleader/forms', status: 'unread' },
  { id: 'notif-sup-member-1', user_id: 'sup-005', type: 'team', title: 'New Member Added', message: 'fa-015 added to Epsilon team.', link: '/supervisor/teams', status: 'read' },
  { id: 'notif-fa-reassign-1', user_id: 'fa-014', type: 'task', title: 'Task Reassigned', message: 'Task transferred to new agent.', link: '/user/tasks', status: 'unread' },
  { id: 'notif-admin-sec-1', user_id: 'admin-001', type: 'security', title: 'Audit Log Alert', message: 'Suspicious activity detected in logs.', link: '/admin/audit', status: 'unread' },
  { id: 'notif-tl-outzone-1', user_id: 'tl-001', type: 'location', title: 'Agent Out of Zone', message: 'fa-004 left assigned Mombasa zone.', link: '/teamleader/map', status: 'read' }
];

    for (const notif of notifications) {
      await connection.query(
        'INSERT IGNORE INTO notifications (id, user_id, type, title, message, link, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [notif.id, notif.user_id, notif.type, notif.title, notif.message, notif.link, notif.status]
      );
    }

    // 9. Seed Submissions (20+)
    const submissions = [
      {
        id: 'sub-001',
        form_id: 'form-nai-hh1',
        user_id: 'fa-001',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-alpha-1',
        data: JSON.stringify({'hh-id': 'H001', 'head-name': 'John Doe', 'water': 'Yes'}),
        status: 'approved'
      },
      {
        id: 'sub-002',
        form_id: 'form-nai-infra1',
        user_id: 'fa-002',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-beta-1',
        data: JSON.stringify({'asset-id': 'A123', 'notes': 'Road damage noted'}),
        status: 'pending'
      },
      {
        id: 'sub-003',
        form_id: 'form-mom-port1',
        user_id: 'fa-004',
        project_id: 'proj-mombasa-2026',
        zone_id: 'zone-mombasa-cbd',
        data: JSON.stringify({'dock-id': 'D001', 'condition': 'Good'}),
        status: 'approved'
      },
      // +17
      {
        id: 'sub-004',
        form_id: 'form-kam-outreach1',
        user_id: 'fa-005',
        project_id: 'proj-kampala-2026',
        zone_id: 'zone-kampala-central',
        data: JSON.stringify({'service-type': 'Clinic'}),
        status: 'rejected'
      },
      {
        id: 'sub-005',
        form_id: 'form-nak-farm1',
        user_id: 'fa-009',
        project_id: 'proj-nakuru-2026',
        zone_id: 'zone-nakuru-farms',
        data: JSON.stringify({'crop-type': 'Maize', 'yield': '8 tons/ha'}),
        status: 'pending'
      },
      {
        id: 'sub-006',
        form_id: 'form-nai-health1',
        user_id: 'fa-003',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-gamma-1',
        data: JSON.stringify({'clinic-distance': 2.5}),
        status: 'approved'
      },
      {
        id: 'sub-007',
        form_id: 'form-nai-hh1',
        user_id: 'fa-006',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-alpha-2',
        data: JSON.stringify({'hh-id': 'H002'}),
        status: 'pending'
      },
      {
        id: 'sub-008',
        form_id: 'form-mom-port1',
        user_id: 'fa-008',
        project_id: 'proj-mombasa-2026',
        zone_id: 'zone-mombasa-cbd',
        data: JSON.stringify({'dock-id': 'D002'}),
        status: 'approved'
      },
      {
        id: 'sub-009',
        form_id: 'form-dar-urban1',
        user_id: 'fa-010',
        project_id: 'proj-dar-2026',
        zone_id: 'zone-dar-harbour',
        data: JSON.stringify({'house-type': 'Apartment'}),
        status: 'pending'
      },
      {
        id: 'sub-010',
        form_id: 'form-nak-farm1',
        user_id: 'fa-015',
        project_id: 'proj-nakuru-2026',
        zone_id: 'zone-nakuru-farms',
        data: JSON.stringify({'crop-type': 'Wheat'}),
        status: 'approved'
      },
      {
        id: 'sub-011',
        form_id: 'form-nai-infra1',
        user_id: 'fa-007',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-beta-2',
        data: JSON.stringify({'asset-id': 'R456'}),
        status: 'rejected'
      },
      {
        id: 'sub-012',
        form_id: 'form-kam-outreach1',
        user_id: 'fa-014',
        project_id: 'proj-kampala-2026',
        zone_id: 'zone-kampala-central',
        data: JSON.stringify({'service-type': 'School'}),
        status: 'approved'
      },
      {
        id: 'sub-013',
        form_id: 'form-nai-health1',
        user_id: 'fa-011',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-gamma-2',
        data: JSON.stringify({'clinic-distance': 5}),
        status: 'pending'
      },
      {
        id: 'sub-014',
        form_id: 'form-mom-port1',
        user_id: 'fa-013',
        project_id: 'proj-mombasa-2026',
        zone_id: 'zone-mombasa-cbd',
        data: JSON.stringify({'dock-id': 'D003'}),
        status: 'approved'
      },
      {
        id: 'sub-015',
        form_id: 'form-nai-hh1',
        user_id: 'fa-012',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-delta-1',
        data: JSON.stringify({'hh-id': 'H003'}),
        status: 'pending'
      },
      {
        id: 'sub-016',
        form_id: 'form-nak-farm1',
        user_id: 'fa-009',
        project_id: 'proj-nakuru-2026',
        zone_id: 'zone-nakuru-farms',
        data: JSON.stringify({'crop-type': 'Dairy'}),
        status: 'approved'
      },
      {
        id: 'sub-017',
        form_id: 'form-dar-urban1',
        user_id: 'fa-010',
        project_id: 'proj-dar-2026',
        zone_id: 'zone-dar-harbour',
        data: JSON.stringify({'house-type': 'Slum'}),
        status: 'rejected'
      },
      {
        id: 'sub-018',
        form_id: 'form-nai-infra1',
        user_id: 'fa-006',
        project_id: 'proj-nairobi-2026',
        zone_id: 'zone-nai-alpha-2',
        data: JSON.stringify({'asset-id': 'P789'}),
        status: 'pending'
      },
      {
        id: 'sub-019',
        form_id: 'form-kam-outreach1',
        user_id: 'fa-005',
        project_id: 'proj-kampala-2026',
        zone_id: 'zone-kampala-central',
        data: JSON.stringify({'service-type': 'Water'}),
        status: 'approved'
      },
      {
        id: 'sub-020',
        form_id: 'form-mom-port1',
        user_id: 'fa-004',
        project_id: 'proj-mombasa-2026',
        zone_id: 'zone-mombasa-cbd',
        data: JSON.stringify({'dock-id': 'D004'}),
        status: 'approved'
      }
    ];

    for (const sub of submissions) {
      await connection.query(
        'INSERT IGNORE INTO submissions (id, form_id, user_id, project_id, zone_id, data, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [sub.id, sub.form_id, sub.user_id, sub.project_id, sub.zone_id, sub.data, sub.status]
      );
    }

    // 10. Seed User Locations (for maps)
    const locations = [
      { user_id: 'fa-001', lat: -1.286389, lng: 36.817223, accuracy: 10 }, // Nairobi CBD
      { user_id: 'fa-002', lat: -1.2921, lng: 36.8219, accuracy: 15 },
      { user_id: 'fa-003', lat: -1.2833, lng: 36.8167, accuracy: 8 },
      { user_id: 'fa-004', lat: -4.0435, lng: 39.6682, accuracy: 12 }, // Mombasa
      { user_id: 'fa-005', lat: 0.3476, lng: 32.5825, accuracy: 20 }, // Kampala
      { user_id: 'fa-006', lat: -1.2900, lng: 36.8200, accuracy: 9 },
      { user_id: 'fa-007', lat: -1.3000, lng: 36.8100, accuracy: 11 },
      { user_id: 'fa-008', lat: -4.0500, lng: 39.6700, accuracy: 14 },
      { user_id: 'fa-009', lat: -0.2833, lng: 36.0667, accuracy: 16 }, // Nakuru
      { user_id: 'fa-010', lat: -6.7924, lng: 39.2083, accuracy: 13 }, // Dar
      { user_id: 'fa-011', lat: -1.3100, lng: 36.8300, accuracy: 7 },
      { user_id: 'fa-012', lat: -1.2700, lng: 36.8000, accuracy: 18 },
      { user_id: 'fa-013', lat: -4.0600, lng: 39.6800, accuracy: 10 },
      { user_id: 'fa-014', lat: 0.3400, lng: 32.5900, accuracy: 12 },
      { user_id: 'fa-015', lat: -0.2900, lng: 36.0700, accuracy: 15 }
    ];

    for (const loc of locations) {
      await connection.query(
        'INSERT IGNORE INTO user_locations (user_id, lat, lng, accuracy) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE lat=VALUES(lat), lng=VALUES(lng), accuracy=VALUES(accuracy), updated_at=NOW()',
        [loc.user_id, loc.lat, loc.lng, loc.accuracy]
      );
    }

    // 11. Seed Audit Logs (15+)
    const audits = [
      {
        id: 'audit-001',
        user_id: 'admin-001',
        user_name: 'System Admin',
        user_role: 'admin',
        action: 'user.login',
        target_type: 'auth',
        target_id: null,
        target_name: null,
        category: 'auth',
        detail: 'Successful login from IP 192.168.1.1',
        ip_address: '192.168.1.1',
        user_agent: 'Chrome/120'
      },
      {
        id: 'audit-002',
        user_id: 'tl-001',
        user_name: 'Grace Kimani',
        user_role: 'team_leader',
        action: 'task.create',
        target_type: 'task',
        target_id: 'task-nai-1',
        target_name: 'Zone Alpha Survey',
        category: 'task',
        detail: 'Created new task for Alpha team.',
        ip_address: '192.168.1.2',
        user_agent: 'Firefox/115'
      },
      {
        id: 'audit-003',
        user_id: 'fa-001',
        user_name: 'John Mwangi',
        user_role: 'field_agent',
        action: 'submission.create',
        target_type: 'submission',
        target_id: 'sub-001',
        target_name: 'HH Survey H001',
        category: 'submission',
        detail: 'Submitted household form data.',
        ip_address: '10.0.0.5',
        user_agent: 'Mobile Safari'
      },
      {
        id: 'audit-004',
        user_id: 'sup-001',
        user_name: 'Supervisor Sarah',
        user_role: 'supervisor',
        action: 'submission.approve',
        target_type: 'submission',
        target_id: 'sub-001',
        target_name: 'HH Survey H001',
        category: 'submission',
        detail: 'Reviewed and approved submission.',
        ip_address: '192.168.1.3',
        user_agent: 'Chrome/120'
      },
      {
        id: 'audit-005',
        user_id: 'tl-002',
        user_name: 'John Doe',
        user_role: 'team_leader',
        action: 'location.update',
        target_type: 'location',
        target_id: 'fa-001',
        target_name: 'John Mwangi',
        category: 'location',
        detail: 'Agent location updated in Alpha zone.',
        ip_address: '192.168.1.4',
        user_agent: 'Edge/120'
      },
      // Additional 10
      {
        id: 'audit-006',
        user_id: null,
        user_name: 'system',
        user_role: 'system',
        action: 'login.failed',
        target_type: 'auth',
        target_id: null,
        target_name: null,
        category: 'security',
        detail: 'Failed login from unknown IP.',
        ip_address: '203.0.113.1',
        user_agent: 'Bot UA'
      },
      {
        id: 'audit-007',
        user_id: 'admin-002',
        user_name: 'Lespikius Junior',
        user_role: 'admin',
        action: 'project.update',
        target_type: 'project',
        target_id: 'proj-nairobi-2026',
        target_name: 'Nairobi Survey',
        category: 'project',
        detail: 'Updated progress to 67%.',
        ip_address: '192.168.1.5',
        user_agent: 'Chrome'
      },
      {
        id: 'audit-008',
        user_id: 'fa-002',
        user_name: 'Mary Wanjiku',
        user_role: 'field_agent',
        action: 'help_request.create',
        target_type: 'help',
        target_id: 'help-001',
        target_name: 'Road blocked',
        category: 'help',
        detail: 'Agent requested road assistance.',
        ip_address: '10.0.0.6',
        user_agent: 'Mobile'
      },
      {
        id: 'audit-009',
        user_id: 'sup-001',
        user_name: 'Supervisor Sarah',
        user_role: 'supervisor',
        action: 'help_request.respond',
        target_type: 'help',
        target_id: 'help-001',
        target_name: 'Road blocked',
        category: 'help',
        detail: 'Supervisor accepted help request.',
        ip_address: '192.168.1.3',
        user_agent: 'Chrome'
      },
      {
        id: 'audit-010',
        user_id: 'tl-001',
        user_name: 'Grace Kimani',
        user_role: 'team_leader',
        action: 'team.member_add',
        target_type: 'team',
        target_id: 'fa-004',
        target_name: 'Esther Njoki',
        category: 'team',
        detail: 'Added agent to Alpha team.',
        ip_address: '192.168.1.2',
        user_agent: 'Firefox'
      },
      {
        id: 'audit-011',
        user_id: 'admin-001',
        user_name: 'System Admin',
        user_role: 'admin',
        action: 'form.publish',
        target_type: 'form',
        target_id: 'form-nai-hh1',
        target_name: 'Household V1',
        category: 'form',
        detail: 'Published new household survey form.',
        ip_address: '192.168.1.1',
        user_agent: 'Chrome'
      },
      {
        id: 'audit-012',
        user_id: 'fa-006',
        user_name: 'Rose Achieng',
        user_role: 'field_agent',
        action: 'sync.session_start',
        target_type: 'sync',
        target_id: 'sess-alpha-001',
        target_name: 'Daily field session',
        category: 'sync',
        detail: 'Agent started daily sync session.',
        ip_address: '10.0.0.7',
        user_agent: 'Mobile Safari'
      },
      {
        id: 'audit-013',
        user_id: 'sup-002',
        user_name: 'Michael Okoth',
        user_role: 'supervisor',
        action: 'zone.boundary_update',
        target_type: 'zone',
        target_id: 'zone-nai-alpha-1',
        target_name: 'Alpha North',
        category: 'zone',
        detail: 'Updated zone boundaries based on GPS.',
        ip_address: '192.168.1.6',
        user_agent: 'Safari'
      },
      {
        id: 'audit-014',
        user_id: 'tl-004',
        user_name: 'Mike Johnson',
        user_role: 'team_leader',
        action: 'task.reassign',
        target_type: 'task',
        target_id: 'task-nai-4',
        target_name: 'Alpha Central audit',
        category: 'task',
        detail: 'Reassigned from fa-006 to fa-007.',
        ip_address: '192.168.1.7',
        user_agent: 'Chrome'
      },
      {
        id: 'audit-015',
        user_id: 'admin-003',
        user_name: 'Admin David',
        user_role: 'admin',
        action: 'backup.create',
        target_type: 'system',
        target_id: null,
        target_name: null,
        category: 'system',
        detail: 'Automated database backup completed.',
        ip_address: '192.168.1.8',
        user_agent: 'CLI'
      }
    ];

    for (const audit of audits) {
      await connection.query(
        'INSERT IGNORE INTO audit_logs (id, user_id, user_name, user_role, action, target_type, target_id, target_name, category, detail, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [audit.id, audit.user_id, audit.user_name, audit.user_role, audit.action, audit.target_type, audit.target_id, audit.target_name, audit.category, audit.detail, audit.ip_address, audit.user_agent]
      );
    }

    // 12. Seed Help Requests (10+ mixed)
    const helpRequests = [
      {
        id: 'help-001',
        user_id: 'fa-001',
        type: 'assistance',
        message: 'Road blocked in Alpha North - need alternate route.',
        status: 'accepted',
        response_from: 'tl-001',
        response_note: 'Use Beta East route, backup arriving in 20min.'
      },
      {
        id: 'help-002',
        user_id: 'fa-002',
        type: 'technical',
        message: 'Form submission error - data not saving properly.',
        status: 'pending'
      },
      {
        id: 'help-003',
        user_id: 'fa-004',
        type: 'meeting',
        message: 'Request team meeting at dock area for coordination.',
        status: 'rejected',
        response_from: 'tl-001',
        response_note: 'Meet tomorrow 9AM HQ.'
      },
      {
        id: 'help-004',
        user_id: 'fa-005',
        type: 'assistance',
        message: 'GPS signal lost in rural area.',
        status: 'accepted',
        response_from: 'sup-001',
        response_note: 'Switch to manual coordinates.'
      },
      {
        id: 'help-005',
        user_id: 'fa-006',
        type: 'technical',
        message: 'Battery dying fast, need quick charge location nearby.',
        status: 'pending'
      },
      {
        id: 'help-006',
        user_id: 'fa-007',
        type: 'coordination',
        message: 'Need to coordinate with neighbor zone Beta team.',
        status: 'accepted',
        response_from: 'tl-002'
      },
      {
        id: 'help-007',
        user_id: 'fa-008',
        type: 'technical',
        message: 'Asset ID unclear on old signage in Old Town.',
        status: 'rejected',
        response_from: 'tl-002',
        response_note: 'Use photo upload.'
      },
      {
        id: 'help-008',
        user_id: 'fa-009',
        type: 'logistics',
        message: 'Farm owner not available for interview today.',
        status: 'pending'
      },
      {
        id: 'help-009',
        user_id: 'fa-010',
        type: 'coordination',
        message: 'Discuss harbour access with port authority.',
        status: 'accepted',
        response_from: 'sup-003'
      },
      {
        id: 'help-010',
        user_id: 'fa-011',
        type: 'assistance',
        message: 'Health clinic unexpectedly closed.',
        status: 'accepted',
        response_from: 'tl-003',
        response_note: 'Mark as closed, try tomorrow.'
      }
    ];

    for (const hr of helpRequests) {
      await connection.query(
        'INSERT IGNORE INTO help_requests (id, user_id, type, message, status, response_from, response_note) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [hr.id, hr.user_id, hr.type, hr.message, hr.status, hr.response_from, hr.response_note]
      );
    }

    logger.info('✅ Database seeded successfully.');
  } catch (error) {
    exitCode = 1;
    logger.error('❌ Database seeding failed:');
    console.error(error);
  } finally {
    try {
      connection?.release?.();
    } catch {
      // ignore
    }

    if (exitProcess) {
      process.exit(exitCode);
    }
  }
};

const isDirectRun = (() => {
  if (!process.argv[1]) return false;
  const resolvedScriptPath = path.resolve(process.argv[1]);
  return import.meta.url === pathToFileURL(resolvedScriptPath).href;
})();

if (isDirectRun) {
  seedDatabase({ exitProcess: true });
}
