# SPIRA — Deployment Guide

## Table of Contents

- [Architecture overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Database setup](#database-setup)
- [Building the apps](#building-the-apps)
- [Running in production](#running-in-production)
- [Reverse proxy (Nginx)](#reverse-proxy-nginx)
- [Environment checklist](#environment-checklist)
- [Health checks and readiness](#health-checks-and-readiness)
- [Rolling updates](#rolling-updates)

---

## Architecture overview

```
Internet
  └── Nginx / CDN (TLS termination)
        ├── /           →  Next.js (port 3000)
        └── /api/*      →  NestJS  (port 4000)
                              ├── PostgreSQL (managed DB recommended)
                              └── Redis      (managed cache recommended)
```

Do not run Postgres or Redis as Docker containers in production. Use a managed service (RDS, Cloud SQL, ElastiCache, Upstash, etc.) so backups, failover, and scaling are handled for you.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 22 |
| pnpm | 11 |
| PostgreSQL | 16 |
| Redis | 7 |

---

## Database setup

### 1. Create database and user

```sql
CREATE DATABASE spira;
CREATE USER spira_app WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE spira TO spira_app;
-- Postgres 15+: also grant schema privileges
\c spira
GRANT ALL ON SCHEMA public TO spira_app;
```

### 2. Run migrations

```bash
cd apps/api
DATABASE_URL="postgresql://spira_app:strong-password@host:5432/spira" \
  npx prisma migrate deploy
```

`migrate deploy` applies pending migrations without prompting — safe for CI/CD pipelines.

### 3. Seed (first deploy only)

```bash
DATABASE_URL="..." npx ts-node prisma/seed.ts
```

Skip on subsequent deploys — seed is idempotent but will create duplicate demo data if run twice.

---

## Building the apps

### API

```bash
cd apps/api
pnpm build          # outputs to dist/
pnpm prisma:generate
```

### Web

```bash
cd apps/web
pnpm build          # outputs to .next/
```

Both require the environment variables to be present at build time for the web app (`NEXT_PUBLIC_*` vars are baked in at build).

---

## Running in production

### API (Node process)

```bash
cd apps/api
NODE_ENV=production node dist/main.js
```

Use a process manager:

```bash
# PM2
pm2 start dist/main.js --name spira-api -i max

# Or systemd — see /etc/systemd/system/spira-api.service
```

### Web (Next.js)

```bash
cd apps/web
NODE_ENV=production node .next/standalone/server.js
# Or: next start -p 3000
```

---

## Reverse proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name app.spira.school;

    ssl_certificate     /etc/ssl/spira/fullchain.pem;
    ssl_certificate_key /etc/ssl/spira/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers (Helmet covers these in the API, add here for web)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # API
    location /api/ {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 10m;
    }

    # Web
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name app.spira.school;
    return 301 https://$host$request_uri;
}
```

---

## Environment checklist

Before going live, verify every value in `apps/api/.env`:

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is 48+ random hex chars (not the dev placeholder)
- [ ] `DATABASE_URL` points to production Postgres with SSL (`?sslmode=require`)
- [ ] `REDIS_URL` points to production Redis with auth (`redis://:password@host:6379`)
- [ ] `CORS_ORIGINS` is your exact production domain — no trailing slash
- [ ] `APP_URL` / `API_URL` match your production URLs
- [ ] SMTP credentials set if using email notifications
- [ ] `AI_ENABLED=false` unless generative AI is intentionally activated

---

## Health checks and readiness

```
GET /api/v1/health
```

Returns `200 OK` with `{"status":"ok","timestamp":"..."}` when the API is ready.

Configure your load balancer or container orchestrator to poll this endpoint before routing traffic to a new instance.

---

## Rolling updates

1. Build new artifacts outside the running server.
2. Run `prisma migrate deploy` against the production database — migrations are backward-compatible by design (additive only; no destructive changes without a multi-step deploy).
3. Swap the running process (PM2 reload / Kubernetes rolling update).
4. Verify `/health` returns 200 before decommissioning old instances.
