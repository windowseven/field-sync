# FieldSync

FieldSync is a full-stack, real-time field operations management platform built with Next.js 16, Node.js/Express, and MySQL. It is designed for organizations running distributed field work such as surveys, census programs, outreach campaigns, inspections, evangelism tracking, and operational monitoring.

The platform separates responsibilities across four primary roles:

- Admin: system owner and platform controller
- Supervisor: project owner and operational manager
- Team Leader: field execution coordinator
- Field Worker: task executor and data collector

This repository contains the complete platform: all four role frontends, the backend API, database migrations, and public-facing company pages.

## Overview

FieldSync is built around two major layers:

- Project operations: projects, teams, zones, forms, tracking, submissions, analytics
- Platform governance: users, sessions, audit logs, security monitoring, alerts, maintenance, backup, storage, API monitoring, and emergency controls

The UI covers four role-based frontend surfaces:

- Admin dashboard for system-level governance
- Supervisor dashboard for project-level operations (with workspace/project context)
- Team Leader dashboard for execution coordination
- Field Worker frontend for task execution and data capture

The admin experience includes pages for:

- System overview
- Global users and supervisors
- Projects overview
- Analytics and audit logs
- Security center, sessions, policies, and threat detection
- Alerts and notifications
- Broadcast messaging
- System settings and emergency controls
- Maintenance tools: server health, database, backups, storage, rate limits, sync monitor, feature flags, sandbox, API monitoring, error tracking

The supervisor experience follows a two-layer architecture:
- **Supervisor Workspace**: Project listing, creation, and high-level management
- **Project Dashboard**: Scoped operational views (Live Map, Teams, Zones, Forms, Analytics, Audit) tied to a specific project context.

The team leader experience includes:
- Team overview, member management, and live map
- Task assignment and form filling mode control
- Performance monitoring and activity tracking
- Notifications and field issue handling

The field worker experience includes:
- Home dashboard with daily tasks summary
- Map view with zone boundaries and teammate visibility
- Step-by-step dynamic form filling with draft save
- Team view and notifications
- Offline sync support

The backend provides:
- REST API with JWT authentication
- MySQL database with migration system
- WebSocket real-time updates
- Email notifications (nodemailer)
- Audit logging and role-based middleware
- Contact inquiry management and field issue tracking
- Team messaging and CSRF protection

## Current Scope

This repository is a complete full-stack platform.

Implemented in this codebase:

- Multi-page admin dashboard built with the Next.js App Router
- Multi-page supervisor dashboard with workspace/project architecture
- Multi-page team leader dashboard for execution coordination
- Multi-page field worker frontend for task execution
- Backend API with Node.js/Express and MySQL
- Real-time WebSocket support
- Email notifications
- Database migration system
- CSRF protection and security middleware
- Public company pages (Landing, About, Careers, Contact, Blog, FAQ, Legal)
- Contact form with real backend integration

## Project Status

| Area | Status | Details |
|------|--------|---------|
| Admin Dashboard | ✅ Complete | System overview, users, projects, analytics, security, maintenance |
| Supervisor Dashboard | ✅ Complete | Workspace/project architecture with scoped operations |
| Team Leader Dashboard | ✅ Complete | Execution coordination, performance monitoring |
| Field Worker Frontend | ✅ Complete | Offline sync, dynamic forms, GPS tracking |
| Backend API | ✅ Complete | REST + WebSocket, JWT auth, CSRF, RBAC, rate limiting |
| Company Pages | ✅ Complete | Landing, About, Careers, Contact, Blog, FAQ, Legal |
| Security Controls | ✅ Complete | bcrypt(12), CSRF double-submit, JWT rotation, blacklist, Helmet CSP |
| Testing | ✅ Complete | **51 unit tests** (token blacklist, CSRF, auth, security policy) + E2E test infrastructure |
| Error Monitoring | ✅ Complete | Sentry integrated (frontend + backend) |
| CI/CD | ✅ Complete | GitHub Actions (lint → test → build), Render auto-deploy |
| Service Layer | ✅ Partial | 4 services extracted (zone, invite, notification, pagination), more can follow |
| Landing Page Performance | ✅ Complete | 7 sections lazy-loaded, page.tsx 1027→204 lines, recharts code-split |
| Infrastructure | 🔄 Deferred | Separate frontend/backend deployment, Redis, load testing |

