# SPIRA — School Parent Interaction & Resource Access

A production-grade school operating system connecting administration, academics, finance, parents and students in one auditable platform.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Quick Start](#quick-start)
- [Demo Accounts](#demo-accounts)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [RBAC](#rbac)
- [Modules](#modules)
- [Compliance](#compliance)
- [Further Reading](#further-reading)

---

## Overview

SPIRA is a monorepo school platform covering:

| Domain | Features |
|--------|----------|
| **Auth** | JWT access + refresh tokens, RBAC guards, audit logging |
| **Students & Staff** | Profiles, enrolment, section assignments |
| **Academics** | Courses, timetable, assignments, exams, grade scales |
| **Attendance** | Session-based marking, roster UI, period-level records |
| **Finance** | Fee plans, invoices, payments, finance dashboard |
| **Communication** | Announcements (in-app/email/SMS channels), documents |
| **Analytics** | Attendance, academic and finance reports; CSV exports |
| **AI Insights** | Attendance risk scoring, performance summaries, audit trail |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS · SWR |
| Backend | NestJS 10 · TypeScript · REST + OpenAPI (Swagger) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (HS256) · refresh-token rotation |
| Validation | class-validator · class-transformer |
| Security | Helmet · Throttler · server-side RBAC guards |
| Monorepo | pnpm workspaces |

---

## Monorepo Structure

```
spira/
├── apps/
│   ├── api/                  # NestJS REST API (port 4000)
│   │   ├── prisma/           # Schema, migrations, seed
│   │   └── src/
│   │       ├── modules/      # Feature modules (auth, students, fees, ai, …)
│   │       ├── common/       # Guards, decorators, filters, interceptors
│   │       └── config/       # PrismaModule, configuration
│   └── web/                  # Next.js 15 frontend (port 3000)
│       └── src/
│           ├── app/          # App Router pages
│           ├── components/   # Shared UI components
│           ├── hooks/        # useAuth, etc.
│           └── lib/          # API client, auth helpers
└── packages/
    └── types/                # Shared Role enum, RBAC, auth types
```

---

## Quick Start

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 22 |
| pnpm | 11 |
| Docker + Compose | 24 |

### 1. Clone and install

```bash
git clone <repo-url> spira
cd spira
pnpm install
```

### 2. Configure environment

```bash
# API
cp .env.example apps/api/.env
# Edit apps/api/.env — set JWT_SECRET to a 32+ char random string

# Web
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > apps/web/.env.local
```

### 3. Start backing services

```bash
docker compose up -d
# Postgres on :5432, Redis on :6379
```

### 4. Set up the database

```bash
pnpm db:generate   # Generate Prisma client
pnpm db:migrate    # Apply schema migrations
pnpm db:seed       # Load demo school + accounts
```

### 5. Start development servers

```bash
pnpm dev:api   # NestJS  →  http://localhost:4000
pnpm dev:web   # Next.js →  http://localhost:3000
```

### 6. Open

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Web application |
| http://localhost:4000/api/docs | OpenAPI / Swagger UI |
| http://localhost:4000/api/v1/health | Health check |

---

## Demo Accounts

All demo accounts belong to school **`spira-demo`**.

| Role | Email | Password | What they can see |
|------|-------|----------|-------------------|
| Admin | admin@spira.school | Admin@1234! | Everything |
| Principal | principal@spira.school | Principal@1234! | Academics, staff, reports, AI |
| Teacher | teacher@spira.school | Teacher@1234! | Assigned sections, attendance, assignments, exams |
| Student | ava.patel@student.spira | Student@1234! | Own timetable, results, invoices |
| Parent | parent@spira.school | Parent@1234! | Linked child's data, own invoices |
| Accountant | accountant@spira.school | Account@1234! | Fee plans, invoices, payments, finance reports |
| Counselor | counselor@spira.school | Counsel@1234! | Analytics, AI recommendations |

> Passwords satisfy: uppercase · lowercase · digit · special character.

---

## API Reference

Base URL: `http://localhost:4000/api/v1`

All endpoints except the public ones below require `Authorization: Bearer <accessToken>`.

**Public endpoints**

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Obtain access + refresh tokens |
| POST | /auth/refresh | Rotate refresh token |
| GET | /health | Liveness check |

**Module prefixes**

| Prefix | Module |
|--------|--------|
| /students | Student profiles |
| /staff | Staff profiles |
| /attendance | Attendance sessions + records |
| /timetable | Timetable slots |
| /courses | Courses + offerings |
| /assignments | Assignments + submissions |
| /exams | Exams + results |
| /grade-scales | Grade scale bands |
| /fees | Fee plans, invoices, payments |
| /announcements | School announcements |
| /documents | Document repository |
| /analytics | Reports + KPI overview |
| /ai | Insights, recommendations, audit |

Full interactive docs at **`/api/docs`**.

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.

Critical variables that **must** be changed before production:

| Variable | Notes |
|----------|-------|
| `JWT_SECRET` | Min 32 chars, randomly generated |
| `DATABASE_URL` | Point to production Postgres |
| `REDIS_URL` | Point to production Redis |
| `CORS_ORIGINS` | Set to your actual domain |
| `NODE_ENV` | Set to `production` |

---

## RBAC

Access control is enforced **server-side** on every route via NestJS `RolesGuard`. There is no trust placed in frontend role checks.

| Role | Key permissions |
|------|----------------|
| ADMIN | All operations across the school |
| PRINCIPAL | Academics, staff oversight, analytics, AI insights |
| TEACHER | Assigned sections: attendance, assignments, exams |
| STUDENT | Read own records: timetable, results, invoices |
| PARENT | Read linked child's records + own invoices |
| ACCOUNTANT | Fee management, finance reports |
| COUNSELOR | Analytics, AI recommendations (read-only) |

`schoolId` is always injected from the JWT — never trusted from the request body.

---

## Modules

### Auth (`/auth`)
JWT HS256 access tokens (15 min) + refresh tokens (7 days). Token hashes stored in DB. Rotation on every refresh. Full audit log on login events.

### Students (`/students`)
Student profiles with section assignment, admission number, enrolment status. School-scoped.

### Staff (`/staff`)
Staff profiles with employee number, designation, department. Links to CourseOfferings and AttendanceSessions.

### Attendance (`/attendance`)
Session-based: open → roster → bulk-submit → lock. Period-level granularity. Present / Absent / Late statuses.

### Timetable (`/timetable`)
Week-grid (Mon–Fri × P1–P8) per section per term. Course-offering-aware slots.

### Courses (`/courses`)
Course catalogue + per-term offerings (section × teacher). Supports multiple terms.

### Assignments (`/assignments`)
Published/draft assignments per course offering. Per-student submissions with grade and feedback.

### Exams (`/exams`)
Exam records per offering. Published results with marks, grade, remarks. Grade scales per grade level.

### Fees (`/fees`)
Fee plans → invoices → payments. Multi-method payment recording. Finance dashboard with collection stats.

### Announcements (`/announcements`)
In-app / email / SMS channels. Audience scoping (school / section / role). Expiry date support.

### Documents (`/documents`)
Categorised file metadata (storage key only — no actual file upload in dev). Legal hold + retention labels.

### Analytics (`/analytics`)
- `GET /analytics/overview` — admin KPIs
- `GET /analytics/attendance` — session-level presence rates
- `GET /analytics/academic` — exam averages per course
- `GET /analytics/finance` — monthly collection
- CSV export on all three reports

### AI Insights (`/ai`)
Rule-based scoring (no external LLM required):
- Attendance risk: 30-day window, high/medium/low bands
- Performance summary: avg exam score narrative
- All runs write to `AuditLog`. Results stored in `AiRecommendation`.

---

## Compliance

| Standard | Implementation |
|----------|---------------|
| **FERPA** | Role-scoped data access, disclosure via audit log, `legalHold` flag on documents |
| **GDPR** | Data minimisation, retention labels, deletion-ready schema, no PII in audit metadata |
| **WCAG 2.2 AA** | Keyboard navigation, visible focus rings, `aria-*` labels, accessible login |
| **OWASP Top 10** | Server-side auth on every route, input validation (class-validator), Helmet headers, throttling, no raw SQL |

---

## Further Reading

- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security & RBAC Checklist](docs/SECURITY.md)
- [E2E Smoke Test Plan](docs/SMOKE_TESTS.md)
- [Production Hardening Checklist](docs/PRODUCTION.md)
