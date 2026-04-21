# Dashboard UI/UX Revamp — Audit & Plan

> **Scope (in)**: Authenticated dashboard surfaces only — admin, instructor, student variants. All inner-app routes that load after login.
> **Scope (out)**: `LandingPage`, `Login`, `Register`, `PendingApprovalPage`, hero section. **Do not touch.**
> **Theme contract**: Black + Red martial-arts aesthetic. Discipline, focus, restraint. No emoji-spam, no playful pastel palettes. Dopaminic = tactile, responsive, weighted, satisfying — *not* loud.
> **Stack**: React 19, Tailwind v4 (`tailwindcss@4.1.14`), DaisyUI v5, Framer Motion 12, lucide-react, react-router-dom v7. Capacitor wrap for Android.

---

## 0. Executive Summary

The current dashboard works but is visually inconsistent, uses three competing design languages (raw Tailwind, DaisyUI `card`/`btn`/`badge`, and ad-hoc `bg-gray-XXX` classes), and lacks a coherent motion language. Mobile vs. desktop are not designed *separately* — they share one layout that is responsive but not *adaptive*. Performance is acceptable but several surfaces re-render unnecessarily and do not use virtualization.

This document defines the **target visual system, the surface-by-surface revamp plan, the responsive strategy, the motion language, the component library additions, and the rollout order**. It is the single source of truth for the implementation phase.

---

## 1. Inventory — Surfaces in scope

### 1.1 Layout chrome (always visible)
| Surface | File | Notes |
|---|---|---|
| Desktop sidebar | [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) | Already decent, needs refinement (active state, density, badge polish). |
| Top header | [src/components/layout/Header.tsx](src/components/layout/Header.tsx) | Mobile + desktop variants merged into one file. Search bar is decorative on mobile. |
| Bottom sliding menu (mobile) | [src/components/layout/BottomSlidingMenu.tsx](src/components/layout/BottomSlidingMenu.tsx) | Drag UX is good but visually heavy. |
| Notification bell | [src/components/NotificationBell.tsx](src/components/NotificationBell.tsx) | No empty state, no grouping. |
| Pull-to-refresh | [src/components/mobile/PullToRefresh.tsx](src/components/mobile/PullToRefresh.tsx) | Indicator is bare. |
| APK install prompt | [src/components/mobile/AndroidApkInstallPrompt.tsx](src/components/mobile/AndroidApkInstallPrompt.tsx) | OK, will be re-skinned. |

### 1.2 Dashboard home (per role)
| Surface | File |
|---|---|
| Admin/Instructor home | [src/components/Dashboard.tsx](src/components/Dashboard.tsx) |
| Student home | [src/components/dashboard/StudentDashboard.tsx](src/components/dashboard/StudentDashboard.tsx) |
| Header strip | [src/components/dashboard/DashboardHeader.tsx](src/components/dashboard/DashboardHeader.tsx) |
| Stats cards | [src/components/dashboard/DashboardStats.tsx](src/components/dashboard/DashboardStats.tsx) |
| Quick actions | [src/components/dashboard/DashboardQuickActions.tsx](src/components/dashboard/DashboardQuickActions.tsx) |
| Today schedule | [src/components/dashboard/DashboardSchedule.tsx](src/components/dashboard/DashboardSchedule.tsx) |
| Activity feed | [src/components/dashboard/DashboardActivity.tsx](src/components/dashboard/DashboardActivity.tsx) |
| Metrics block | [src/components/dashboard/DashboardMetrics.tsx](src/components/dashboard/DashboardMetrics.tsx) |
| Pending approvals (admin) | [src/components/admin/PendingApprovals.tsx](src/components/admin/PendingApprovals.tsx) |

