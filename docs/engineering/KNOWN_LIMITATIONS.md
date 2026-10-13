# Known limitations and blockers

- Browser and Android cannot execute native GCC/CPython/JDK processes; portable IR/compute only. Native/compiler execution must use compatible trusted, eventually contained workers.
- Host compiler temporary directories/timeouts are not a full sandbox. Supported final program execution now uses tested Docker Linux containment; see COMPILER_USAGE.md for bounds and target identity. Host compilation, Windows/Android OS containment and universal semantic guarantees remain open.
- Native Windows desktop/installer and Android application do not exist at baseline.
- ADB detected no connected phone on 2026-10-13. Historical Redmi detection is not current availability. Native APK is not yet built/installed/tested; no clean target Windows installation or production-signing evidence. These remain unverified release gates, not reasons to stop independent coding.
- Docker Linux engine is running after diagnostic startup. Developer DB table/row counts were read only; backups/SQLite value inspection remains pending. Isolated live verifiers now run without touching developer records/volume.
- Globally installed Node is non-LTS 26.8.1; verification uses the verified portable Node 24.21.0 runtime. Clean LTS archive installation passed the earlier runtime phase; native installer bundling remains open.
- Historical SQLite files and backup remain protected pending value inspection and deletion approval.
- Baseline automated coverage is narrow relative to the cumulative master, with Java concurrency-sensitive timeout and compiler semantic/security findings recorded in PROJECT_STATUS.
- Live provider configuration, real email permission, code-signing credentials and production publishing authorization have not been established.
