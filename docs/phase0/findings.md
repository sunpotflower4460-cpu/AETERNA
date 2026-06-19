# Phase 0 Findings

- `src/core/AeternaNetwork.js` で Core から Observer へ直接 import していたため、Phase 0 原則に合わせて bridge 経由へ移した。
- weakPlasticity は観測用トレースと runtime 反映可能経路が同居しており、Phase 2 の writeback review が必要。
- vital/breath 系の語彙は `externalDriveField` 周辺で禁止テストにより監査されており、「現象の意味付け」を設計で作らない方針に合致する。
