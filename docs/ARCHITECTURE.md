# Architecture

## System context

Martial Arts Manager is a production web application for martial-arts school operations. The public client is a React/TypeScript application. Application APIs run as Cloudflare Pages Functions / Workers and persist operational data in Cloudflare D1.

```text
Browser / installed PWA
        |
        | HTTPS
        v
Cloudflare edge
  - static application assets
  - Pages Functions API
  - global security middleware
        |
        +---- D1 database
        +---- Cloudflare secret bindings
        +---- approved external service APIs
```

Production is served at `hamarr.cl`. GitHub is the source-control and collaboration surface; deployment to production is intentionally performed from a trusted local maintainer environment rather than from repository Actions.

## Trust boundaries

### Client

The browser is untrusted. Role checks and hidden UI elements are convenience controls only; authorization decisions belong to server handlers.

Access tokens are kept in application memory. The web refresh token is transported in a `Secure`, `HttpOnly`, `SameSite=Strict` cookie. Native authentication uses an explicitly separated transport path.

### API boundary

Cloudflare Pages Functions authenticate requests, authorize access, validate request data, and scope branch-aware operations before reaching D1.

The global middleware provides defense in depth by:

- assigning a correlation identifier to responses;
- converting uncaught failures into a stable error envelope;
- sanitizing 5xx responses so internal database or implementation details are not returned to clients;
- enforcing CSP, HSTS, anti-framing, MIME-sniffing, referrer, permissions, and cross-origin headers.

### Data layer

D1 stores application data including personally identifiable information required for school operations. Production data is not a development fixture and must never be copied into Git, issues, screenshots, examples, or pull requests.

Local Wrangler/D1 state is ephemeral developer state and is excluded from version control.

### Secrets

Runtime credentials and secrets are supplied by Cloudflare or ignored local environment files. Repository code must not contain production credentials, signing keys, database exports, or copied secret values.

## Major domains

```text
Authentication & authorization
Students & progression
Classes & scheduling
Attendance & QR workflows
Payments & overdue workflows
Branches & transfers
Analytics
Notifications
Settings & profile
```

The frontend favors typed services/hooks/components. The backend groups request handlers under `functions/api` and common security/data primitives under `functions/middleware` and `functions/utils`.

## Multi-branch isolation

Branch resolution is a server-side concern. Requests that operate on branch-scoped records resolve the active branch at the API boundary and constrain database operations accordingly. Authorization checks must not be delegated to client-supplied presentation state.

## Error handling

Expected validation and authorization failures use explicit 4xx responses. Unexpected failures are logged server-side and leave the production boundary as a generic 5xx response with a request identifier. This keeps diagnostics useful without disclosing schema, query, stack, or infrastructure details to clients.

## Quality gates

The repository requires four local validation classes before a production deployment:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

`pnpm check` executes the complete sequence. GitHub CI repeats these validation categories for changes to `main`. CodeQL, Dependabot, secret scanning, and push protection provide repository-level security controls.

## Deployment boundary

`pnpm deploy` is an explicit maintainer operation. Its `predeploy` lifecycle runs typecheck, lint, and the test suite before the production build is published with Wrangler. GitHub Actions do not hold Cloudflare deployment credentials and do not deploy production automatically.

## Related mobile repository

The local workspace may contain a nested `martial-arts-manager-native` checkout. It is a separate Git repository and is intentionally ignored by this parent repository so histories, dependencies, caches, and release workflows remain isolated.
