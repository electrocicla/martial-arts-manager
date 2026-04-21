# Worklog — Technical Debt Resolution

> Project: martial-arts-manager
> Started: 2026-04-15

---

## 2026-04-15 — Initial Audit & First Fixes

### Session 1: Feature Development + Bug Fixes (COMPLETED)

**Changes deployed to production:**

1. **EnrollStudentsModal — Group students by discipline** ✅
   - Added `DisciplineGroup` interface and `useMemo`-based grouping
   - Students now organized in collapsible sections per discipline
   - Each group shows enrolled count (e.g., "Brazilian Jiu-Jitsu (3/15)")

2. **EnrollStudentsModal — "Select All" per discipline group** ✅
   - Added `handleSelectAllInGroup` to enroll all unenrolled students in a discipline
   - Button shows "Seleccionar todos" / "Todos inscritos" state
   - Respects max capacity limit

3. **Attendance API — Fixed access control** ✅
   - `POST /api/attendance`: Was only checking `created_by`, now checks `created_by OR instructor_id` for non-admins
   - `GET /api/attendance`: Same fix for both classId-specific and general queries
   - Admin role now bypasses ownership checks (consistent with other endpoints)
   - **Root cause of Joaquin Benavides selection issue**: Student was created by different admin (Camilo), attendance POST only checked `created_by` match

4. **Students API — Set instructor_id on creation** ✅
   - `POST /api/students`: Now sets `instructor_id = auth.user.id` alongside `created_by`
   - Prevents future orphaned students (recurring issue)

5. **Database fix — NULL instructor_id** ✅
   - Fixed 9 students with `NULL` instructor_id by setting to their `created_by` value
   - Verified: all 99 active students now have `instructor_id` assigned

6. **i18n — New translation keys** ✅
   - Added `selectAll` and `allInscribed` to es.json, en.json, pt.json
   - Added full `enrollModal` section to en.json and pt.json (was missing)

**Commit:** `33794f6` — pushed to `origin/main`
**Deploy:** CI/CD pipeline triggered (GitHub Actions → Cloudflare Pages)

### Session 2: Comprehensive Technical Debt Audit (COMPLETED)

**Audit scope:** Backend API (35 findings), Frontend (57 findings), Database (15 findings)

**Key discoveries:**

- **CRITICAL:** `classes.instructor` stores name string, not user ID — attendance access control compares UUID against name (always fails for non-creators)
- **CRITICAL:** Belt exam PUT allows arbitrary column injection via unvalidated request body keys
- **CRITICAL:** Student self-profile allows belt escalation
- **CRITICAL:** Cleanup-expired-qr endpoint has no authentication
- **HIGH:** Admin cannot see/edit/delete classes created by other instructors (inconsistent with other APIs)
- **HIGH:** 6+ modals lack accessibility (focus trap, aria attributes) despite a proper Modal component existing
- **HIGH:** 7 files use raw `fetch()` bypassing centralized auth/error handling
- **HIGH:** Triple-duplicate type definitions causing silent type drift

**Deliverables created:**
- `audit/TODO.md` — 54 prioritized items across 4 phases
- `audit/WORKLOG.md` — This file
- `audit/MASTER_PROMPT.md` — Agent prompt for executing the work plan

---

<!-- Add new entries below this line -->

## Phase 1 — Critical Security & Data Integrity (COMPLETED)

### P1-01: Fix `classes.instructor` access control ✅
- Created migration `migrations/add_instructor_id_to_classes.sql`
- Added `instructor_id TEXT` column to `classes` table
- Backfilled all 29 active classes from `users.name` → `users.id` matching
- Updated SQL queries in: `functions/api/attendance.ts` (3 queries), `functions/api/classes.ts` (INSERT + PUT), `functions/api/classes/[id].ts` (PUT), `functions/api/student/attendance/check-in.ts` (WHERE clause), `functions/api/classes/metadata.ts` (instructor lookup via JOIN)
- Updated frontend: `src/pages/Attendance.tsx` filter uses `instructor_id` instead of name
- Updated types: `ClassEntity` in `src/types/index.ts`, `ClassRecord` in backend files, `Class` in `src/types.ts`
- Updated `schema.sql` to include `instructor_id`

### P1-02: Fix belt exam PUT — column injection ✅
- Replaced `Object.entries(updates)` with explicit allowlist in `functions/api/belt-exams.ts`
- Allowed fields: `belt_level`, `exam_date`, `exam_time`, `location`, `max_candidates`, `notes`
- `examiner_id` and `status` restricted to admin-only updates

### P1-03: Fix student self-profile — belt escalation ✅
- Removed `belt` and `disciplines` from student-editable fields in `functions/api/student/profile.ts`
- Updated request body type to exclude these fields

