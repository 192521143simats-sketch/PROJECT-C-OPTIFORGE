# Phase 5 — existing web product implementation checklist

**Status: IN PROGRESS, not sealed.** Phase 4 v1 remains sealed at 4b75df2.

Goal: finish the existing GRID-X web product against the actual coordinator and
MySQL, without replacing working authentication, compilers, worker protocol or
database models. React/Vite and Fastify remain authoritative.

Specification: preserved MASTER_PROMPT.txt, B:20 Phase 5 (5485–5499),
M2 R12/R16, and later user UI overrides.

## Ordered acceptance tasks

- [x] Audit existing routes, current admin/compiler screens and Phase 4 evidence.
- [x] Reproduce empty/large pagination and inaccessible operation feedback.
- [x] Repair bounded, accessible pagination; preserve server-side 10/page queries.
- [x] Handle invalid/unavailable HTTP responses without exposing response bodies;
  preserve cookies, server authorization messages and actual successful JSON.
- [x] Remove only the unused legacy Admin and Dashboard implementations. App
  already routes to AdminV2 and DashboardV2; neither live screen is replaced.
- [ ] Complete authentication operation pending/error behavior and keyboard
  onboarding; test signup/reset redirects, eye controls, invalid/expired sessions.
- [ ] Implement authorized generic Compute Tasks submission/history/details using
  the existing task engine and catalogue, with owner-scoped APIs and real results.
- [ ] Finish admin task/job/node details, independent table paging, policies and
  live state/error recovery; preserve consolidated overview and Audit-only events.
- [ ] Implement required settings/onboarding and configurable privacy-safe
  Resend/PostHog adapters. Core operation must not depend on external availability.
- [ ] Run actual browser user/admin journeys against isolated MySQL/coordinator,
  including downloads, admission toggles, failure states and responsive keyboard UX.
- [ ] Review, fix/retest, run complete workspace/compiler regressions, update
  granular requirements/evidence, then seal only the verified acceptance scope.

## Constraints and rulings

- MySQL records, credentials, volumes, backups and unrelated files remain untouched.
- User submits language/source/filename, not a chosen network. Server selection
  remains authoritative. Compilation history remains in the admin console per
  the later explicit user request; do not restore the removed user history UI.
- Native packages and physical worker/device acceptance retain their later gates.
- Real email needs explicit approval and configured sender; no claimed delivery
  from a mock. Analytics must exclude code, secrets, admission URLs and artifacts.
- Cleanup removes generated residue only, not regression tests or sample programs.
- User explicitly requested autonomous execution; ordinary implementation does
  not wait for another design approval. No deployment/publication is authorized.

## Current test-first evidence

Pagination: 3 behavioral failures before repair (empty Next enabled, missing
current-page announcement, 10,002 controls for 10,000 pages); 7 passed afterward.
HTTP: 2 failures before repair (unavailable service and malformed response);
4 real local HTTP fixture tests passed afterward. Feedback: 2 failures before
repair (missing alert/status semantics); 4 passed afterward.
Review-driven page-shrink recovery: 1 React-DOM failure before fix; 2/2 DOM tests
passed afterward. Full suite: 269/269, all workspace checks/builds passed.

These component/HTTP checks are not actual browser-to-MySQL end-to-end acceptance.
This checklist deliberately does not convert a partial implementation into a
Phase 5 seal.
