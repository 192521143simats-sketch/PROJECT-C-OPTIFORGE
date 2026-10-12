# Explicit user requirement overrides

## 2026-10-12 — Reusable default network admission

The user explicitly superseded master M2 R03's single-use-only admission: multiple devices must explicitly consent and join through the same network link while admission is open, subject to the network node limit. Every network has one default link, invoked by default. Admin can revoke/invoke it using a toggle. A revoked link must not enroll and must show an apt expired/unavailable page. Invoking restores the same default URL. Existing enrolled workers remain authenticated; the admission toggle is not node revocation or network disable.

Implementation: append-only MySQL migration 0003, existing NetworkService/admission transactions and existing join page. Keep explicit consent, scoped worker cookies/bearers, stable node IDs, reservation deadline, capability checks and atomic node limits. Retrieval/toggling is admin-only. The default public admission token is stored recoverably for repeated admin copy actions; it is not an admin password or private worker credential. Treat shared links as sensitive admission invitations; keep them out of logs/referrers/analytics. Network expiration/disable still overrides an invoked link.

Previously hashed-only default tokens cannot be recovered. Migration supplies each existing network one fresh default link without changing users, enrolled worker credentials, IDs, jobs or artifacts. Admin retrieves that link after coordinator startup. Old unrecognized links show unavailable; existing single-use invitation API remains compatible but cannot bypass a revoked network admission gate. Historical invitation evidence and frozen migrations 0001/0002 are not rewritten.

This is a bounded user-directed admission change, not permission to redesign compilers, authentication, worker protocols, dashboards or deployment.
