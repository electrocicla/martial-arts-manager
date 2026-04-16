# Technical Debt — TODO List

> Generated: 2026-04-15 | Project: martial-arts-manager
> Status: ⬜ Not Started | 🔄 In Progress | ✅ Completed

---

## Phase 1 — CRITICAL Security & Data Integrity (Priority: Immediate)

### P1-01 ✅ Fix `classes.instructor` access control (CRITICAL)
- `classes.instructor` stores a name string, but attendance API compares it against `auth.user.id` (UUID)
- `instructor = ?` will **never** match a user ID → non-creator instructors cannot manage attendance
- **Fix:** Add `instructor_id TEXT` column to `classes`, migrate data, update all queries
- **Files:** `functions/api/attendance.ts`, `functions/api/classes.ts`, `functions/api/classes/[id].ts`, `schema.sql`
- **Migration:** New SQL migration to add column and backfill from `users.name` → `users.id`

### P1-02 ✅ Fix belt exam PUT — arbitrary column injection (CRITICAL)
- `Object.entries(updates)` iterates unvalidated request body keys into SQL column names
- Attacker can set `created_by`, `examiner_id`, `status` etc.
- **Fix:** Allowlist updatable fields explicitly
- **Files:** `functions/api/belt-exams.ts` (PUT handler, ~L153-170)

### P1-03 ✅ Fix student self-profile — belt escalation (CRITICAL)
- Student `PUT /api/student/profile` allows students to update their own `belt` field
- **Fix:** Remove `belt` and `disciplines` from student-editable fields
- **Files:** `functions/api/student/profile.ts`

### P1-04 ✅ Fix unauthenticated cleanup-expired-qr endpoint (CRITICAL)
- `GET /api/attendance/cleanup-expired-qr` has no auth — anyone can trigger QR cleanup + notification spam
- **Fix:** Add admin-only auth check or shared secret header
- **Files:** `functions/api/attendance/cleanup-expired-qr.ts`

### P1-05 ✅ Fix student/payments soft-delete filter (CRITICAL)
- `SELECT * FROM payments WHERE student_id = ?` missing `AND deleted_at IS NULL`
- Soft-deleted payments visible to students
- **Files:** `functions/api/student/payments.ts`

### P1-06 ✅ Consolidate triple-duplicate type definitions (CRITICAL)
- `Student`, `Payment`, `Class`, `Attendance` defined in `src/types.ts`, `src/types/index.ts`, AND `src/lib/api-client.ts`
- `Discipline` type has silent drift between files
- **Fix:** Delete `src/types.ts`, remove duplicates from `api-client.ts`, consolidate into `src/types/index.ts`

### P1-07 ✅ Fix validation.ts discipline enum drift (CRITICAL)
- Zod schema discipline enum is incomplete vs `constants.ts` DISCIPLINES
- Valid discipline selections rejected by form validation
- **Fix:** Generate enum from `DISCIPLINES` constant
- **Files:** `src/lib/validation.ts`, `src/lib/constants.ts`

### P1-08 ✅ Fix CalendarView timezone bug (CRITICAL)
- `toISOString().split('T')[0]` converts to UTC, can shift date ±1 day
- **Fix:** Use `parseLocalDate()` from `src/lib/utils.ts`
- **Files:** `src/components/CalendarView.tsx`

---

## Phase 2 — HIGH Security & Consistency (Priority: Short-term)

### P2-01 ✅ Admin bypass for classes GET/PUT/DELETE
- Admin cannot see/edit/delete classes created by other instructors
- Inconsistent with enrollment and attendance APIs that grant admin full access
- **Files:** `functions/api/classes.ts`, `functions/api/classes/[id].ts`

### P2-02 ✅ Admin bypass for unenroll student DELETE
- DELETE handler checks `created_by` without admin override
- POST/GET handlers in same file correctly handle admin
- **Files:** `functions/api/classes/[classId]/students/[studentId].ts`

### P2-03 ✅ Fix student-classes check — add instructor_id
- Only checks `created_by`, not `instructor_id`
- **Files:** `functions/api/students/[id]/classes.ts`

### P2-04 ✅ Fix avatar delete — broken R2 key extraction
- `new URL(student.avatar_url)` throws on relative paths
- R2 object never actually deleted
- **Files:** `functions/api/students/avatar.ts`

### P2-05 ✅ Fix avatar delete — admin/instructor bypass
- Avatar delete only checks `created_by`, no admin or instructor_id check
- **Files:** `functions/api/students/avatar.ts`

