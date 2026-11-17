# Manzur Bros web — shared D1/R2 production integration

## Definitive architecture (owner-approved, 2026-11-13)

There are four clients: Hamarr Web, Hamarr Native, Manzur Web and Manzur Native.
ALL FOUR use the exact same existing Cloudflare D1 database and R2 bucket.
Tenant isolation is logical: `organization_id`, authorized membership, role,
branch scope, JWT/session binding and R2 access checks. Neither previews nor
production require new D1 databases, buckets, copied accounts or a data migration.

Cloudflare Pages projects are independent deployment surfaces:
- Hamarr: `martial-arts-manager`, `hamarr.cl`; **do not redeploy or modify**.
- Manzur: `manzurbros`, `https://manzurbros.pages.dev` (created November 13).
  A future purchased `manzurbros.cl` is an alias on this SAME Pages project.

Current existing resource bindings from the Hamarr `wrangler.toml`:
- `DB`: Cloudflare D1 ID `4ad2408a-54e1-45e3-a352-42be3e284299`
- `AVATARS`: Cloudflare R2 bucket `martial-arts-manager-bucket`

Both must match the ID/name in `wrangler.manzur.toml`; the new Pages
project additionally pins `SITE_ORGANIZATION_ID=manzur` at server runtime.
The frontend builds Manzur with `VITE_ORGANIZATION_ID=manzur`. No user-supplied
header is sufficient to authorize another tenant. Manzur Web's same-origin
`/api` handlers use this Pages project's Functions; Native can retain its
existing Hamarr-hosted API route and explicit organization header.

The `wrangler.manzur.toml` is the source of truth for Manzur Pages runtime
bindings and outputs (Cloudflare Pages configuration mode). Verify every field
against Cloudflare before first upload; do not replace existing Hamarr settings.
The per-project encrypted `JWT_SECRET` and `TURNSTILE_SECRET` must be present
in Manzur Pages production; they are separate *secrets*, not data resources.
Never commit secrets or disable Turnstile as a shortcut. When creating a
separate Manzur JWT secret, sessions are host-specific and cannot be silently
shared across domains; the membership data remains shared in D1.

## Commands

```shell
pnpm typecheck
pnpm lint
pnpm test:run
pnpm test:web:build
pnpm build:web:hamarr
pnpm build:web:manzur
pnpm verify:web:hamarr
pnpm verify:web:manzur
```

These build only `dist/hamarr` and `dist/manzur`; they do not access remote
D1/R2. The old `pnpm deploy` remains exclusively Hamarr production and is
not part of the Manzur rollout. Manzur build validation rejects mixed branding,
Hamarr APK links, stale SW metadata and missing icons.

After *verified* tenant-isolation/negative QA, secret configuration, production
binding and account identity verification, release Manzur explicitly:

```powershell
$env:MANZUR_PAGES_DEPLOY_APPROVED='approve-manzurbros-pages'
$env:MANZUR_TENANT_SECURITY_QA_APPROVED='1'
pnpm deploy:web:manzur
```

This command does not create a database, bucket or domain. It targets only
`manzurbros` and the production branch `main`. Do not set the safety
environment flags unless the corresponding checkpoints actually passed.
Cloudflare access is via the existing Wrangler authenticated account.
Never run this operation on Hamarr production.

## Security acceptance gates

1. Verify production D1/R2 identity by **read-only** Cloudflare inventory.
   Verify all four clients use their intended `organization_id` and branch,
   without creating or copying users or students.
2. Negative tests: cross-tenant JWT, cookies, role and branch switching,
   registrations/approvals, classes, calendar, attendance, financial analytics
   and payments. A Manzur user never gains Hamarr rights (nor vice versa).
3. Shared R2: avatar upload/list/read/delete must enforce ownership and
   organization; existing R2 keys and records remain readable by their rightful
   owners. Never re-key or delete data as part of deployment.
4. Native remains compatible: no trusting `X-Client-Platform` as a proof of
   native identity, no Turnstile bypass solely from spoofable headers.
5. MercadoPago redirect/webhook origins, signature and payment references must
   be tenant-scoped. Never perform live checkout for smoke tests.
6. Lint/typecheck/functional/negative tests, both separate builds, PWA, login,
   onboarding, student approvals and actual same-tenant data parity.
7. Before deployment, compare remote Pages config and encrypted secret names.
   Fail closed on unknown account, Pages project, D1/R2 binding or host.
8. After first deployment, verify public HTTPS headers, assets, API denial
   tests and no Hamarr branding. Rollback affects Manzur Pages only.

## Operational status

As of initial creation on November 13, 2026, Cloudflare verified the
`manzurbros` Pages project and reserved `manzurbros.pages.dev`.
Creation of the project is **not** a successful deploy or evidence of a live
site; production asset/functions deployment remains a separate gate.

Nested `martial-arts-manager-native` is a separate ignored Git repository with
independent staged work. Do not commit its files through the parent repository.