### 1.3 Inner app routes (admin/instructor)
| Route | File |
|---|---|
| `/students` | [src/components/StudentManager.tsx](src/components/StudentManager.tsx) + `src/components/students/` |
| `/classes` | [src/components/ClassManager.tsx](src/components/ClassManager.tsx) + `src/components/classes/` |
| `/payments` | [src/components/PaymentManager.tsx](src/components/PaymentManager.tsx) + `src/components/payments/` |
| `/calendar` | [src/components/CalendarView.tsx](src/components/CalendarView.tsx) |
| `/attendance` | [src/pages/Attendance.tsx](src/pages/Attendance.tsx) + `src/components/attendance/` |
| `/attendance/:classId` | [src/components/AttendanceManager.tsx](src/components/AttendanceManager.tsx) |
| `/belt-testing` | [src/pages/BeltTesting.tsx](src/pages/BeltTesting.tsx) + `src/components/belttesting/` |
| `/analytics` | [src/pages/Analytics.tsx](src/pages/Analytics.tsx) + `src/components/analytics/` |
| `/profile` | [src/pages/StudentProfile.tsx](src/pages/StudentProfile.tsx) + `src/components/profile/` |
| Settings | `src/components/settings/` |

### 1.4 Inner app routes (student)
| Route | File |
|---|---|
| `/my-attendance` | [src/pages/StudentAttendance.tsx](src/pages/StudentAttendance.tsx) |
| `/profile` | [src/pages/StudentProfile.tsx](src/pages/StudentProfile.tsx) |

### 1.5 Reusable UI primitives (must be hardened first)
[src/components/ui/](src/components/ui) — `Avatar`, `Badge`, `Button`, `Card`, `ConfirmModal`, `IconButton`, `Input`, `InstructorSelect`, `Modal`, `Select`, `Skeleton`, `TabButton`, `ToastProvider`.

---

## 2. Findings — what is wrong today

### 2.1 Design-system fragmentation (critical)
- Three coexisting systems: **raw Tailwind** (`bg-gray-800/90`), **DaisyUI** (`card`, `btn`, `badge-primary`), and **custom CSS** (`mobile-dashboard`, `dashboard-content`, `bg-grid-pattern`).
- Same intent rendered three different ways across files. Examples:
  - `Dashboard.tsx` uses `bg-black`; `StudentDashboard.tsx` uses `bg-gray-900`; `DashboardHeader.tsx` uses `bg-base-200/50`. **Three different page backgrounds.**
  - Cards: `card bg-gray-800/90 backdrop-blur-sm` (DashboardStats) vs. `<Card>` primitive (StudentDashboard) vs. `card bg-base-200/50` (DashboardSchedule).
  - Badges: `badge badge-primary` vs. inline `bg-red-500/15 text-red-400 border …`.
- **Effect**: visually inconsistent, impossible to theme, expensive to evolve.

### 2.2 No real "design tokens"
- Colors are hardcoded literals (`text-red-400`, `bg-red-900/20`). DaisyUI semantic tokens (`primary`, `base-200`) are partially used but inconsistent.
- No standardized spacing, radius, elevation, or motion duration scales.

### 2.3 Responsive ≠ Adaptive
- One layout scales with `sm:`/`md:`/`lg:` breakpoints. Mobile gets the desktop card grid shrunk down — not a *mobile-native* experience.
- The bottom sliding menu is the only mobile-specific component, and it is duplicated in scope with `Header.tsx`'s mobile drawer (`mobileMenuOpen`).
- Tap targets are inconsistent: 32px in some places, 44px in others. iOS HIG demands 44pt; Android Material 48dp.

### 2.4 Motion is inconsistent and accidental
- `framer-motion` is installed and barely used.
- Hover transforms are random (`hover:scale-[1.02]`, `hover:-translate-y-0.5`, `hover:translate-x-0.5`).
- No coordinated entrance choreography. Cards pop in simultaneously with no stagger.
- `prefers-reduced-motion` is referenced in CSS classes (`motion-safe:`) but no consistent enforcement.

### 2.5 Loading states are bare
- Mostly spinners. Skeletons exist (`ui/Skeleton.tsx`) but are barely used in dashboard surfaces.
- No optimistic updates anywhere.

### 2.6 Empty states are uninspired
- "No classes today" → small icon + 1 line of text. No call-to-action visual hierarchy. No personality.

### 2.7 Error states are jarring
- Full-page red card replaces the whole dashboard on a single failed fetch (see `Dashboard.tsx` lines ~35-55 and `StudentDashboard.tsx` lines ~30-44). User loses *all* context.
- Should be **inline per-section** error states with retry, not a page-wide takeover.

