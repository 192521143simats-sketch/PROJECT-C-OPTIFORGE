# Existing architecture and implementation map

React/Vite → cookie-authenticated Fastify APIs → MySQL repositories/auth/network service → persisted jobs/tasks/attempts → capability/network scheduler → WebSocket browser or native worker → result aggregation → MySQL artifact bytes → owner/admin-authorized download.

MySQL is the sole runtime database. Browser computes bounded SHA/prime/C IR optimization in Web Workers; Node detects native toolchains and compiles Python/Java; C frontend/IR/aggregation/GCC generation runs through existing coordinator/compiler packages. Language internals remain distinct and share orchestration.

Explicit user override supersedes single-use default admission (R03): networks have reusable invoked/revocable default links, with separate consenting device enrollments and atomic capacity. Stable per-network node numbering is preserved. Versioned v1 shared worker envelopes and migration history exist; extend the task/attempt and artifact models rather than duplicate systems. New Windows desktop/core and Kotlin Android modules attach to the same authoritative coordinator/protocol/database. Android/browser advertise only portable capabilities, never native toolchains.

Root Compose currently starts MySQL only; backend/frontend run host npm scripts. Existing Windows scripts launch Docker, wait for engine/MySQL, launch app and preserve volume. Do not silently replace this development path with a new database/stack.

Compiler publication now independently verifies native output from stored source
and C IR transformations. Final supported programs execute through the owned
Docker Linux controller, then measured evidence and actual artifacts enter the
existing atomic job/artifact publication. Runtime failure does not fabricate a
compiler failure or discard valid compiled outputs. Background finalization leaves
the versioned worker heartbeat/result message queue responsive. See COMPILER_USAGE
for target-specific output and isolation boundaries.
