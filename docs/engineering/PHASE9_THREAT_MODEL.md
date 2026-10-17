# Practical threat model — Phase9 local review, 17 October 2026

Scope: existing coordinator/MySQL, browser, Windows native and Android native
workers. This is a control inventory and gap list, not a completed penetration
test, public deployment acceptance or unrestricted-code sandbox certification.

| Threat | Existing control and evidence | Open work |
|---|---|---|
| Unauthorized joining | Random network admission, explicit consent, transactionally checked active/revoked/expiry/capacity, audited administrator approval and link replacement; phase9.integration.ts and real web approval acceptance | Public production-origin acceptance remains open |
| Stolen worker credential | Scoped identity checks per message, revocation/leave, protected DPAPI/Keystore storage, self/admin rotation and replacement import; API rejects old credentials and preserves identity | Updated Android rotation lifecycle test built but not rerun on absent phone; endpoint compromise can steal in-process credentials |
| Fabricated task result | Stored input and schema checked, portable outputs independently recomputed, C transformations verified, native compilation rederived; portable-verification.test.ts and Verify-Task-Results.mjs | Cannot infer arbitrary program semantic equivalence from a hash; explicit input-hash protocol binding needs review |
| Replayed or stale result | Task/node/network/attempt and MySQL lease checks, terminal-state guards, separate attempt history; Verify-Task-Leases.mjs, Verify-Task-Recovery.mjs | Fresh mixed-platform adversarial run still required |
| Malicious source | Language validation, genuine diagnostics, bounded processes, real Docker final execution; Kubernetes Job adapter has spec/fake-API tests | Native compilation is not universal untrusted-source containment; actual Kubernetes runtime/CNI/admission containment still needs a cluster |
| Browser session attack | Argon2id, server-side sessions/HttpOnly cookies, role/owner checks, origin/CSRF guards; auth.test.ts/runtime-http.test.ts and actual web product suite | Production DNS/TLS/proxy acceptance unavailable; no claim of comprehensive web penetration test |
| Denial of service | Input bounds, rate limits, leases, bounded retries, cancellation, worker allowlists; package downloads have request budgets and four concurrent checksum slots, tested under competing requests | Wider load/queue behavior still needs measured capacity testing; bounded package verification does not prove whole-platform DoS resistance |
| Coordinator compromise | Workers execute fixed supported task contracts, never coordinator shell strings; worker isolation policies and credential-scoped authorization | Compromised authority can schedule valid abusive work; stronger host/network containment, operational response and key rotation remain open |
| Supply chain / malicious package | Lockfile, npm audit zero advisories, pinned private Node/Gradle checksums; actual local package size/SHA validation and path/symlink/descriptor checks before streaming | Official published release verification and production signing not established; hashes do not establish publisher trust |
| Secret leakage / monitoring gaps | Safe URL logging and hashed credential persistence; log-privacy.test.ts; persisted auth/enrollment/admin events | Audit rejected results/authorization failures comprehensively; review every protocol error response before declaring leakage-free |

New Phase9 endpoint guard rejects HTTPS local/private/development destinations in
production configuration. DNS resolution/rebinding, certificate ownership and
actual public reachability are separate checks; lexical checks do not prove them.

No blockchain, SIEM, custom cryptography or ML threat detector is introduced.
No phone can advertise GCC/CPython/JDK merely because it runs portable compute.
TLS authenticates/protects transport; it does not establish correctness or safe
execution of submitted code. Package hashes establish byte identity, not trust in
the publisher or semantic correctness of compilation.
