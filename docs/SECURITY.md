# SPIRA — Security & RBAC Checklist

Use this checklist before every production deployment and as a quarterly review reference.

---

## Authentication

- [ ] `JWT_SECRET` is at least 48 random hex characters — generated with `crypto.randomBytes(48)`
- [ ] Access token TTL is ≤ 15 minutes (`JWT_ACCESS_EXPIRES=900`)
- [ ] Refresh token TTL is ≤ 7 days (`JWT_REFRESH_EXPIRES=604800`)
- [ ] Refresh token is rotated on every use — old token hash is replaced in DB
- [ ] Compromised tokens can be revoked by deleting their `refresh_token` row
- [ ] Login endpoint is rate-limited (ThrottlerModule: 100 req / 60 s per IP)
- [ ] `POST /auth/logout` deletes the refresh token row from the database
- [ ] Passwords are hashed with bcrypt (cost factor ≥ 10)
- [ ] No passwords or token secrets appear in logs or audit metadata

## Authorisation (RBAC)

- [ ] Every protected route is decorated with `@Roles(...)` — no unguarded endpoints except `/auth/*` and `/health`
- [ ] `RolesGuard` is applied globally or per-controller — not just per-method
- [ ] `schoolId` is always read from `CurrentUser()` (JWT claim) — never from the request body or query string
- [ ] Parent and student endpoints use `userId → profile → schoolId` chaining rather than accepting a `schoolId` parameter
- [ ] No client-side role check is the sole gatekeeper for any action

### Per-role scope verification

| Role | Verified |
|------|---------|
| ADMIN — can access all modules | [ ] |
| PRINCIPAL — blocked from finance create/delete | [ ] |
| TEACHER — cannot see other teachers' rosters | [ ] |
| STUDENT — can only read own profile, results, invoices | [ ] |
| PARENT — limited to linked children's records | [ ] |
| ACCOUNTANT — no access to academic or attendance data | [ ] |
| COUNSELOR — read-only on analytics and AI insights | [ ] |

## Transport & Headers

- [ ] TLS 1.2+ enforced at the reverse proxy (see `docs/DEPLOYMENT.md`)
- [ ] HTTP redirected to HTTPS (301)
- [ ] `Strict-Transport-Security` header present and max-age ≥ 1 year
- [ ] Helmet middleware active on the NestJS app (`app.use(helmet())`)
- [ ] Helmet sets: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- [ ] `Content-Security-Policy` header configured for the frontend
- [ ] CORS `origin` allowlist contains only the production domain — no wildcards

## Input Validation

- [ ] `ValidationPipe` is global with `whitelist: true` and `forbidNonWhitelisted: true`
- [ ] All DTOs use class-validator decorators — no unvalidated `any` accepted from clients
- [ ] File uploads are validated for MIME type and size before storage
- [ ] Prisma parameterised queries used throughout — no raw SQL string interpolation

## Data Access

- [ ] No student PII is returned in list endpoints beyond name + admission number
- [ ] `AuditLog` is written for every create/update/delete of sensitive records
- [ ] `AuditLog.metadata` does not contain passwords, tokens, or raw PII
- [ ] Legal hold prevents deletion of flagged documents (`Document.legalHold = true`)
- [ ] Soft-delete pattern used for documents (`Document.isDeleted`) — hard delete only via admin command

## Secrets Management

- [ ] No secrets in source code or committed `.env` files
- [ ] `.env.example` contains only placeholder values
- [ ] Production secrets are stored in a secrets manager (AWS Secrets Manager / Vault / GCP Secret Manager)
- [ ] Secret rotation procedure documented in your runbook
- [ ] CI/CD pipeline uses injected environment variables — not committed secrets

## Dependencies

- [ ] `pnpm audit` passes with no high/critical vulnerabilities
- [ ] Dependabot or Renovate configured for automated dependency updates
- [ ] `node_modules` not committed to source control
- [ ] Lock file (`pnpm-lock.yaml`) committed and used in CI

## Logging & Monitoring

- [ ] Structured JSON logs in production (`NODE_ENV=production`)
- [ ] Log level is `warn` or `error` in production — not `verbose`
- [ ] No PII logged (emails, names, IP addresses only in audit table — not application logs)
- [ ] `/health` endpoint monitored by uptime checker
- [ ] Database connection pool errors trigger alerts
- [ ] `401` / `403` spike alerts configured to detect credential stuffing

## AI Insights

- [ ] AI run endpoints restricted to ADMIN and PRINCIPAL only
- [ ] Every AI run writes to `AuditLog` with actor userId
- [ ] `AiRecommendation.featureFlag` is set to `"ai_insights"` — can be disabled by filtering
- [ ] No student data is sent to an external LLM without explicit consent (`AI_ENABLED=false` by default)
- [ ] If generative AI is enabled, data processing agreement with the AI provider is in place
