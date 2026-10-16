# Practical threat model — initial Phase9 review

Scope: existing coordinator/MySQL, browser, Windows native and Android native
workers. This is a control inventory and gap list, not a completed penetration
test, public deployment acceptance or unrestricted-code sandbox certification.

| Threat | Existing control and evidence | Open work |
|---|---|---|
| Unauthorized joining | Random network admission, explicit consent, transactionally checked active/revoked/expiry/capacity; Verify-Reusable-Link.mjs and Verify-Enrollment.mjs | New admin approval gate not yet implemented |
| Stolen worker credential | Scoped network/enrollment/node authentication rechecked per message; revocation/leave; DPAPI and Android Keystore; physical Android leave/reconnect accepted | Rotation and operator workflow not yet accepted; endpoint compromise can steal in-process credentials |
| Fabricated task result | Stored input and schema checked, portable outputs independently recomputed, C transformations verified, native compilation rederived; portable-verification.test.ts and Verify-Task-Results.mjs | Cannot infer arbitrary program semantic equivalence from a hash; explicit input-hash protocol binding needs review |
| Replayed or stale result | Task/node/network/attempt and MySQL lease checks, terminal-state guards, separate attempt history; Verify-Task-Leases.mjs, Verify-Task-Recovery.mjs | Fresh mixed-platform adversarial run still required |
| Malicious source | Language validation, genuine compiler diagnostics, bounded process trees and isolated Docker final execution; compilation-verification.test.ts and Verify-Execution.mjs | Native compilation is not universal untrusted-source containment; Kubernetes execution adapter remains open |
| Browser session attack | Argon2id, server-side sessions/HttpOnly cookies, role/owner checks, origin/CSRF guards; auth.test.ts/runtime-http.test.ts and actual web product suite | Production DNS/TLS/proxy acceptance unavailable; no claim of comprehensive web penetration test |
| Denial of service | Input bounds, rate limits, leases, bounded retries, cancellation, resource policy and worker allowlists; existing protocol/task tests | Global concurrency, verifier cost and unbounded SQL queue deserve measured load testing |
| Coordinator compromise | Workers execute fixed supported task contracts, never coordinator shell strings; worker isolation policies and credential-scoped authorization | Compromised authority can schedule valid abusive work; stronger host/network containment, operational response and key rotation remain open |
| Supply chain / malicious package | Lockfile, current npm audit zero advisories, pinned private Node and Gradle checksums | Official public package registry/checksum download verification and production signing not established |
| Secret leakage / monitoring gaps | Safe URL logging and hashed credential persistence; log-privacy.test.ts; persisted auth/enrollment/admin events | Audit rejected results/authorization failures comprehensively; review every protocol error response before declaring leakage-free |

New Phase9 endpoint guard rejects HTTPS local/private/development destinations in
production configuration. DNS resolution/rebinding, certificate ownership and
actual public reachability are separate checks; lexical checks do not prove them.

No blockchain, SIEM, custom cryptography or ML threat detector is introduced.
No phone can advertise GCC/CPython/JDK merely because it runs portable compute.
TLS authenticates/protects transport; it does not establish correctness or safe
execution of submitted code. Package hashes establish byte identity, not trust in
the publisher or semantic correctness of compilation.