The next phase is production deployment scaling and iterative improvements.

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI primitives
- Recharts (code-split via dynamic import)
- Lucide React icons
- React Hook Form and Zod validation
- DOMPurify for input sanitization
- SWR for data fetching
- Sentry for error monitoring
- Leaflet for map/zone visualization

### Backend
- Node.js 22
- Express.js
- MySQL (via mysql2/promise)
- JWT authentication (access + refresh token rotation)
- WebSocket (ws, custom server with room-based routing)
- Nodemailer (with SendGrid/Brevo/Resend providers)
- bcrypt (12 rounds)
- Zod input validation
- Sentry for error monitoring
- Jest (51 unit tests + E2E test framework)

## Security Architecture

FieldSync implements a multi-layered security model covering authentication, authorization, request validation, and runtime protection.

### Authentication

| Layer | Implementation | Details |
|-------|---------------|---------|
| Password Storage | bcrypt, 12 rounds | ~250ms per hash, rate-limited at 10/min per IP |
| Access Token | JWT, 24h expiry, `jti` claim | Signed with `JWT_SECRET`, verified on every protected route |
| Refresh Token | JWT, 7d expiry, rotation on use | Old `jti` blacklisted on each refresh — prevents replay |
| Token Blacklist | In-memory `Map<jti, expiry>` with TTL cleanup | `unref()` timer won't block process exit; 7 test cases |
| Session Inactivity | Configurable timeout via `securityPolicyStore` | Cross-tab logout sync via `BroadcastChannel` API |
| OTP | `crypto.randomInt(100000, 999999)` | 1/1,000,000 brute-force probability per attempt; 3 attempts/ window |

### Authorization (RBAC)

- **28 granular permissions** across 4 roles via `authorizeRole(['admin', 'supervisor', ...])` middleware
- Role-based route protection: every protected route specifies allowed roles
- `enforcePlatformControls` middleware checks `maintenanceMode` and `platformLocked` globally
- Frontend route protection via `middleware.ts` (Next.js server-side) + `ProtectedRoute` / `RoleGuard` components (client-side)

### Request Protection

| Control | How it Works | Config |
|---------|-------------|--------|
| CSRF | Double-submit cookie: `crypto.randomBytes(32)` token, HttpOnly + SameSite=Strict, verified on every mutation | 1h token expiry, 30min cleanup |
| Rate Limiting | Sliding window via `express-rate-limit`: auth=10/15min, OTP=3/window, API=200/15min, invites=10/5min | All configurable via env |
| Input Validation | Zod schemas on every mutation endpoint | 400 with field-level error messages |
| Helmet CSP | Restrictive Content-Security-Policy headers | Blocks XSS, clickjacking, MIME sniffing |
| CORS | Restricted to `FRONTEND_URL` | Whitelist-based, not open |
| DOMPurify | Client-side HTML sanitization | Prevents stored XSS in rich text fields |

### Token Security Flow

```
Login → JWT (access: 24h, refresh: 7d) → Access token in Authorization header
  → Refresh: old refresh JTI blacklisted → new token pair issued
  → Logout: access JTI blacklisted for remaining TTL
  → CSRF: XSRF-TOKEN cookie + X-CSRF-Token header on all mutations
```

### Health & Monitoring Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | None | DB connection + WebSocket client count + overall status |
| `/health/ws` | GET | None | WebSocket-specific health: total/role connections |
| `/api/v1/dashboard/health` | GET | Admin | System health: memory, DB pool, uptime, Sentry errors |

## Software Engineering & Architecture

### Error Handling Pattern

All 15 controllers use the `asyncHandler` wrapper which eliminates try/catch boilerplate:

```js
// Before (boilerplate in every handler)
const handler = async (req, res) => {
  try {
    // ... logic ...
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// After (clean, declarative)
const handler = asyncHandler(async (req, res) => {
  const result = await doSomething();
  res.json({ status: 'success', data: result });
});
```

- `asyncHandler.js` — catches async errors, auto-handles `AppError` (statusCode + error code) and `ZodError` (400 with validation messages)
- `AppError` class — `throw new AppError('message', 401, 'CODE')` instead of manual error responses
- Global error handler — `app.js` catches unhandled errors, includes `x-request-id` for distributed tracing
- Consistent response format: `{ status: 'success'|'error', data?, message?, code? }` across all endpoints

