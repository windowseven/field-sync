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

FieldSync has been built in stages as a full platform.

Current delivery status:

- Admin Dashboard: **Complete** ✅
- Supervisor Dashboard: **Complete** ✅ (incl. Project Context architecture)
- Team Leader Dashboard: **Complete** ✅ (incl. execution coordination pages)
- Field Worker Frontend: **Complete** ✅ (incl. offline sync status)
- Backend API: **Complete** ✅ (Node.js/Express + MySQL + WebSocket + Email)
- Company Pages: **Complete** ✅ (Landing, About, Careers, Contact, Blog, FAQ, Legal)

The next phase is production deployment, field testing, and iterative improvements.

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI primitives
- Recharts
- Lucide React icons
- React Hook Form and Zod validation
- DOMPurify for input sanitization

### Backend
- Node.js
- Express.js
- MySQL
- JWT authentication
- WebSocket (ws)
- Nodemailer
- bcrypt
- dotenv

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

The dashboard includes operational sections that move the product beyond a simple demo UI:

- System health monitoring
- Error tracking
- Backup and restore
- Storage monitoring
- API monitoring
- Rate limiting controls
- Offline sync monitoring
- Feature flags
- Sandbox/testing views

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

## Project Structure

```txt
frontend/
  app/
    landing/
    about/
    careers/
    contact/
    blog/
    faq/
    privacy/
    terms/
    cookies/
    login/
    register/
    verify-otp/
    forgot-password/
    reset-password/
    dashboard/
      analytics/
      alerts/
      audit/
      broadcast/
      emergency/
      forms/
      maintenance/
      projects/
      security/
      settings/
      supervisors/
      tracking/
      users/
    supervisor/
      projects/
        [projectId]/
          map/
          teams/
          zones/
          forms/
          users/
          invitations/
          analytics/
          audit/
          settings/
      settings/
    teamleader/
      overview/
      members/
      map/
      tasks/
      forms/
      performance/
      notifications/
      activity/
      settings/
    user/
      home/
      map/
      tasks/
      forms/
        [id]/
      team/
      notifications/
  components/
    dashboard/
    supervisor/
    teamleader/
    user/
    ui/
  lib/
    api/
      contactService.ts
      ...

backend/
  src/
    controllers/
    middleware/
    routes/
    services/
    db/
      migrate-indexes.js
    utils/
  .env
  package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm installed
- MySQL server running

### Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### Set up environment

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and email settings
```

### Run database migrations

```bash
cd backend
node src/db/migrate-indexes.js
```

### Start the development servers

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

Open `http://localhost:3000`, then go to:

```txt
http://localhost:3000/landing
http://localhost:3000/login
http://localhost:3000/dashboard
```

### Production build

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
npm run start
```

## Available Scripts

### Frontend
- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run start` - start the production server
- `npm run lint` - run ESLint

### Backend
- `npm run dev` - start the development server
- `npm run start` - start the production server

## Documentation

This repository includes supporting product and architecture documents:

- [INDEX.md](./docs/INDEX.md) — Documentation index (start here)
- [PROJECT DOCUMENTATION.md](./docs/PROJECT%20DOCUMENTATION.md) — Product vision, role model, delivery phases
- [MODULE OUTLINE.md](./docs/MODULE%20OUTLINE.md) — Platform module breakdown
- [QUICK_START.md](./docs/QUICK_START.md) — Fastest way to run and tour the app
- [ADMIN DASHBOARD UPDATED.md](./docs/ADMIN%20DASHBOARD%20UPDATED.md) — Admin responsibilities and permissions
- [SUPERVISOR DASHBOARD.md](./docs/SUPERVISOR%20DASHBOARD.md) — Supervisor workspace and project context
- [TEAMLEADER DASHBOARD.md](./docs/TEAMLEADER%20DASHBOARD.md) — Team Leader execution coordination
- [USER DASHBOARD.md](./docs/USER%20DASHBOARD.md) — Field Worker task execution
- [DASHBOARD.md](./docs/DASHBOARD.md) — General dashboard notes
- [DASHBOARD_IMPLEMENTATION.md](./docs/DASHBOARD_IMPLEMENTATION.md) — Technical structure and details
- [SYSTEM MAINTAINANCE FEATURES.md](./docs/SYSTEM%20MAINTAINANCE%20FEATURES.md) — Maintenance and reliability tooling
- [ADMIN_DASHBOARD_SUMMARY.md](./docs/ADMIN_DASHBOARD_SUMMARY.md) — Summary of all dashboard surfaces
- [FRONTEND SECURITY FEATURES.md](./docs/FRONTEND%20SECURITY%20FEATURES.md) — Frontend security layer
- [AUTH PAGES.md](./docs/AUTH%20PAGES.md) — Authentication flow and pages
- [AUTHORIZATION MODULE.md](./docs/AUTHORIZATION%20MODULE.md) — Role-based access control

## Notes

- The platform is structured as a professional, production-ready field operations system.
- All four role frontends, backend API, and company pages are implemented.
- Contact form submissions are wired to real backend endpoints.
- Database migrations create the required tables.
- CSRF protection, token refresh, inactivity timeout, and route guards enforce security.

## License

This project currently has no license declared in the repository. Add a license if the project is intended for public distribution.
