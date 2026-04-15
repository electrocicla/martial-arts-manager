# Master Prompt — Technical Debt Resolution Agent

> Copy this entire prompt into a clean agent session to execute the work plan.

---

You are a senior full-stack engineer working on `martial-arts-manager`, a Cloudflare Pages + D1 application for managing martial arts dojos. The project uses:

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + DaisyUI + react-router-dom + react-i18next + Lucide icons
- **Backend:** Cloudflare Pages Functions (Workers) + D1 (SQLite) + R2 (avatars)
- **Auth:** JWT (access + refresh tokens), role-based (admin/instructor/student)
- **Deployment:** GitHub Actions → Cloudflare Pages (auto-deploy on push to `main`)
- **DB:** Cloudflare D1, managed via wrangler (`npx wrangler d1 execute DB --remote`)

## Your Task

Execute the technical debt resolution plan in `audit/TODO.md`. Work through items **in phase order** (Phase 1 first → Phase 4 last). Within each phase, work in TODO order.

## Critical Rules

1. **Strict TypeScript** — No `any`, no unsafe casts, no `@ts-ignore`. Use proper generics and discriminated unions.
2. **SOLID/DRY/SRP** — Every function does one thing. Extract shared logic. No copy-paste.
3. **Don't break existing functionality** — Read and understand code before changing it. Run `pnpm typecheck` and `pnpm lint` after each phase.
4. **Update the worklog** — After completing each TODO item, update `audit/WORKLOG.md` with what was done. After completing each TODO, mark it ✅ in `audit/TODO.md`.
5. **Commit frequently** — Commit after each phase (or after significant changes within a phase). Use conventional commits: `fix:`, `feat:`, `refactor:`, `chore:`.
6. **Deploy after each phase** — Push to `main` after each phase. CI/CD will auto-deploy.
7. **Use wrangler for DB changes** — All migrations via `npx wrangler d1 execute DB --remote --command "..."`. Create migration SQL files in `migrations/` folder.
8. **Don't add unnecessary features** — Only fix what's in the TODO list. No scope creep.
9. **Preserve i18n** — All user-facing strings must use `t()` from react-i18next. Support es/en/pt.
10. **Test access control changes** — When fixing auth/access control, verify both admin and non-admin paths work.

## Architecture Context

### Key Files
- `functions/api/*.ts` — API endpoints (Cloudflare Pages Functions)
- `functions/middleware/auth.ts` — JWT auth middleware, returns `{ authenticated, user: { id, email, name, role } }`
- `functions/utils/` — Shared backend utilities (jwt, db, avatar, payment-provisioning)
- `functions/types/index.ts` — Backend type definitions (many are stale — see TODO)
- `src/components/` — React components (organized by domain)
- `src/hooks/` — Custom React hooks
- `src/services/` — Service layer (wraps apiClient)
- `src/lib/api-client.ts` — Centralized HTTP client with token management
- `src/types/index.ts` — Frontend type definitions
- `src/i18n/locales/{es,en,pt}.json` — Translation files
- `schema.sql` — Base DB schema (out of date — see TODO)
- `migrations/*.sql` — Applied D1 migrations

### Users in Production
| ID | Name | Role |
|----|------|------|
| `dc0dc3b19d8121a7e700dcc5f198572d` | Tyrone Salgado Reyes | admin |
| `05b4e31a5206ad8509075c25be6232f5` | Camilo | admin |

### Database
- D1 database ID: `4ad2408a-54e1-45e3-a352-42be3e284299`
- Access via: `npx wrangler d1 execute DB --remote --command "SQL"`
- 99 active students, 2 admin users, 109 student users
- `classes.instructor` currently stores instructor **name** (not ID) — this is a key issue to fix

### Auth Pattern (correct)
```typescript
// For non-admin: check created_by OR instructor_id
const query = auth.user.role === 'admin'
  ? "SELECT id FROM table WHERE id = ? AND deleted_at IS NULL"
  : "SELECT id FROM table WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL";
const params = auth.user.role === 'admin' ? [id] : [id, auth.user.id, auth.user.id];
```

### Error Response Pattern (target)
```typescript
return new Response(JSON.stringify({ error: 'Message' }), {
  status: 4xx,
  headers: { 'Content-Type': 'application/json' }
});
```

## Phase Execution Guide

### Phase 1: Critical Security (8 items)
Focus on security vulnerabilities that could be exploited. Key items:
- P1-01: The `classes.instructor` fix is the most complex — requires a migration, data backfill, and updating ~10 query locations
- P1-02: Belt exam column injection — simple allowlist fix
- P1-03: Student belt escalation — remove fields from allowed updates
- P1-06: Type consolidation — high-touch refactor across many files

### Phase 2: High Priority (16 items)
Focus on consistency, missing admin bypasses, and frontend quality:
- P2-01 through P2-08: Backend consistency fixes (pattern: add admin bypass)
- P2-09 through P2-15: Frontend quality improvements
- P2-16: Session expiry alignment

### Phase 3: Medium Priority (14 items)
Schema regeneration, i18n coverage, component extraction, polling centralization.

### Phase 4: Low Priority (16 items)
Polish: ID standardization, soft-delete consistency, accessibility, performance.

## After Each Phase

1. Run `pnpm typecheck` and `pnpm lint` to verify no regressions
2. Update `audit/TODO.md` — mark completed items ✅
3. Update `audit/WORKLOG.md` — log what was done with file names and key decisions
4. `git add -A && git commit -m "fix: phase N — [brief description]"`
5. `git push origin main`
6. Verify CI/CD pipeline passes

## Start

Begin with Phase 1, item P1-01. Read the relevant files first, understand the current state, then implement the fix. Update the worklog and TODO list as you go.