### Service Layer

Business logic extracted from controllers into reusable services:

| Service | Responsibility | Used By |
|---------|---------------|---------|
| `zoneService.js` | Point-in-polygon check (GeoJSON), boundary parsing, user zone lookup | `zoneBoundary.js`, `teamController.js` |
| `inviteService.js` | Invite link/email validation with row-level locking, consumption tracking | `authController.js`, `invitationController.js` |
| `notificationService.js` | Create + emit notifications (single and bulk) | Ready for controller adoption |
| `paginationService.js` | `paginate(page, limit)` + `buildPaginationResponse()` | `userController.js`, `taskController.js`, `notificationController.js` |

### Testing Strategy

```
51 unit tests ───────────────────── E2E test infrastructure
├─ tokenBlacklist (7)              ├─ Real MySQL pool via jest.unstable_mockModule
├─ securityPolicyStore (9)         ├─ Test DB lifecycle (create → migrate → seed → drop)
├─ csrf (11)                       ├─ Auth flow tests (register → persist → login → reject)
├─ auth middleware (11)            └─ npm run test:e2e requires local MySQL
├─ auth endpoints (13)
```

- All tests use ESM (`--experimental-vm-modules`) and `jest.unstable_mockModule`
- Mock-based: verify logic correctness, not SQL syntax
- E2E tests verify real DB persistence, constraint enforcement, and transaction behavior

### Code Quality Practices

- **`asyncHandler` + `AppError`**: Zero try/catch boilerplate across 26 controller functions
- **Zod validation**: Every mutation endpoint has a typed schema; `ZodError` returns 400 with field-level messages
- **Request ID**: `x-request-id` header on every request, included in all log lines for distributed tracing
- **Rate limit metrics**: Track blocked vs allowed requests per rule
- **Audit logging**: Every significant action logged with user, IP, user-agent, and rich metadata
- **Code splitting**: Landing page: 7 lazy-loaded sections, recharts code-split from admin dashboard
- **Versioned migrations**: Hash-verified SQL files in `src/db/migrations/`, dry-run mode, force re-apply

## Key Product Concepts

### Admin Control Plane

The Admin is not a project manager. The Admin operates at platform level and is responsible for:

- Monitoring users, sessions, alerts, and audit logs
- Reviewing security events and suspicious activity
- Controlling platform settings and policies
- Broadcasting system-wide announcements
- Managing maintenance and emergency controls

### Supervisor-Owned Operations

Supervisors own project execution. They are responsible for:

- Creating and managing projects
- Organizing teams and team leaders
- Defining zones and workflows
- Managing project forms and submissions

### Team Leader Coordination

Team Leaders coordinate field execution inside assigned projects:

- Assigning tasks to team members
- Choosing form filling mode (individual or group)
- Monitoring team movement, progress, and submissions
- Handling field issues and redirects

### Field Worker Execution

Field Workers perform field tasks in assigned zones:

- Joining assigned sessions or work areas
- Sharing GPS updates where permitted
- Filling dynamic forms step by step
- Saving drafts and submitting collected data
- Working offline with automatic sync

### Production-Oriented Maintenance

The admin dashboard includes production-grade operational tooling across 10 maintenance pages:

| Page | Route | Features |
|------|-------|----------|
| **Server Health** | `/dashboard/maintenance` | Memory (heap/RSS), CPU, uptime, DB pool status, WebSocket connections, Sentry error count |
| **Database** | `/dashboard/maintenance/database` | Table sizes, row counts, index status, query performance, connection pool metrics |
| **Backup & Restore** | `/dashboard/maintenance/backup` | Manual backup trigger, restore from backup, backup history, last backup timestamp |
| **Error Tracking** | `/dashboard/maintenance/errors` | Sentry error feed, error grouping, resolution status, error detail expansion |
| **Rate Limits** | `/dashboard/maintenance/rate-limits` | Per-rule metrics (allowed vs blocked), current rate limit window state, reset times |
| **Sync Monitor** | `/dashboard/maintenance/sync` | Pending sync items, sync failures, offline queue depth, sync health per user |
| **Storage** | `/dashboard/maintenance/storage` | Upload storage usage, file type distribution, storage by project, quota tracking |
| **API Monitoring** | `/dashboard/maintenance/api` | Request volume, endpoint latency percentile (p50/p95/p99), error rate, throughput |
| **Feature Flags** | `/dashboard/maintenance/features` | Toggle feature visibility (sandbox, beta features, maintenance mode flags) |
| **Sandbox** | `/dashboard/maintenance/sandbox` | Isolated test environment for safe experimentation without production impact |

