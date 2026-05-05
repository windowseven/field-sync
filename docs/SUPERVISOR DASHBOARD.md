# SUPERVISOR WORKSPACE AND PROJECT DASHBOARD

## Purpose

This document defines the intended Supervisor experience for FieldSync after introducing support for one Supervisor owning or managing more than one project.

It answers two critical questions:

- What does a Supervisor see before opening a specific project?
- What can a Supervisor do after entering a specific project?

This is the correct next step for the product because the current project-level dashboard assumes a single active project. That works for a demo, but it is not enough for a real multi-project field operations platform.

## Core Architectural Change

The Supervisor experience should be split into two layers:

1. Supervisor Workspace ✅
   This is the pre-project layer where the Supervisor sees all of their projects and chooses what to open.
2. Project Dashboard ✅
   This is the project-scoped layer where the Supervisor manages teams, zones, forms, tasks, users, and field activity for one selected project.

This separation is important because project operations only make sense after a project has been selected.

## Why This Change Is Needed

The previous model treated the Supervisor almost like a one-project owner. That creates several problems:

- A Supervisor with multiple projects has no project selection screen
- Project-scoped pages become ambiguous because the system does not know which project is active
- Settings, users, teams, zones, and forms get mixed together without a clear boundary
- The product cannot scale cleanly to multi-project organizations

The new model solves this by introducing an explicit project context.

## Supervisor Workspace

## What The Supervisor Sees Before Entering A Project

The Supervisor Workspace is the first screen after login for a Supervisor.

The Supervisor should see:

- A list of all projects they own or manage
- Project cards or table rows with:
  - Project name
  - Status such as Active, Paused, Draft, Archived
  - Team count
  - Member count
  - Zone count
  - Progress summary
  - Last activity
  - Created date
  - Last opened date
- Search and filtering for projects
- Quick summary metrics across all their projects
- Cross-project notifications
- Their own account/profile entry point
- A clear `Create Project` action

If the Supervisor has no projects, the screen should show an empty state with:

- A message that no projects exist yet
- A primary button to create the first project
- Optional onboarding guidance for project setup

## What The Supervisor Can Do Before Entering A Project

At the workspace level, the Supervisor can:

- Create a new project
- View all owned projects
- Open a project
- Switch between projects
- Search and filter projects
- Pause or archive a project if permissions allow
- Duplicate or reuse a project setup if the product later supports templates or cloning
- View high-level notifications across projects
- Access personal account settings

At this level, the Supervisor should not directly manage project teams, project zones, project users, or project forms until a specific project has been opened.

## Project Dashboard

After selecting a project, the Supervisor enters a project-scoped dashboard.

## What The Supervisor Sees Inside A Selected Project

Inside one project, the Supervisor should see:

- Project overview and status
- Team members and active sessions
- Teams and team leaders
- Zones and map coverage
- Forms and tasks
- Project users
- Invitations and join status
- Live map and field activity
- Project analytics
- Project audit logs
- Project-specific settings

All information at this stage must be scoped to the selected project only.

## What The Supervisor Can Do Inside A Selected Project

Inside one selected project, the Supervisor can:

- Edit project details
- Activate, pause, or archive the project
- Invite users into that project
- Assign users to teams
- Promote users to Team Leader inside that project
- Create and restructure teams
- Create and manage zones
- Assign teams to zones
- Create or adopt forms for that project
- Assign tasks to teams or individuals
- Track field activity in real time
- Review submissions
- Analyze performance
- Review project audit logs
- Configure project-level settings

## Important Boundary

The Supervisor must not do system-level work. Even with multiple projects, the Supervisor still does not:

- Control global system settings
- Access platform-wide audit logs
- Manage users outside their own project memberships
- Configure backend or infrastructure
- Perform platform maintenance

Those remain Admin responsibilities.

## Separation Of Supervisor-Level And Project-Level Views

The product should clearly separate these two concepts:

### Supervisor-Level Views

- My Projects
- Create Project
- Cross-project notifications
- Personal profile and account settings

### Project-Level Views

- Overview
- Teams
- Zones
- Forms and Tasks
- Project Users
- Invitations
- Map
- Analytics
- Audit Logs
- Project Settings

This separation prevents confusion and keeps navigation predictable.

## Recommended Route Structure

The recommended route structure is:

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

### Route Meaning

- `/supervisor` or `/supervisor/projects`
  Supervisor workspace and project list
- `/supervisor/projects/new`
  New project creation flow
- `/supervisor/projects/[projectId]/*`
  Project-scoped pages
- `/supervisor/settings`
  Personal Supervisor account settings only

This means project settings must move under the project route, while personal settings stay outside project scope.

## Navigation Model

The Supervisor sidebar should evolve into two modes.

### Mode 1: Workspace Sidebar

Visible before a project is selected:

- My Projects
- Create Project
- Notifications
- Account Settings

### Mode 2: Project Sidebar

Visible after a project is selected:

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

At the top of the project sidebar there should be a project switcher so the Supervisor can jump between projects without returning to a separate page every time.

## Data Model Direction

The architecture should not assume that one Supervisor equals one project.

Instead, the system should model:

- Users
- Projects
- Project memberships
- Project-scoped roles and permissions

Recommended conceptual model:

- A user can have the global role `Supervisor`
- The same Supervisor can belong to multiple projects
- Each project has memberships
- Membership defines what that user can do inside that specific project

That gives the system room to support:

- One Supervisor owning many projects
- More than one Supervisor inside one project in the future
- Delegated project-level administration
- Cleaner permission handling

## Suggested Membership Concepts

At project level, a membership may eventually include values like:

- Project Owner
- Supervisor
- Team Leader
- Field Worker

This is more scalable than hardcoding all permissions directly into one global role.

## UX States To Support

The Supervisor Workspace should handle these states clearly:

### Zero Projects

- Show empty state
- Emphasize `Create Project`

### One Project

- Show workspace summary
- Optionally allow quick resume into the last opened project

### Many Projects

- Show searchable project list
- Support filtering by status, activity, or ownership

### Returning User

- Show recent projects
- Show last activity and pending notifications

## Product Rules

These rules should guide implementation:

- No project-scoped page should load without a project context
- Teams, zones, forms, project users, and project audit must always belong to a selected project
- Personal settings and project settings must remain separate
- The Supervisor should always know which project is active
- Switching projects should be fast and explicit

## Recommended Implementation Direction

Status: **Complete** ✅

1. [x] Introduce the Supervisor Workspace as the new entry point
2. [x] Move all operational pages under `/supervisor/projects/[projectId]/...`
3. [x] Add a project switcher
4. [x] Separate personal settings from project settings
5. [x] Update data structures and docs to use project memberships
6. [x] Backend API integration for project operations

## Final Architecture Summary

Admin:

- Platform-level control
- Security, maintenance, audit, policies, system visibility

Supervisor Workspace:

- Sees and manages owned projects
- Chooses which project to open
- Creates new projects

Supervisor Project Dashboard:

- Runs one selected project
- Manages teams, zones, forms, tasks, users, invitations, analytics, and project audit

Team Leader:

- Coordinates team execution inside assigned project scope

Field Worker:

- Executes field work inside assigned project scope

## Final Insight

This change makes the Supervisor experience realistic for a production field operations system.

It improves:

- Multi-project support
- Navigation clarity
- Permission boundaries
- Scalability
- Future backend design

In short, the Supervisor should not start inside a project by default. The Supervisor should start in a workspace, see their projects, and then choose which project to open.
