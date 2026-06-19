# SPIRA — Production Hardening Checklist

Work through this list before the first production launch and revisit quarterly.

---

## Infrastructure

- [ ] PostgreSQL is a managed service (RDS, Cloud SQL, Supabase, Neon) — not a container
- [ ] Redis is a managed service (ElastiCache, Upstash, Redis Cloud) — not a container
- [ ] Both databases are in the same region / VPC as the application servers
- [ ] Application servers cannot be reached directly — traffic goes through a load balancer or reverse proxy
- [ ] SSH access to servers is key-only, on a non-standard port, and limited to a bastion host
- [ ] Automated daily backups configured for PostgreSQL with point-in-time recovery enabled
- [ ] Redis persistence configured (`appendonly yes` or scheduled RDB snapshots)

## TLS / Certificates

- [ ] TLS certificate from a trusted CA (Let's Encrypt via Certbot, or ACM on AWS)
- [ ] Auto-renewal configured — alert on cert expiry < 30 days
- [ ] TLS 1.0 and 1.1 disabled at the reverse proxy
- [ ] HSTS header with `max-age=63072000; includeSubDomains; preload`

## Application

- [ ] `NODE_ENV=production` set in the API process environment
- [ ] `JWT_SECRET` is 48+ random hex chars — confirmed different from dev value
- [ ] Debug-level logging disabled in production
- [ ] Swagger UI (`/api/docs`) is disabled or IP-restricted in production

  ```typescript
  // In main.ts — gate Swagger behind NODE_ENV check
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }
  ```

- [ ] Stack traces are not returned in API error responses (`HttpExceptionFilter` strips them)
- [ ] Rate limiting tuned — default is 100 req / 60 s; adjust per endpoint under load
- [ ] File upload size limits set in Nginx (`client_max_body_size`) and NestJS

## Database

- [ ] Prisma migrations applied with `prisma migrate deploy` (not `migrate dev`)
- [ ] Database user has only the minimum required privileges — no superuser
- [ ] Connection string uses `?sslmode=require` for encrypted connections
- [ ] Connection pool size tuned for expected concurrency (`connection_limit` in DATABASE_URL)
- [ ] Slow query logging enabled in Postgres (`log_min_duration_statement = 500`)
- [ ] `AuditLog` table has a retention policy — archive or prune rows older than 2 years

## Secrets

- [ ] All secrets injected via environment variables — not present in Docker images or source code
- [ ] Secret scanning configured in CI (e.g. GitHub Secret Scanning, `gitleaks`)
- [ ] Rotation procedure documented: JWT_SECRET rotation requires all existing sessions to be invalidated (delete all `refresh_token` rows)

## CI/CD

- [ ] `pnpm install --frozen-lockfile` used in CI to prevent lock file drift
- [ ] `pnpm typecheck` and `pnpm lint` run in CI — pipeline fails on error
- [ ] `prisma migrate deploy` runs as a pre-deploy step, not post-deploy
- [ ] Canary or blue-green deployment strategy used to reduce downtime
- [ ] Rollback procedure documented — tested at least once before launch

## Observability

- [ ] Structured JSON logging configured (e.g. Pino with `pino-pretty` disabled in prod)
- [ ] Log aggregation configured (Datadog, Grafana Loki, CloudWatch, etc.)
- [ ] Alerts set for:
  - API error rate > 1% over 5 minutes
  - Database connection pool exhaustion
  - Redis connection failures
  - Disk usage > 80% on database server
- [ ] `/api/v1/health` polled every 30 seconds by uptime monitor
- [ ] Latency p95 baseline established — alert if it regresses > 2×

## FERPA / GDPR Readiness

- [ ] Data Processing Agreement (DPA) signed with all third-party services that handle student data (storage, email, AI providers)
- [ ] Student data does not leave the country of operation without explicit consent, unless the AI provider has an appropriate DPA
- [ ] Deletion request workflow documented — how to purge a student's data across all tables
- [ ] `Document.legalHold` checked before any deletion — legal hold blocks delete
- [ ] Retention schedule defined for each data type (e.g. attendance records: 5 years, exam results: 7 years)
- [ ] Audit logs (`AuditLog`) retained for at least 1 year
- [ ] Parent or student can request an export of their data — export procedure documented

## Capacity Planning

- [ ] Load tested at 2× expected peak concurrent users before launch
- [ ] Database index review done — check `EXPLAIN ANALYZE` on the top 10 queries
- [ ] Prisma connection pool sized correctly for the number of API replicas:
  `connection_limit ≈ (max_db_connections / api_replica_count) - 5`
- [ ] Redis maxmemory set and eviction policy chosen (`allkeys-lru` for cache workloads)

## Checklist sign-off

| Area | Reviewer | Date | Notes |
|------|----------|------|-------|
| Infrastructure | | | |
| TLS / Security | | | |
| Application | | | |
| Database | | | |
| CI/CD | | | |
| Observability | | | |
| Compliance | | | |