### 2.8 Density and rhythm
- Inconsistent vertical spacing (`space-y-6`, `space-y-8`, mixed `gap-3`/`gap-4`).
- Information density too low on desktop (24-inch users see 3 cards on a 4-column grid because of large padding).
- Information density too high on mobile (cards have 16px padding + nested grids).

### 2.9 Accessibility gaps
- Many decorative icons have no `aria-hidden`.
- Some buttons rely only on icon (no `aria-label`).
- Color-only state indicators in some places (`text-success`/`text-error` with no glyph).
- Focus rings are inconsistent (some `focus:ring-2 focus:ring-red-500`, others none).
- No skip-to-content link.

### 2.10 Performance
- `Dashboard.tsx` re-renders on every `accessToken` change (PollingProvider triggers parent re-render → all dashboard children).
- `DashboardStats` does not memoize stat objects.
- No virtualization on `StudentManager` / `PaymentManager` / `ClassManager` lists (relies on backend pagination only).
- Large lucide-react import surface (~50 icons across dashboard). Can be tree-shaken better with explicit imports.
- Background image / grid patterns rendered with CSS but no `will-change` discipline.

### 2.11 Dark-mode inconsistency
- Some components hardcode `text-white` / `bg-gray-900`; others use `text-base-content` / `bg-base-200`. App is dark-only by design but the contradiction will block any future light mode and creates contrast bugs (e.g. `text-white` on `bg-base-200/50` could be unreadable if the theme changes).

### 2.12 Typography
- No type scale. Headings use raw classes (`text-2xl sm:text-3xl lg:text-4xl`) without rhythm.
- Body copy is mostly `text-sm text-gray-400` — low contrast (~3.8:1) below WCAG AA for body text.
- No font weight system (mixes `font-medium`, `font-semibold`, `font-bold`, `font-black` without hierarchy).

### 2.13 Iconography
- Lucide is great but used inconsistently in size (`w-3 h-3` to `w-12 h-12` with no scale).
- Stroke width never customized — opportunity to give the brand a sharper martial-arts feel with `strokeWidth={1.5}`.

---

## 3. Target Design System

### 3.1 Brand voice
- **Disciplined** — generous negative space, strict alignment, no decorative noise.
- **Sharp** — angular accents, thin precision lines, decisive contrast.
- **Tactile** — every interactive element gives haptic-like feedback (depth, sound-cue-like motion).
- **Black-and-Red** — black is the canvas, red is the strike. Red is *rare and meaningful*, not background filler.

### 3.2 Color tokens (Tailwind v4 `@theme`)
Add to `src/index.css` under a single `@theme` block. **Single source of truth.**

```css
@theme {
  /* Surface ramp — pure black to elevated charcoal */
  --color-surface-0:  oklch(0.08 0 0);   /* canvas */
  --color-surface-1:  oklch(0.12 0 0);   /* card */
  --color-surface-2:  oklch(0.16 0 0);   /* elevated card */
  --color-surface-3:  oklch(0.22 0 0);   /* hover */
  --color-border:     oklch(0.26 0 0 / 0.6);
  --color-border-strong: oklch(0.34 0 0);

  /* Brand red — controlled ramp */
  --color-strike-50:  oklch(0.96 0.04 25);
  --color-strike-400: oklch(0.68 0.21 25);  /* hover/text on dark */
  --color-strike-500: oklch(0.62 0.24 25);  /* primary */
  --color-strike-600: oklch(0.55 0.24 25);  /* pressed */
  --color-strike-700: oklch(0.47 0.21 25);
  --color-strike-900: oklch(0.28 0.13 25);  /* depth */

  /* Text ramp */
  --color-ink-primary:   oklch(0.98 0 0);
  --color-ink-secondary: oklch(0.78 0 0);   /* WCAG AA on surface-1 */
  --color-ink-muted:     oklch(0.62 0 0);
  --color-ink-disabled:  oklch(0.42 0 0);

  /* Status — desaturated for cohesion */
  --color-success: oklch(0.72 0.16 145);
  --color-warning: oklch(0.78 0.16 75);
  --color-danger:  oklch(0.62 0.24 25);   /* same as strike-500 */
  --color-info:    oklch(0.72 0.10 230);

  /* Radius scale */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  /* Elevation (shadow) */
  --shadow-card: 0 1px 0 oklch(1 0 0 / 0.04) inset, 0 8px 24px -12px oklch(0 0 0 / 0.6);
  --shadow-pop:  0 1px 0 oklch(1 0 0 / 0.06) inset, 0 18px 40px -16px oklch(0 0 0 / 0.7);
  --shadow-strike: 0 0 0 1px var(--color-strike-500), 0 12px 32px -8px oklch(0.62 0.24 25 / 0.4);

  /* Motion */
  --ease-out-strike: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-snap:       cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:   140ms;
  --duration-base:   220ms;
  --duration-slow:   360ms;
}
```