Backend maintenance capabilities:

- **`/health`** — Public endpoint returning DB status (200/503), WebSocket client count, role breakdown, timestamp
- **`/health/ws`** — Public endpoint returning real-time WebSocket connection stats
- **Data retention scheduler** — `cleanupData.js` runs on startup + every 6h, batch-deletes: location history (90d), audit logs (365d), broadcast deliveries (180d)
- **Request metrics** — `requestMetrics.js` tracks endpoint latency with 100k-entry hard cap
- **Rate limit metrics** — `rateLimitMetrics.js` records blocked/allowed per rule for admin dashboard

## Major Routes

### Public Routes

```txt
/landing
/about
/careers
/contact
/blog
/faq
/privacy
/terms
/cookies
/login
/register
/verify-otp
/forgot-password
/reset-password
```

### Admin Routes

```txt
/dashboard
/dashboard/users
/dashboard/supervisors
/dashboard/projects
/dashboard/forms
/dashboard/tracking
/dashboard/analytics
/dashboard/audit
/dashboard/security
/dashboard/security/threats
/dashboard/security/sessions
/dashboard/security/policies
/dashboard/alerts
/dashboard/broadcast
/dashboard/settings
/dashboard/emergency
/dashboard/maintenance
/dashboard/maintenance/server
/dashboard/maintenance/database
/dashboard/maintenance/backup
/dashboard/maintenance/errors
/dashboard/maintenance/rate-limits
/dashboard/maintenance/sync
/dashboard/maintenance/storage
/dashboard/maintenance/api
/dashboard/maintenance/features
/dashboard/maintenance/sandbox
```

### Supervisor Routes

```txt
/supervisor (Redirects to Workspace)
/supervisor/projects (Workspace / Project List)
/supervisor/projects/new (Project Creation Wizard)
/supervisor/projects/[projectId] (Project Overview)
/supervisor/projects/[projectId]/map (Live project map)
/supervisor/projects/[projectId]/teams (Team management)
/supervisor/projects/[projectId]/zones (Geofencing)
/supervisor/projects/[projectId]/forms (Forms & Tasks)
/supervisor/projects/[projectId]/users (Project members)
/supervisor/projects/[projectId]/invitations (Access control)
/supervisor/projects/[projectId]/analytics (Project data)
/supervisor/projects/[projectId]/audit (Project logs)
/supervisor/projects/[projectId]/settings (Project-specific configuration)
/supervisor/settings (Personal account settings)
```

### Team Leader Routes

```txt
/teamleader/overview
/teamleader/members
/teamleader/map
/teamleader/tasks
/teamleader/forms
/teamleader/performance
/teamleader/notifications
/teamleader/activity
/teamleader/settings
```

### Field Worker Routes

```txt
/user/home
/user/map
/user/tasks
/user/forms/[id]
/user/team
/user/notifications
```

## API Endpoints

All API routes are prefixed with `/api/v1` and return JSON with the format `{ status: 'success'|'error', data?, message?, code? }`.

### Public Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | None | Login with email + password, returns JWT pair |
| POST | `/auth/register` | None | Register with optional invite code/token |
| POST | `/auth/refresh` | None | Exchange refresh token for new JWT pair (rotates) |
| POST | `/auth/forgot-password` | None | Request OTP for password reset |
| POST | `/auth/verify-otp` | None | Verify OTP and get password reset token |
| POST | `/auth/reset-password` | None | Reset password with token |
| POST | `/auth/resend-otp` | None | Resend verification OTP |
| GET | `/invitations/validate/:code` | None | Validate an invite link code |
| GET | `/invitations/email/validate/:token` | None | Validate an email invite token |
| POST | `/contact/inquiries` | None | Submit a contact form inquiry |

### System Health (Public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | DB connection status, WebSocket client count/role breakdown, timestamp |
| GET | `/health/ws` | WebSocket-specific: total connected clients + per-role counts |

