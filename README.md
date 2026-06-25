# FieldSync 📍

A real-time, role-based field operations management platform built for survey teams, census work, and community outreach in East Africa.

🔗 **Live Demo:** [v0-modified-admindashboard-field-op.vercel.app](https://v0-modified-admindashboard-field-op.vercel.app)

## Overview

FieldSync solves the coordination problem in field operations — supervisors lose visibility of what teams are doing once they leave the office. This platform gives every stakeholder a real-time view of operations with role-appropriate dashboards.

## User Roles & Access

| Role | Capabilities |
|---|---|
| **Admin** | Full system control, user management, project creation |
| **Supervisor** | Project oversight, team assignment, progress monitoring |
| **Team Leader** | Task management, field worker coordination |
| **Field Worker** | Task execution, GPS check-in, data submission |

## Features

- 🗺️ Real-time location tracking and GPS check-in
- 📊 Live dashboards per role
- 📁 Project-based context system (`/supervisor/projects/[projectId]/*`)
- 🔐 Full authentication & authorization module
- 📱 Responsive design for field use on mobile
- ⚡ WebSocket-powered real-time updates

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript |
| Styling | Tailwind CSS |
| Real-time | Socket.io / WebSockets |
| Auth | JWT, Role-based access control |
| Deployment | Vercel |

## Getting Started

```bash
git clone https://github.com/Windowseven/field-sync.git
cd field-sync
npm install
npm run dev
```

## Screenshots

> Dashboard previews available at the live demo link above.

## Built By

**Junior L. Malimi** — CS Student @ NIT Dar es Salaam, Tanzania  
🌐 [Portfolio](https://my-portifolio-qk1s.onrender.com/)
