# Payments History & Overdue Notifications Revamp

## Goal
Give admins/instructors a complete monthly view of payments since launch and a
dedicated overdue section that lets them send a forced-confirmation pending
payment notification to the student. When the student confirms, the admin is
notified back.

## Architecture (SRP-first)
- **API endpoints** (Cloudflare Pages Functions, SSR-friendly):
  - `GET /api/payments/history` → aggregated monthly buckets (admin/instructor).
  - `GET /api/payments/overdue` → overdue students (admin/instructor).
  - `POST /api/payments/notify-overdue` → create pending-payment notification.
  - `POST /api/notifications/confirm` → student confirms; system notifies admin.
- **Schema**: notifications table is extended idempotently with
  `requires_confirmation`, `confirmed_at`, `action_type`, `metadata`,
  `confirmation_notify_user_id`. Migration ships and `ensureNotificationsSchema`
  upgrades existing DBs at runtime (compatible with Workers cold starts).
- **Frontend**:
  - `PaymentManager` becomes a tab host (Manage / History / Overdue).
  - Each view orchestrates its own data hook (`usePaymentHistory`,
    `useOverdueStudents`) and pure presentation components (one component =
    one responsibility).
  - `NotificationBell` renders a non-dismissable `PaymentConfirmationCard` when
    a notification has `action_type=payment_pending` and is unconfirmed. Mark-as-read
    and delete are disabled until confirmation.

## Quality gates
- Strict TypeScript (no `any`, no `as any`).
- Only `console.warn` / `console.error`.
- All UI strings i18n-keyed (en / es / pt).
- Lucide-react icons only.
- Stable React keys (no array index).
- Cloudflare Workers compatible (no Node-only APIs in `functions/`).