DaisyUI theme override to point `primary` → `--color-strike-500`, `base-100` → `--color-surface-0`, etc., so existing DaisyUI-using components inherit automatically.

### 3.3 Spacing & rhythm
Vertical rhythm = 4px base. Use only: `gap-2 / gap-3 / gap-4 / gap-6 / gap-8 / gap-12`. **Ban** `gap-5`, `gap-7`, `gap-10`.

Section spacing:
- Mobile section gap: `space-y-6`
- Desktop section gap: `space-y-10`

### 3.4 Typography scale
| Token | Class | Use |
|---|---|---|
| Display | `text-4xl md:text-5xl font-black tracking-tight` | Greeting only |
| H1 | `text-2xl md:text-3xl font-bold tracking-tight` | Page title |
| H2 | `text-lg md:text-xl font-bold` | Section title |
| H3 | `text-base font-semibold` | Card title |
| Body | `text-sm md:text-base text-ink-secondary` | Default body |
| Caption | `text-xs text-ink-muted uppercase tracking-wider` | Labels |
| Mono | `font-mono text-sm` | IDs, codes |

Body color must hit ≥ 4.5:1 contrast on `surface-1`.

### 3.5 Iconography
- Lucide, `strokeWidth={1.75}` default (sharper, more "blade-like").
- Sizes: `w-4 h-4`, `w-5 h-5`, `w-6 h-6` only.
- Action buttons → `w-5`, decorative inline → `w-4`, hero/empty-state → `w-6`.

### 3.6 Motion language
| Pattern | Duration | Easing | Use |
|---|---|---|---|
| Hover lift | 140ms | `ease-out-strike` | Cards, buttons |
| Press depth | 80ms | `ease-snap` | All actionable |
| Page enter | 360ms | `ease-out-strike` | Route transitions, stagger 40ms |
| Modal in | 220ms | `ease-out-strike` | Overlay scale 0.96 → 1 |
| Skeleton shimmer | 1400ms | linear | Loading |
| Number tick | 600ms | `ease-out-strike` | KPI counters |

Implementation: a tiny wrapper `<Motion.fadeUp>` over Framer Motion with predefined variants. **No raw `animate-` classes** in components.

### 3.7 Tactile / "dopaminic" details
- KPI cards: animated count-up on first paint (Framer Motion `useMotionValue` + `animate`).
- Card hover: subtle red 1px border-glow + 2px lift — *not* scale, which causes layout jitter on grids.
- Press feedback: 80ms compress (`scale-[0.98]`) + brief inner-shadow.
- Streak/achievement micro-confetti (red sparks only) on first unlock — once per session, persisted.
- Optional success haptic on Capacitor (`Haptics.impact({ style: 'Light' })`) for primary actions.
- Pull-to-refresh: red rope-tension indicator that "snaps" on release.

### 3.8 Adaptive (not just responsive)
- **Mobile (<768px)**: stacked, full-bleed cards, 16px gutters, sticky compact header, bottom sheet for detail, swipe gestures (already in `BottomSlidingMenu`), thumb-zone primary actions.
- **Tablet (768–1023)**: 2-column grids, side rail nav (already there).
- **Desktop (≥1024)**: 3-4 column grids, hover affordances enabled, denser typography, keyboard shortcuts (`g d` → dashboard, `g s` → students, `?` → cheatsheet).

