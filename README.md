# Martial Arts Manager

[![CI](https://github.com/electrocicla/martial-arts-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/electrocicla/martial-arts-manager/actions/workflows/ci.yml)
[![CodeQL](https://github.com/electrocicla/martial-arts-manager/actions/workflows/codeql.yml/badge.svg)](https://github.com/electrocicla/martial-arts-manager/actions/workflows/codeql.yml)
[![Release](https://img.shields.io/github/v/release/electrocicla/martial-arts-manager)](https://github.com/electrocicla/martial-arts-manager/releases)
[![License](https://img.shields.io/github/license/electrocicla/martial-arts-manager)](LICENSE)

Open-source management platform for martial-arts schools and academies. The project combines a React/TypeScript application with Cloudflare Pages Functions and D1 to manage students, classes, attendance, payments, belt progression, branch operations, and analytics.

**Production:** https://hamarr.cl

**Latest stable release:** `v1.0.1`

## Why this project exists

Martial-arts schools often need operational software that reflects dojo-specific workflows instead of generic CRM assumptions. Martial Arts Manager provides a reusable OSS implementation for student lifecycle management, class scheduling, QR attendance, payments, belt progression, role-based access, and multi-branch administration.

The repository is actively maintained and the same codebase is used for the live Hamarr deployment.

## Core capabilities

- Student management and progression tracking.
- Class scheduling, capacity, instructors, and branch-aware operations.
- QR-based attendance and student attendance history.
- Payment tracking, overdue workflows, history, and operational reporting.
- Belt testing and progression workflows.
- Admin, instructor, and student roles with server-side authorization.
- Multi-branch management and branch-scoped data access.
- Analytics dashboards backed by application data.
- English, Spanish, and Portuguese internationalization.
- Responsive web/PWA surfaces with Capacitor/TWA mobile distribution workflows.

## Architecture

```text
src/                         React 19 application
  components/                UI and domain components
  hooks/                     reusable application hooks
  context/                   auth, branch and app state
  services/                  typed API clients
  pages/                     routed application surfaces
  i18n/                      translations

functions/                   Cloudflare Pages Functions
  api/                       HTTP endpoints
  middleware/                authentication helpers
  utils/                     database, JWT, rate limiting, payments, etc.

android/                    Capacitor Android project
docs/                        mobile/platform documentation
migrations/                  D1 database migrations
```


For trust boundaries, data flow, and deployment design, see [Architecture details](docs/ARCHITECTURE.md).

## Technology

- React 19 + TypeScript 5.9
- Vite / Rolldown
- Tailwind CSS 4 + DaisyUI
- React Hook Form + Zod
- Cloudflare Pages Functions / Workers
- Cloudflare D1
- Vitest + Testing Library + MSW
- Capacitor and Bubblewrap for mobile distribution workflows

## Security model

Security controls are enforced at the server boundary rather than relying on UI visibility.

- Public registration is constrained to the student role.
- Admin/instructor/student authorization is checked by API handlers.
- Student listing is blocked for student accounts to protect PII.
- Access tokens are held in application memory; refresh tokens use secure HTTP-only cookies for the web flow.
- Authentication endpoints use rate limiting and Cloudflare Turnstile where configured.
- Responses include CSP, HSTS, anti-framing, MIME-sniffing, referrer, permissions, and cross-origin security headers.
- Production secrets are supplied through Cloudflare secret storage and are not committed.
- Local D1 state, exports, query results, diagnostic output, and production data are excluded from Git.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Local development

### Requirements

- Node.js 22
- pnpm 10

```bash
git clone https://github.com/electrocicla/martial-arts-manager.git
cd martial-arts-manager
pnpm install --frozen-lockfile
pnpm dev:local
```

To run against the Cloudflare Pages Functions development runtime:

```bash
pnpm dev
```

Local environment values belong in ignored environment files such as `.dev.vars` or `.env.local`. Never commit production credentials or production data.

## Quality gates

Run the complete local gate with:

```bash
pnpm check
```

Equivalent individual commands:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

GitHub CI runs the same validation categories on pushes and pull requests targeting `main`. CodeQL and Dependabot provide additional repository-level security and dependency checks.

## Production deployment

Production deployment is intentionally performed from the maintainer's local trusted environment rather than automatically from GitHub Actions.

```bash
pnpm deploy
```

The deploy lifecycle validates type safety, lint, and tests before building and publishing through Wrangler. Cloudflare credentials and runtime secrets remain outside the repository.

## Database

The application uses Cloudflare D1. The schema is defined in `schema.sql`, with incremental changes under `migrations/`.

For local development:

```bash
pnpm db:local
```

Production database commands should only be run intentionally from an authenticated maintainer environment. Database output and exports must never be committed.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. The repository includes issue templates, a pull-request checklist, a security policy, and a public [roadmap](ROADMAP.md).

Do not use real student/customer data in issues, tests, screenshots, examples, or pull requests.

## Releases

Stable releases follow semantic versioning. The first formal stable release is [`v1.0.0`](https://github.com/electrocicla/martial-arts-manager/releases/tag/v1.0.0).

## License

MIT. See [LICENSE](LICENSE).
