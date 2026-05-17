import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as otpController from '../controllers/otpController.js';
import * as passwordController from '../controllers/passwordController.js';
import * as projectController from '../controllers/projectController.js';
import * as userController from '../controllers/userController.js';
import * as syncController from '../controllers/syncController.js';
import * as taskController from '../controllers/taskController.js';
import * as formController from '../controllers/formController.js';
import * as teamController from '../controllers/teamController.js';
import * as teamMessageController from '../controllers/teamMessageController.js';
import * as fieldIssueController from '../controllers/fieldIssueController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as zoneController from '../controllers/zoneController.js';
import * as locationController from '../controllers/locationController.js';
import * as helpRequestController from '../controllers/helpRequestController.js';
import * as auditLogController from '../controllers/auditLogController.js';
import * as invitationController from '../controllers/invitationController.js';
import * as submissionController from '../controllers/submissionController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as maintenanceController from '../controllers/maintenanceController.js';
import * as securityController from '../controllers/securityController.js';

import * as contactController from '../controllers/contactController.js';
import * as emergencyController from '../controllers/emergencyController.js';
import * as broadcastController from '../controllers/broadcastController.js';
import { authenticateToken, authorizeRole, enforcePlatformControls } from '../middlewares/auth.js';
import { validate, schemas } from '../middlewares/validationMiddleware.js';

const router = Router();

// ══════════════════════════════════════════════════════════════
// AUTH ROUTES (public)
// ══════════════════════════════════════════════════════════════
router.post('/auth/login', validate(schemas.login), authController.login);
router.post('/auth/register', validate(schemas.register), authController.register);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/forgot-password', otpController.forgotPassword);
router.post('/auth/verify-otp', otpController.verifyOtp);
router.post('/auth/reset-password', passwordController.resetPassword);
router.post('/auth/resend-otp', otpController.resendOtp);
router.post('/auth/logout', authenticateToken, authController.logout);

// ══════════════════════════════════════════════════════════════
// CONTACT (public)
// ══════════════════════════════════════════════════════════════
router.post('/contact/inquiries', contactController.submitContactInquiry);
router.get('/contact/inquiries', authenticateToken, authorizeRole(['admin']), contactController.getContactInquiries);
router.patch('/contact/inquiries/:id/status', authenticateToken, authorizeRole(['admin']), contactController.updateInquiryStatus);

// ══════════════════════════════════════════════════════════════
// AUTH ROUTES (authenticated)
// ══════════════════════════════════════════════════════════════
router.get('/auth/profile', authenticateToken, authController.getProfile);

// ══════════════════════════════════════════════════════════════
// PLATFORM CONTROLS (applied after authenticateToken on each route)
// enforcePlatformControls checks maintenanceMode and platformLocked
// ══════════════════════════════════════════════════════════════
router.use(enforcePlatformControls);

// ══════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ══════════════════════════════════════════════════════════════
router.get('/dashboard/stats', authenticateToken, authorizeRole(['admin']), dashboardController.getAdminDashboardStats);
router.get('/dashboard/health', authenticateToken, authorizeRole(['admin']), dashboardController.getSystemHealth);
router.get('/maintenance', authenticateToken, authorizeRole(['admin']), maintenanceController.getMaintenanceSnapshot);
router.get('/security/admin', authenticateToken, authorizeRole(['admin']), securityController.getAdminSecuritySnapshot);

router.get('/analytics/admin', authenticateToken, authorizeRole(['admin']), analyticsController.getAdminAnalytics);
router.get('/analytics/project/:projectId', authenticateToken, authorizeRole(['admin', 'supervisor']), analyticsController.getProjectAnalytics);
router.get('/analytics/team-leader', authenticateToken, authorizeRole(['team_leader']), analyticsController.getTeamLeaderStats);

// ══════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════
router.get('/projects', authenticateToken, projectController.getAllProjects);
router.get('/projects/:id', authenticateToken, projectController.getProjectById);
router.get('/projects/:id/users', authenticateToken, projectController.getProjectUsers);
router.post('/projects', authenticateToken, authorizeRole(['admin', 'supervisor']), validate(schemas.projectCreate), projectController.createProject);
router.patch('/projects/:id', authenticateToken, authorizeRole(['admin', 'supervisor']), projectController.updateProject);
router.patch('/projects/:id/status', authenticateToken, authorizeRole(['admin', 'supervisor']), projectController.updateProjectStatus);
router.delete('/projects/:id', authenticateToken, authorizeRole(['admin', 'supervisor']), projectController.deleteProject);