Mobile-only and desktop-only components live under `src/components/dashboard/_mobile/` and `src/components/dashboard/_desktop/` with a thin **dispatcher** at `src/components/dashboard/Dashboard.tsx` that picks one based on `useMediaQuery('(min-width: 768px)')` — chosen at mount, *not* swapped on resize, to avoid layout thrash.

---

## 4. Component library — additions

### 4.1 Primitives to add (in `src/components/ui/`)
| Component | Purpose |
|---|---|
| `Surface.tsx` | Replaces ad-hoc `<div class="bg-gray-800 rounded …">`. Variants: `flat`, `raised`, `outline`, `strike` (red-bordered). |
| `Stat.tsx` | KPI primitive: label, value, delta, trend icon, optional sparkline. Animated count-up. |
| `Section.tsx` | `<header><h2><actions/></header><body>` shell. |
| `EmptyState.tsx` | Icon, title, description, primary action. Used everywhere no data. |
| `InlineError.tsx` | Per-section error with retry. Replaces page-takeover errors. |
| `Sparkline.tsx` | 60×24 SVG line chart (no library — small inline path). |
| `Streak.tsx` | Visualizes consecutive-day attendance with red flame nodes. |
| `Sheet.tsx` | Bottom sheet for mobile detail views (replaces full Modal on small screens). |
| `Kbd.tsx` | Keyboard shortcut chip. |
| `CommandPalette.tsx` | `cmd+k` global navigator (desktop only). |
| `Skeleton.tsx` | Already exists — extend with `<SkeletonStat>`, `<SkeletonRow>`, `<SkeletonCard>` presets. |
| `Motion.tsx` | Framer Motion variant wrappers: `FadeUp`, `Stagger`, `PressableMotion`. |

### 4.2 react-bits / external?
**Recommendation: do NOT pull `react-bits` as a dep.** Its install-via-CLI model copies code into the repo; adding 10+ unused components inflates the bundle and conflicts with our token system. **Selectively port** (with attribution) only these patterns, rewritten against our tokens:

- "Magnet" hover effect → for primary CTAs only (subtle, ≤4px pull). [reactbits.dev]
- "Counting Number" → for KPI cards.
- "Shiny Text" → reserved for a single hero greeting word ("Welcome back, **Camilo**").
- "Magic Border" → on the active sidebar item (animated red gradient sweep, very slow, low opacity).

All ported as small in-house components under `src/components/ui/effects/`. Total added bundle target: **<6 kB gzipped**.

### 4.3 Charts
Currently no chart lib. Analytics page renders bars with raw divs. Add **`recharts@^2`** (gzipped ~38 kB, tree-shakes per chart) or hand-rolled SVG if we want to stay lean. **Decision: hand-rolled SVG `<Sparkline>` + `<BarStack>` + `<DonutGauge>`** under `src/components/ui/charts/`. Zero dep added.

---

## 5. Surface-by-surface plan

Each surface has: **(M)** mobile changes · **(D)** desktop changes · **(B)** behavior changes.

### 5.1 Layout chrome

**Sidebar** ([src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx))
- (D) Width 240px (was 256). Tighter type scale. Active-item: animated red gradient sweep + 2px left bar.
- (D) Collapse-to-rail toggle (icon-only mode), persisted to localStorage. Saves 192px on dense screens.
- (D) Footer block: app version, online/offline dot, language switcher chip.
- (B) Keyboard: `g + key` shortcuts; focus-visible outlines.

**Header** ([src/components/layout/Header.tsx](src/components/layout/Header.tsx))
- **Split into two files**: `HeaderDesktop.tsx` and `HeaderMobile.tsx`.
- (D) Real working search → opens `<CommandPalette>`. Shows `⌘K` chip.
- (D) Compress avatar dropdown into a clean menu (Settings, Profile, Logout). Remove inline language selector — move to Settings.
- (M) Sticky, 56px height, blur backdrop on scroll. Center logo, left menu, right notification bell + avatar.