### P2-06 ✅ Add rate limiting to auth endpoints
- No rate limiting on login/register
- Brute-force attacks unmitigated
- **Files:** `functions/api/auth/login.ts`, `functions/api/auth/register.ts`

### P2-07 ✅ Fix class comments — ownership check
- Any authenticated user (including students) can create/read comments on any class
- No DELETE handler
- **Files:** `functions/api/classes/[classId]/comments.ts`

### P2-08 ✅ Add payments PUT/DELETE endpoints
- Schema has `deleted_at`, `updated_by`, `status` but no edit/delete endpoints
- **Files:** `functions/api/payments.ts`

### P2-09 ✅ Standardize API access — replace raw fetch()
- 7+ files use raw `fetch()` bypassing centralized auth/error handling
- **Files:** `src/context/AuthContext.tsx`, `src/hooks/useProfile.ts`, `src/hooks/useStudentDashboardData.ts`, `src/hooks/usePendingApprovalsCount.ts`, `src/components/admin/PendingApprovals.tsx`, `src/components/students/StudentDetailsModal.tsx`

### P2-10 ✅ Add Error Boundaries
- No React Error Boundary — any render error crashes entire app
- **Files:** `src/App.tsx` or new `src/components/ErrorBoundary.tsx`

### P2-11 ✅ Fix useGreeting interval performance
- 1-second interval causes 86,400 unnecessary re-renders/day
- **Fix:** Change to 60,000ms or compute once
- **Files:** `src/hooks/useGreeting.ts`

### P2-12 ✅ Migrate modals to shared Modal component
- 6+ modals lack focus trap, `role="dialog"`, `aria-modal`
- A proper `<Modal>` component exists but isn't used
- **Files:** `StudentFormModal`, `StudentEditModal`, `StudentDetailsModal`, `ClassFormModal`, `ClassDetailsModal`, `EnrollStudentsModal`

### P2-13 ✅ Remove/verify AppContext dead code
- AppContext provides state but individual hooks fetch independently
- Likely unused
- **Files:** `src/context/AppContext.tsx`

### P2-14 ✅ Deduplicate utility functions
- `getClassStatus()` in both `classUtils.ts` and `dashboardUtils.ts`
- `getBeltColor()` in both `studentUtils.ts` and `beltTestingUtils.ts`
- `normalizeAvatarUrl()` copy-pasted in 3 backend files
- `disciplines` JSON parsing duplicated in 3 files

### P2-15 ✅ Fix eslint-disable suppressions
- `AuthContext.tsx`: stale closure in token refresh
- `StudentFormModal/EditModal`: unmemoized `availableDisciplines`
- `NotificationBell`: `fetchNotifications` not properly memoized

### P2-16 ✅ Fix session expiry mismatch
- JWT refresh token: 30 days, DB session: 7 days
- After 7 days JWT valid but session lookup fails
- **Files:** `functions/utils/jwt.ts`, `functions/api/auth/login.ts`

---

## Phase 3 — MEDIUM Improvements (Priority: Medium-term)

### P3-01 ✅ Regenerate schema.sql from current DB state
- Missing 6+ tables and many columns added by migrations
- **Files:** `schema.sql`, `migrations/`

### P3-02 ✅ Complete i18n coverage
- `PendingApprovalPage.tsx`: Zero i18n (all hardcoded English)
- `PendingApprovals.tsx`: All strings hardcoded
- `DashboardActivity.tsx`: Hardcoded English
- `Login.tsx`: Hardcoded English
- `useStudentStats.ts`: Hardcoded English
- `ClassFormModal.tsx`: `DAYS_OF_WEEK` hardcoded in Spanish

### P3-03 ✅ Extract large components (SRP)
- `StudentManager.tsx` (~300+ lines): Extract `StudentList`, `StudentFilters`, `StudentStats`
- `ClassManager.tsx` (~300+ lines): Extract sub-components
- `PaymentManager.tsx`: Extract `PaymentForm`, `PaymentList`, `PaymentFilters`
- `StudentProfile.tsx` (~300+ lines): Split into tab components

### P3-04 ✅ Centralize polling
- `usePendingApprovalsCount` + `NotificationBell` both poll every 30s
- Duplicate polling when both mounted
- **Fix:** Shared context/provider for polling