### Authenticated — Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/logout` | Any | Logout, blacklists current JWT |
| GET | `/auth/profile` | Any | Get current user profile |

### Admin Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/stats` | admin | Platform-wide stats: users, projects, submissions, activity series |
| GET | `/dashboard/health` | admin | System health: memory, database, WebSocket, Sentry errors |
| GET | `/maintenance` | admin | Maintenance snapshot: server, database, backup, rate limits, sync, errors, storage |
| GET | `/security/admin` | admin | Security snapshot: active sessions, threat detections, login attempts, failed OTPs |

### Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/admin` | admin | Admin analytics: trends, distribution, performance metrics |
| GET | `/analytics/project/:projectId` | admin, supervisor | Project-level analytics with filters |
| GET | `/analytics/team-leader` | team_leader | Team leader stats: member performance, completion rates |

### Projects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/projects` | Any | List all projects (scoped by role) |
| GET | `/projects/:id` | Any | Get project by ID |
| GET | `/projects/:id/users` | Any | Get users assigned to a project |
| POST | `/projects` | admin, supervisor | Create a new project |
| PATCH | `/projects/:id` | admin, supervisor | Update project details |
| PATCH | `/projects/:id/status` | admin, supervisor | Update project status |
| DELETE | `/projects/:id` | admin, supervisor | Delete a project |

### Zones & Geofencing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/projects/:projectId/zones` | Any | List zones for a project |
| POST | `/projects/:projectId/zones` | admin, supervisor | Create a zone with GeoJSON boundaries |
| PATCH | `/zones/:id` | admin, supervisor | Update zone |
| DELETE | `/zones/:id` | admin, supervisor | Delete zone |
| PATCH | `/zones/:id/mode` | admin, supervisor, team_leader | Set assignment mode (individual/group) |
| POST | `/zones/sub-assign` | admin, supervisor, team_leader | Assign sub-zone to user |
| GET | `/zones/:zoneId/sub-assignments` | Any | Get sub-zone assignments |
| DELETE | `/zones/sub-assign/:id` | admin, supervisor, team_leader | Remove sub-zone assignment |

### Tasks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tasks` | Any | List tasks for current user (paginated) |
| GET | `/tasks/:id` | Any | Get task by ID |
| GET | `/projects/:projectId/tasks` | admin, supervisor, team_leader | List tasks by project |
| POST | `/tasks` | admin, supervisor, team_leader | Create task (sends notifications) |
| PATCH | `/tasks/:id` | admin, supervisor, team_leader | Update task |
| POST | `/tasks/:id/status` | Any | Update own task status (pending/in-progress/completed) |

### Forms

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/forms` | Any | List forms |
| GET | `/forms/:id` | Any | Get form with fields |
| GET | `/projects/:projectId/forms` | admin, supervisor, team_leader | List forms by project |
| POST | `/forms` | admin, supervisor, team_leader | Create form with dynamic fields |
| PATCH | `/forms/:id` | admin, supervisor, team_leader | Update form |

### Submissions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/submissions` | Any | Submit form data |
| GET | `/submissions/:id` | Any | Get submission by ID |
| GET | `/projects/:projectId/submissions` | admin, supervisor, team_leader | List submissions by project |
| PATCH | `/submissions/:id/status` | admin, supervisor, team_leader | Approve/reject submission |

### Teams

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/team/stats` | team_leader | Team statistics (members, tasks, submissions) |
| GET | `/team/members` | team_leader | List team members |
| GET | `/team/my/members` | field_agent | Get own team with members (includes leader) |
| GET | `/team/zone-breaches` | team_leader | Check which members are outside assigned zones |
| POST | `/team/session` | team_leader | Start/end/check team session |
| POST | `/team/announcement` | team_leader | Send announcement to all team members |
| GET | `/team/messages` | Any | Get team chat messages |
| POST | `/team/messages` | Any | Send team chat message |
| POST | `/teams` | admin, supervisor | Create a team |
| POST | `/teams/:teamId/members` | team_leader | Add member to team |
| DELETE | `/teams/:teamId/members/:userId` | team_leader | Remove member from team |
| GET | `/projects/:projectId/teams` | admin, supervisor | List teams by project |

### Field Issues

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/team/issues` | Any | Report a field issue |
| GET | `/team/issues` | Any | Get team field issues |
| GET | `/team/issues/active` | Any | Get active (unresolved) issues |
| PATCH | `/team/issues/:id/respond` | admin, supervisor, team_leader | Respond to a field issue |