**BottomSlidingMenu** ([src/components/layout/BottomSlidingMenu.tsx](src/components/layout/BottomSlidingMenu.tsx))
- (M) Visual polish: 4px red drag handle (was generic gray), peek 64px showing current section + breadcrumb.
- (M) Replace search input with role-aware quick chips: "My classes", "Today", "Pending".
- (B) Snap-points using Framer Motion drag, not manual pointer math (cuts ~120 lines).

**NotificationBell**
- (D/M) Popover dropdown grouped by day, marked-read on hover. Badge: red dot only (no number) until ≥3, then pill.
- (B) Empty state with disciplined copy: "All clear. Stay sharp."

**PullToRefresh**
- (M) Replace generic spinner with red "rope tension" SVG that stretches as user pulls and snaps when triggered. ~30 lines.

### 5.2 Dashboard home — Admin/Instructor

[src/components/Dashboard.tsx](src/components/Dashboard.tsx)

**(M+D)** New composition:
1. **Greeting strip** — `<DashboardHero>`: large display greeting, today's date, weather/discipline quote (optional, deferred), primary CTA "Start today's class" if a class is in the next 60 min.
2. **Pulse row** (`<PulseRow>`) — 4 KPI stats with count-up + sparkline + WoW delta. Replaces `DashboardStats`.
3. **Pending approvals card** — only if `count > 0`. Compact (no longer a full grid). Animated entry.
4. **Today's schedule** — timeline view (mobile: vertical with current-time line; desktop: horizontal rail).
5. **Activity feed** — single column, grouped by hour.
6. **Quick actions** — 4 large tactile tiles (mobile: 2×2; desktop: hidden if Command Palette is available — replaced by tooltip "Press ⌘K").
7. **Insights block** — 2 charts (revenue trend, attendance heatmap). Mobile: swipeable carousel; desktop: side-by-side.

**(B)** Remove page-takeover error. Each section owns its `<InlineError>`.

### 5.3 Dashboard home — Student
[src/components/dashboard/StudentDashboard.tsx](src/components/dashboard/StudentDashboard.tsx)
- **(M)** "Next class" hero countdown card — full bleed, time-until live ticker, location chip, "Get directions" CTA.
- **(M+D)** Belt progression block: visual belt bar (current → next), % requirements met, next exam date.
- **(M+D)** Streak block: `<Streak days={N}>` — flame nodes for last 7 sessions. Tap to expand to month view.
- **(M+D)** Payments status: single card (paid/due) with month chip; tap → payment history sheet.
- **(M)** "Scan QR" button promoted to floating action button (FAB) above bottom menu. Persistent thumb access.

### 5.4 `/students` ([src/components/StudentManager.tsx](src/components/StudentManager.tsx))
- **(D)** Two-pane: left = virtualized list (already have `@tanstack/react-virtual`!), right = student detail with tabs (Profile / Attendance / Payments / Belt).
- **(M)** Single column. Card row → tap opens bottom sheet with same tabs.
- **(B)** Search uses fuzzy match (`@tanstack/react-virtual` lib already present); filter chips (active, by belt, by discipline) sticky at top.
- New: bulk actions bar appears when ≥1 row selected.

### 5.5 `/classes` ([src/components/ClassManager.tsx](src/components/ClassManager.tsx))
- **(D)** Switchable view: Grid / List / Week-grid. Persisted preference.
- **(M)** Day-grouped list with sticky day headers; pull-to-refresh.
- **(B)** Inline edit for class capacity (number stepper); long-press on mobile to enter selection mode.

### 5.6 `/payments` ([src/components/PaymentManager.tsx](src/components/PaymentManager.tsx))
- **(D)** 3-column dashboard: month summary chart (left), filterable table (center), recent activity (right).
- **(M)** Tab strip "This month / Pending / All". Each row: amount-first design, status pill, swipe-left for delete.
- **(B)** Add quick-add FAB on mobile.

### 5.7 `/calendar` ([src/components/CalendarView.tsx](src/components/CalendarView.tsx))
- **(D)** Month + week views, drag to reschedule (admin), color-coded by discipline.
- **(M)** Week scroller (horizontally swipeable), day-detail bottom sheet with timeline.
- **(B)** "Today" pill always reachable. `j`/`k` keyboard nav on desktop.

