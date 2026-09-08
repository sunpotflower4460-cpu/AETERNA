# K11 凍結宣言

`docs/vessel/K-series-II-brain-and-universe-plan.md` K11節の完了条件:

> 閾値と手順が K12/K13 の実装より前にコミットされている

`AETERNA-TORUS/CLAUDE.md` の原則（「新しい現象と、その現象を判定する測定器を同一PRで
確定しない」）と、`Aeterna-Genesis` の WHITE_CEILINGS 方法論（測定器は現象より先に凍結し、
実測を見てから閾値を調整しない）に従う。

このコミットの時点で、K11 の全ての測定器・その事前登録定数は**凍結**される。K12（記憶
チャンネル再検討）・K13（2次元世界χ）以降の実装は、これらの値を**変更してはならない**。
異なる値が必要になった場合は、新しいADR（K5-exchange-medium-adr.md と同じ作法）で理由を
明記し、新しい凍結として扱う——既存の値を黙って上書きしない。

## 凍結される事前登録定数

| 定数 | 使用箇所 | 値の決め方 | 実装 |
|---|---|---|---|
| `maxDisplacementCells`（L3追跡の最大変位） | `trackVortices` | 「1tickでの妥当な変位」を格子間隔の整数値として先に決める。K11-PR1のテストでは検証用に1〜2を使用したが、K12以降の実run configで使う値はそのrun自身のconfigに明記すること（このモジュールが特定の値を既定値として埋め込むことはしない） | `src/pure/observe/vortexTracking.ts` |
| `relativeDeviation`（L4密度外れ値判定） | `findDensityBlobs` | 平均密度に対する比。絶対閾値ではない（K11本文の明示的要求）。K11-PR2のテストでは0.2〜0.5を使用 | `src/pure/observe/densityContrast.ts` |
| `thetaContrast`（L4内外コントラスト閾値） | `evaluateContrast` / `evaluateL4Structural` | blob内外の密度比がこの値を超えるかどうか。K11-PR2のテストでは2・5を使用 | `src/pure/observe/densityContrast.ts`, `blobTracking.ts` |
| `minOverlapFraction`（L4追跡のJaccard重なり閾値） | `trackBlobs` | (0,1]。K11-PR2のテストでは0.3を使用 | `src/pure/observe/blobTracking.ts` |
| `tauLifetimeTicks`（L4寿命閾値） | `evaluateL4Structural` | 追跡IDが何tick以上続けば「持続」と判定するか | `src/pure/observe/blobTracking.ts` |
| 摂動パルスの投入セル（L4摂動回復） | `runPerturbationRecoveryProtocol` | χの交換ポートセル（インデックス0固定 - `createExchangeCouplingConfig` が既に決めている幾何的事実であり、新たな自由パラメータではない） | `src/pure/emergence/perturbationRecovery.ts` |
| `pulseAmplitude` / `recoveryTolerance`（L4摂動回復） | `runPerturbationRecoveryProtocol` | パルスの大きさと「戻った」とみなす相対許容誤差。K12以降のrun configで明記すること | 同上 |
| `structureThreshold`（L6構造指標の存在判定） | `runSelfSustainingClosureProtocol` | 構造指標（最大blobのcontrastRatio）がこの値以上なら「構造あり」とみなす | `src/pure/emergence/selfSustainingClosure.ts` |
| 動径シェルの1/e閾値（相関長ξ） | `computeCorrelationLength` | 標準的な相関長の定義（自己相関がゼロ遅延の1/eまで下がる距離）。物理定数由来であり、実測を見て選んだ値ではない | `src/pure/observe/structureStatistics.ts` |

