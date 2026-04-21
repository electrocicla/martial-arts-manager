# Decisions — Dashboard UI/UX Revamp

> Recorded after audit sign-off. These override / extend the original [AUDIT.md](./AUDIT.md) §13 open questions.

| # | Question | Decision |
|---|----------|----------|
| 1 | Plan sign-off | ✅ **Approved**, proceed to PR 1 |
| 2 | Belt insignia | **Bespoke SVG belt graphics per discipline** (BJJ, Karate, Taekwondo, Judo, Muay Thai...). Add to `src/components/ui/belts/` |
| 3 | Gamification | **None** — pure disciplined. No flames, confetti, haptics on milestones. |
| 4 | Greeting extras | **Drop entirely** — clean greeting + date only |
| 5 | Command palette | **Both** desktop (`⌘K`) and mobile (search bar opens same palette) |
| 6 | Light theme | **Active dual-theme** — design + ship light + dark from PR 1, theme toggle in Settings + system preference auto-detect |
| 7 | Charts | **Hand-rolled SVG** in `src/components/ui/charts/` — zero new deps |
| 8 | DaisyUI | **Drop this revamp** — replace every `btn`/`card`/`badge`/`loading`/`tab`/etc. class. Saves ~30 kB CSS. |
| 9 | Flag rollout | **Single big-bang flag flip** at end of PR 5. v1 & v2 coexist mid-rollout. Legacy code removed in PR 6. |

## Implications on plan

### Light theme (decision #6)
- All tokens defined in pairs: `--color-surface-0-light` / `-dark`. Switch via `[data-theme="light"]` / `[data-theme="dark"]` on `<html>`.
- New file: `src/lib/themeTokens.ts` and `src/context/ThemeContext.tsx`.
- Surface contracts: `bg-surface-0` always means "current theme's canvas". Black-on-light, white-on-dark.
- Brand red **stays the same** in both themes (it is the brand).
- Theme toggle in `Settings` page; auto-detect via `prefers-color-scheme` on first visit.
- All surfaces validated WCAG AA on **both** themes.
- Lighthouse a11y score gate applies on both themes.

### Drop DaisyUI (decision #8)
- Remove `daisyui` from `package.json` only after every usage is replaced (last step of PR 5).
- Until then, our new tokens override DaisyUI variables so legacy components inherit new colors automatically.
- Replacement map (centralized in PR 1):
  - `btn btn-primary` → `<Button variant="primary">` (already exists, harden it)
  - `card`, `card-body`, `card-title` → `<Surface>` + composition
  - `badge`, `badge-primary`, `badge-sm` → `<Badge>` (already exists, expand variants)
  - `loading loading-spinner` → `<Spinner>` (new in PR 1)
  - `tabs`, `tab` → `<Tabs>` (new in PR 1; `TabButton` exists, formalize)
  - `modal` → already use custom `Modal` in most places
  - `alert` → `<Banner>` or `<InlineError>` per intent
  - `input`, `select`, `checkbox` → already custom-wrapped via `Input`, `Select`
  - `link` → standard `<a>` with token classes
- Color names: `primary`/`secondary`/`accent`/`neutral` Tailwind utilities provided by DaisyUI plugin → must be replaced with our token names (`strike`, `surface-N`, `ink-N`, `success`, `warning`, `danger`, `info`).

### Big-bang flag (decision #9)
- Each surface still gets its v2 alongside v1 during PR 2–5.
- Flag `localStorage.uiV2 === '1'` lets devs preview v2 throughout.
- At end of PR 5: single commit flips default to v2, deletes v1 code paths.
- Reduces risk of leaving the app in a "half-revamped" state visible to users.

### Command palette on mobile (decision #5)
- Mobile header search input no longer decorative — it focuses-into the palette overlay.
- Palette renders full-screen on mobile (no popover), fits keyboard.
- Adds ~3 kB to mobile bundle (acceptable).

### Bespoke belt SVGs (decision #2)
- Style: knotted belt rendered horizontally, real fabric texture via SVG filters (subtle), color according to belt level, discipline crest at the knot.
- Disciplines to support initially: `BJJ`, `Karate`, `Taekwondo`, `Judo`, `Muay Thai`, `Kickboxing`. Fallback to generic.
- Sizes: `sm` (32px), `md` (64px), `lg` (128px hero).
- Lazy-loaded per discipline (one chunk each, ~1 kB).

### No gamification (decision #3)
- Streak block stays as a *visualization* (last 7 days dots), no celebration on milestones.
- No haptics tied to visual milestones (Capacitor haptics still allowed for primary CTAs as a tactile *interaction* response, not as celebration).

### No greeting extras (decision #4)
- `DashboardHero` simplifies: `{Greeting}, {firstName}` + today's date + (if applicable) primary CTA "Start today's class". Nothing else.

---

*This file is read alongside AUDIT.md and MASTER_PROMPT.md. If a future decision conflicts with the audit, this DECISIONS.md wins.*