### 5.8 `/attendance` ([src/pages/Attendance.tsx](src/pages/Attendance.tsx) + [src/components/AttendanceManager.tsx](src/components/AttendanceManager.tsx))
- **(D)** Class roster with one-tap check-in toggle, real-time count, QR generation panel inline.
- **(M)** Big "Scan QR" button, then roster sheet. Optimistic toggles with undo toast.
- **(B)** Show check-in method icon (manual / QR / geo) inline.

### 5.9 `/belt-testing` ([src/pages/BeltTesting.tsx](src/pages/BeltTesting.tsx))
- **(D)** Calendar of upcoming exams, candidate roster per exam, results entry grid.
- **(M)** Card per exam, tap to drill down.
- **(B)** Result entry uses keyboard-friendly `<Pass>/<Fail>` toggle with optional score.

### 5.10 `/analytics` ([src/pages/Analytics.tsx](src/pages/Analytics.tsx))
- **(D)** 4-up KPI strip + 2 charts row + table. Real charts via in-house SVG components.
- **(M)** KPI carousel (one card visible at a time, dot indicator) + stacked charts. Tap chart to expand.
- **(B)** Date range picker becomes a sheet on mobile, popover on desktop. Comparison toggle ("vs. previous period").

### 5.11 `/profile` ([src/pages/StudentProfile.tsx](src/pages/StudentProfile.tsx))
- **(M+D)** Hero with avatar, name, belt insignia, member-since. Tabs: Personal / Disciplines / Attendance / Payments / Settings.
- **(B)** Inline edit (no separate edit modal). Save on blur with toast.

### 5.12 Settings (`src/components/settings/`)
- **(D)** Two-pane: nav left, panel right.
- **(M)** Single page with section anchors and back-button on each detail.
- (B) Group: Account, Appearance (placeholder for future themes), Notifications, Language, Mobile (haptics, install prompt), Danger zone.

### 5.13 `/my-attendance` ([src/pages/StudentAttendance.tsx](src/pages/StudentAttendance.tsx))
- **(M+D)** Heatmap calendar (last 90 days) with red intensity, streak block at top, list of recent sessions.

### 5.14 PendingApprovals ([src/components/admin/PendingApprovals.tsx](src/components/admin/PendingApprovals.tsx))
- **(D)** Compact list with inline approve/reject buttons + confirm modal.
- **(M)** Stack of action cards, swipe-right to approve / swipe-left to reject (with confirm).

---

## 6. Performance plan

1. **Memoize** `DashboardStats`, `DashboardSchedule`, `DashboardActivity` with `React.memo`. Stabilize props with `useMemo` in parent.
2. **Lift PollingProvider state**: split into `<PendingApprovalsProvider>` and `<NotificationsProvider>` so a notification update does not re-render the dashboard.
3. **Virtualize** Students/Classes/Payments lists (`@tanstack/react-virtual` already installed).
4. **Lazy-load** chart components (Analytics page only). Already lazy at route level — extend to chart sub-blocks.
5. **Image strategy**: avatars served from `/api/avatars`. Add `loading="lazy"` and width/height attributes everywhere.
6. **CSS**: Tailwind v4 already JIT'd. Audit final CSS bundle; target ≤ 60 kB gzipped (currently 24 kB — good).
7. **JS budget**: target initial route ≤ 250 kB gzipped (currently `pages-pcqsXR6X.js` = 90 kB gz). Confirm dashboard route alone ≤ 60 kB.
8. **`will-change`** only on actively animating elements (sidebar already does this — extend selectively).
9. **`content-visibility: auto`** on below-the-fold dashboard sections.
10. **Avoid** layout-shifting hover transforms on grid items; use border/shadow only.

---

## 7. Accessibility plan (WCAG 2.2 AA)

- Color contrast: every text token verified ≥ 4.5:1 (body) / 3:1 (large text).
- All interactive elements ≥ 44×44 px hit area on mobile.
- Visible `:focus-visible` ring (2px red, 2px offset).
- `aria-label` on every icon-only button.
- `aria-live="polite"` on toast region and inline error blocks.
- Skip-to-content link.
- Modal/Sheet trap focus; restore on close.
- `prefers-reduced-motion`: all motion variants degrade to opacity-only.
- Keyboard map documented in `<CommandPalette>` (`?` to open cheatsheet).

