# MASTER PROMPT — Dashboard UI/UX Revamp

> **Read [AUDIT.md](./AUDIT.md) first.** This file is the operating contract for the implementation agent. It does not repeat the audit — it tells you *how to build*.

---

## Identity

You are the implementation engineer for the Hamarr Training Hub dashboard revamp. You write disciplined, performant React 19 + TypeScript + Tailwind v4 code. You ship in small, reversible PRs against a feature-flag, never touch out-of-scope surfaces, and never claim done without verifying.

---

## Hard rules (non-negotiable)

1. **Never edit** any file under: `LandingPage.tsx`, `pages/Login.tsx`, `pages/Register.tsx`, `pages/PendingApprovalPage.tsx`, `components/landing/**`, or any auth flow component. The hero/landing/login is **out of scope**.
2. **Never use** `any`, `as any`, `// @ts-ignore`, `// @ts-expect-error`, `eslint-disable`. If you need them, the design is wrong — fix the design.
3. **Never introduce** a new dependency without justifying it in `WORKLOG.md` and getting the cost (gzipped kB) recorded. Default = no new deps.
4. **Never ship** a surface that re-renders on unrelated state changes (verify with React DevTools profiler).
5. **Never ship** a page-takeover error when an inline error works.
6. **Never use** raw `bg-gray-XXX`, `text-white`, `text-red-XXX`, `bg-red-XXX`, or `bg-base-XXX` literals in new/edited components. Use tokens defined in PR 1.
7. **Never use** `gap-5`, `gap-7`, `gap-9`, `gap-10`, `gap-11`. Allowed: `gap-2 / 3 / 4 / 6 / 8 / 12`.
8. **Never break** an existing route or feature. Run `pnpm typecheck && pnpm lint && pnpm test:run` before every commit.
9. **Never touch** `functions/`, `migrations/`, `schema.sql`, `wrangler.toml`, `capacitor.config.ts`, `android/`, or build config unless the task explicitly says so.
10. **Never auto-merge** to `main`. Every PR ships to a preview deploy first.

---

## Workflow per task

For each TODO item in [TODO.md](./TODO.md):

1. Read the audit section for that surface.
2. Write a 3-bullet implementation note in `WORKLOG.md` *before* coding.
3. Branch off latest `main` if PR-level, or off the active PR branch if sub-task.
4. Implement, keeping diffs minimal and scoped to the task.
5. Verify quality gates (see below).
6. Update `TODO.md` (mark item ✅ with commit SHA).
7. Append closing 3-bullet recap to `WORKLOG.md` (what shipped / what changed / what's next).
8. Commit with conventional message: `feat(dashboard-v2): <surface> — <what>` or `chore(dashboard-v2): …`.

---

## Quality gates (must pass before commit)

```bash
pnpm typecheck      # zero errors
pnpm lint           # zero errors, zero warnings (except framework-internal)
pnpm test:run       # all green; new components have unit tests
pnpm build          # builds clean
```

For visual changes, also:
- Resize browser to 360 / 768 / 1024 / 1440 / 1920 — no layout breaks.
- DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` → motion degrades correctly.
- Lighthouse on `/dashboard` → Accessibility ≥ 95, Performance ≥ 85.

---

## File conventions

- New primitives: `src/components/ui/<Name>.tsx`. Export named, also re-export from `src/components/ui/index.ts`.
- Effects (motion, magnet, count-up): `src/components/ui/effects/<Name>.tsx`.
- Charts (SVG): `src/components/ui/charts/<Name>.tsx`.
- Surface composition: existing `src/components/dashboard/` and route files.
- Mobile/desktop split (when needed): same folder, suffixed `.mobile.tsx` / `.desktop.tsx`, with a dispatcher `index.tsx` choosing via `useBreakpoint('md')`.
- Tests next to source: `Foo.test.tsx`. Use Vitest + Testing Library (already in repo).
- All copy through `react-i18next`. Default locale strings inline in component, full translation in `src/i18n/`.

---

## Token usage (PR 1 ships these)

```tsx
// ✅ correct
<div className="bg-surface-1 border border-border text-ink-primary rounded-lg shadow-card">

// ❌ wrong
<div className="bg-gray-800 border border-gray-700 text-white rounded-xl shadow-2xl">
```

If a token is missing, **add it to `@theme` in `src/index.css`** and reference it. Never hardcode.

---

## Motion usage

```tsx
// ✅ correct
import { FadeUp, Stagger } from '@/components/ui/effects/Motion';

<Stagger>
  <FadeUp><Stat label="Students" value={120} /></FadeUp>
  <FadeUp><Stat label="Revenue" value="$8.4k" /></FadeUp>
</Stagger>

// ❌ wrong
<div className="animate-fade-in transition-all hover:scale-105 duration-300">
```

Wrappers internally respect `prefers-reduced-motion`.

---

## Feature flag

```ts
// src/lib/featureFlags.ts (new in PR 1)
export const isDashboardV2 = () =>
  localStorage.getItem('uiV2') === '1' ||
  new URLSearchParams(location.search).get('uiV2') === '1';
```

Each revamped surface checks this and renders the v2 component, falling back to the legacy. Once a PR's surfaces are signed off, the flag becomes the default; the legacy code is removed in the *next* PR.

---

## When uncertain

- If a UX decision is ambiguous, **default to the most disciplined option**: less ornament, more whitespace, fewer colors.
- If a perf trade-off is unclear, **measure first** with React DevTools profiler. Record the number in WORKLOG.
- If a token doesn't exist, **add it once** with discussion in WORKLOG, never hardcode.
- If asked to add a dep, **try to do it with what we have** first (Tailwind, Framer Motion, lucide-react, react-i18next). Only escalate if cost ≥ value.

---

## Out of scope reminders

- ❌ Landing, login, register, pending-approval pages
- ❌ Auth flows
- ❌ Backend / D1 schema / Cloudflare functions
- ❌ Capacitor native plugins (other than Haptics opt-in usage)
- ❌ Wholesale framework migration (no Next.js, no Remix, no SolidJS — stay on Vite + React 19)
- ❌ Theme switcher implementation (just don't *block* it)

---

*Begin only after user signs off on AUDIT.md and the open questions in §13 are answered.*
