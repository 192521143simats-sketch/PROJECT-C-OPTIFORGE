# GRID-X worker protocol v1

Transport: authenticated `/ws/worker`. Browser enrollment uses a scoped HttpOnly cookie and validated Origin; native clients send `Authorization: Bearer <scoped credential>` over WSS outside local development. No credentials in URLs. `/version` advertises application/protocol version. Every envelope includes integer `protocolVersion: 1`; unsupported/missing versions receive `PROTOCOL_INCOMPATIBLE` then close 1008. Old pages/agents must reload/update, not silently send legacy messages.

Worker → coordinator:

- `register`: capability `profile` (worker/device type, real toolchain availability/version, supported operations, CPU/core/memory descriptions).
- `heartbeat`: bounded `resources`, observation timestamp and measurement availability.
- `task_state`: assigned `taskId`, positive `attempt`, `RUNNING` or `FAILED`, optional bounded error.
- `task_result`: matching `taskId`/`attempt`, result, actual nonnegative execution time and resources.
- `disconnect`: explicit departure from transport. Leave-network API revokes enrollment.

Coordinator → worker:

- `registered`: stable `nodeId`, heartbeat interval 1–60 seconds (currently 5 s).
- `task_assignment`: `taskId`, `attempt`, `taskKind`, schema-validated matching allow-listed payload.
- `error`: stable code and bounded message; policy violation closes 1008, which stops blind credential/protocol reconnect loops.

Kinds/operations: TEST_COMPUTE → SHA-256, prime count, bounded SHA chain; C_OPTIMIZE_IR → C IR function optimization; PYTHON_COMPILE/ JAVA_COMPILE → corresponding native pipeline only. Shell commands are never an operation. Browser performs portable compute/IR, not native toolchains. Android/Windows implementations must use this contract as it evolves, not fork the coordinator.

Authority: coordinator validates schema/version, enrollment on registration and each subsequent message, and task/node/attempt/network ownership through persistence. Revocation closes scope. Native and browser clients now validate coordinator envelopes, not unchecked casts. Existing result semantic verification, durable leases, cancel/pause/resource policy and additional portable catalogue are still open requirements; v1 does not falsely claim those implemented.

Compatibility policy: coordinated development upgrade from unversioned legacy to v1; no indefinite legacy admission or duplicate protocol. Future incompatible changes require a new version, explicit negotiation/upgrade path and fixture tests across all worker applications.

## Admission and revocation

Admin creates a network with `POST /api/admin/networks`, which supplies its first single-use `joinUrl`. `POST /api/admin/networks/:networkId/invitations` issues additional invitations with optional `ttlMinutes` (1–1440, default 15) and `workerTypes` (`BROWSER`, `NATIVE`, `ANDROID`). `POST /api/admin/invitations/:invitationId/revoke` invalidates an unused invitation. Only token hashes are persisted; never log or persist the returned URL in analytics.

`GET /api/join/:token` inspects without admission. `POST /api/join/:token/accept` requires `consent:true`, `workerType` and `deviceIdentity`. A token admits exactly one enrollment atomically; expired/revoked/consumed tokens return 410, occupied/reserved capacity returns 409, disallowed worker type returns 403. Public information tokens cannot enroll. A ten-minute registration deadline prevents pending enrollments from holding slots indefinitely. Existing worker credentials and IDs are not rotated by this migration.

Browser admission sets only a scoped HttpOnly cookie. Native and Android admission returns `workerCredential` for secure client storage and subsequent bearer authentication, never a URL parameter. `ANDROID` is a distinct identity limited to portable capabilities; protocol support is not an APK or device-test claim. `POST /api/worker/leave` accepts either mechanism, revokes the enrollment/current node atomically, closes its socket and requeues eligible work. Reconnect cannot evade revocation/capacity or renumber nodes.