// ══════════════════════════════════════════════════════════════
// ZONES
// ══════════════════════════════════════════════════════════════
router.get('/projects/:projectId/zones', authenticateToken, zoneController.getZonesByProject);
router.post('/projects/:projectId/zones', authenticateToken, authorizeRole(['admin', 'supervisor']), zoneController.createZone);
router.patch('/zones/:id', authenticateToken, authorizeRole(['admin', 'supervisor']), zoneController.updateZone);
router.delete('/zones/:id', authenticateToken, authorizeRole(['admin', 'supervisor']), zoneController.deleteZone);
router.patch('/zones/:id/mode', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), zoneController.setZoneAssignmentMode);
router.post('/zones/sub-assign', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), zoneController.assignSubZone);
router.get('/zones/:zoneId/sub-assignments', authenticateToken, zoneController.getSubZoneAssignments);
router.delete('/zones/sub-assign/:id', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), zoneController.removeSubZoneAssignment);

// ══════════════════════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════════════════════
router.get('/tasks', authenticateToken, taskController.getAllTasks);
router.get('/tasks/:id', authenticateToken, taskController.getTaskById);
router.get('/projects/:projectId/tasks', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), taskController.getTasksByProject);
router.post('/tasks', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), taskController.createTask);
router.patch('/tasks/:id', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), taskController.updateTask);
router.post('/tasks/:id/status', authenticateToken, taskController.updateMyTaskStatus);

// ══════════════════════════════════════════════════════════════
// FORMS
// ══════════════════════════════════════════════════════════════
router.get('/forms', authenticateToken, formController.getAllForms);
router.get('/forms/:id', authenticateToken, formController.getFormById);
router.get('/projects/:projectId/forms', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), formController.getFormsByProject);
router.post('/forms', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), formController.createForm);
router.patch('/forms/:id', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), formController.updateForm);

// ══════════════════════════════════════════════════════════════
// SUBMISSIONS
// ══════════════════════════════════════════════════════════════
router.get('/projects/:projectId/submissions', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), submissionController.getSubmissionsByProject);
router.post('/submissions', authenticateToken, submissionController.createSubmission);
router.get('/submissions/:id', authenticateToken, submissionController.getSubmissionById);
router.patch('/submissions/:id/status', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), submissionController.updateSubmissionStatus);

// ══════════════════════════════════════════════════════════════
// TEAMS
// ══════════════════════════════════════════════════════════════
router.get('/team/stats', authenticateToken, teamController.getTeamStats);
router.get('/team/members', authenticateToken, teamController.getTeamMembers);
router.get('/team/my/members', authenticateToken, teamController.getMyTeamMembers);
router.get('/team/zone-breaches', authenticateToken, teamController.checkZoneBreaches);
router.post('/team/session', authenticateToken, teamController.manageTeamSession);
router.post('/team/announcement', authenticateToken, teamController.sendTeamAnnouncement);
router.get('/team/messages', authenticateToken, teamMessageController.getTeamMessages);
router.post('/team/messages', authenticateToken, teamMessageController.sendTeamMessage);

// ══════════════════════════════════════════════════════════════
// FIELD ISSUES (Team Leader & Members)
// ══════════════════════════════════════════════════════════════
router.post('/team/issues', authenticateToken, fieldIssueController.createFieldIssue);
router.get('/team/issues', authenticateToken, fieldIssueController.getTeamFieldIssues);
router.get('/team/issues/active', authenticateToken, fieldIssueController.getActiveIssues);
router.patch('/team/issues/:id/respond', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), fieldIssueController.respondToFieldIssue);
router.post('/teams', authenticateToken, authorizeRole(['admin', 'supervisor']), teamController.createTeam);
router.post('/teams/:teamId/members', authenticateToken, authorizeRole(['team_leader']), teamController.addMember);
router.delete('/teams/:teamId/members/:userId', authenticateToken, authorizeRole(['team_leader']), teamController.removeMember);
router.get('/projects/:projectId/teams', authenticateToken, authorizeRole(['admin', 'supervisor']), teamController.getTeamsByProject);

