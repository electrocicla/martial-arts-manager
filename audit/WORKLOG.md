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