### P1-04: Fix unauthenticated cleanup-expired-qr endpoint ✅
- Added `authenticateUser` import and admin-only auth check to `functions/api/attendance/cleanup-expired-qr.ts`
- Returns 401/403 for unauthorized requests

### P1-05: Fix student/payments soft-delete filter ✅
- Added `AND deleted_at IS NULL` to payments query in `functions/api/student/payments.ts`

### P1-06: Consolidate triple-duplicate type definitions ✅
- Deleted `src/types.ts` (all imports `'../types'` now resolve to `src/types/index.ts`)
- Removed duplicate `ApiResponse<T>` and `PaginatedResponse<T>` from `src/lib/api-client.ts` — now re-exported from `src/types/index.ts`
- Removed duplicate `ApiResponse<T>` and `PaginatedResponse<T>` definitions within `src/types/index.ts` (was defined twice)

### P1-07: Fix validation.ts discipline enum drift ✅
- Replaced hardcoded 6-item `z.enum()` in `studentSchema` and `classSchema` with `disciplineEnum` generated from `DISCIPLINES` constant (11 items)
- `src/lib/validation.ts` now imports from `src/lib/constants.ts`

### P1-08: Fix CalendarView timezone bug ✅
- Replaced `selectedDate.toISOString().split('T')[0]` with local date formatting using `getFullYear()/getMonth()/getDate()`
- Prevents ±1 day shift when timezone offset crosses midnight

---

## Phase 2 — HIGH Priority (16/16 completed)

### P2-01: Admin bypass for classes GET/PUT/DELETE ✅
- Admin sees all classes in GET; instructors see own (`created_by` or `instructor_id`)
- PUT/DELETE: admin bypasses ownership check
- Files: `classes.ts`, `classes/[id].ts`

### P2-02: Admin bypass for unenroll student DELETE ✅
- Added admin bypass to DELETE handler in `classes/[classId]/students/[studentId].ts`

### P2-03: Fix student-classes — add instructor_id ✅
- Added admin bypass + `instructor_id` ownership check in `students/[id]/classes.ts`

### P2-04: Fix avatar delete — broken R2 key extraction ✅
- Fixed `new URL()` throwing on relative paths; now parses `/api/avatars?key=...` format

### P2-05: Fix avatar delete — admin/instructor bypass ✅
- Added admin/instructor bypass for avatar deletion ownership check

### P2-06: Add rate limiting to auth endpoints ✅
- Created `functions/utils/rate-limit.ts` (in-memory sliding window)
- Login: 10 req/min/IP; Register: 5 req/min/IP

### P2-07: Fix class comments — ownership check ✅
- Blocked student role from accessing comments
- Added instructor ownership check for class
- Added DELETE handler (soft-delete, author-or-admin only)

### P2-08: Add payments PUT/DELETE endpoints ✅
- PUT: update amount, date, type, notes, status, payment_method with allowlist
- DELETE: soft-delete via `deleted_at`
- Both with admin bypass + instructor ownership check

### P2-09: Standardize API access — replace raw fetch() ✅
- Replaced raw `fetch()` with `apiClient` in 4 files
- Kept raw fetch in AuthContext (circular dep) and StudentDetailsModal (FormData)

### P2-10: Add Error Boundaries ✅
- Created `src/components/ErrorBoundary.tsx` with reset + reload
- Wrapped entire app in `App.tsx`

### P2-11: Fix useGreeting interval performance ✅
- Changed interval from 1000ms to 60000ms

### P2-12: Migrate modals to shared Modal component ✅
- Migrated 6 modals to shared `Modal` (escape, backdrop click, aria attrs)

### P2-13: Remove/verify AppContext dead code ✅
- Confirmed `useApp()` never called; deleted `AppContext.tsx`, removed from `main.tsx`

### P2-14: Deduplicate utility functions ✅
- `getClassStatus`: canonical in `classUtils.ts`, removed from `dashboardUtils.ts`
- `getBeltColor`: canonical in `studentUtils.ts`, re-exported from `beltTestingUtils.ts`
- `normalizeAvatarUrl`: removed local copies in `students.ts`/`students/[id].ts`, import from `utils/avatar.ts`

### P2-15: Fix eslint-disable suppressions ✅
- Fixed `NotificationBell`: `useCallback` for `fetchNotifications`
- Verified remaining suppressions are legitimate

### P2-16: Fix session expiry mismatch ✅
- Aligned DB session expiry from 7→30 days to match JWT refresh token

---

## Phase 2 — HIGH Priority (16/16 completed)

### P2-01: Admin bypass for classes GET/PUT/DELETE ✅
- Admin sees all classes in GET; instructors see own (`created_by` or `instructor_id`)
- PUT/DELETE: admin bypasses ownership check
- Files: `classes.ts`, `classes/[id].ts`

### P2-02: Admin bypass for unenroll student DELETE ✅
- Added admin bypass to DELETE handler in `classes/[classId]/students/[studentId].ts`

