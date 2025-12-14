# DOT Copilot

A production-ready full-stack training management application converted from Bubble.io to React + TypeScript.

## Features

- **User Authentication**: JWT-based login with refresh tokens, password hashing (bcrypt), role-based access control
- **Driver Dashboard**: View assignments, training progress, and notifications
- **Supervisor Dashboard**: Manage fleets, users, and view team progress
- **Training Builder**: Create and manage training programs, modules, and lessons
- **Quiz System**: Quiz questions with automatic scoring
- **User Management**: Full CRUD operations with role-based permissions
- **File Storage**: S3-compatible file upload for training materials
- **Email Notifications**: Password reset, assignment notifications, completion certificates

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- React Router v7
- Zustand (state management)
- Axios (HTTP client)
- Vitest + Testing Library (testing)

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication with refresh tokens
- Zod validation
- Winston logging
- Sentry error tracking
- Rate limiting with express-rate-limit
- Helmet.js security headers

## Project Structure

```
DOT-Copilot/
├── frontend/                # React + TypeScript application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── store/         # Zustand state stores
│   │   ├── types/         # TypeScript interfaces
│   │   └── __tests__/     # Frontend tests
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                # Express.js API server
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Auth, logging middleware
│   │   ├── services/      # Email, storage, logging
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── utils/         # JWT, password utilities
│   │   └── config/        # Environment configuration
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Database seeder
│   ├── __tests__/         # Backend tests
│   └── Dockerfile
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── parser/                 # Bubble.io JSON parser
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- npm

### Quick Start with Docker

```bash
# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Set up database
cd backend
cp .env.example .env  # Edit with your settings
npx prisma migrate dev
npx prisma db seed

# Start development servers
npm run dev  # In backend folder
npm run dev  # In frontend folder (separate terminal)
```

### Manual Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd DOT-Copilot

cd backend && npm install
cd ../frontend && npm install
```

2. **Configure environment:**

Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dot_copilot?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

3. **Set up database:**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

4. **Start servers:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

5. **Open browser:** http://localhost:5173

## Test Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123456 |
| Supervisor | supervisor@example.com | supervisor123 |
| Driver | driver@example.com | driver123456 |

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/register` | POST | Register new user |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/reset-password` | POST | Request password reset |

### Resources

All endpoints require authentication (Bearer token).

| Resource | Endpoints | Roles |
|----------|-----------|-------|
| Users | GET, POST, PUT, DELETE `/api/users` | Admin, Supervisor |
| Fleets | GET, POST, PUT, DELETE `/api/fleets` | Admin |
| Training Programs | GET, POST, PUT, DELETE `/api/training-programs` | Admin, Supervisor |
| Modules | GET, POST, PUT, DELETE `/api/modules` | Admin, Supervisor |
| Lessons | GET, POST, PUT, DELETE `/api/lessons` | Admin, Supervisor |
| Assignments | GET, POST, PUT, DELETE `/api/assignments` | Admin, Supervisor |
| Notifications | GET `/api/notifications` | All authenticated |
| Quizzes | GET, POST `/api/quizzes` | All authenticated |
| Uploads | POST, GET, DELETE `/api/uploads` | Admin, Supervisor |

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `/health` | Basic health status |
| `/health/ready` | Readiness check (database) |
| `/health/live` | Liveness check |

## Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage
```

## Deployment

### Docker

```bash
# Build and run all services
docker compose up --build

# Production deployment
docker compose -f docker-compose.yml up -d
```

### CI/CD

GitHub Actions workflows are included for:
- Linting and testing on PR
- Docker image building
- Deployment to staging/production

Configure these secrets in GitHub:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `VERCEL_TOKEN` (for frontend)
- `RAILWAY_TOKEN` (for backend)

## Production Checklist

- [ ] Set strong JWT secrets (32+ characters)
- [ ] Configure production DATABASE_URL
- [ ] Set up SSL/TLS
- [ ] Configure CORS for production domain
- [ ] Set up Sentry DSN for error tracking
- [ ] Configure email service (SMTP)
- [ ] Set up S3 bucket for file storage
- [ ] Enable database backups
- [ ] Configure log aggregation

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret (32+ chars) |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `FRONTEND_URL` | No | CORS origin (default: http://localhost:5173) |
| `SMTP_HOST` | No | Email server host |
| `SMTP_PORT` | No | Email server port |
| `SMTP_USER` | No | Email username |
| `SMTP_PASS` | No | Email password |
| `AWS_ACCESS_KEY_ID` | No | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | No | S3 secret key |
| `AWS_S3_BUCKET` | No | S3 bucket name |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | API URL (default: http://localhost:3001/api) |

## License

ISC
