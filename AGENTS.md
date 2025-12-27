# Repository Guidelines

## Main Rules
- We work on windows 11 with powershell, commands must be compatible.
- the use of 'any' or 'as any' types is totally prohibited, this are low level code and must be avoided, instead develop high level solutions ready for production.
- Always clean and delete deprecated or duplicated files after working, and always read the files before deleting them and compare them to related files to understand the real use of suspicious files.
- Always check for official guidelines of dependancies to work with high level official code.
- Always search for related components before creating a new file, you always must avoid creating duplicated files.
- Always WORK with SOLID, DRY, SRP principles while creating code, if you se chances of improving monolithic code you always ask User if he wants to Refactor that file with SOLID and SRP for better performance and scalability of the code.
- Always work with safe and secure code.
- Always check for memory leak issues and properly manage memory performance in your code.
- Always work with high standart code, create high level solutions and develop anything that is missing to consolidate or integrate missing sections.
- avoid creating backup files, unless is totally necesary and delete them after main task is completed and the backup is no longer needed.

## Project Structure & Module Organization
- `src/` contains the React 19 + TypeScript client; domain folders such as `components/`, `pages/`, `hooks/`, `lib/`, and `i18n/` split UI, feature logic, utilities, and translations.
- `functions/` houses Cloudflare Pages Functions (`api/`, `middleware/`, `utils/`, `types/`) and mirrors route topics (`students.ts`, `classes.ts`, etc.); keep new APIs aligned with this convention.
- `migrations/` and `schema.sql` define D1 schema updates; run them via the Wrangler scripts before testing auth- or data-heavy changes.
- `public/` holds static assets served by Vite; build outputs land in `dist/` and should not be committed.

## Build, Test, and Development Commands
- `pnpm install` to sync dependencies (pnpm is assumed throughout).
- `pnpm dev` starts Wrangler Pages locally with functions and D1 bindings; `pnpm dev:local` runs pure Vite when backend stubs suffice.
- `pnpm build` (tsc + vite) produces the production bundle; `pnpm preview` serves the built app for smoke testing.
- `pnpm lint`, `pnpm typecheck`, and `pnpm db:local`/`pnpm db:prod` (apply schema to Cloudflare D1) must pass before any PR; `pnpm deploy` publishes to the Pages environment.

## Coding Style & Naming Conventions
- Use 2-space indentation, TypeScript strict types, and React functional components; co-locate feature hooks under `src/hooks` and prefix them with `use`.
- Component/script files stay PascalCase (`StudentManager.tsx`), utility modules remain camelCase, and SQL tables/columns use snake_case as seen in `schema.sql`.
- Tailwind 4 classes drive styling; reuse primitives under `src/components/ui/` before introducing new variants.
- Run `pnpm lint` after significant changes—ESLint enforces import order, unused vars, and hooks rules.

## Testing Guidelines
- Automated tests are not yet checked in; lean on `pnpm lint`, `pnpm typecheck`, and targeted manual QA of students, classes, payments, and calendar flows.
- When adding tests, group them near the feature (`src/**/__tests__` or `*.test.tsx`) and ensure they run under Vite’s tooling; document manual scenarios in the PR description until a runner is added.

## Commit & Pull Request Guidelines
- Follow the existing Conventional Commit pattern (`feat(calendar): …`, `fix(comments): …`) and keep scopes aligned with folder names.
- Every PR should outline the change, reference related issues or TODO items, note database migrations, and include UI screenshots or recordings when UI changes are visible.
- Confirm `pnpm build`, `pnpm lint`, and any D1 migrations have been run locally before requesting review; mention deviations explicitly.