### Users (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | admin | List all users (paginated, filterable by role/search) |
| GET | `/users/:id` | admin | Get user by ID |
| POST | `/users` | admin | Create user (bypasses registration) |
| PATCH | `/users/:id` | admin | Update user (name, email, role, password) |
| DELETE | `/users/:id` | admin | Delete user (prevents self-deletion) |
| GET | `/users/dashboard/stats` | field_agent | Field agent dashboard: task stats, sessions, zones |
| POST | `/users/session` | Any | Update own session status (online/offline/idle) |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Any | List notifications (paginated) |
| GET | `/notifications/unread-count` | Any | Get unread notification count |
| PUT | `/notifications/read-all` | Any | Mark all notifications as read |
| PUT | `/notifications/:id` | Any | Mark single notification as read |

### Locations & Tracking

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/locations/update` | Any | Update own GPS location |
| GET | `/locations` | admin, supervisor, team_leader, field_agent | Get latest locations for team/project |
| GET | `/projects/:projectId/locations` | admin, supervisor, team_leader | Get locations by project |
| GET | `/locations/my/history` | Any | Get own location history |
| GET | `/team/movement-paths` | Any | Get team movement history |

### Help Requests

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/help-requests` | Any | Create a help request |
| GET | `/help-requests` | Any | Get own help requests |
| GET | `/help-requests/pending` | admin, supervisor, team_leader | Get pending help requests for team |
| PATCH | `/help-requests/:id/respond` | admin, supervisor, team_leader | Respond to help request |

### Invitations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/invitations/links` | Any | Get active invite links |
| POST | `/invitations/links` | admin, supervisor | Create invite link |
| POST | `/invitations/links/:id/regenerate` | admin, supervisor | Regenerate invite link (new code + expiry) |
| DELETE | `/invitations/links/:id` | admin, supervisor | Delete/revoke invite link |
| GET | `/invitations/emails` | Any | Get email invites |
| POST | `/invitations/emails` | admin, supervisor | Send email invite |
| POST | `/invitations/emails/:id/resend` | admin, supervisor | Resend email invite |
| DELETE | `/invitations/emails/:id` | admin, supervisor | Cancel email invite |

### Sync (Offline)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sync/batch` | Any | Process batch sync operations (tasks, forms, submissions) |

### Audit Logs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/audit-logs` | admin, supervisor | Get audit logs with filters (user, action, date range) |

### Alerts & Emergency (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/alerts` | admin | Get system alerts |
| GET | `/emergency/snapshot` | admin | Get emergency status snapshot |
| POST | `/emergency/control` | admin | Update emergency control |
| POST | `/emergency/shutdown` | admin | Request emergency system shutdown |
| GET | `/broadcasts` | admin | Get broadcast history |
| POST | `/broadcasts` | admin | Create a new broadcast |

### Contact (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/contact/inquiries` | admin | List contact form inquiries |
| PATCH | `/contact/inquiries/:id/status` | admin | Update inquiry status |

## WebSocket Events

The WebSocket server (`ws://host/ws?token=JWT`) provides real-time bidirectional communication:

| Event Direction | Event Name | Payload | Description |
|----------------|-----------|---------|-------------|
| Client→Server | `location:update` | `{ lat, lng, accuracy }` | Send GPS location (throttled to 2s) |
| Client→Server | `ping` | — | Heartbeat response |
| Server→Client | `notification:new` | `{ id, type, title, message, link, createdAt }` | New notification (task assigned, zone breach, announcement) |
| Server→Client | `location:batch` | `[{ userId, lat, lng, accuracy, timestamp }]` | Batch location broadcast (throttled to 2s) |
| Server→Client | `zone:assigned` | `{ zone_id, zone_name, assigned_by, assigned_at }` | Sub-zone assignment notification |
| Server→Client | `task:unassigned` | `{ taskId }` | Task reassignment notification |
| Server→Client | `pong` | `{ serverTime }` | Heartbeat acknowledgment |

Connection lifecycle:
1. Client connects with `?token=<JWT>` query parameter
2. Server authenticates per-message via JWT
3. Heartbeat: server pings every 30s, client responds within 10s timeout
4. Server indexes clients by `userId` and `role` for O(1) targeted emits
5. Connection limit is configurable (default 500)

