import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { broadcast, emitToUser, getConnectedClientsSnapshot } from '../sockets/wsServer.js';
import { logAudit } from './auditLogController.js';
import {
  getAppSettings,
  getPlatformControls,
  getUserPreferences,
  maskApiKey,
  setAppSetting,
  updateUserPreferences,
} from '../utils/platformConfigStore.js';
import { getSecurityPolicies } from '../utils/securityPolicyStore.js';

const AUDIENCE_ROLE_FILTERS = {
  all: null,
  supervisors: ['supervisor'],
  workers: ['field_agent'],
  admins: ['admin'],
  team_leaders: ['team_leader'],
};

const AUDIENCE_LABELS = {
  all: 'All Users',
  supervisors: 'All Supervisors',
  workers: 'All Field Workers',
  admins: 'All Admins',
  team_leaders: 'All Team Leaders',
};

const BROADCAST_NOTIFICATION_TYPES = {
  announcement: 'system',
  maintenance: 'alert',
  alert: 'alert',
};

const EMERGENCY_CONTROL_LABELS = {
  trackingDisabled: 'Live tracking',
  registrationBlocked: 'Registrations',
  maintenanceMode: 'Maintenance mode',
  platformLocked: 'Platform lock',
};

function buildLastName(name = '', firstName = '') {
  if (!name) return '';
  if (firstName && name.toLowerCase().startsWith(firstName.toLowerCase())) {
    return name.slice(firstName.length).trim();
  }
  return name.split(' ').slice(1).join(' ');
}

function createPasswordValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validatePasswordWithPolicy(password) {
  const passwordPolicy = getSecurityPolicies().password;

  if (typeof password !== 'string' || password.length < passwordPolicy.minLength) {
    throw createPasswordValidationError(
      `Password must be at least ${passwordPolicy.minLength} characters`
    );
  }

  if (!/[a-z]/.test(password)) {
    throw createPasswordValidationError('Password must contain lowercase letters');
  }

  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    throw createPasswordValidationError('Password must contain uppercase letters');
  }

  if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) {
    throw createPasswordValidationError('Password must contain numbers');
  }
}
