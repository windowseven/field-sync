# SUPERVISOR DASHBOARD UPDATE [PROJECT CONTEXT]

## Purpose

This document defines an important update to the Supervisor experience in FieldSync.

The goal of this update is to introduce proper project context handling so that:

- One Supervisor can own or manage more than one project
- A Supervisor does not land directly inside one hardcoded project
- The system clearly separates pre-project actions from project-level operations

This update is necessary for a realistic multi-project field operations platform.

## Problem

The current Supervisor dashboard flow assumes that the Supervisor is already inside one project.

That creates a major gap:

- What does the Supervisor see before opening a project?
- What does the Supervisor do if they have multiple projects?
- What happens if they have no project yet?
- How does the system know which project is currently active?

Without solving this, project-scoped pages such as teams, zones, forms, users, invitations, analytics, and audit logs become unclear and difficult to scale.

## Core Update

The Supervisor experience must be split into two distinct layers:

1. Supervisor Workspace
2. Project Dashboard

This is the main change introduced by Project Context. **Status: Successfully Implemented ✅**

## 🏁 Implementation Status: COMPLETE

The dual-layer Supervisor experience has been fully implemented as defined in this document.

### ✅ Layer 1: Supervisor Workspace
- [x] **Project List**: Live project directory with status cards and metrics.
- [x] **Search & Filter**: Real-time filtering by name and status.
- [x] **Project Creator**: 4-step wizard for starting new operations.
- [x] **Empty State**: Tailored onboarding for new supervisors.

### ✅ Layer 2: Project Dashboard (Scoped)
- [x] **Project Scoping**: All operational pages now require a valid `projectId`.
- [x] **Context-Aware Modules**: Analytics, Audit, Forms, Map, Teams, Users, and Zones all filter data based on the active project.
- [x] **Project Switcher**: Persistent dropdown in the sidebar to toggle between project contexts.
- [x] **Navigation Modes**: Sidebar automatically switches between Workspace and Project views.

## Important Clarification

This update does not mean we are designing a brand new dashboard UI for the inside of a project.

The project-level dashboard UI can remain the same as the current Supervisor dashboard concept.

What changes is the layer before it:

- We add a Supervisor Workspace
- We add project selection
- We add project switching
- We make project context explicit

In other words:

- The current project dashboard remains the operational dashboard
- Project Context is the wrapper around that dashboard
- We are not replacing the inside-project dashboard with a completely different product surface

So the change is architectural and navigational, not a reinvention of the project dashboard itself.

## Layer 1: Supervisor Workspace

This is the first level a Supervisor should see before entering a specific project.

The Supervisor Workspace is not a project dashboard.

It is a project selection and project management area for the Supervisor as a user.

## What The Supervisor Sees In The Workspace

Before opening any project, the Supervisor should see:

- A list of all projects they own or manage
- Project cards or rows showing:
  - Project name
  - Status such as Active, Paused, Draft, Archived
  - Team count
  - Member count
  - Zone count
  - Overall progress
  - Last activity
  - Created date
  - Last opened date
- Search across their projects
- Filters by status or activity
- Recent project activity across their projects
- Notifications relevant to them as a Supervisor
- Personal account/profile access
- A `Create Project` action

## What The Supervisor Can Do In The Workspace

Before selecting a project, the Supervisor can:

- Create a new project
- View all projects they own or manage
- Open a project
- Switch from one project to another
- Search and filter projects
- Resume the last opened project
- Pause or archive a project if product rules allow
- Duplicate a project setup in the future if cloning is supported
- Access personal settings

## Empty State

If the Supervisor has no projects, the workspace should show:

- A clear empty state message
- A primary `Create Project` button
- Optional onboarding steps for setting up the first project

This is important because a new Supervisor should not be taken into a blank project dashboard.

## Layer 2: Project Dashboard

After the Supervisor selects a project, the system enters project context.

At this point, all pages must be scoped to that selected project only.

This is the actual operational dashboard.

This dashboard can reuse the current Supervisor dashboard UI structure. The difference is that it will now open under a selected project instead of pretending there is only one project by default.

## What The Supervisor Sees Inside A Selected Project

Inside one selected project, the Supervisor should see:

- Project overview and status
- Team members and active sessions
- Teams and team leaders
- Zones and zone assignments
- Live map and movement activity
- Forms and tasks
- Project users
- Invitations and access control
- Project analytics
- Project audit logs
- Project settings

All of these must belong to the currently selected project.