## Project Structure

```txt
field-sync/
  app/                          ← Next.js App Router (all role frontends)
    (auth)/                     ← Login, register, verify-otp, forgot/reset password
    (company)/                  ← Landing, about, careers, contact, blog, faq, privacy
    dashboard/                  ← Admin dashboard (system-level governance)
      _components/              ← Dashboard-specific lazy-loaded components
      analytics/
      maintenance/
      map/
      security/
      settings/
      ...
    supervisor/                 ← Supervisor workspace + project scoped dashboards
      projects/[projectId]/     ← Map, teams, zones, forms, analytics, audit
    teamleader/                 ← Team leader execution coordination
    user/                       ← Field worker task execution
  backend/
    src/
      controllers/              ← 15 controllers + auth sub-modules
      services/                 ← zoneService, inviteService, notificationService, paginationService
      sockets/                  ← Custom WebSocket server (room-based routing)
      middlewares/              ← auth, csrf, rate limit, validation
      routes/                   ← Single route index (225 lines)
      config/                   ← database.js (pool + TiDB support)
      utils/                    ← logger, tokenBlacklist, securityPolicy, requestMetrics
      db/                       ← migrations, seed, migrate-indexes
      __tests__/                ← 5 test suites (51 tests)
        e2e/                    ← E2E tests with real database
        helpers/                ← e2eDb.js (test DB lifecycle)
    scripts/                    ← DB setup helpers
  components/                   ← Shared React components (shadcn/ui primitives)
  lib/                          ← API client, auth context, hooks, utilities
  types/                        ← Shared TypeScript types
  middleware.ts                 ← Next.js server-side route protection
  package.json                  ← Frontend dependencies + workspace scripts

MODIFIED FIELDSYNC ADMIN/       ← Outer monorepo wrapper
  package.json                  ← Proxy scripts (install:all, build, start)
  render.yaml                   ← Render production deployment blueprint
  render-staging.yaml           ← Render staging deployment blueprint
```

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm installed
- MySQL server running

### Install dependencies

```bash
# From the field-sync/ directory
npm install                    # Frontend dependencies
npm install --prefix backend   # Backend dependencies
```

### Set up environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and email/email settings
```

### Run database migrations

```bash
npm run migrate --prefix backend
```

### Start development servers

```bash
npm run dev
```

This starts both frontend (`localhost:3000`) and backend (`localhost:5000`) concurrently via `concurrently`.

### Run tests

```bash
# Unit tests (51 tests, 5 suites)
npm test --prefix backend

# E2E tests (requires local MySQL)
npm run test:e2e --prefix backend
```

### Production Build

```bash
npm run build                    # Builds Next.js frontend
npm start                        # Starts backend (serves frontend in production)
```

## Production Deployment

### Option 1: Render Blueprint (Current)

The repository includes two Render blueprint files at the repo root:

| Blueprint | Service Name | Purpose |
|-----------|-------------|---------|
| `render.yaml` | `fieldsync-web` | Production deployment (single web service) |
| `render-staging.yaml` | `field-sync-staging` | Staging/preview environment |

Both use `rootDir: field-sync` and deploy the backend which serves the pre-built frontend. Deploy via:

```bash
# Production
render blueprint launch --blueprint render.yaml

# Staging
render blueprint launch --blueprint render-staging.yaml
```

Required secrets (set via Render dashboard, never in code):
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET`
- `EMAIL_USER`, `EMAIL_PASS` (or `RESEND_API_KEY` / `SENDGRID_API_KEY` / `BREVO_API_KEY`)
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`

### Option 2: Separate hosting (Recommended for scale)

**Frontend** → Vercel, Netlify, or any Node hosting:
- Set `NEXT_PUBLIC_API_URL=https://your-api-domain/api/v1`
- Set `NEXT_PUBLIC_WS_URL=wss://your-api-domain`
- Run `npm run build` then `npm run start`

**Backend** → Railway, Render, DigitalOcean, or any VPS:
- Set all backend `.env` variables (JWT secrets, database, email)
- Run `npm run migrate` once after deployment
- Run `npm start` (from `field-sync/backend/`)

### Option 3: Single VPS

