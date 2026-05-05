# FieldSync Documentation Index

This index reflects the current state of the repository as of May 2026.

## Implementation Status

- Landing Page (`/landing`) ✅
- Auth Pages (`/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password`) ✅
- Company Pages (About, Careers, Contact, Blog, FAQ, Privacy, Terms, Cookies) ✅
- Admin Dashboard (`/dashboard`) ✅
- Supervisor Dashboard (`/supervisor`) ✅ (with Workspace/Project context)
- Team Leader Dashboard (`/teamleader`) ✅
- Field Worker Frontend (`/user`) ✅
- Backend API (Node.js/Express + MySQL) ✅
- Real-time WebSocket support ✅
- Email notifications ✅
- CSRF protection + security middleware ✅

## Start Here

- [README.md](./README.md) — Overall repository scope, current status, route summary, and project structure.
- [QUICK_START.md](./QUICK_START.md) — Fastest way to run the app and tour all dashboards.
- [PROJECT DOCUMENTATION.md](./PROJECT%20DOCUMENTATION.md) — Product vision, role model, delivery phases, and architecture.

## Role-Specific Docs

- [ADMIN DASHBOARD UPDATED.md](./ADMIN%20DASHBOARD%20UPDATED.md) — Admin responsibilities, permissions, and system-level boundaries.
- [SUPERVISOR DASHBOARD.md](./SUPERVISOR%20DASHBOARD.md) — Supervisor responsibilities, project-level visibility, and operational boundaries.
- [TEAMLEADER DASHBOARD.md](./TEAMLEADER%20DASHBOARD.md) — Team Leader execution coordination and team management.
- [USER DASHBOARD.md](./USER%20DASHBOARD.md) — Field Worker task execution, form submission, and offline workflows.

## Technical and Product Docs

- [DASHBOARD.md](./DASHBOARD.md) — General dashboard notes and implementation overview.
- [DASHBOARD_IMPLEMENTATION.md](./DASHBOARD_IMPLEMENTATION.md) — Technical structure and implementation details.
- [MODULE OUTLINE.md](./MODULE%20OUTLINE.md) — Broader platform module breakdown.
- [SYSTEM MAINTAINANCE FEATURES.md](./SYSTEM%20MAINTAINANCE%20FEATURES.md) — System maintenance and reliability tooling.
- [ADMIN_DASHBOARD_SUMMARY.md](./ADMIN_DASHBOARD_SUMMARY.md) — Summary of all dashboard surfaces.
- [FRONTEND SECURITY FEATURES.md](./FRONTEND%20SECURITY%20FEATURES.md) — Frontend security layer documentation.
- [AUTH PAGES.md](./AUTH%20PAGES.md) — Authentication flow and page specifications.
- [AUTHORIZATION MODULE.md](./AUTHORIZATION%20MODULE.md) — Role-based access control and permission system.

## Current Route Summary

Public routes:
- `/landing` — Landing/marketing page
- `/about`, `/careers`, `/contact`, `/blog`, `/faq` — Company information pages
- `/privacy`, `/terms`, `/cookies` — Legal pages
- `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` — Auth pages

Admin routes:
- `/dashboard` — System overview
- `/dashboard/users`, `/dashboard/supervisors`, `/dashboard/projects`
- `/dashboard/forms`, `/dashboard/tracking`, `/dashboard/analytics`
- `/dashboard/audit`, `/dashboard/security`, `/dashboard/alerts`
- `/dashboard/broadcast`, `/dashboard/settings`, `/dashboard/emergency`
- `/dashboard/maintenance` (server, database, backup, errors, rate-limits, sync, storage, api, features, sandbox)

Supervisor routes:
- `/supervisor` (Workspace Redirect)
- `/supervisor/projects` (Project List)
- `/supervisor/projects/new` (Creation Wizard)
- `/supervisor/projects/[projectId]/*` (All operational modules)
- `/supervisor/settings` (Personal settings)

Team Leader routes:
- `/teamleader/overview`, `/teamleader/members`, `/teamleader/map`
- `/teamleader/tasks`, `/teamleader/forms`, `/teamleader/performance`
- `/teamleader/notifications`, `/teamleader/activity`, `/teamleader/settings`

Field Worker (User) routes:
- `/user/home`, `/user/map`, `/user/tasks`
- `/user/forms/[id]`, `/user/team`, `/user/notifications`

## Recommended Read Order

1. [README.md](./README.md)
2. [QUICK_START.md](./QUICK_START.md)
3. [PROJECT DOCUMENTATION.md](./PROJECT%20DOCUMENTATION.md)
4. [ADMIN DASHBOARD UPDATED.md](./ADMIN%20DASHBOARD%20UPDATED.md)
5. [SUPERVISOR DASHBOARD.md](./SUPERVISOR%20DASHBOARD.md)
6. [TEAMLEADER DASHBOARD.md](./TEAMLEADER%20DASHBOARD.md)
7. [USER DASHBOARD.md](./USER%20DASHBOARD.md)

## Current Architecture Snapshot

- Admin owns platform-wide governance, security, audit, maintenance, and global visibility
- Supervisor owns project execution, teams, zones, tasks, invitations, and project analytics
- Team Leader coordinates team execution, task assignment, and field monitoring
- Field Worker performs tasks, fills forms, shares location, and works offline
- Backend (Node.js/Express + MySQL) provides REST APIs, WebSocket real-time updates, email notifications, and database migrations
- Frontend security includes CSRF protection, token refresh, inactivity timeout, route guards, and input sanitization

This means the documentation should now be read as a complete four-role system with full backend integration.