## What The Supervisor Can Do Inside A Selected Project

Inside one project, the Supervisor can:

- Edit project details
- Activate, pause, or archive that project
- Invite users into that project
- Assign users to teams
- Promote users to Team Leader inside that project
- Create and restructure teams
- Create, update, and assign zones
- Create or adopt forms for that project
- Assign tasks to teams or specific users
- Track field activity in real time
- Review submissions
- Monitor progress and performance
- Review project audit logs
- Configure project-level settings

## What Must Never Happen Without Project Context

The following pages and actions must not exist without a selected project:

- Teams
- Zones
- Forms
- Tasks
- Project users
- Invitations
- Project analytics
- Project audit logs
- Project settings
- Live field map for one project

These are project-scoped features and must always be tied to a specific project.

## Key Product Rule

No project-scoped page should load unless a project has been selected.

That is the heart of the Project Context update.

## Recommended Route Structure

To support this change cleanly, the Supervisor routes should evolve into:

```txt
/supervisor
/supervisor/projects
/supervisor/projects/new
/supervisor/projects/[projectId]
/supervisor/projects/[projectId]/map
/supervisor/projects/[projectId]/teams
/supervisor/projects/[projectId]/zones
/supervisor/projects/[projectId]/forms
/supervisor/projects/[projectId]/users
/supervisor/projects/[projectId]/invitations
/supervisor/projects/[projectId]/analytics
/supervisor/projects/[projectId]/audit
/supervisor/projects/[projectId]/settings
/supervisor/settings
```

## Route Meaning

- `/supervisor` or `/supervisor/projects`
  Supervisor Workspace
- `/supervisor/projects/new`
  Create Project flow
- `/supervisor/projects/[projectId]`
  Selected project overview
- `/supervisor/projects/[projectId]/*`
  Project-scoped operational pages
- `/supervisor/settings`
  Personal Supervisor settings only

## Navigation Update

The Supervisor navigation should support two modes.

## Workspace Navigation

Before a project is selected, navigation should focus on:

- My Projects
- Create Project
- Notifications
- Personal Settings

## Project Navigation

After a project is selected, navigation should focus on:

- Project Overview
- Live Map
- Teams
- Zones
- Forms and Tasks
- Project Users
- Invitations
- Analytics
- Audit Logs
- Project Settings

There should also be a visible project switcher at the top so the Supervisor always knows which project is active.

## Settings Separation

This update also introduces an important separation:

- Personal Supervisor settings stay at `/supervisor/settings`
- Project settings move to `/supervisor/projects/[projectId]/settings`

This avoids mixing account-level configuration with project-level configuration.

## Data Model Direction

The system should no longer assume:

- One Supervisor = one project

Instead, it should support:

- One Supervisor = many projects
- One project = memberships
- Permissions = project-scoped where needed

Recommended model direction:

- User
- Project
- ProjectMembership
- ProjectRole

## Conceptual Meaning

- A user may have the global role `Supervisor`
- The same Supervisor may manage multiple projects
- Each project has its own memberships
- Membership defines what the user can do in that project

This is much more scalable than attaching all logic to one global role.

## Future-Safe Benefits

This model also prepares the product for:

- Multiple supervisors inside one project if needed later
- Delegated project administration
- Cleaner permissions
- Better backend design
- Better audit scoping

## UX States To Support

The workspace should handle these cases:

### Zero Projects

- Show empty state
- Promote `Create Project`

### One Project

- Show workspace summary
- Optionally allow quick open into the latest project

### Many Projects

- Show project list
- Allow search, filtering, and switching

### Returning Supervisor

- Show recent projects
- Show last activity
- Show pending notifications

## Supervisor Boundaries Still Remain

Even after this update, the Supervisor still does not:

- Control global system settings
- Access platform-wide logs
- Manage users outside project scope
- Configure infrastructure or backend
- Perform system maintenance

Those remain Admin responsibilities.

## Summary Of The Change

Before this update:

- Supervisor dashboard starts inside one project
- Project context is assumed
- Multi-project support is weak

After this update:

- Supervisor starts in a Workspace
- Supervisor sees all owned projects first
- Supervisor creates or selects a project
- Project-scoped pages only open after project selection
- The existing project dashboard UI remains the same in principle
- Multi-project architecture becomes clean and scalable

## Final Decision

The Supervisor should not start inside a project by default.

The Supervisor should start in a Supervisor Workspace, see their available projects, and then choose the project they want to open.

That selected project becomes the active project context for all operational pages.
