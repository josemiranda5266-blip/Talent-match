# TalentMatch — production security checklist

## Verified on `production-hardening`

- Administrative API namespace `/api/admin/` is protected by `requireAdmin` and therefore requires a verified Firebase ID token with the `admin` or `role=admin` custom claim.
- Financial summary, reserve configuration and executive report endpoints require the same administrative claim.
- The registration flow does not grant administrative privileges from a client-selected role: a requested `admin` role is normalized to the normal athlete role.
- Demo Firestore seeding is gated by `VITE_DEMO_MODE` and is disabled automatically in production builds (`import.meta.env.PROD`).
- Public discovery reads use published projection collections (`publicAthletes`, `publicSearches`, `publicTeams`, `publicTournaments`) instead of exposing private operational collections.
- Sensitive Firestore collections use owner/participant/admin checks and the catch-all rule denies access by default.
- Operational collections used for server-side AI quota and Mercado Pago webhook idempotency are not client-readable or writable.
- Analytics responses are forced to neutral values and explicitly marked `MODELLED` until production telemetry is connected.
- Financial endpoints are explicitly marked `MODELLED` and start with neutral production data rather than fabricated business metrics.
- Production Mercado Pago callbacks require an explicit HTTPS `PUBLIC_APP_URL`; no real domain is stored in the repository.
- Production secrets are expected from the deployment environment / Secret Manager and are not committed to Git.

## External production actions still required

1. Configure `PUBLIC_APP_URL` with the real HTTPS application URL.
2. Configure `MERCADOPAGO_ACCESS_TOKEN` and `MERCADOPAGO_WEBHOOK_SECRET` in Secret Manager.
3. Configure `GEMINI_API_KEY` in Secret Manager before enabling AI routes.
4. Use a least-privilege Cloud Run service account with Firebase/Firestore and Secret Manager access required by the application.
5. Deploy the `production-hardening` image to Cloud Run and verify `GET /api/health` returns HTTP 200.
6. Perform one controlled real Mercado Pago transaction and verify the webhook, payment ledger and Premium activation end-to-end.
7. Connect real production telemetry before treating financial/analytics dashboards as operational accounting or business KPIs.

## Scope

This checklist documents repository-level verification. It does not claim that Cloud Run, Secret Manager, Firebase production rules, or Mercado Pago credentials have been externally configured unless those systems are independently verified.