## Security release blockers identified during implementation

- **Hamarr public avatar endpoint**: the live Hamarr deployment may still use
  the historical unauthenticated `GET /api/avatars?key=avatars/...` handler,
  while Manzur Native currently uses Hamarr's API origin. Since both apps use
  one R2 bucket and Manzur legacy keys have the `avatars/` prefix, hardening
  only Manzur Pages does not make those objects private. Coordinate a separately
  reviewed Hamarr Functions security deployment or a compatible namespace and
  Native migration. Do not launch shared-production R2 writes until this gap
  is closed and four-client image compatibility is proven.
- **Native spoofable transport marker**: legacy login/register exempt Turnstile
  based on `X-Client-Platform=native` and absence of browser Fetch Metadata.
  External HTTP clients can mimic these headers. Replace this with an actual
  validated native admission/attestation or compensating server-side protection
  before claiming production auth abuse resistance; never silently block the
  installed Native clients.
- **New Pages secrets missing**: a read-only `wrangler pages secret list
  --project-name manzurbros` returned no `JWT_SECRET` or
  `TURNSTILE_SECRET` in production. Provision securely with host-authorized
  Turnstile configuration for `manzurbros.pages.dev`. Do not reuse
  undocumented Hamarr secrets, store them in Git, or fake the deployment
  safety approval variables.

These are launch gates, not authorization to modify Hamarr production, D1
records, Native APK signing, user accounts, or the shared bucket.

## Integrated release candidate — 2026-11-17

Owner authorized the production Manzur release, not a Hamarr deployment. Reviewed scope and adopted the pending prior WEB-A/B/C/D application, CI, tenant-binding and build/config paths after inspection; previous V2 draft documents excluded. The separate preview still contains intentional warnings and disabled API; production uses the regular App/AuthProvider entry, not the visual-preview entry. Build verifier rejects preview worker, preview marker, noindex, missing PWA manifest and preview-only notices. Manzur-only middleware rejects Native transport spoofing and fails closed on missing JWT or Turnstile secrets. Native retains the existing Hamarr API origin. Updated login palette and shared catalog APK fallback; no changes to Native or data.

Live read-only evidence: Wrangler d1 list confirms martial-arts-db ID 4ad2408a-54e1-45e3-a352-42be3e284299; r2 bucket list confirms martial-arts-manager-bucket. Downloaded the actual Manzur Pages config to ignored dist/manzur-production-audit-20261117; its production environment has no D1/R2 bindings. Local wrangler.manzur.toml pins both existing resources and SITE_ORGANIZATION_ID=manzur; remote bindings NOT applied. Wrangler production secret inventory empty. Canonical host returns 404. One anonymous request to Hamarr with a synthetic nonexistent avatar key returned 404 Not found; no real avatar was requested, not evidence of privacy acceptance. Existing live legacy handler risk remains open. No remote data mutations or production deployment attempted.

The deployment script now obtains authoritative project details from the official Cloudflare Pages project GET API, instead of constructing a guessed production branch from project-list output. Provide CLOUDFLARE_ACCOUNT_ID and a scoped CLOUDFLARE_API_TOKEN through the local secure environment (neither was available together in this session); never log or commit them. It requires encrypted JWT_SECRET and TURNSTILE_SECRET in the verified project, and an explicit VITE_TURNSTILE_SITE_KEY for the Manzur host. Configure the verified Turnstile widget and securely generate a project-specific signing secret. Existing Wrangler OAuth remains usable for CLI, but does not establish separate REST environment authorization. Do not export/extract OAuth tokens. See https://developers.cloudflare.com/pages/functions/wrangler-configuration/ and https://developers.cloudflare.com/api/resources/pages/subresources/projects/ for the config and project API contracts.

Source QA before final preflight refinement: typecheck/lint 0, 264 tests passed/3 skipped, production Manzur and Hamarr builds 0 with brand/output guard, Functions compilation through Wrangler 0. Re-run after final preflight refinement. Actual authenticated four-client tenant/branch/avatars QA and Turnstile live acceptance remain unproven. Production deployment and shared remote bindings remain blocked; do not set QA approval flag until genuine acceptance. Preserve existing public visual-only preview. No new DB or bucket.

Final candidate QA (after remote preflight refinement): typecheck validation_7e6571b5529d4e83/run_3e9377c04b5344b1 PASS; lint validation_7c7187376ca54046/run_aa5edb0be3a14dc6 PASS; test validation_a070ed1c11be4af7/run_5584da0b566d427f PASS (265 tests passed, 3 skipped, 49 files passed, 1 skipped); both final production brand builds and output checks termrun_1c705a7b5bab4208b2ea4c317fc420a8 exit0; Worker compile termrun_a920d18ed7864699a543372128d5fe83 exit0. Live workspace QA, not authenticated production acceptance. No production deployment; remote Manzur D1/R2 bindings and secrets pending.