Deploy both on one server:
- Backend runs on port 5000
- Frontend runs on port 3000
- Use Nginx as reverse proxy:
  - `/api/v1/*` → `localhost:5000`
  - `/ws` → `localhost:5000` (WebSocket)
  - `/*` → `localhost:3000`

## Available Scripts

### Root (`field-sync/`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend + backend in dev mode |
| `npm run build` | Build frontend (Next.js) |
| `npm start` | Start backend server (serves frontend in production) |
| `npm run lint` | Run ESLint on frontend |

### Backend (`field-sync/backend/`)
| Script | Description |
|--------|-------------|
| `npm test` | Run 51 unit tests (5 suites) |
| `npm run test:e2e` | Run E2E tests against real MySQL (requires `fieldsync_test` DB) |
| `npm run test:ci` | CI-optimized test run |
| `npm run migrate` | Run database migrations |
| `npm run migrate:dry-run` | Preview migrations without applying |
| `npm run migrate:force` | Re-apply migrations with hash mismatch |
| `npm run seed` | Seed database with sample data |
| `npm run migrate-indexes` | Apply additional performance indexes |

## Environment Variables

See `backend/.env.example` for required variables. Render blueprints auto-generate `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CSRF_SECRET` via `generateValue: true`.

**Never commit `.env` files to version control.**

## Documentation

This repository includes supporting product and architecture documents:

- [INDEX.md](../INDEX.md) — Documentation index (start here)
- [PROJECT DOCUMENTATION.md](./PROJECT%20DOCUMENTATION.md) — Product vision, role model, delivery phases
- [MODULE OUTLINE.md](./MODULE%20OUTLINE.md) — Platform module breakdown
- [QUICK_START.md](./QUICK_START.md) — Fastest way to run and tour the app
- [ADMIN DASHBOARD UPDATED.md](../04-admin-dashboard/ADMIN%20DASHBOARD%20UPDATED.md) — Admin responsibilities and permissions
- [SUPERVISOR DASHBOARD.md](../05-supervisor-dashboard/SUPERVISOR%20DASHBOARD.md) — Supervisor workspace and project context
- [TEAMLEADER DASHBOARD.md](../06-team-leader-dashboard/TEAMLEADER%20DASHBOARD.md) — Team Leader execution coordination
- [USER DASHBOARD.md](../07-field-worker-dashboard/USER%20DASHBOARD.md) — Field Worker task execution
- [DASHBOARD.md](../02-architecture/DASHBOARD.md) — General dashboard notes
- [DASHBOARD_IMPLEMENTATION.md](../02-architecture/DASHBOARD_IMPLEMENTATION.md) — Technical structure and details
- [SYSTEM MAINTAINANCE FEATURES.md](../08-maintenance/SYSTEM%20MAINTAINANCE%20FEATURES.md) — Maintenance and reliability tooling
- [ADMIN_DASHBOARD_SUMMARY.md](../04-admin-dashboard/ADMIN_DASHBOARD_SUMMARY.md) — Summary of all dashboard surfaces
- [FRONTEND SECURITY FEATURES.md](../03-security/FRONTEND%20SECURITY%20FEATURES.md) — Frontend security layer
- [AUTH PAGES.md](../03-security/AUTH%20PAGES.md) — Authentication flow and pages
- [AUTHORIZATION MODULE.md](../03-security/AUTHORIZATION%20MODULE.md) — Role-based access control

## Notes

- The platform is structured as a professional, production-ready field operations system.
- All four role frontends, backend API, and company pages are implemented.
- Contact form submissions are wired to real backend endpoints.
- Database migrations create the required tables.
- CSRF protection, token refresh, inactivity timeout, and route guards enforce security.
- **51 unit tests** cover auth, CSRF, token blacklist, security policy, and auth endpoint integration.
- **E2E test infrastructure** available for real database validation (`npm run test:e2e`).
- **Service layer** partially extracted: zoneService, inviteService, notificationService, paginationService.
- **Error monitoring** via Sentry on both frontend and backend.
- **CI/CD** via GitHub Actions (lint → test → build) with Render auto-deploy.
- Landing page uses lazy-loaded sections and code-split charts for optimal initial load.
- Render deployment uses `rootDir: field-sync` in the outer `render.yaml` blueprint.

## License

This project currently has no license declared in the repository. Add a license if the project is intended for public distribution.
