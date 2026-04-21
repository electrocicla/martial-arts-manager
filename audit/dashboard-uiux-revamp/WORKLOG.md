# WORKLOG — Dashboard UI/UX Revamp

> Append-only journal. Newest entries on top. Each entry: timestamp, author/agent, what shipped, what changed, what's next.

---

## 2026-04-21 — PR 0: Audit

**Author**: GitHub Copilot (Luna)
**Branch**: `feature/dashboard-uiux-revamp-audit`

**Shipped**:
- Created `audit/dashboard-uiux-revamp/` with `AUDIT.md`, `MASTER_PROMPT.md`, `TODO.md`, `WORKLOG.md`.
- Inventoried every dashboard surface (admin/instructor/student/layout) — see [AUDIT.md §1](./AUDIT.md#1-inventory--surfaces-in-scope).
- Found 13 distinct categories of UI/UX issues — see [AUDIT.md §2](./AUDIT.md#2-findings--what-is-wrong-today).
- Defined target design system: tokens (OKLCH black/red ramp), spacing rhythm, type scale, motion language, adaptive (not just responsive) strategy — see [AUDIT.md §3](./AUDIT.md#3-target-design-system).
- Specified 13 new primitives + in-house SVG charts. **No new dependency** — react-bits patterns ported selectively in-house (~6 kB total) — see [AUDIT.md §4](./AUDIT.md#4-component-library--additions).
- Drafted surface-by-surface revamp plan (14 surfaces) — see [AUDIT.md §5](./AUDIT.md#5-surface-by-surface-plan).
- Sequenced 6 PRs behind a `localStorage.uiV2` feature flag — see [AUDIT.md §11](./AUDIT.md#11-rollout-plan-5-sequential-prs-after-this-audit).

**Decisions recorded**:
- **No `react-bits` install**. Selective in-house port keeps bundle lean and tokenized.
- **No chart lib**. Hand-rolled SVG primitives in `src/components/ui/charts/`.
- **Adaptive split** for the few surfaces where one layout cannot serve both well (`Header`, `BottomSlidingMenu`, dashboard home, students/classes/payments). Selected at mount via `useBreakpoint('md')` — not swapped on resize.
- **Feature flag** `localStorage.uiV2` so legacy + v2 coexist mid-rollout. Each PR flips its surfaces on after sign-off.
- **DaisyUI**: keep for now. Dropping it is a separate decision (see open question §13.7).

**Open questions** (need user input before PR 1):
1. Belt insignia — bespoke SVG or generic colored bar?
2. Streak gamification intensity — confetti/haptics yes/no?
3. Greeting weather/quote — keep, drop, or behind a setting?
4. CommandPalette — desktop only, or also mobile?
5. Light theme — tokens-only future-proofing, or actively design for both now?
6. Charts — accept hand-rolled SVG decision, or want `recharts`?
7. DaisyUI — keep or drop in this iteration?

**Next**:
- User reviews [AUDIT.md](./AUDIT.md) and answers §13 open questions.
- Once signed off, PR 1 begins per [TODO.md](./TODO.md) PR 1 checklist.
- Implementation agent operates exclusively under the rules in [MASTER_PROMPT.md](./MASTER_PROMPT.md).

**Out-of-scope confirmation**: Landing page, hero section, Login, Register, PendingApprovalPage, all auth flows — **untouched** this iteration and across the entire revamp.
