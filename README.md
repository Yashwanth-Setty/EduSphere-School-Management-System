# SPIRA — School Parent Interaction & Resource Access

A production-grade school operating system connecting administration, academics, finance, parents and students.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS |
| Backend | NestJS · TypeScript · REST + OpenAPI |
| Database | PostgreSQL (via Prisma ORM) |
| Cache/Queue | Redis |
| Auth | JWT · OIDC/OAuth 2.0 · PKCE |
| RBAC | Server-enforced guards |
| Observability | OpenTelemetry (planned) |

## Monorepo Structure

```
spira/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   ├── api/          # NestJS backend
│   └── worker/       # Background jobs (planned)
├── packages/
│   ├── types/        # Shared TypeScript types & RBAC contracts
│   └── config/       # Shared config helpers
├── docker-compose.yml
└── prisma/
    └── schema.prisma
```

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm 11+
- Docker + Docker Compose

### 1. Start services

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up database

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed demo data
```

### 4. Start development servers

```bash
pnpm dev:api   # NestJS on http://localhost:4000
pnpm dev:web   # Next.js on http://localhost:3000
```

### 5. Open the app

- Web app: http://localhost:3000
- API docs (OpenAPI): http://localhost:4000/api/docs

## Demo Accounts

All accounts use school code: `spira-demo`

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@spira.school | Admin@1234! |
| Principal | principal@spira.school | Principal@1234! |
| Teacher | teacher@spira.school | Teacher@1234! |
| Student | ava.patel@student.spira | Student@1234! |
| Parent | parent@spira.school | Parent@1234! |
| Accountant | accountant@spira.school | Account@1234! |
| Counselor | counselor@spira.school | Counsel@1234! |

## RBAC

Role-based access control is enforced server-side via NestJS guards. No UI-only hiding.

| Role | Scope |
|------|-------|
| Admin | Full school operations |
| Principal | Academic oversight & approvals |
| Teacher | Assigned sections & courses |
| Student | Self only |
| Parent | Linked children only |
| Accountant | Finance records |
| Counselor | Referred students (welfare notes restricted) |

## API

Base URL: `http://localhost:4000/api/v1`

OpenAPI docs: `http://localhost:4000/api/docs`

All endpoints except `/auth/login`, `/auth/refresh`, and `/health` require `Authorization: Bearer <token>`.

## Environment Variables

See `.env.example` for all required and optional variables. Copy to `apps/api/.env` and `apps/web/.env.local`.

## Compliance

- **FERPA**: Student record access controls, disclosure logs, amendment request support
- **GDPR**: Data minimization, retention schedules, legal hold, deletion workflows  
- **WCAG 2.2 AA**: Keyboard navigation, visible focus, accessible authentication, screen-reader labels
- **OWASP**: Server-side authorization on every route, audit logging, HTTPS/helmet, input validation
