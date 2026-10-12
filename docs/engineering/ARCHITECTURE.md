# Existing architecture and implementation map

React/Vite → cookie-authenticated Fastify APIs → MySQL repositories/auth/network service → persisted jobs/tasks/attempts → capability/network scheduler → WebSocket browser or native worker → result aggregation → MySQL artifact bytes → owner/admin-authorized download.

MySQL is the sole runtime database. Browser computes bounded SHA/prime/C IR optimization in Web Workers; Node detects native toolchains and compiles Python/Java; C frontend/IR/aggregation/GCC generation runs through existing coordinator/compiler packages. Language internals remain distinct and share orchestration.

Public network information must be separated from atomic single-use enrollment invitations (R03). Preserve stable per-network node numbering. Introduce versioned shared worker envelopes before platform clients; extend existing task/attempt and artifact models rather than duplicate systems. New Windows desktop/core and Kotlin Android modules attach to the same authoritative coordinator/protocol/database. Android/browser advertise only portable capabilities, never native toolchains.

Root Compose currently starts MySQL only; backend/frontend run host npm scripts. Existing Windows scripts launch Docker, wait for engine/MySQL, launch app and preserve volume. Do not silently replace this development path with a new database/stack.
