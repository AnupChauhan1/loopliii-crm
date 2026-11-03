# Digital Das ERP - Setup Guide

## ⚠️ Important: PostgreSQL Required

**This application requires PostgreSQL to function properly.** The backend cannot start without a running PostgreSQL database.

### Current Status
- ✅ Frontend UI: Fully redesigned and functional with mock data
- ✅ Backend API: Implemented and ready to use
- ❌ Database: PostgreSQL required (not currently available in this environment)

### Without PostgreSQL
You can run the frontend in **UI Demo Mode** using mock data:
```bash
npm install
cd apps/web
npm run dev
```
- Visit http://localhost:3000
- Login: admin@digitaldas.com / password123
- All features work with demo data

### With PostgreSQL (Full Functionality)
Follow the instructions below to set up PostgreSQL and enable real backend connectivity.

## Overview

Digital Das ERP is a comprehensive Digital Agency Management ERP + CRM + Client Collaboration SaaS platform built with Next.js, NestJS, PostgreSQL, and Prisma.

## Prerequisites

- Node.js 18+
- PostgreSQL 16+ **(REQUIRED for full functionality)**
- npm 9+
- Git
- Docker and Docker Compose (optional but recommended for PostgreSQL)

## Quick Start (Development Mode - UI Only)

If you want to test the UI without setting up PostgreSQL:

1. **Install dependencies:**
```bash
npm install
```

2. **Start the frontend:**
```bash
cd apps/web
npm run dev
```

3. **Access the application:**
- Open http://localhost:3000 in your browser
- Use demo credentials: `admin@digitaldas.com` / `password123`

The frontend will use mock data for demonstration purposes.

## Full Setup (With Backend and Database)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL

#### Option A: Using Docker (Recommended)

```bash
docker-compose up -d
```

This will start PostgreSQL and Redis containers.

#### Option B: Local PostgreSQL Installation

1. Install PostgreSQL 16+ on your system
2. Create a database:
```sql
CREATE DATABASE digital_das_erp;
```

3. Update `.env` with your database credentials

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/digital_das_erp?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 4. Run Database Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Seed Database with Demo Data

```bash
npm run prisma:seed
```

This will create:
- Organization: Digital Das Agency
- Roles: Super Admin, Admin, HR Manager, Sales Manager, etc.
- Demo users with role assignments
- Demo client, project, and tasks

Default login credentials:
- Email: `admin@digitaldas.com`
- Password: `password123`

### 6. Start All Services

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Background worker (if configured)

### 7. Start Individual Services

```bash
# Frontend only
npm run dev:web

# Backend only
npm run dev:api

# Worker only
npm run dev:worker
```

## Project Structure

```
digital-das-erp/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS backend
│   └── worker/       # Background job worker
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared configuration
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Database seed script
├── docs/             # Documentation
└── docker-compose.yml
```

## Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all services
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with demo data
- `npm run prisma:studio` - Open Prisma Studio

## Database Management

### View and Edit Database

```bash
npm run prisma:studio
```

### Create a New Migration

```bash
npx prisma migrate dev --name migration_name
```

### Reset Database (CAUTION: deletes all data)

```bash
npx prisma migrate reset
```

## Current Blocker: PostgreSQL Not Available

### Issue Identified
The backend cannot start because PostgreSQL is not running at `localhost:5432`. This is a hard requirement for the application to function.

### Error Message
```
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
```

### Required Actions

To complete the full implementation:

1. **Install and Start PostgreSQL**
   - Option A: Use Docker Compose (recommended)
     ```bash
     docker-compose up -d
     ```
   - Option B: Install PostgreSQL locally
     - Download and install PostgreSQL 16+
     - Create database: `CREATE DATABASE digital_das_erp;`
     - Update `.env` with your credentials

2. **Run Database Setup**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

3. **Start Backend**
   ```bash
   npm run dev:api
   ```

4. **Connect Frontend to Backend**
   - The frontend is already configured to use real API when available
   - Remove or comment out mock data calls in components
   - The API client is already set up with proper interceptors

### What Works Now
- ✅ Premium UI redesign (all pages)
- ✅ Frontend runs with mock data
- ✅ Backend code is complete and ready
- ✅ Database schema is comprehensive
- ✅ Authentication system implemented
- ✅ Task API fully implemented

### What Needs PostgreSQL
- ❌ Backend startup
- ❌ Real API calls
- ❌ Database persistence
- ❌ End-to-end testing
- ❌ Data verification

