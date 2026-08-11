# Roadmap

Martial Arts Manager is in stable `v1.x` production use. The roadmap prioritizes reliability, security, maintainability, and reusable open-source value over feature count.

## Current priorities

### Security and privacy

- Keep authorization checks at API boundaries and expand regression coverage for role/branch isolation.
- Maintain secret scanning, CodeQL, dependency updates, rate limiting, secure headers, and safe authentication flows.
- Keep production data, local D1 state, exports, diagnostics, and credentials outside Git history.

### Quality and maintainability

- Increase coverage around critical payment, attendance, authentication, and multi-branch workflows.
- Continue decomposing high-complexity surfaces into single-responsibility services, hooks, and components.
- Keep TypeScript strict, avoid `any`, and preserve deterministic quality gates.

### Product and platform

- Continue improving mobile/native parity and low-friction attendance workflows.
- Improve operational analytics while preserving least-privilege data access.
- Refine multi-branch administration and student lifecycle workflows based on production use.

### Open-source readiness

- Maintain actionable issues and contribution documentation.
- Publish release notes for meaningful stable changes.
- Prefer small reviewable pull requests and document architecture decisions that are useful to downstream adopters.

## Release policy

Stable releases follow semantic versioning. Security fixes may be released outside the normal feature cadence when required.
