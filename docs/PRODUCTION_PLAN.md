# Talent-match — Production Hardening Plan

## Repository contract
- Repository: `josemiranda5266-blip/Talent-match`
- Current production-hardening branch: `production-hardening`
- Base: `main`
- No changes are made to unrelated repositories.

## Phase 0 — Baseline and release gate
- [x] Verify repository and current branch structure.
- [x] Audit package/build architecture.
- [x] Audit Firestore authorization rules.
- [x] Audit Storage authorization.
- [x] Identify committed financial/banking configuration.
- [ ] Run a clean install and production build in CI.
- [ ] Run Firestore/Storage emulator security tests.
- [ ] Run E2E smoke tests.

## Phase 1 — Critical security
- [x] Default-deny Firestore fallback rule.
- [x] Restrict user documents to owner/admin.
- [x] Restrict athlete records to owner/admin.
- [x] Restrict applications to participants/admin.
- [x] Restrict conversations/messages to participants/admin.
- [x] Prevent client-side creation of arbitrary notifications.
- [x] Restrict verification records and requests.
- [x] Restrict verified references to moderation/admin.
- [x] Remove banking data from `.env.example`.
- [x] Add Storage ownership and upload limits.

## Phase 2 — Public/private data model
Create dedicated sanitized public projections instead of exposing canonical private documents:
- `publicProfiles/{userId}`
- `publicAthletes/{athleteId}`
- `publicTeams/{teamId}`
- `publicTournaments/{tournamentId}`

Public documents must contain only fields intentionally exposed to unauthenticated users.

## Phase 3 — Backend hardening
Split the current large server into modules:
- authentication/authorization middleware
- AI service
- payment service
- profile service
- application service
- notification service
- moderation service
- billing/usage service

All privileged writes must use the Admin SDK behind authenticated, authorized API endpoints.

## Phase 4 — AI cost controls
- Per-user daily/monthly quotas.
- Per-plan quotas.
- Global monthly AI budget.
- Request payload limits.
- Output token limits.
- Persistent cache for multi-instance deployments.
- Usage telemetry by user, endpoint and model.

## Phase 5 — Media controls
- Reject unsupported MIME types.
- Enforce server-side size limits.
- Avoid Base64 fallback for production media.
- Generate optimized derivatives for images/video.
- Apply retention rules to unused media.

## Phase 6 — Real unit economics
Replace hardcoded financial health figures with measured data:
- active users
- paid users
- MRR/ARR
- payment fees
- AI token cost
- Firestore usage
- Storage and egress
- hosting
- refunds
- churn
- CAC/LTV

Financial dashboards must label estimates separately from measured costs.

## Phase 7 — Quality and operations
- Strict TypeScript.
- Unit tests.
- API integration tests.
- Firestore/Storage rules tests.
- E2E critical flows.
- CI on every pull request.
- Staging environment.
- Error monitoring.
- Structured logs and correlation IDs.
- Backups/export and recovery procedure.

## Phase 8 — Production release
Release only when all critical security tests pass and the production Firebase project is explicitly verified. Do not use the current AI Studio Firebase project as a production target without that verification.

## Initial cost target
For an early commercial MVP, target approximately **US$30–50/month of infrastructure** plus payment fees and optional marketing. Increase the budget only when measured usage requires it.