---

## 8. Mobile-native concerns (Capacitor)

- Safe-area insets honored everywhere (`env(safe-area-inset-*)` already partial — make global via CSS variable on `<body>`).
- Bottom menu must clear gesture bar.
- Tap delays: ensure no 300ms FastClick-style lag; use `touch-action: manipulation`.
- Haptics on primary CTAs (only when `Capacitor.isNativePlatform()`).
- Pull-to-refresh disabled on Capacitor WebView when native scroll bounce conflicts.

---

## 9. i18n

All new copy goes through `react-i18next`. Add new keys under `dashboard.*`, `ui.*`, `empty.*`, `error.*` namespaces. Keep keys in `src/i18n/` resources synchronized for `en` and `es`.

---

## 10. Testing strategy

- **Visual**: Storybook is not present. Skip — instead add Playwright screenshot smoke per surface (`npm run test:e2e:visual`). Phase 2.
- **Unit**: cover new primitives (`Surface`, `Stat`, `EmptyState`, `Sparkline`).
- **A11y**: `vitest` + `axe-core` snapshot per route.
- **Manual**: device matrix — Pixel 6 (Capacitor APK), iPhone 13 Safari, Desktop Chrome 1440px, Desktop Firefox 1920px.

---

## 11. Rollout plan (5 sequential PRs after this audit)

| PR | Title | Scope | Risk |
|---|---|---|---|
| 1 | **Design tokens + UI primitives** | `index.css` `@theme`, DaisyUI override, new primitives in `ui/`, motion wrappers. **No surface changes yet.** | Low |
| 2 | **Layout chrome** | Sidebar, Header split, BottomSlidingMenu polish, NotificationBell, PullToRefresh. | Medium |
| 3 | **Admin/Instructor dashboard home** | `Dashboard.tsx`, all `dashboard/*` blocks, Pending approvals. | Medium |
| 4 | **Inner routes pass A** | `/students`, `/classes`, `/payments`. Two-pane patterns. | Medium |
| 5 | **Inner routes pass B** | `/calendar`, `/attendance`, `/belt-testing`, `/analytics`, `/profile`, settings, student dashboard, `/my-attendance`. | Medium |

Each PR ships behind a feature flag `localStorage.uiV2 === '1'` initially → flip on for staging → ship to prod after one round of feedback.

---

## 12. Definition of done (per surface)

A surface is "done" when:
1. Renders correctly at 360, 768, 1024, 1440, 1920 widths.
2. All text ≥ WCAG AA contrast on `surface-1`.
3. No `bg-gray-XXX` / `text-white` / `bg-base-200` literals — only tokens.
4. Loading state = `<Skeleton*>`, not spinner.
5. Empty state = `<EmptyState>` with action.
6. Error state = `<InlineError>`, not page takeover.
7. Memoized; no avoidable re-renders measured with React DevTools profiler.
8. Keyboard navigable end-to-end.
9. Reduced-motion variant verified.
10. Tested on Capacitor APK (debug build) on physical Android device.

---

## 13. Open questions for the user

1. **Belt insignia art** — do we want bespoke SVG belt graphics per discipline, or generic colored bar?
2. **Streak gamification intensity** — confetti/haptics on milestones (yes/no)? May feel out-of-character for serious dojos.
3. **Weather/quote in greeting** — keep, drop, or behind a setting?
4. **Command palette (`⌘K`)** — desktop only, or include on mobile via search bar?
5. **Light theme** — explicitly defer, or design tokens that accommodate it from day 1?
6. **Charts library** — accept hand-rolled SVG (zero deps) or accept `recharts` (~38 kB gz)?
7. **Reduce bundle**: is dropping `daisyui` on the table (replacing all `btn`/`card`/`badge` with our primitives)? Saves ~30 kB CSS but is a bigger PR.

---

*End of audit. Implementation begins per `MASTER_PROMPT.md` only after user sign-off.*
