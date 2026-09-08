# K15 変換器カタログ（環2、入力ポート版）

`docs/vessel/anti-delusion-apparatus.md` 環2「観測ファイアウォール・写像カタログ」と
同じ考え方を、K15の**入力ポート**側に適用する。番号は`K15-M`プレフィックスを使い、
K11の測定器カタログ（`K11-mapping-catalog.md`、出力側）や legacy 側の番号系列と
衝突しない。

本カタログは**実行ロジックを持たない**。各行の `実装` 列に示したファイルが実際の
コードで、このカタログはそこへ辿るための辞書である。

`docs/vessel/K15-runtime-design.md` 選択4が定めるとおり、**変換器は信号・時刻・
セル数しか受け取らず、ψ・χ自身の現在の場・観測器の出力のいずれも参照しない**
（`src/tests/pure/transducer.test.ts`のソーススキャンで検証）。適用された信号は
全て`src/pure/runtime/inputLog.ts`の入力ログに記録され、リプレイの入力となる。

| ID | 入力（信号） | 出力 | 変換内容 | 実装 |
|---|---|---|---|---|
| K15-M1 | `number`（振幅） | `Float64Array`（χの駆動spatialProfileへの加算項、全セル同一値） | 信号の値をそのままχの全セルへ一様に加算する。最小限のテスト用変換器 | `src/pure/runtime/builtinTransducers.ts` の `uniformAmplitudeTransducer` |
| K15-M2 | `{cellIndex, amplitude}` | `Float64Array`（指定した1セルのみ非ゼロ） | 指定したセルにのみパルス振幅を加算し、他は0。最小限のテスト用変換器 | `src/pure/runtime/builtinTransducers.ts` の `singleCellPulseTransducer` |

## 経路の例

1つの信号がχの実際の駆動に反映されるまでの経路（K15-M1の場合）:

```
信号 (number) → K15-M1.toChiDriveContribution(signal, t, cellCount)
  → Float64Array（全セル一様）
  → applyTransducerToChiDrive(baseDrive, K15-M1, signal, t)（transducer.ts）
  → 新しいDriveSpec（spatialProfile = baseDrive.spatialProfile + contribution）
  → runWorldTick(..., drive, ...)（worldTick.ts、chiの駆動としてのみ渡る）
```

この経路のどの段階にもψは現れない——`runWorldTick`のψ側呼び出し
（`runDissipationTick(psi, ...)`）自体が構造的に駆動引数を持たない
（K13で確立済み、`src/tests/pure/worldTick.test.ts`）。

## 誠実な限界（K15-runtime-design.md 選択4から引用）

意味のある変換器（センサー・音・テキストのエネルギー化）は今回1つも確定しない。
上記2つはこの変換器機構・入力ログ・リプレイの仕組み自体を検証するための
最小限のテスト用実装である。「新しい現象と、その現象を判定する測定器を同一PRで
確定しない」という`AETERNA-TORUS`原則を、ここでは「同一PRで意味のある変換器を
確定しない」という形で適用している。

## 完了条件（このカタログ自体について）

- 各変換器のIDが一意である（`createTransducerRegistry`が重複を検出、テスト済み）
- 各変換器のシグネチャがψを一切参照しない（ソーススキャンで検証済み）
- 新しい変換器を追加する際は、この表に行を追加し、`K15-M{n}`の次の番号を割り当てる
