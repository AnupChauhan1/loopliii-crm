# LOOPLI CRM

A comprehensive Digital Agency Management ERP + CRM + Client Collaboration SaaS platform with a premium, professional UI.

## 🚀 Quick Start

### UI Demo (No Database Required)

Want to see the redesigned UI immediately?

```bash
npm install
cd apps/web
npm run dev
```

Open http://localhost:3000 and use:
- Email: `admin@looply.com`
- Password: `password123`

### Full Setup (With Backend & Database)

For the complete experience with real backend API and database:

**See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.**

Quick summary:
```bash
npm install
cp .env.example .env
docker-compose up -d  # Start PostgreSQL and Redis
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## ✨ What's New

### Recent UI Redesign (October 2026)

- **Premium Professional Design**: Completely redesigned with a clean, modern enterprise SaaS aesthetic
- **Sophisticated Color Scheme**: White/gray surfaces with green (#16A34A) accents
- **Enhanced Dashboard**: Real-time stats, activity feed, revenue overview, and upcoming deadlines
- **Modern Sidebar**: Collapsible sections, user profile, and logout functionality
- **Improved Header**: Global search, quick actions, notifications, and user menu
- **Professional Tables**: Enhanced data tables with filters, search, and consistent styling
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### New Pages

- ✅ **Tasks**: Advanced filtering, search, and professional table layout
- ✅ **Projects**: Card-based project view with progress tracking
- ✅ **CRM**: Sales pipeline with lead management
- ✅ **Clients**: Client directory with contact management
- ✅ **Social Media**: Content calendar and publishing management
- ✅ **Login**: Professional authentication page

## 🎨 Design System

- **Primary Color**: `#16A34A` (Green)
- **Theme**: Clean light theme
- **Typography**: Geist Sans (Inter alternative)
- **Components**: shadcn/ui with custom styling
- **Icons**: Lucide React
- **Framework**: Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, TypeScript, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: React Query (TanStack Query)
- **Authentication**: JWT with bcrypt
- **HTTP Client**: Axios

## 📁 Project Structure

```
loopli-crm/
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
├── SETUP_GUIDE.md    # Detailed setup instructions
└── docker-compose.yml
```

## 📋 Available Scripts

```bash
npm run dev          # Start all services
npm run dev:web      # Frontend only
npm run dev:api      # Backend only
npm run build        # Build all services
npm run test         # Run all tests
npm run lint         # Lint all code
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with demo data
```

## 🔧 Development

### Running Individual Services

```bash
# Frontend only
npm run dev:web

# Backend only
npm run dev:api

# Worker only
npm run dev:worker
```

### Database Management

```bash
# View and edit database
npm run prisma:studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

## 📊 Implementation Status

### Completed Features ✅

**Frontend UI (Premium Redesign):**
- ✅ Dashboard with real-time stats and activity feed
- ✅ Professional sidebar with collapsible sections
- ✅ Modern header with search and quick actions
- ✅ Tasks page with advanced filtering
- ✅ Projects page with card-based layout
- ✅ CRM page with pipeline visualization
- ✅ Clients page with contact management
- ✅ Social Media page with content management
- ✅ Login page with authentication
- ✅ Placeholder pages for all other modules

**Backend:**
- ✅ Authentication system (JWT, bcrypt)
- ✅ Task management API with full CRUD
- ✅ Role-based access control
- ✅ Organization data isolation
- ✅ Audit logging
- ✅ Complete database schema for all modules

**Infrastructure:**
- ✅ API client with axios
- ✅ React Query setup
- ✅ Mock data service for development
- ✅ Environment configuration
- ✅ Docker Compose setup

### Modules Overview

| Module | Frontend | Backend API | Database |
|--------|----------|-------------|----------|
| Dashboard | ✅ | Partial | ✅ |
| Tasks | ✅ | ✅ | ✅ |
| Projects | ✅ | ⏳ | ✅ |
| CRM | ✅ | ⏳ | ✅ |
| Clients | ✅ | ⏳ | ✅ |
| Social Media | ✅ | ⏳ | ✅ |
| Calendar | ⏳ | ⏳ | ✅ |
| Approvals | ⏳ | ⏳ | ✅ |
| Chat | ⏳ | ⏳ | ✅ |
| Meetings | ⏳ | ⏳ | ✅ |
| HR | ⏳ | ⏳ | ✅ |
| Finance | ⏳ | ⏳ | ✅ |
| Reports | ⏳ | ⏳ | ✅ |

**Legend:**
- ✅ Complete
- ⏳ In Progress / Placeholder

## 🔐 Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation with class-validator
- CORS protection
- SQL injection prevention (Prisma)
- Organization-level data isolation

## 📚 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup and configuration
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Feature implementation status
- [docs/](./docs/) - Additional documentation

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

UNLICENSED

## 🆘 Support

For support:
- Email: support@looply.com
- Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for troubleshooting
- Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for feature status
