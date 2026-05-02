# AETERNA-NATURAL v1.1 Observation UX Polish

## 1. Purpose

v1.1 は AETERNA-NATURAL v1.0 Stabilization の上で、N-series の観測体験を磨き込むための UI / UX polish である。  
新しい dynamics は追加しない。geometry / complex field / vortex / membrane / weak plasticity / observed ratios / long-run comparison を、誤解なく観測・比較・理解できる状態に整理する。

## 2. Observation dashboard

- Overview 内に Observation Dashboard を追加
- 表示順:
  1. Current Runtime Mode
  2. Current Field Status
  3. Natural Geometry
  4. Complex Field / Vortex
  5. Boundary / Membrane
  6. Weak Plasticity
  7. Observed Ratios
  8. Long-Run Comparison
  9. Diagnostics
- advanced metrics は各詳細 panel 側で追う

## 3. Runtime mode badges

- Metric / Field / Membrane / Plasticity / Constants / Safety を常時表示
- `safe` は calm / neutral
- `research` は blue / cyan
- `experimental` は amber
- `legacy` は dashed badge
- Neutral constants が default baseline であることを明示

## 4. Value kind badges

統一する種類:

- Raw
- Measured
- Derived
- Proxy
- Check
- Presentation-smoothed
- Reference

各 badge は tooltip で意味を説明し、Raw / Derived / Proxy / Check / Reference を誤読しないようにする。

## 5. Complex field / vortex UX

- Signed total charge を topological check として表示
- Charge deviation / average vortex lifetime / curvature-vortex correlation を補助表示
- Vortex candidate は observer-side phase-defect candidate と明記
- Phase は数学的位相であり、感情や意味ではないと明記

## 6. Geometry UX

- Area element range を追加
- Gaussian curvature / mean curvature / asymmetry / inner/outer rim counts をまとめて読めるようにする
- Flat / Curved の説明を短く固定する

## 7. Membrane UX

- Actuation imprint / return imprint を追加表示
- Membrane note を日本語で固定
- soul boundary / self boundary 解釈を排除する

## 8. Weak plasticity UX

- observe-only / ablation guard を明示
- medium trace / resistance history proxy であると固定
- memory / learning 用語は使わない

## 9. Observed ratios UX

- constants mode と legacy comparison-only を明示
- closest reference / distance / match strength / emergent resonance proxy を並べる
- caution note を常時表示する

## 10. Long-run comparison UX

- strongest / weakest ではなく highest observed / lowest observed として読む
- difference highlight に「winner board ではない」注意書きを追加
- variant card に scenario / mode stack / semantic leak / NaN / Infinity を表示する

## 11. Guide copy policy

- Guide は observation translator としてふるまう
- weak plasticity = observe-only
- observed ratios = comparison result only
- long-run comparison = risk / safety checks と合わせて読む

## 12. Mobile UX

- Runtime mode badges を mobile でも折り返し表示
- Observation Dashboard を 1-column に落とす
- Guide panel を mobile bottom sheet 形状にする

## 13. Warning severity

分類:

- Info
- Notice
- Warning
- Critical
- Experimental

Critical のみ強く出し、Experimental は amber warning だが恐怖演出にしない。

## 14. Interpretation guardrails

- proxy は proxy として表示する
- comparison result を proof として扱わない
- vortex / membrane / plasticity / observed ratio を consciousness / emotion / self / soul / intelligence / life proof と結びつけない
- fake visual / fake event / fake result は追加しない
