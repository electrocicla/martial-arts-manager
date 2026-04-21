# TODO — Dashboard UI/UX Revamp

> Status legend: ⬜ not started · 🟡 in progress · ✅ done · ⏸ blocked

Each item links to the relevant section of [AUDIT.md](./AUDIT.md). PRs are sequential — do not start PR N+1 until PR N is merged.

---

## PR 0 — This audit (current)

- ✅ AUDIT.md
- ✅ MASTER_PROMPT.md
- ✅ TODO.md
- ✅ WORKLOG.md
- ⬜ User sign-off on §13 open questions

---

## PR 1 — Design tokens + UI primitives  *(no surface changes)*

Audit ref: §3, §4.1, §4.2

- ⬜ Add `@theme` block in `src/index.css` with all color/radius/shadow/motion tokens
- ⬜ Override DaisyUI theme to consume the new tokens
- ⬜ Verify all existing screens still render (legacy DaisyUI classes inherit new colors)
- ⬜ `src/lib/useBreakpoint.ts` — single hook used by all adaptive components
- ⬜ `src/lib/featureFlags.ts` — `isDashboardV2()`
- ⬜ `src/components/ui/Surface.tsx` (variants: flat / raised / outline / strike)
- ⬜ `src/components/ui/Stat.tsx` (label, value, delta, trend, sparkline slot, count-up)
- ⬜ `src/components/ui/Section.tsx`
- ⬜ `src/components/ui/EmptyState.tsx`
- ⬜ `src/components/ui/InlineError.tsx`
- ⬜ `src/components/ui/Sheet.tsx` (mobile bottom sheet)
- ⬜ `src/components/ui/Kbd.tsx`
- ⬜ `src/components/ui/effects/Motion.tsx` (FadeUp, Stagger, PressableMotion — all reduced-motion-safe)
- ⬜ `src/components/ui/effects/CountUp.tsx`
- ⬜ `src/components/ui/effects/Magnet.tsx`
- ⬜ `src/components/ui/effects/ShinyText.tsx`
- ⬜ `src/components/ui/charts/Sparkline.tsx`
- ⬜ `src/components/ui/charts/BarStack.tsx`
- ⬜ `src/components/ui/charts/DonutGauge.tsx`
- ⬜ Extend `src/components/ui/Skeleton.tsx` with `<SkeletonStat>`, `<SkeletonRow>`, `<SkeletonCard>`
- ⬜ Unit tests for all new primitives
- ⬜ Update `src/components/ui/index.ts` exports
- ⬜ Bundle size check: total added ≤ 12 kB gzipped

---

## PR 2 — Layout chrome

Audit ref: §1.1, §5.1

- ⬜ `Sidebar.tsx` — refresh active state, animated red gradient sweep, collapse-to-rail toggle, footer block
- ⬜ Split `Header.tsx` → `HeaderDesktop.tsx` + `HeaderMobile.tsx`, dispatcher in `Header.tsx`
- ⬜ `CommandPalette.tsx` — `⌘K` global navigator (desktop)
- ⬜ Real search wired to CommandPalette (replaces decorative input)
- ⬜ `BottomSlidingMenu.tsx` — Framer-Motion drag, red drag handle, role-aware quick chips, peek breadcrumb
- ⬜ `NotificationBell.tsx` — popover grouping by day, mark-read on hover, refined empty state
- ⬜ `PullToRefresh.tsx` — red rope-tension SVG indicator
- ⬜ Skip-to-content link in `App.tsx`
- ⬜ Safe-area insets via global CSS variables
- ⬜ Keyboard shortcut cheatsheet (`?`)

---

## PR 3 — Admin/Instructor dashboard home

Audit ref: §1.2, §5.2

- ⬜ `DashboardHero.tsx` (replaces `DashboardHeader.tsx`) — display greeting, date, contextual primary CTA
- ⬜ `PulseRow.tsx` (replaces `DashboardStats.tsx`) — KPIs with count-up + sparkline + WoW delta
- ⬜ `TodaySchedule.tsx` (replaces `DashboardSchedule.tsx`) — mobile vertical timeline / desktop horizontal rail
- ⬜ `ActivityFeed.tsx` (replaces `DashboardActivity.tsx`) — grouped by hour
- ⬜ `QuickTiles.tsx` (replaces `DashboardQuickActions.tsx`) — 4 tactile tiles, hidden on desktop if CommandPalette enabled
- ⬜ `InsightsBlock.tsx` (replaces `DashboardMetrics.tsx`) — 2 charts, mobile carousel / desktop side-by-side
- ⬜ `PendingApprovalsCompact.tsx` — collapses to inline strip, expands to full sheet/modal
- ⬜ Inline error per section (no more page takeover)
- ⬜ Memoize all blocks; verify zero unrelated re-renders
- ⬜ `Dashboard.tsx` becomes thin composition behind `isDashboardV2` flag
- ⬜ Lighthouse: A11y ≥ 95, Perf ≥ 85 on `/dashboard`

---

## PR 4 — Inner routes (Pass A)

Audit ref: §5.4, §5.5, §5.6

- ⬜ `/students` two-pane (desktop) + sheet detail (mobile); virtualized; bulk actions; sticky filter chips
- ⬜ `/classes` Grid/List/Week toggle (desktop); day-grouped sticky list (mobile); inline capacity edit
- ⬜ `/payments` 3-column dashboard (desktop); tabbed list with swipe-delete (mobile); FAB

---

## PR 5 — Inner routes (Pass B) + Student surfaces

Audit ref: §5.3, §5.7–§5.14

- ⬜ Student dashboard hero countdown + belt progression + streak block + payment chip + FAB QR
- ⬜ `/calendar` month+week (desktop), week-scroller + day sheet (mobile)
- ⬜ `/attendance` & `AttendanceManager` — optimistic toggles, undo toast, check-in method icons
- ⬜ `/belt-testing` exam calendar + results entry grid
- ⬜ `/analytics` 4-up KPI strip + 2 chart row + table (desktop), KPI carousel + stacked charts (mobile)
- ⬜ `/profile` hero + tabs + inline edit
- ⬜ Settings two-pane (desktop) / single-page anchors (mobile)
- ⬜ `/my-attendance` heatmap + streak + sessions
- ⬜ `PendingApprovals` swipe-actions on mobile, inline buttons on desktop
- ⬜ Remove all v1 dashboard code paths; flip flag default-on; delete dead code

---

## PR 6 — Polish & verification

- ⬜ Full a11y sweep (axe-core)
- ⬜ Capacitor APK debug build, manual test on physical Android device
- ⬜ iPhone Safari smoke test (responsive only — no native iOS this iteration)
- ⬜ Bundle audit; remove any unused DaisyUI components if dropping the dep
- ⬜ Update `README.md` with brief design system note
- ⬜ Final Lighthouse pass on every revamped route

---

## Backlog (post-revamp; explicitly out-of-scope for this iteration)

- ☁️ Light theme (tokens already permit it)
- ☁️ Real-time WebSocket presence on attendance
- ☁️ Charts upgrade to a small lib if SVG complexity grows
- ☁️ Storybook reintroduction
- ☁️ E2E visual regression (Playwright screenshot)
