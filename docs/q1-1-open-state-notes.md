# Q1-1 Open-State Snapshot Notes

AETERNA v0.5 / Quantum-Inspired Q1-1

実装日: 2026-04-21

## Phase Goal

AETERNA に Open-State Layer の最小版を導入する。

目的: AETERNA を「1つの確定状態」ではなく、複数の内部傾向が少し混ざった状態として観測・保持できるようにする。

## Implemented Components

### 1. OpenStateSnapshot Type

Location: `src/types/openStateSnapshot.ts`

```typescript
interface OpenStateSnapshot {
  timestamp: number;
  feltMix: { ... };
  activationMix: { ... };
  driveMix: { ... };
  stabilityIndex: number;
  mixtureEntropy: number;
  dominantPole: string | null;
}
```

- feltMix: felt-state の混合 (7 axes)
- activationMix: arousal/awareness の混合 (4 axes)
- driveMix: need/motivation の混合 (6 axes)
- stabilityIndex: 安定性の proxy 指標 (0~1)
- mixtureEntropy: 混合度合いの proxy 指標 (0~2.0+)
- dominantPole: 優勢軸の便宜的ラベル (observer用)

### 2. Derivation Function

Location: `src/organism/deriveOpenStateSnapshot.ts`

Pure function:
```typescript
deriveOpenStateSnapshot(
  feltState: FeltStateVector,
  arousalAwareness: ArousalAwarenessState,
  needMotivation: NeedMotivationState
): OpenStateSnapshot
```

Helper functions:
- `calculateStabilityIndex()`: coherence / boundary / restoration の組み合わせから安定性を計算
- `calculateMixtureEntropy()`: 代表軸の分布から Shannon entropy 風の指標を計算
- `determineDominantPole()`: 優勢軸を判定 (observer用)

### 3. Scenario Integration

Location: `src/experiments/runScenario.ts`

Changes:
- `MetricsSnapshot` に `openState_*` フィールドを追加
- `ScenarioResult.summary` に Open-State 集計を追加
  - avgStabilityIndex
  - avgMixtureEntropy
  - dominantPoleDistribution
- `buildMetricsSnapshot()` 内で `deriveOpenStateSnapshot()` を呼び出し

### 4. Tests

Location: `src/tests/openStateSnapshot.test.ts`

Test cases:
- ✓ Valid snapshot generation
- ✓ Finite stabilityIndex
- ✓ Finite mixtureEntropy
- ✓ Overload pole detection
- ✓ Restoration pole detection
- ✓ Neutral-mixed detection
- ✓ No NaN values
- ✓ Zero value handling
- ✓ Stability comparison (coherent vs chaotic)

### 5. Documentation

- `docs/open-state-principles.md`: 原理・設計方針
- `docs/q1-1-open-state-notes.md`: 実装ノート (this file)

## What Was NOT Changed

### Intentionally Untouched

- `src/organism/runtimeLoop.ts`: 主ループには手を入れていない
- `src/core/AeternaNetwork.js`: organism core は変更していない
- Mode system: mode 変更なし
- Action system: action 決定は変更していない
- UI: MajorStateObserver への表示追加は次回に残した

### Deferred to Next Phase

- **MajorStateObserver への表示追加**: UI 更新は最小実行後に追加予定
- Touch backaction 本格実装: Q1-2 以降
- Modulation の返却: Q1-2 以降
- Annealing / error mitigation: 後続 Phase
- Entanglement 的関係性: 後続 Phase

## Design Decisions

### StabilityIndex Calculation

Weight distribution:
- coherence: 30%
- boundaryIntegrity: 25%
- restorationReadiness: 15%
- overload penalty: -15%
- safetyNeed penalty: -10%
- awarenessWindow check: +5%

Rationale: coherence と boundary を重視し、overload を penalty にする。

### MixtureEntropy Calculation

Method: Shannon entropy on normalized axes

Selected axes (11 total):
- depletion, overload, coherence, restorationReadiness
- arousalLevel, awarenessWindow
- energyNeed, safetyNeed
- noveltyMotivation, repetitionMotivation, explorationMotivation

Rationale: 主要な混合要素を広く含む。

### DominantPole Thresholds

- restoration: restorationReadiness > 0.6 && restorationNeed > 0.4
- overload: overload > 0.7 || safetyNeed > 0.8
- exploration: explorationMotivation > 0.6 && noveltyMotivation > 0.5
- safety: safetyNeed > 0.6 && boundaryIntegrity < 0.4
- neutral-mixed: otherwise

Rationale: 単一極への強い偏りがある場合のみラベル付け。

## Validation

### Build

```bash
npm run build
```

Expected: No errors

### Lint

```bash
npm run lint
```

Expected: No errors

### Test

```bash
npm run test:run
```

Expected: All tests pass, including new openStateSnapshot tests

## Scenario Usage Example

```typescript
import { runScenario } from './experiments/runScenario.ts';

const result = await runScenario({
  name: 'quiet-baseline',
  totalFrames: 600,
  seed: 42,
});

console.log('Stability Index (avg):', result.summary.avgStabilityIndex);
console.log('Mixture Entropy (avg):', result.summary.avgMixtureEntropy);
console.log('Pole Distribution:', result.summary.dominantPoleDistribution);
```

Expected output:
- avgStabilityIndex: 0.5~0.8 (stable baseline)
- avgMixtureEntropy: 1.5~2.5 (moderately mixed)
- dominantPoleDistribution: mostly 'neutral-mixed' for quiet scenario

## Completion Criteria

- [x] OpenStateSnapshot 型がある
- [x] felt / activation / drive の mixed snapshot を作れる
- [x] stabilityIndex と mixtureEntropy の最小版がある
- [x] 毎tick生成・保持できる (scenario runner で実装)
- [x] scenario / tests / docs がある
- [x] organism core を壊していない
- [x] Open-State がまだ causal driver になっていない

## Next Steps (Q1-2)

1. MajorStateObserver への表示追加
2. Touch backaction の最小導入
3. Weak modulation の返却開始
4. LastOpenStateSnapshot の runtime loop 保持
5. Open-State history (ring buffer)

## Notes

- Open-State は **観測専用** のまま維持された
- 行動分岐への影響はゼロ
- dominantPole は debug / observer 用のみ
- stabilityIndex / mixtureEntropy は proxy / derived であることを明示
- Literal quantum state ではないことを強調

## References

- Cloud Agent 指示書 25: AETERNA v0.5 / Quantum-Inspired Q1-1
- AETERNA 段階的設計書 v0.2
- 量子インスパイア統合設計図 v0.1
