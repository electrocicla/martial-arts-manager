# Contributing to Martial Arts Manager

Martial Arts Manager is an MIT-licensed production application used to manage martial-arts school operations. Contributions should preserve security, data privacy, strict typing, and production reliability.

## Development setup

Requirements:

- Node.js 22
- pnpm 10
- A Cloudflare account only when testing Cloudflare-specific functionality

```bash
pnpm install --frozen-lockfile
pnpm dev:local
```

For the Cloudflare Pages Functions runtime:

```bash
pnpm dev
```

## Quality gates

Before opening a pull request, run:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

`pnpm check` runs the complete validation sequence.

## Engineering rules

- Keep TypeScript strict and do not introduce `any`.
- Prefer small, single-purpose modules and explicit domain types.
- Preserve role-based authorization at the API boundary; UI visibility is not an authorization control.
- Never commit credentials, `.env` files, Wrangler local state, database files, production exports, customer/student data, or query results.
- Use synthetic data in tests and examples.
- Add or update tests for behavioral changes and bug fixes.
- Keep API responses free of internal error details that could disclose implementation or sensitive state.
- Avoid introducing new runtime dependencies when a small local implementation is sufficient.

## Pull requests

A pull request should explain the problem, the implementation, security/privacy impact, validation performed, and any migration or deployment considerations. Keep unrelated refactors separate.

## Security issues

Do not disclose vulnerabilities or production data in public issues. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the repository's MIT License.