## Troubleshooting

### PostgreSQL Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running:
```bash
# Docker
docker ps

# Local
pg_isready
```

2. Check your DATABASE_URL in `.env`

3. Ensure the database exists:
```sql
\l digital_das_erp
```

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Find the process using the port
# Windows
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Permission Errors

If you encounter permission errors:

1. Check file permissions on the project directory
2. Ensure you have write access to create `.next` and `dist` folders

### Build Errors

If you encounter build errors:

1. Clear the cache:
```bash
rm -rf .next node_modules
npm install
```

2. Check for TypeScript errors:
```bash
npm run lint
```

## Development Notes

### Frontend (Next.js)

- Uses App Router
- React Query for data fetching
- Tailwind CSS for styling
- shadcn/ui components
- Lucide icons

### Backend (NestJS)

- REST API under `/api/v1`
- JWT authentication
- Prisma ORM for database
- Class-validator for validation
- Role-based access control

### Database (PostgreSQL + Prisma)

- UUID primary keys
- Organization-level data isolation
- Audit logging
- Foreign key constraints
- Indexes for performance

## Current Implementation Status

### Completed Features ✅

- **Frontend UI:**
  - Premium redesigned dashboard with real-time stats
  - Professional sidebar with collapsible sections
  - Modern header with search and quick actions
  - Tasks page with advanced filtering
  - Projects page with card-based layout
  - CRM page with pipeline visualization
  - Social Media page with content management
  - Login page with authentication
  - Placeholder pages for all other modules

- **Backend:**
  - Authentication system (JWT, bcrypt)
  - Task management API with full CRUD
  - Role-based access control
  - Organization data isolation
  - Audit logging
  - Database schema for all modules

- **Infrastructure:**
  - API client with axios
  - React Query setup
  - Mock data service for development
  - Environment configuration
  - Docker Compose setup

### Modules Implemented (Frontend)

- ✅ Dashboard
- ✅ Tasks
- ✅ Projects
- ✅ CRM
- ✅ Clients
- ✅ Social Media
- ✅ Login/Authentication
- ⏳ Calendar (placeholder)
- ⏳ Approvals (placeholder)
- ⏳ Proposals (placeholder)
- ⏳ Content Calendar (placeholder)
- ⏳ Creative Review (placeholder)
- ⏳ Inbox/Chat (placeholder)
- ⏳ Meetings (placeholder)
- ⏳ Calls (placeholder)
- ⏳ Employees (placeholder)
- ⏳ Attendance (placeholder)
- ⏳ Leave (placeholder)
- ⏳ Invoices (placeholder)
- ⏳ Payments (placeholder)
- ⏳ Expenses (placeholder)
- ⏳ Reports (placeholder)
- ⏳ Analytics (placeholder)
- ⏳ Automation (placeholder)
- ⏳ User Management (placeholder)
- ⏳ Settings (placeholder)

### Next Steps for Full Implementation

1. **Connect Frontend to Backend API:**
   - Replace mock data service with real API calls
   - Implement proper error handling
   - Add loading states for all pages

2. **Complete Backend Modules:**
   - Projects API
   - CRM API
   - Social Media API
   - HR Module API
   - Finance Module API
   - Communication Module API

3. **Implement Real-time Features:**
   - WebSockets for chat
   - Live notifications
   - Real-time updates

4. **Add Testing:**
   - Unit tests for backend
   - Integration tests for API
   - E2E tests with Playwright

5. **Production Ready:**
   - Security audit
   - Performance optimization
   - Database backups
   - Monitoring setup

## API Documentation

### Authentication

**POST /api/v1/auth/login**
```json
{
  "email": "admin@digitaldas.com",
  "password": "password123"
}
```

**POST /api/v1/auth/register**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "My Company"
}
```

### Tasks

**GET /api/v1/tasks**
- Headers: `Authorization: Bearer <token>`
- Query params: `status`, `priority`, `projectId`, `search`, `page`, `limit`

**POST /api/v1/tasks**
```json
{
  "title": "Task title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "deadline": "2026-10-20",
  "projectId": "project-id"
}
```

**PUT /api/v1/tasks/:id**
- Update task details

**DELETE /api/v1/tasks/:id**
- Delete a task

## Support

For issues or questions:
- Email: support@digitaldas.com
- Check the documentation in `docs/` folder
- Review the implementation status in `IMPLEMENTATION_STATUS.md`

## License

UNLICENSED
