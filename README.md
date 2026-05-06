# FieldSync

Real-time field operations management platform.

## Project Structure

```
field-sync/
├── frontend/          # Next.js 16 dashboard (Admin, Supervisor, Team Leader, Field Worker)
├── backend/           # Node.js/Express REST API + WebSocket + MySQL
└── package.json       # Root workspace scripts
```

## Quick Start

### Install all dependencies

```bash
npm install          # Install root (concurrently)
npm run install:all  # Install frontend + backend
```

### Set up environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and email settings

# Frontend (optional for dev)
cp frontend/.env.example frontend/.env
```

### Run database migrations

```bash
npm run migrate
```

### Start development servers

```bash
npm run dev
```

This starts both frontend (`localhost:3000`) and backend (`localhost:5000`) concurrently.

### Production Build

```bash
npm run build
npm run start        # Starts backend only (frontend must be deployed separately or built into backend)
```

## Production Deployment

### Option 1: Separate hosting (Recommended)

**Frontend** → Vercel, Netlify, or any Node hosting:
- Set `NEXT_PUBLIC_API_URL=https://your-api-domain/api/v1`
- Set `NEXT_PUBLIC_WS_URL=wss://your-api-domain`
- Run `npm run build` then `npm run start`

**Backend** → Railway, Render, DigitalOcean, or any VPS:
- Set all backend `.env` variables (JWT secrets, database, email)
- Run `npm run migrate` once after deployment
- Run `npm run start`

### Option 2: Single VPS

Deploy both on one server:
- Backend runs on port 5000
- Frontend runs on port 3000
- Use Nginx as reverse proxy:
  - `/api/v1/*` → `localhost:5000`
  - `/ws` → `localhost:5000` (WebSocket)
  - `/*` → `localhost:3000`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend + backend in dev mode |
| `npm run build` | Build frontend + install backend deps |
| `npm run start` | Start backend server (runs migrations automatically) |
| `npm run migrate` | Run database migrations manually |
| `npm run seed` | Seed database with sample data |
| `npm run install:all` | Install dependencies for root, frontend, and backend |
| `npm run lint` | Run ESLint on frontend |

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts, Leaflet
- **Backend**: Node.js, Express, MySQL 2, WebSocket (ws), Nodemailer, Zod, Helmet, JWT
- **Database**: MySQL with migration system

## Environment Variables

See `frontend/.env.example` and `backend/.env.example` for required variables.

**Never commit `.env` files to version control.**

## License

No license declared. Add a license if the project is intended for public distribution.
