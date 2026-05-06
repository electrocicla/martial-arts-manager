# MercadoPago Integration — Plan & Strategy

## Goal
Integrate MercadoPago **Checkout Pro** end-to-end so admins can configure a MercadoPago account from a new Settings section, activate it once all secrets are valid, and enable a "Pay with MercadoPago" button on every student record. Differentiate MercadoPago vs manual payments in the Payment History UI.

## Why Checkout Pro
- Easiest integration: REST-only, no SDK, fully compatible with Cloudflare Workers (`fetch` based).
- Hosted checkout page handled by MercadoPago — we never see card data → PCI scope minimized.
- Webhooks (IPN v2) deliver `payment.updated` events with HMAC `x-signature` for verification.
- Works across LATAM (CL/AR/BR/MX/...).

## API endpoints used (server-to-server)
- `POST https://api.mercadopago.com/checkout/preferences` — create checkout session
- `GET  https://api.mercadopago.com/v1/payments/{id}` — fetch payment details from webhook
- `GET  https://api.mercadopago.com/users/me` — credentials test (Test button)

## Architecture

### Backend (Cloudflare Pages Functions)
- `functions/utils/mercadopago.ts`
  - `createPreference(accessToken, payload)`
  - `getPayment(accessToken, paymentId)`
  - `verifyWebhookSignature(secret, headers, dataId)`
  - `testCredentials(accessToken)`
- `functions/api/payments/mercadopago/config.ts` (GET/PUT) — admin only, masks secrets on GET
- `functions/api/payments/mercadopago/status.ts` (GET) — public-safe status (enabled?, public_key)
- `functions/api/payments/mercadopago/preference.ts` (POST) — create preference for student payment
- `functions/api/payments/mercadopago/webhook.ts` (POST) — IPN receiver, no auth, signature validated
- `functions/api/payments/mercadopago/test.ts` (POST) — admin only, validates access token

### Database
Migration `migrations/add_mercadopago_payment_source.sql`:
- `payments.payment_source` TEXT default `'manual'` (`'manual' | 'mercadopago'`)
- `payments.external_id` TEXT NULL (MercadoPago payment id, indexed unique when not null)
- `payments.external_reference` TEXT NULL (our generated reference)
- Index on `external_id` for webhook idempotency.

### Frontend
- `src/services/mercadopago.service.ts`
- `src/hooks/useMercadoPago.ts`
- `src/pages/Settings.tsx` — new admin Settings hub (route `/settings`)
- `src/components/settings/MercadoPagoSettings.tsx` — config form with show/hide secret toggles, activation switch, Test button, validation chips
- `src/components/payments/MercadoPagoPayButton.tsx` — reusable button (any student, any amount/type)
- Wire into `StudentTable` + `StudentGrid` (admin-only column/action)
- Wire into `PaymentList` to show **MercadoPago** vs **Manual** badge
- Add `/settings` route in `App.tsx`
- Add Settings nav entry (admin only) in `mobileMenuConfig.ts`
- i18n keys for everything

### Activation Rules
The system can only be activated when ALL of:
- `accessToken` non-empty (server-side validated against `/users/me`)
- `publicKey` non-empty (starts with `APP_USR-` or `TEST-`)
- `accountEmail` valid email
- `webhookSecret` non-empty (we still accept payments without it but reject webhook updates)
- `currency` set (`CLP`, `ARS`, `BRL`, `MXN`, `USD`, ...)
- `defaultAmount` > 0 (used as suggested amount)
- `enabled === true`

### Security
- Access token / webhook secret stored in `settings.value` JSON (admin-scoped row).
- GET config endpoint masks secrets (`accessToken: "****abcd"`); raw secret only kept in DB.
- Webhook signature validation rejects unsigned/invalid payloads with 401.
- All admin endpoints check `auth.user.role === 'admin'`.
- No secret ever logged.

## Workflow
1. DB migration + schema update.
2. Backend utility + endpoints.
3. Frontend service + hook.
4. Settings page + MercadoPago section UI.
5. PayButton component, wire into Student components.
6. Source badge in PaymentList.
7. Settings route + sidebar entry.
8. i18n entries (en + es).
9. `pnpm run scan --include-hints` → fix everything → re-run → 0 issues → commit & push.