**誠実な注記**: 上記のうち `maxDisplacementCells`・`relativeDeviation`・`thetaContrast`・
`minOverlapFraction`・`pulseAmplitude`・`recoveryTolerance`・`structureThreshold` の
「具体的な数値」自体はこのモジュール群がデフォルト値として埋め込んでいない
（各関数はconfig引数として要求する）。凍結されるのは「**これらは事前登録すべき値であり、
実測後に結果を見て調整してはならない**」という運用規律そのものと、K11-PR1〜PR4のテストで
実際に使用した値（各テストファイル参照）が「後から見て妥当だったサンプル値」として残る、
という2点である。K12/K13の各run configは、使用した具体的な値を結果とともに必ず明記する
（K5-exchange-medium-adr.md・K6-reafference-preregistration.md と同じ作法）。

## 凍結される手順

1. **L3判定手順**（`src/pure/observe/vortexCandidates.ts` → `vortexTracking.ts`）:
   `detectVortexCandidates` → `trackVortices` → `evaluateL3`。この経路のみを使う。
2. **L4構造判定手順**（`src/pure/observe/densityContrast.ts` → `blobTracking.ts`）:
   `findDensityBlobs` → `evaluateContrast`（各tick）→ `trackBlobs`（tick列）→
   `evaluateL4Structural`。
3. **L4摂動回復手順**（`src/pure/emergence/perturbationRecovery.ts`）:
   ベースラインtick数 → χポートセルへの単発パルス → 測定窓tick数 → 構造指標の
   ベースライン比較。パルスは**χにのみ**適用し、ψには絶対に触れない。
4. **L1/L2補助指標**（`src/pure/observe/structureStatistics.ts`）: S(k)・相関長・
   participation ratioは、いずれも `|ψ|²` から直接計算し、他の指標を経由しない。
5. **L6判定手順**（`src/pure/emergence/selfSustainingClosure.ts`）: 駆動ありで
   `driveTicks` 走行 → 駆動振幅を厳密に0にして `postDriveTicks` 継続 → 構造指標が
   `dissipationTimeTicks = (1/ν₀)/dt` を**厳密に超えて**（`>`、`>=`ではない）
   持続するか。観測ウィンドウ内で一度も閾値を下回らなかった場合は `censored: true` を
   返し、「確認された持続時間」ではなく「少なくともこの長さ、それ以上は未知」として扱う。

## 非干渉性（環2の中核）

観測ON/OFFでψ・νがビット一致することを、2つの独立した方法で確認済み:

- **静的検査**（import方向）: `src/tests/pure/observerNonIntervention.test.ts` が
  `src/pure/field`・`ledger`・`drive`・`medium`・`geometry` のいずれも
  `observe/`・`run/` からimportしていないことを確認する。K11で追加した
  `src/pure/observe/vortexTracking.ts`・`densityContrast.ts`・`blobTracking.ts`・
  `structureStatistics.ts` は全て `observe/` 配下にあるため、この検査は追加変更なしで
  自動的にこれらもカバーする。
- **実測**（ビット一致）: `src/tests/pure/k11ObserverNonInterference.test.ts` が、
  K11の全測定器（L3追跡・L4密度コントラスト・L4追跡・S(k)・相関長・participation ratio）
  を毎tick実行しながら物理を進めた場合と、一切実行しなかった場合とで、最終的なψ・νが
  ビット一致することを N=32・300tick で確認する（日常的なテストスイートで毎回実行され
  続ける、軽量な回帰ガード）。K11自身の完了条件が明示する N=128・10⁴tick という規模での
  検証は、`scripts/k11-observer-scale-validation.ts` で一度だけ実施し、結果を
  `docs/vessel/vessel-roadmap.md` のK11完了記録に記載する（毎回のテストスイートに
  含めると、K11の観測器が2Dフーリエ変換を毎tick複数回行うため実行時間が著しく増加する
  ——この判断はK10の長時間run検証がスクリプトとして別立てにされたのと同じ理由による）。

**この凍結宣言のコミット以降、K12・K13の実装がこの文書に列挙した手順・定数の意味を
変更する場合、新しいADRを書き、この文書ではなく新しい文書として記録すること。**
