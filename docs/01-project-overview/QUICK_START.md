# FieldSync Dashboards - Quick Start

This quick start reflects the current state of FieldSync as of May 2026.

All four role frontends, backend API, and company pages are **complete** ✅

- Admin Dashboard: **Complete** ✅
- Supervisor Dashboard: **Complete** ✅ (incl. Project Context)
- Team Leader Dashboard: **Complete** ✅
- Field Worker Frontend: **Complete** ✅
- Backend API: **Complete** ✅ (Node.js/Express + MySQL)
- Company Pages: **Complete** ✅ (Landing, About, Careers, Contact, Blog, FAQ, Legal)

## 1. Start the Application

### Frontend

Install dependencies:

```bash
cd frontend
npm install
```

Run the development server:

```bash
npm run dev
```

### Backend

Install dependencies:

```bash
cd backend
npm install
```

Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

Run database migrations:

```bash
node src/db/migrate-indexes.js
```

Start the backend server:

```bash
npm run dev
```

Open the application in your browser:

```txt
http://localhost:3000/landing
http://localhost:3000/login
http://localhost:3000/dashboard
http://localhost:3000/supervisor
http://localhost:3000/teamleader
http://localhost:3000/user
```

## 2. What You Can Access Right Now

The current repository contains complete frontend surfaces for all four roles plus the backend API:

- Admin Dashboard: the system-level control plane for platform governance
- Supervisor Dashboard: the project-level workspace for field operations control
- Team Leader Dashboard: the execution coordination layer
- Field Worker Frontend: the field execution and data capture layer
- Backend API: REST endpoints, WebSocket, email notifications, and MySQL persistence
- Company Pages: Landing, About, Careers, Contact, Blog, FAQ, Privacy, Terms, Cookies

## 3. Admin Dashboard Navigation

Main admin route:

```txt
/dashboard
```

Key admin areas:

- System Overview
- Global Users
- Supervisors
- Projects Overview
- Global Form Templates
- System Analytics
- Audit and Logs
- Security Center
- Alerts
- Broadcast
- Settings
- Emergency Control
- Maintenance modules: server, database, backups, storage, rate limits, sync, API monitor, feature flags, sandbox, errors

Recommended admin tour:

1. `/dashboard`
2. `/dashboard/users`
3. `/dashboard/projects`
4. `/dashboard/security`
5. `/dashboard/audit`
6. `/dashboard/maintenance`

## 4. Supervisor Dashboard Navigation

Main supervisor route:

```txt
/supervisor (Workspace)
```

Key supervisor areas:

- Project List (Workspace)
- Project Creation Wizard
- Project Dashboard (Scoped)
- Live Map
- Teams & Users
- Zones & Geofencing
- Forms and Tasks
- Analytics & Audit Logs
- Project settings
- Personal settings

Recommended supervisor tour:

1. `/supervisor` (Project List)
2. `/supervisor/projects/new` (Creation Flow)
3. `/supervisor/projects/proj-nairobi-2026` (Sample Project Overview)
4. `/supervisor/projects/proj-nairobi-2026/map` (Live project map)
5. `/supervisor/projects/proj-nairobi-2026/analytics` (Project data)

## 5. Team Leader Dashboard Navigation

Main team leader route:

```txt
/teamleader
```

Key team leader areas:

- Team Overview (`/teamleader/overview`)
- Team Members (`/teamleader/members`)
- Team Map (`/teamleader/map`)
- Tasks (`/teamleader/tasks`)
- Forms (`/teamleader/forms`)
- Performance (`/teamleader/performance`)
- Notifications (`/teamleader/notifications`)
- Activity (`/teamleader/activity`)
- Settings (`/teamleader/settings`)

## 6. Field Worker (User) Dashboard Navigation

Main user route:

```txt
/user
```

Key field worker areas:

- Home Dashboard (`/user/home`)
- Map View (`/user/map`)
- Assigned Tasks (`/user/tasks`)
- Dynamic Forms (`/user/forms/[id]`)
- Team View (`/user/team`)
- Notifications (`/user/notifications`)

## 7. Company Pages

Public-facing pages:

- Landing (`/landing`)
- About (`/about`)
- Careers (`/careers`)
- Contact (`/contact`) — with real backend submission
- Blog (`/blog`)
- FAQ (`/faq`) — with search and categorized accordions
- Privacy (`/privacy`)
- Terms (`/terms`)
- Cookies (`/cookies`)

## 8. How to Read the Current State

This is a fully implemented system with all four role frontends, backend API, and company pages.

That means:

- The route structure and UI flows are in place for all roles
- The role separation across Admin, Supervisor, Team Leader, and Field Worker is visible
- Backend API provides REST endpoints, WebSocket, email notifications, and MySQL persistence
- Contact form submissions are wired to real backend endpoints
- Database migrations are in place
- Authentication, JWT tokens, CSRF protection, and role-based middleware are implemented

## 9. Helpful Documents

For deeper context, continue with:

- [README.md](./README.md)
- [PROJECT DOCUMENTATION.md](./PROJECT%20DOCUMENTATION.md)
- [ADMIN DASHBOARD UPDATED.md](../04-admin-dashboard/ADMIN%20DASHBOARD%20UPDATED.md)
- [SUPERVISOR DASHBOARD.md](../05-supervisor-dashboard/SUPERVISOR%20DASHBOARD.md)
- [TEAMLEADER DASHBOARD.md](../06-team-leader-dashboard/TEAMLEADER%20DASHBOARD.md)
- [USER DASHBOARD.md](../07-field-worker-dashboard/USER%20DASHBOARD.md)
- [MODULE OUTLINE.md](./MODULE%20OUTLINE.md)
- [SYSTEM MAINTAINANCE FEATURES.md](../08-maintenance/SYSTEM%20MAINTAINANCE%20FEATURES.md)
- [INDEX.md](../INDEX.md)

## 10. Fastest Meaningful Walkthrough

If you want the quickest way to understand the full product:

1. Open `/landing` to see the marketing page
2. Open `/dashboard` to see the system-level Admin layer
3. Open `/supervisor` to see the project-level Supervisor layer
4. Open `/teamleader` to see the execution coordination layer
5. Open `/user` to see the field worker layer
6. Compare [ADMIN DASHBOARD UPDATED.md](../04-admin-dashboard/ADMIN%20DASHBOARD%20UPDATED.md) with [SUPERVISOR DASHBOARD.md](../05-supervisor-dashboard/SUPERVISOR%20DASHBOARD.md)
7. Check [USER DASHBOARD.md](../07-field-worker-dashboard/USER%20DASHBOARD.md) for the field worker experience

That gives you the clearest view of the complete four-role architecture: Admin owns the platform, Supervisor owns project execution, Team Leader coordinates execution, and Field Worker performs tasks.
