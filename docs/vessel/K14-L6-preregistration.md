# K14 事前登録 — L6: K13の実世界を使った自己維持閉環プロトコルの初回実測

**Status:** approved-by-continuation（うえきさんの「OK お願いします」を実装
続行の承認として扱う）。`docs/vessel/K-series-II-brain-and-universe-plan.md`
K14節「L6」に応じる文書。

## 何をするか

K11-PR4（`selfSustainingClosure.ts`）はL6の**測定手続き**を凍結しただけで、
K11完了記録が明記するとおり「AETERNAの力学がこの性質を実際に持つかどうかは
まだ測っていない」。K13で実チャネルの2次元世界χが実装された今、`src/pure/
emergence/worldSelfSustainingClosure.ts`（K14で新規作成、K11版を一切変更せず
並存させたファイル。K13の`runWorldTick`を使う点のみが違う）を使って、**K14で
初めて実測する**。

手続きは凍結済み（K11-PR4）のまま変更しない:
1. 駆動ありでdriveTicks走らせ、構造を作る。
2. χの駆動振幅を厳密に0にする（K13構成での「世界の唯一の外部エネルギー
   ポートを切る」— ψ自身はK13の憲法によりそもそも駆動を受け取れないので、
   切るべき対象はχの駆動しかない）。
3. postDriveTicks継続し、構造指標が散逸時間`(1/ν₀)/dt`を**厳密に超えて**
   持続するかを見る。観測窓を使い切ったら`censored: true`。

## 固定するパラメータ（実験を見る前に決める）

| パラメータ | 値 | 選定理由 |
|---|---|---|
| N（ψ・χとも） | 64 | K14-L2-preregistration・K14-L3-L4-preregistrationと同一。系サイズ非依存性は別文書で確認済み |
| α, g, ν₀, κ, ρ（ψ・χとも） | 1, 4, 0.15, 1, 0.3 | K14の他文書と一貫 |
| ω, 駆動振幅（build-up phaseのχへの駆動） | 3, 0.3 | 同上 |
| k, λ | 4, 20 | K13・K14の他文書と同一値 |
| dt | 0.01 | 全フェーズで一貫 |
| **driveTicks** | 1000 | 散逸時間`(1/0.15)/0.01=667tick`より長い build-up を確保し、構造指標が過渡状態を脱してから駆動を切るため |
| **postDriveTicks** | 2000 | 散逸時間667tickの約3倍。「明確に閾値を割り込む」「観測窓を使い切る（censored）」のどちらの結果も窓内で十分観測できる長さとして選定 |
| relativeDeviation（`findDensityBlobs`の外れ値判定） | 0.3 | K11-PR2のテストで検証済みレンジ（0.2〜0.5）の中央値。K11凍結宣言が明記するとおり、この数値自体はモジュールに埋め込まれた既定値ではなく、run configとして今回明記する |
| structureThreshold（構造ありと判定するcontrastRatioの下限） | 2 | K11-PR4のテストが最初から使っていた値（`selfSustainingClosure.test.ts`、K14のこの実験より前にコミット済み）をそのまま再使用する。**この実験の結果を見てから選んだ値ではない**——K11のテスト用途で決まった値を、決定的な物理runにそのまま流用するという簡略化を、事前に明記する |
| seed | 1〜10（10 seed） | K14-L2-preregistrationと同じ規模のアンサンブル |
| totalTicks/seed | 3000（= driveTicks + postDriveTicks） | 実測スループット確認後に決定（下記） |

## 実行前のスループット確認（K10〜K13と同じ作法）

N=64・λ=20・毎tick構造指標算出込みで100tick試走した結果、**約59.2 tick/s**
（K14-PR3のL2校正値62.2 tick/sとほぼ同じ——`findDensityBlobs`/
`evaluateContrast`の追加コストはK11のS(k)/自己相関ほど重くないことが分かる）。
3000tick×10 seed ≈ 30,000tick ≈ 約8.5分。計算資源の制約による事前縮小は
**不要**と判断する。

## 決定的反証子の判定基準（実行前に固定）

- 10 seed中、`satisfiesL6`（散逸時間を**厳密に超えて**持続）が成立したseed数を
  記録する。
- `censored`（観測窓を使い切った=survivalTicksPastDriveOffがpostDriveTicksと
  一致）となったseedは、「少なくともこの長さ持続した、それ以上は未知」として
  区別し、「持続しなかった」に丸め込まない。
- 10 seed中1つでも`satisfiesL6`が成立すれば、K13の実世界構成が「駆動を切った
  後も構造が単純な受動的散逸より長く生き残る」ことを**少なくとも一度観測した**
  として記録する。0/10であれば、それが結論。

## 誠実な限界（先に述べる）

- `structureIndicator`（最大blobのcontrastRatio）は密度外れ値ベースの指標であり、
  L11-PR2で検証済みの手続きだが、位相・渦構造（L3）とは独立の軸を見ている。
  L3・L2の結果とは別の指標として扱い、統合判定はしない。
- structureThresholdはK11のテスト用途由来の値をそのまま流用する簡略化であり、
  この実験専用に物理的根拠から再導出したものではない。将来、閾値を独立に
  較正する零仮説較正（Crystal-Genesis方式、K14-PR1の`deriveTauMin.ts`と同型）
  を行う余地は残る。
- 10 seedは頑健性の最小限の確認であり、統計的に確証的な検定ではない。

## 完了条件

- 10 seedの結果（indicatorHistory要約・survivalTicksPastDriveOff・censored・
  satisfiesL6）を表として記録する。
- 決定的反証子の判定基準を機械的に適用し、結果を正直に記録する。