// ══════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════
router.get('/users/dashboard/stats', authenticateToken, userController.getDashboardStats);
router.post('/users/session', authenticateToken, userController.updateSession);
router.get('/users', authenticateToken, userController.getAllUsers);
router.get('/users/:id', authenticateToken, userController.getUserById);
router.post('/users', authenticateToken, authorizeRole(['admin']), userController.createUser);
router.patch('/users/:id', authenticateToken, authorizeRole(['admin']), userController.updateUser);
router.delete('/users/:id', authenticateToken, authorizeRole(['admin']), userController.deleteUser);

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS (read-all BEFORE :id to avoid param conflict)
// ══════════════════════════════════════════════════════════════
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.get('/notifications/unread-count', authenticateToken, notificationController.getUnreadCount);
router.put('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);
router.put('/notifications/:id', authenticateToken, notificationController.markAsRead);

// ══════════════════════════════════════════════════════════════
// LOCATIONS
// ══════════════════════════════════════════════════════════════
router.post('/locations/update', authenticateToken, locationController.updateLocation);
router.get('/locations', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader', 'field_agent']), locationController.getLatestLocations);
router.get('/projects/:projectId/locations', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), locationController.getProjectLocations);
router.get('/locations/my/history', authenticateToken, locationController.getMyLocationHistory);
router.get('/team/movement-paths', authenticateToken, locationController.getTeamMovementPaths);

// ══════════════════════════════════════════════════════════════
// HELP REQUESTS
// ══════════════════════════════════════════════════════════════
router.post('/help-requests', authenticateToken, helpRequestController.createHelpRequest);
router.get('/help-requests', authenticateToken, helpRequestController.getMyHelpRequests);
router.get('/help-requests/pending', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), helpRequestController.getPendingHelpRequests);
router.patch('/help-requests/:id/respond', authenticateToken, authorizeRole(['admin', 'supervisor', 'team_leader']), helpRequestController.respondToHelpRequest);

// ══════════════════════════════════════════════════════════════
// SYNC
// ══════════════════════════════════════════════════════════════
router.post('/sync/batch', authenticateToken, syncController.processBatch);

// ══════════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════════
router.get('/audit-logs', authenticateToken, authorizeRole(['admin', 'supervisor']), auditLogController.getAuditLogs);

// ══════════════════════════════════════════════════════════════
// INVITATIONS
// ══════════════════════════════════════════════════════════════
// Validation endpoints (public - needed for join page before login)
router.get('/invitations/validate/:code', invitationController.validateInviteCode);
router.get('/invitations/email/validate/:token', invitationController.validateEmailInvite);
// Authenticated endpoints
router.get('/invitations/links', authenticateToken, invitationController.getInviteLinks);
router.post('/invitations/links', authenticateToken, authorizeRole(['admin', 'supervisor']), invitationController.createInviteLink);
router.post('/invitations/links/:id/regenerate', authenticateToken, authorizeRole(['admin', 'supervisor']), invitationController.regenerateInviteLink);
router.delete('/invitations/links/:id', authenticateToken, authorizeRole(['admin', 'supervisor']), invitationController.deleteInviteLink);
router.get('/invitations/emails', authenticateToken, invitationController.getEmailInvites);
router.post('/invitations/emails', authenticateToken, authorizeRole(['admin', 'supervisor']), invitationController.sendEmailInvite);
router.post('/invitations/emails/:id/resend', authenticateToken, authorizeRole(['admin', 'supervisor']), invitationController.resendEmailInvite);
router.delete('/invitations/emails/:id', authenticateToken, authorizeRole(['admin', 'supervisor']), invitationController.deleteEmailInvite);

// ══════════════════════════════════════════════════════════════
// ALERTS (admin only)
// ══════════════════════════════════════════════════════════════
router.get('/alerts', authenticateToken, authorizeRole(['admin']), maintenanceController.getAlerts);

// ══════════════════════════════════════════════════════════════
// EMERGENCY CONTROLS (admin only)
// ══════════════════════════════════════════════════════════════
router.get('/emergency/snapshot', authenticateToken, authorizeRole(['admin']), emergencyController.getEmergencySnapshot);
router.post('/emergency/control', authenticateToken, authorizeRole(['admin']), emergencyController.updateEmergencyControl);
router.post('/emergency/shutdown', authenticateToken, authorizeRole(['admin']), emergencyController.requestEmergencyShutdown);

// ══════════════════════════════════════════════════════════════
// BROADCASTS (admin only)
// ══════════════════════════════════════════════════════════════
router.get('/broadcasts', authenticateToken, authorizeRole(['admin']), broadcastController.getBroadcastSnapshot);
router.post('/broadcasts', authenticateToken, authorizeRole(['admin']), broadcastController.createBroadcast);

export default router;
