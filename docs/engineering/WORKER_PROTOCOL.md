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

Kinds/operations: TEST_COMPUTE → SHA-256, prime count, bounded SHA chain; C_OPTIMIZE_IR → C IR function optimization; C_COMPILE → actual native GCC source compilation; PYTHON_COMPILE/ JAVA_COMPILE → corresponding native pipeline only. Shell commands are never an operation. Browser performs portable compute/IR, not native toolchains. Android/Windows implementations must use this contract as it evolves, not fork the coordinator.

The additive v1 full-source C operation is capability-gated: only a node advertising
`runtimes.c=true` AND `operations.nativeCSource=true` receives `C_COMPILE`.
Absent flag means unsupported, including older native v1 clients. Existing IR and
other tasks remain compatible. Native compiler payloads carry optional `sourceName`
(safe basename) and actual `source`; older callers retain compiler defaults.
`task_state` may carry at most 100 located error/warning diagnostics (2000 characters
per message). Compiler diagnostics are terminal for that attempt/job; transport
loss/timeouts retain existing retries. Native result envelopes carry actual output
bytes as base64, generated source, diagnostics and truthful transformation evidence.
The coordinator checks language/operation, file names, bounds, bytecode/executable
headers and nonempty bytes before committing artifacts. WebSocket payload limit is
32 MB to accommodate bounded class/JAR outputs; source HTTP limits are unchanged.
These are integrity screens, not independent verification of an adversarial worker.

Authority: coordinator validates schema/version, enrollment on registration and each subsequent message, and task/node/attempt/network ownership through persistence. Revocation closes scope. Native and browser clients now validate coordinator envelopes, not unchecked casts. Existing result semantic verification, durable leases, cancel/pause/resource policy and additional portable catalogue are still open requirements; v1 does not falsely claim those implemented.

Compatibility policy: coordinated development upgrade from unversioned legacy to v1; no indefinite legacy admission or duplicate protocol. Future incompatible changes require a new version, explicit negotiation/upgrade path and fixture tests across all worker applications.

## Admission and revocation

Admin creates a network with `POST /api/admin/networks`, which supplies its reusable default `joinUrl`, enabled by default. `GET /api/admin/networks/:networkId/join-link` retrieves it; `POST` to that endpoint with `{enabled:true|false}` invokes/revokes admission without revoking enrolled workers. These endpoints are admin-only and audited without tokens. The default token is stored recoverably so the admin can retrieve the same link; it is a public admission token, never a worker/admin credential. Never log URLs or persist them in analytics. Network expiration/disable overrides admission. This explicitly supersedes master M2 R03 per USER_REQUIREMENT_OVERRIDES.md.

`GET /api/join/:token` inspects without admission. `POST /api/join/:token/accept` requires `consent:true`, `workerType` and `deviceIdentity`. The same invoked default token admits multiple separate enrollments atomically under network capacity. Revoked/expired links return 410; occupied/reserved capacity returns 409. A ten-minute registration deadline prevents pending enrollments from holding slots indefinitely. Migration 0003 supplies a fresh default link to existing hashed-only networks, without rotating private worker credentials or node IDs. Retrieve the new default link after startup.

Legacy explicit single-use invitation endpoints remain compatible, including type/expiry/replay checks, but cannot bypass the network admission toggle. They are not the ordinary admin UI workflow.

Browser admission sets only a scoped HttpOnly cookie. Native and Android admission returns `workerCredential` for secure client storage and subsequent bearer authentication, never a URL parameter. `ANDROID` is a distinct identity limited to portable capabilities; protocol support is not an APK or device-test claim. `POST /api/worker/leave` accepts either mechanism, revokes the enrollment/current node atomically, closes its socket and requeues eligible work. Reconnect cannot evade revocation/capacity or renumber nodes.