### P3-05 ✅ Add AbortController to data-fetching hooks
- Hooks don't cancel requests on unmount
- Potential "setState on unmounted component" warnings

### P3-06 ✅ Add audit logging to CRUD operations
- `audit_logs` table exists, `logAuditAction` utility exists
- Only called during login/register
- Should log: student create/update/delete, payment ops, class changes, approvals

### P3-07 ✅ Add missing DB indexes
- `idx_classes_created_by`, `idx_students_created_by`, `idx_students_instructor_id`
- `idx_payments_student_date` (composite)

### P3-08 ✅ Clean expired sessions
- 132 expired sessions in DB
- `deleteExpiredSessions()` utility exists but never scheduled
- **Fix:** Add to `_scheduled.ts` cron handler

### P3-09 ✅ Fix inconsistent error response format
- Some endpoints: `{ error: "msg" }`, others: `{ success: false, message: "msg" }`
- **Fix:** Shared error response helper, standardize on one shape

### P3-10 ✅ Fix emailExists blocking re-registration
- `emailExists` doesn't filter `is_active`, blocking rejected users from re-registering
- **Files:** `functions/utils/db.ts`

### P3-11 ✅ Fix pending approvals scope
- Instructors see ALL pending users, not just those who selected them
- **Files:** `functions/api/auth/pending-approvals.ts`

### P3-12 ✅ Fix student delete — soft-delete user instead of hard-delete
- Student soft-deleted but linked user account hard-deleted
- Destroys audit history
- **Files:** `functions/api/students/[id].ts`

### P3-13 ✅ Fix metadata disciplines scope
- Disciplines query is global, unlike locations and instructors which are scoped to user
- **Files:** `functions/api/classes/metadata.ts`

### P3-14 ✅ Fix StudentDetailsModal prop mutation
- Directly mutates `student.avatar_url = data.avatarUrl` — should use callback to parent
- **Files:** `src/components/students/StudentDetailsModal.tsx`

---

## Phase 4 — LOW Polish (Priority: Long-term)

### P4-01 ✅ Standardize ID generation
- Mix of `crypto.randomUUID()`, `generateUserId()` (hex), and composite IDs

### P4-02 ✅ Fix payment ID predictability
- Fallback `${studentId}-${Date.now()}` is guessable and can collide
- Use `crypto.randomUUID()`

### P4-03 ✅ Align backend TypeScript types with schema
- `functions/types/index.ts` has stale `start_time`/`end_time`/`capacity` etc.

### P4-04 ✅ Add Content-Type header to all error responses

### P4-05 ✅ Fix QR cleanup to use soft-delete
- Hard-deletes QR codes despite `deleted_at` column existing

### P4-06 ✅ Deduplicate scheduled QR cleanup logic
- Nearly identical logic in `_scheduled.ts` and `cleanup-expired-qr.ts`

### P4-07 ✅ Fix `useStudentStats` wrong icon
- Uses `DollarSign` for "Inactive" stat card

### P4-08 ✅ Fix hardcoded currency in StudentPaymentHistory
- Hardcodes `'es-MX'` and `'MXN'`

### P4-09 ✅ Lazy-load particle system
- `performanceMonitor.ts` + `particlePool.ts` imported unconditionally

### P4-10 ✅ Add batch enrollment endpoint
- `handleSelectAllInGroup` makes sequential API calls

### P4-11 ✅ Create dedicated analytics API
- Currently fetches all students, payments, classes, attendance data
- Should return pre-computed analytics

### P4-12 ✅ Add keyboard accessibility to AttendanceRow
- Clickable div lacks `role="button"`, `tabIndex`, `onKeyDown`

### P4-13 ✅ Fix `useClasses` missing dataEvent dispatch
- Does not dispatch `'classes'` event after mutations

### P4-14 ✅ Replace `alert()` and `window.confirm()` with toast/modal
- `StudentFormModal`, `StudentDetailsModal`, `ClassDetailsModal`, `PendingApprovals`

### P4-15 ✅ Add `class_comments` FK on `author_id`

### P4-16 ✅ Add logout audit logging

---

## Summary

| Phase | Items | Severity | Effort |
|-------|-------|----------|--------|
| Phase 1 | 8 | Critical | ~2-3 days |
| Phase 2 | 16 | High | ~4-5 days |
| Phase 3 | 14 | Medium | ~3-4 days |
| Phase 4 | 16 | Low | ~2-3 days |
| **Total** | **54** | | **~11-15 days** |
