# Manzur Web V2 — deployment / identity / provenance ledger
## Orchestrator identity
- Own taskId: deployment-child-f562b96d22dd3f97b4dc57e054c29832.
- Own agentInstanceId: web-child-f562b96d22dd3f97b4dc57e054c29832.
- Own lifecycleEpoch/sessionId: 4eb6da02-6b3f-45de-a80e-7ac80e20c4a2, independently CONNECTED to rootIndex6 martial-arts-manager.
- Parent taskId martial-manzur-web-v2-pm-20261115-1501 and sessionId db422fb9-3011-4c4e-a239-25c80daedfd9: coordination only; send failed when parent became inactive.
- Parent initial deploymentId f33cfad6-74e3-474c-ae2e-5685a7bb1bbe previously flagged blocked; do not duplicate. Own lifecycle verified despite that earlier deployment status.
- Direct authoritative ChatGPT conversation URL: **NOT VERIFIED**, not derivable from task/agent/deployment IDs.
- Independently deployed subworkers: **none**.

## Repository publication
- github.com/electrocicla/martial-arts-manager branch feature/manzur-white-label-multitenant.
- Entry HEAD 014e1e4d1f54f78831e52f2614c433729d04c83e, origin ahead0/behind0, 33 dirty/untracked. Existing Nov13 integration edits still must be treated as prior owner work; nested Native separate repository.
- Task commit/push receipt: **PENDING VALIDATION**. Do not state committed=true or pushed without exact source verification.
- Live Hamarr production: **NO DEPLOY**.
- Manzur Pages production: **NO DEPLOY**; project exists but empty prior secret inventory and unresolved security blockers.
- Shared D1: 4ad2408a-54e1-45e3-a352-42be3e284299; shared R2: martial-arts-manager-bucket; no migrations, database writes, secret operations or bucket writes.
- Manzur Pages `manzurbros` https://manzurbros.pages.dev is an expected route, not verified active deployment.
- Required owner-controlled secrets: JWT_SECRET and TURNSTILE_SECRET; 2026-11-13 read-only secret inventory found neither. 2026-11-15 inventory not yet verified.
- Gate: authenticated legacy Hamarr R2 GET must be live on old hostname before Manzur shared R2 uploads, with Native image behavior preserved.
- Gate: native login/register client hint is spoofable and isolate-local limiter insufficient; safe replacement and live proof absent.
- Gate: release requires real tenant/branch, payment webhook signature/idempotency, dual builds and four-client smoke tests, owner Cloudflare approvals.
