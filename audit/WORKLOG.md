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
