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
