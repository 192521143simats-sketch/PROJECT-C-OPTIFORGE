# Initial threat model — open remediation backlog

Assets: account/password hashes and cookies, enrollment/node credentials, source/IP, MySQL/backup contents, coordinator availability, worker host/device, artifacts and release signatures.

Trust boundaries: untrusted web requests ↔ coordinator; untrusted participant ↔ scoped WebSocket; worker output ↔ coordinator verifier; submitted source ↔ native toolchain/execution sandbox; DB ↔ migrations/restore; release build ↔ signing/publishing.

Threats requiring tests/remediation: cross-origin cookie actions/WebSocket hijacking, spoofed proxy IP/rate-limit bypass, reusable enrollment/racing capacity, revoked or mismatched capabilities, stale/duplicate attempts, fabricated semantically incorrect results, malicious source/process/resource escape, artifact tampering/cross-owner download, sensitive logs/analytics, unsafe reset/restore, unsigned/tampered updates.

Current protections to preserve: Argon2id, hashed session/reset/enrollment tokens, HttpOnly cookies, role and job-owner checks, network-qualified assignment/results, schema/payload bounds, temporary compiler directories/time/output bounds. These do not constitute full native sandboxing or independent correctness validation.

Mitigation gates: explicit production origins/trusted proxies, validated WS/session scope; atomic invitations; versioned bounded protocol; independent task verification and durable leases; native container/OS containment; artifact digests; minimal logs and provider consent; protected migrations/backups/actual restore; verified signing/update chain. Record residual risk, never claim native workers are fully sandboxed today.
