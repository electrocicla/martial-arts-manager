# Changelog

All notable stable changes are documented here. This project follows semantic versioning.

## [1.0.1] - 2026-08-10

### Security and repository hardening

- Removed tracked local Wrangler/D1 state and production-query outputs from the current repository snapshot.
- Expanded `.gitignore` to prevent local databases, production exports, environment files, agent state, diagnostics, signing material, and nested companion repositories from being committed.
- Repaired the MIT license file so GitHub can identify the project license correctly.
- Replaced automatic GitHub-to-production deployment with validation-only CI; production remains an explicit local maintainer action.
- Added CodeQL analysis, Dependabot configuration, security policy, contribution policy, issue forms, and pull-request checks.
- Aligned deployment quality gates so typecheck, lint, and tests run before production builds are published.
- Refreshed public documentation for the production deployment at `hamarr.cl` and the project's OSS maintenance model.

## [1.0.0] - 2026-08-10

First formal stable GitHub release of Martial Arts Manager.

### Highlights

- Student, class, attendance, payment, and belt-progression management.
- QR-based attendance workflows and student portal.
- Role-based authentication for admins, instructors, and students.
- Multi-branch administration and mobile-focused management improvements.
- Analytics and operational dashboards backed by application data.
- English, Spanish, and Portuguese internationalization.
- Cloudflare Pages Functions / Workers and D1 backend with React and TypeScript.
