# K11 写像カタログ（環2）

`docs/vessel/anti-delusion-apparatus.md` 環2「観測ファイアウォール・写像カタログ」の要求
（`Cheese-Machine-75/src/core/mappings/mappingCatalog.ts` のアイデアを移植、番号付きで
判定量から場の量までの経路を辿れるようにする）に対する、K11 で初めて追加された測定器群の
実装。番号は `K11-M` プレフィックスを使い、legacy 側や将来の他フェーズの番号系列と衝突しない
（`vessel-roadmap.md` の「既存ロードマップの陳腐化解消」節が定めた作法と同じ）。

本カタログは**実行ロジックを持たない**。各行の `実装` 列に示したファイルが実際のコードで、
このカタログはそこへ辿るための辞書である（Cheese-Machine-75 のカタログと同じ位置づけ）。

| ID | 入力 | 出力 | 変換内容 | 実装 |
|---|---|---|---|---|
| K11-M1 | ψ (ComplexField) | `VortexCandidate[]` | 位相の離散巻き数（circulation quantization）で位相特異点候補を検出する | `src/pure/observe/vortexCandidates.ts` の `detectVortexCandidates`（K4で実装済み、K11が拡張的に再利用） |
| K11-M2 | `VortexCandidate[][]`（tick列） + TrackingConfig | `TrackedVortex[]` | 最近傍割当（torus周期wrapped、事前登録した最大変位、符号一致必須）でtick間の同一性を追跡する | `src/pure/observe/vortexTracking.ts` の `trackVortices` |
| K11-M3 | `TrackedVortex[]` | `L3Judgment[]` | `com_velocity ≠ 0 AND circulation ≠ 0`（Aeterna-Genesis L3の判定式、flux項は本計画のK11節が明示的に落とした） | `src/pure/observe/vortexTracking.ts` の `evaluateL3` |
| K11-M4 | ψ | `Float64Array`（密度 \|ψ\|²） | セルごとの `real²+imag²` | 各モジュール内にインライン実装（`densityContrast.ts`, `structureStatistics.ts`, `k11ObserverNonInterference.test.ts` 等で同一の3行の式を独立に持つ - 単純すぎて共有ヘルパー化する価値がないと判断） |
| K11-M5 | 密度 + TorusGeometry + relativeDeviation | `DensityBlob[]` | 平均密度に対する比（絶対閾値ではない）で外れ値セルを判定し、4近傍・周期境界の連結成分に分ける | `src/pure/observe/densityContrast.ts` の `findDensityBlobs` |
| K11-M6 | `DensityBlob` + 同tickの全blob + ψ + thetaContrast | `ContrastEvaluation` | blob内平均密度とblob外平均密度の比（`max(内/外, 外/内)`、常に≥1） | `src/pure/observe/densityContrast.ts` の `evaluateContrast` |
| K11-M7 | `DensityBlob[][]`（tick列） + minOverlapFraction | `TrackedBlob[]` | セル集合のJaccard重なりでtick間の同一性を追跡する（変形に頑健、位置ではなく形状の重なりで判定） | `src/pure/observe/blobTracking.ts` の `trackBlobs` |
| K11-M8 | `TrackedBlob` + 各tickのcontrastRatio列 + tau + theta | `L4StructuralJudgment` | `tracked_id_lifetime > tau AND inside_outside_contrast > theta`（Genesis L4の判定式のうち構造面の2条件。`recovers_after_perturbation` はK11-M9が別途担当） | `src/pure/observe/blobTracking.ts` の `evaluateL4Structural` |
| K11-M9 | 完全なK5閉ループ実行設定 + 単発パルス仕様 | `PerturbationRecoveryResult` | ベースライン走行 → χのポートセルへ一度だけ振幅を加える（ψには触れない）→ 測定窓走行 → 構造指標がベースラインへ戻るか | `src/pure/emergence/perturbationRecovery.ts` の `runPerturbationRecoveryProtocol` |
| K11-M10 | 密度 + N（2冪） | `Float64Array`（S(k)、平坦化） | K9のFFT（`forwardFFT`）を行→列に適用した分離型2次元変換で、密度ゆらぎのパワースペクトルを得る | `src/pure/observe/structureStatistics.ts` の `computeStructureFactor` |
| K11-M11 | 密度 + N | `number \| undefined`（相関長 ξ、格子セル単位） | Wiener-Khinchin定理（パワースペクトルの逆変換）で自己相関関数を得て、動径方向に平均し、正規化後 1/e まで下がる最小半径を返す | `src/pure/observe/structureStatistics.ts` の `computeAutocorrelation` / `computeCorrelationLength` |
| K11-M12 | 密度 | `number`（participation ratio） | 標準的な逆participation ratio（一様=1、単一セル集中=1/N_total） | `src/pure/observe/structureStatistics.ts` の `computeParticipationRatio` |
| K11-M13 | 完全なK5閉ループ実行設定（駆動フェーズ＋駆動停止フェーズ） | `SelfSustainingClosureResult` | 駆動ありで走行 → 駆動振幅を厳密に0にして継続 → 構造指標が散逸時間 1/ν₀ を超えて持続するか（Genesis L6の観測としての最小版定義） | `src/pure/emergence/selfSustainingClosure.ts` の `runSelfSustainingClosureProtocol` |

## 経路の例（K11-M1 から K11-M3 まで、L3判定に至る全チェーン）

```
ψ(tick=0..T)
  --[K11-M1]--> VortexCandidate[][]（tickごとの巻き数リスト）
  --[K11-M2]--> TrackedVortex[]（同一性が追跡された渦候補の履歴）
  --[K11-M3]--> L3Judgment[]（各追跡IDについて、自発運動が観測されたか）
```

同様に L4 は K11-M4→M5→M6（構造の空間的検出）と K11-M4→M5→M7→M8（構造の時間的持続）
の二経路が合流し、`recovers_after_perturbation` はK11-M9が独立に担当する。
L1/L2補助指標（K11-M10〜M12）はいずれもK11-M4（密度）から直接分岐する。

## 環2としての完了条件（`anti-delusion-apparatus.md` 参照）

- [x] 番号が振られている（K11-M1〜M13）
- [x] 各番号が実装ファイルを持つ
- [x] 判定結果（L3/L4/L1/L2補助/L6のいずれも）から、その根拠となった場の量（ψ、密度）まで
      このカタログを逆に辿れる
- [x] 力学（`src/pure/field`, `ledger`, `drive`, `medium`, `exchange`）から読み取り専用の
      経路（`src/pure/observe`, `src/pure/emergence`）への書き戻しがないことは、
      `src/tests/pure/observerNonIntervention.test.ts`（import方向の静的検査）と
      `src/tests/pure/k11ObserverNonInterference.test.ts`（観測ON/OFFのビット一致の実測）
      の両方で確認済み
