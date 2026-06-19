# SPIRA — E2E Smoke Test Plan

Run these checks after every deployment to verify the golden paths work end-to-end. They are not a substitute for unit tests — they confirm that the system is wired together correctly in a real environment.

**Accounts used**: the demo seed accounts (see README § Demo Accounts).  
**Environment**: staging or production with seed data loaded.  
**Tool**: manual browser + curl, or Playwright / Cypress targeting the live URL.

---

## 1. Health & Connectivity

| # | Step | Expected |
|---|------|---------|
| 1.1 | `GET /api/v1/health` | `200 {"status":"ok"}` |
| 1.2 | Open `http://APP_URL` | Login page loads, no JS errors in console |
| 1.3 | Open `/api/docs` | Swagger UI loads with all tags visible |

---

## 2. Authentication

| # | Step | Expected |
|---|------|---------|
| 2.1 | POST `/auth/login` with `admin@spira.school` / `Admin@1234!` | `200` with `accessToken` + `refreshToken` |
| 2.2 | POST `/auth/login` with wrong password | `401` |
| 2.3 | GET `/students` with no token | `401` |
| 2.4 | POST `/auth/refresh` with valid refreshToken | `200` with new token pair |
| 2.5 | Login via browser as Admin, observe redirect to `/dashboard` | Dashboard KPI cards load |
| 2.6 | Reload browser — session persists (token in cookie/storage) | Still logged in |

---

## 3. RBAC Enforcement

| # | Step | Expected |
|---|------|---------|
| 3.1 | Login as **Student** (`ava.patel@student.spira`), visit `/analytics` | Redirected or `403` |
| 3.2 | As **Student**, `GET /fees/plans` | `403` |
| 3.3 | As **Parent**, `GET /attendance/sessions` | `403` |
| 3.4 | As **Teacher**, `DELETE /students/{id}` | `403` |
| 3.5 | As **Accountant**, `POST /ai/run/attendance-risk` | `403` |

---

## 4. Students Module

| # | Step | Expected |
|---|------|---------|
| 4.1 | As Admin, `GET /students` | Returns paginated list with at least 1 student |
| 4.2 | Navigate to `/students` in browser | Student rows displayed |

---

## 5. Attendance Module

| # | Step | Expected |
|---|------|---------|
| 5.1 | As Admin, `GET /attendance/sessions` | Returns session list |
| 5.2 | As Teacher, open `/attendance/new`, create session for section 8-A | Session created, redirect to roster |
| 5.3 | On roster page, mark all present, click Submit | Session locked, `submittedAt` set |

---

## 6. Courses & Timetable

| # | Step | Expected |
|---|------|---------|
| 6.1 | `GET /courses` | List of courses returned |
| 6.2 | `GET /timetable/sections` | Section list returned |
| 6.3 | Visit `/timetable` as Teacher, select section 8-A | Week grid renders without error |

---

## 7. Academics (Assignments + Exams)

| # | Step | Expected |
|---|------|---------|
| 7.1 | `GET /assignments` as Teacher | Assignment list returned |
| 7.2 | `GET /exams` as Principal | Exam list returned |
| 7.3 | As Student, visit `/exams` | Can see published results for own section |
| 7.4 | As Teacher, visit `/exams/new` and create exam | Exam record created |

---

## 8. Fees Module

| # | Step | Expected |
|---|------|---------|
| 8.1 | As Accountant, `GET /fees/plans` | Fee plan list returned |
| 8.2 | Visit `/fees/dashboard` | KPI cards (total, paid, pending, overdue) render |
| 8.3 | As Student, `GET /fees/my-invoices` | Returns only own invoices |
| 8.4 | As Accountant, record a payment on an open invoice | Invoice `status` becomes `paid` or `partial` |

---

## 9. Announcements & Documents

| # | Step | Expected |
|---|------|---------|
| 9.1 | As Admin, create announcement, set `isPublished: true` | `201` returned |
| 9.2 | As Teacher, `GET /announcements` | Published announcement visible |
| 9.3 | As Admin, `POST /documents` with metadata | Document record created |
| 9.4 | As Student, `GET /documents` | Returns only school-scoped visible documents |

---

## 10. Analytics

| # | Step | Expected |
|---|------|---------|
| 10.1 | `GET /analytics/overview` as Admin | Returns 6 KPI fields without error |
| 10.2 | Visit `/analytics` in browser as Admin | KPI cards populate from API |
| 10.3 | `GET /analytics/attendance?from=2026-01-01&to=2026-12-31` | Returns rows + summary |
| 10.4 | Visit `/analytics/attendance` and click "Export CSV" | CSV file downloads |
| 10.5 | `GET /analytics/finance` as Accountant | Monthly rows returned |

---

## 11. AI Insights

| # | Step | Expected |
|---|------|---------|
| 11.1 | As Admin, visit `/ai` | Hub page renders, two Run buttons visible |
| 11.2 | Click "Run Now" on Attendance Risk | Response shows `{ processed, created }` |
| 11.3 | `GET /ai/recommendations` | Returns list (may be empty if < 5 sessions per student) |
| 11.4 | `GET /ai/audit-logs` | Shows the run just performed with actor name |
| 11.5 | As Counselor, `POST /ai/run/attendance-risk` | `403` Forbidden |

---

## 12. End-to-End User Journeys

### 12.A: Teacher marks attendance

1. Login as `teacher@spira.school`
2. Navigate to `/attendance/new`
3. Create session (section 8-A, today, period 1)
4. Mark 3 students present, 1 absent
5. Submit → session locked
6. Navigate to `/attendance` → session shows in list

### 12.B: Student checks results

1. Login as `ava.patel@student.spira`
2. Navigate to `/exams`
3. Verify own results visible
4. Navigate to `/fees` → own invoices visible
5. Attempt to navigate to `/analytics` → access denied (redirect or 403)

### 12.C: Admin runs AI + checks dashboard

1. Login as `admin@spira.school`
2. Navigate to `/ai`, run both Attendance Risk and Performance Summary
3. Navigate to `/ai/recommendations` → rows appear
4. Navigate to `/ai/audit` → both run entries appear
5. Navigate to `/dashboard` → KPI cards show live counts

---

## Pass / Fail Criteria

All items in sections 1–11 must return expected results. Journey tests 12.A–12.C must complete without unexpected errors or empty screens. Any `500` response or JS console error is a blocking failure.