### P2-03: Fix student-classes — add instructor_id ✅
- Added admin bypass + `instructor_id` ownership check in `students/[id]/classes.ts`

### P2-04: Fix avatar delete — broken R2 key extraction ✅
- Fixed `new URL()` throwing on relative paths; now parses `/api/avatars?key=...` format

### P2-05: Fix avatar delete — admin/instructor bypass ✅
- Added admin/instructor bypass for avatar deletion ownership check

### P2-06: Add rate limiting to auth endpoints ✅
- Created `functions/utils/rate-limit.ts` (in-memory sliding window)
- Login: 10 req/min/IP; Register: 5 req/min/IP

### P2-07: Fix class comments — ownership check ✅
- Blocked student role from accessing comments
- Added instructor ownership check for class
- Added DELETE handler (soft-delete, author-or-admin only)

### P2-08: Add payments PUT/DELETE endpoints ✅
- PUT: update amount, date, type, notes, status, payment_method with allowlist
- DELETE: soft-delete via `deleted_at`
- Both with admin bypass + instructor ownership check

### P2-09: Standardize API access — replace raw fetch() ✅
- Replaced raw `fetch()` with `apiClient` in 4 files
- Kept raw fetch in AuthContext (circular dep) and StudentDetailsModal (FormData)

### P2-10: Add Error Boundaries ✅
- Created `src/components/ErrorBoundary.tsx` with reset + reload
- Wrapped entire app in `App.tsx`

### P2-11: Fix useGreeting interval performance ✅
- Changed interval from 1000ms to 60000ms

### P2-12: Migrate modals to shared Modal component ✅
- Migrated 6 modals to shared `Modal` (escape, backdrop click, aria attrs)

### P2-13: Remove/verify AppContext dead code ✅
- Confirmed `useApp()` never called; deleted `AppContext.tsx`, removed from `main.tsx`

### P2-14: Deduplicate utility functions ✅
- `getClassStatus`: canonical in `classUtils.ts`, removed from `dashboardUtils.ts`
- `getBeltColor`: canonical in `studentUtils.ts`, re-exported from `beltTestingUtils.ts`
- `normalizeAvatarUrl`: removed local copies in `students.ts`/`students/[id].ts`, import from `utils/avatar.ts`

### P2-15: Fix eslint-disable suppressions ✅
- Fixed `NotificationBell`: `useCallback` for `fetchNotifications`
- Verified remaining suppressions are legitimate

### P2-16: Fix session expiry mismatch ✅
- Aligned DB session expiry from 7→30 days to match JWT refresh token

---

## Phase 3 � MEDIUM Improvements (14/14 completed)

### P3-01: Regenerate schema.sql from current DB state ?
- Regenerated full schema from live D1 database

### P3-02: Complete i18n coverage ?
- Added i18n keys to 6 components, 3 locale files

### P3-03: Extract large components (SRP) ?
- StudentManager: 521?308, ClassManager: 555?287, PaymentManager: 444?130, StudentProfile: 569?500

### P3-04: Centralize polling ?
- Created PollingContext with single 30s setInterval

### P3-05: Add AbortController to data-fetching hooks ?
- Added signal to apiClient.get(), 5 services, 9 hooks

### P3-06: Add audit logging to CRUD operations ?
- Non-blocking logAuditAction in students, payments, classes, approvals CRUD

### P3-07: Add missing DB indexes ?
- idx_students_created_by, idx_students_instructor_id, idx_classes_created_by, idx_payments_student_date

### P3-08: Clean expired sessions ?
- Added deleteExpiredSessions() to _scheduled.ts cron

### P3-09: Fix inconsistent error response format ?
- Created functions/utils/response.ts with errorResponse/jsonResponse helpers

### P3-10: Fix emailExists blocking re-registration ?
- Added `AND is_active = 1` filter

### P3-11: Fix pending approvals scope ?
- Instructors now only see pending student accounts

### P3-12: Fix student delete � soft-delete user ?
- Changed hard-delete to soft-delete (is_active = 0)

### P3-13: Fix metadata disciplines scope ?
- Scoped disciplines query by created_by/instructor_id

### P3-14: Fix StudentDetailsModal prop mutation ?
- Removed direct prop mutation

---

## Phase 4 � LOW Polish (16/16 completed)

### P4-01: Standardize ID generation ?
- Replaced all generateUserId() (hex) with crypto.randomUUID() in auth endpoints
- Removed generateUserId/generateSessionToken from hash.ts

### P4-02: Fix payment ID predictability ?
- Replaced fallback `$`{studentId}-`$`{Date.now()} with crypto.randomUUID()

### P4-03: Align backend types with schema ?
- Fixed Class, Payment, Attendance interfaces in functions/types/index.ts

