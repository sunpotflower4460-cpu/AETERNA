# Phase 0 Core/Observer Split Record

## ディレクトリ構造

- `src/core/` : 現象を起こす側
- `src/observer/` : 現象を見る側
- `src/bridge/` : Core から Observer 情報を取得する read-only 経路

## 今回の分離適用

- `src/core/AeternaNetwork.js` の `../observer/*` 直接 import を削除し、`src/bridge/coreObserverReadBridge.js` 経由に統一。
- Core 側から Observer 側への「直接依存」を bridge に集約（read-only）。

## writeback 判定（Step 0-2）

### (A) 物理原則として writeback review が必要

- weakPlasticityTrace（`src/plasticity/weakPlasticity.ts`）
  - `requires_writeback_review: true`
  - 理由: `getResistanceScale` 経由で runtime 反映可能な経路を持つため。

### (B) Observer へ移動・維持できるもの

- vortex candidates
- CellObservation / Cell Inspector
- proto-neuron / proto-network 候補
- dynamic viability 指標の記録

### (C) 判別が難しくレビュー待ち

- Reafference Comparison
  - 位置は closure/core loop だが性質は observer 的。
  - `requires_writeback_review: true` として仮説レビュー対象に残す。

## Core → Observer 直接呼び出しチェック

- `src/core/` 内の `../observer/` 直接 import は 0 件（bridge 経由に統一）。