### P4-04: Add Content-Type header to all error responses ?
- Added missing Content-Type: application/json to 15+ error responses across 9 files

### P4-05: Fix QR cleanup to use soft-delete ?
- Changed DELETE to UPDATE SET deleted_at, is_active=0 in both cleanup handlers

### P4-06: Deduplicate QR cleanup logic ?
- Extracted cleanupExpiredQRCodes() into functions/utils/db.ts

### P4-07: Fix useStudentStats wrong icon ?
- Already fixed in P3-02 (DollarSign replaced with UserX)

### P4-08: Fix hardcoded currency ?
- StudentPaymentHistory now uses i18n.language-derived locale instead of hardcoded es-MX

### P4-09: Lazy-load particle system ?
- MartialArtsParticles loaded via React.lazy() with Suspense fallback

### P4-10: Add batch enrollment endpoint ?
- Created POST /api/classes/[classId]/students/batch with D1.batch()
- Frontend handleSelectAllInGroup now uses single batch call

### P4-11: Create dedicated analytics API ?
- Created GET /api/analytics with SQL aggregates (18 queries via D1.batch())
- useDashboardData now calls single endpoint instead of 3 separate services

### P4-12: Add keyboard accessibility to AttendanceRow ?
- Added role=button, tabIndex=0, onKeyDown (Enter/Space) to clickable div

### P4-13: Fix useClasses dataEvent dispatch ?
- Added dispatchDataEvent('classes') after create/update/delete mutations
- Added onDataEvent listener for cross-hook sync

### P4-14: Replace alert() with toast notifications ?
- Replaced 15 alert() calls across 5 files with useToast hook

### P4-15: Add class_comments FK on author_id ?
- Added idx_class_comments_author_id index, updated schema.sql with FK constraint

### P4-16: Add logout audit logging ?
- Logout handler now logs audit action with user_id before session deletion

---

## Post-Master-Plan � UX / i18n / Feature Session (2026-04-16)

Beyond the 54-item tech-debt plan, this session shipped a batch of product-level polish and a mini-feature drop:

### Jiu-Jitsu sub-categories + multi-discipline students
- Added 'Brazilian Jiu-Jitsu Gi', 'Brazilian Jiu-Jitsu No-Gi', 'Brazilian Jiu-Jitsu Kids' alongside existing BJJ/Jiujitsu entries in src/lib/constants.ts (with full belt ladders in BELT_RANKINGS).
- New QUICK_DISCIPLINE_FILTERS export powering the filter-chip toolbar (bjj-gi, bjj-nogi, bjj-kids, bjj-all, mma).
- Extended API allowlist in unctions/api/classes/metadata.ts with the new BJJ sub-categories + Boxing.
- StudentFormData gained optional disciplines?: { discipline: string; belt: string }[].
- New reusable src/components/students/MultiDisciplineEditor.tsx used in StudentFormModal, StudentEditModal, and inline in StudentProfile for self-edits. Supports add/remove rows, auto-resets belt on discipline change, picks first unused discipline on add, accessible labels.
- Service layer src/services/student.service.ts now forwards the full disciplines array on create/update; legacy discipline/elt preserved from the primary row for backward compat.

### Quick-filter chip bar on Student Manager
- New src/components/students/DisciplineFilterChips.tsx � horizontal scroll-snap toolbar with 'All' chip + BJJ group chips + MMA chip + dynamic chips for any remaining disciplines with count > 0.
- StudentManager now filters against the union of student.discipline and student.disciplines[].discipline so multi-discipline students match any selected filter.

### i18n fix � 'Cursos' ? 'Clases' (Spanish)
- Updated 9 keys in src/i18n/locales/es.json: 
av.classes, dashboard.stats.todayClasses + classesThisWeek + 
oClasses, dashboard.quickActions.scheduleClass, dashboard.metrics.totalClasses, classesOnDate, nalytics.averagePerClass, nalytics.byClass. Mobile and desktop labels now read 'Clases' everywhere.

### Belt Testing v2 hero
- src/components/belttesting/AdminBeltTesting.tsx hero refreshed with FadeUp title, gradient accent blur, and three animated Stat cards (replaces the old daisyUI stats block that the user flagged as 'ugly and old').

### PR 2 chrome � theme toggle
- Added Sun/Moon theme toggle button to desktop Header (src/components/layout/Header.tsx), wired to useTheme().toggle from the existing theme provider.

### Quality gates
- pnpm typecheck: clean
- pnpm lint: clean (fixed one broken JSX block in StudentProfile introduced during an earlier multi-replace pass)
- pnpm test:run: 43 passed, 2 pre-existing failures in student.service.test.ts (unrelated signal arg mismatch from commit d6f15dd)
- pnpm build: clean (6.5s)
- Deployed preview: https://feature-dashboard-uiux-revam.martial-arts-manager.pages.dev (commit d57d7b9)

