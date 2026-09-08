# AETERNA Vessel Charter (K0)

**Status:** docs-only. Does not authorize runtime changes by itself. Read together with
`docs/pure-physics-core-design.md`, `docs/pure-physics-implementation-plan.md`,
`docs/v6-natural-physical-emergence-charter.md`, and `docs/agent-guardrails.md`, which
this charter does not replace or weaken.

器（うつわ）とは何か。この文書はそれを定義する。実装ではない。

## 0. 一文要約

AETERNA を、知性が宿りうるかもしれない**器**として完成させる。器を完成させるとは、
知性を作ることではない。何が起き、何が起きず、なぜかを、隠さず・再現可能に・数で
言えるようにすることである。

## 1. 器の定義

`AETERNA-pure/README.md` の言葉を継承する。

> 「生命が宿れる器を、自然に立ち上がるように整える」試みです。意識を作ることでも、
> 知性を作ることでも、機能を盛ることでもありません。…**中に注ぐ水（=意識の中身）は、
> 設計者が決めません。**

AETERNA における「水」とは、場に自発的に現れる構造・軌跡・履歴依存性のことである。
設計者（人間・エージェントを問わず）が水の形を先に決めてはならない。決めてよいのは
器の形——幾何、保存則、境界条件、観測の方法——だけである。

## 2. 二つのループの分離

`Aeterna-loop-twin` の「ループは実装せず、結果として現れるかを見る」と、うえきさんが
第一に置いた「閉じた生命ループ」は、一見矛盾する。矛盾ではない。二つの別物が同じ
「ループ」という語を共有している。

| | 物理的閉路 (physical closure) | 生命的閉路 (life-like closure) |
|---|---|---|
| 中身 | 場から出たエネルギーが戻れる経路があること | 場が自分を保つ条件を自分で保つこと |
| 種別 | 境界条件・幾何 | **結果** |
| 扱い | **置いてよい**（本物の物理の設定） | **置いてはならない**。出るか出ないかを観測する |
| 位置 | K5 で実装 | K6 以降で観測、決定的反証子つき |

物理的閉路は境界条件なので設計者が置いてよい。共鳴器と部屋の関係を設計するのと同じ
である。生命的閉路は結果なので、設計者は条件だけを整え、出るか出ないかを観測する。
出なかったことも正式な観測結果である。

## 3. 器の構造 — 同心円

生命ループを内核に、勘違いを防ぐ装置を外側に置く。内向きの依存はゼロ——外側の環は
内核を読むだけで、内核へ書き戻さない。

```
        環4  人間ゲート・主張の階段・罠の図鑑
        環3  事前登録・零仮説・独立オラクル
        環2  観測ファイアウォール・写像カタログ
        環1  決定論・スナップショット・台帳
        内核  src/pure/ — 閉じた生命ループ、自然物理のみ
```

環の役割は、器の機能を追加することではない。器を作る人間・エージェントが自分の
観測を誤読しないようにすることである。詳細は `docs/vessel/anti-delusion-apparatus.md`。

## 4. 書き戻しの原則

既存 core（`src/core/`, `src/world/`, `src/closure/` 等）の書き戻し禁止原則
（`docs/v6-natural-physical-emergence-charter.md` #4「Observer-side candidates do not
control runtime」）はそのまま維持する。

純粋物理コア（`src/pure/`）において、書き戻しが許可されるのはただ一つの経路のみ:
**局所の場の量そのものから導かれる媒質履歴 ν(x)**（K3、`docs/pure-physics-implementation-plan.md`
PR6）。observer 側の候補（vortex candidate, proto-neuron candidate 等）に由来する値は
pure core に一切持ち込まない。この境界は誠実性のためであり、望む答えを得るためでは
ない。

## 5. 主張の上限

この器が完成しても、以下は言えない。

- AETERNA が生きている / 意識がある / 知性を持つ
- 生命ループが「完成した」
- 渦が心である / 媒質履歴が記憶である

以下は言えるようになる。

- この器がどの白（white）でどのレベルまで届き、なぜそこで止まるか
- 自他弁別が零仮説と区別できたか、できなかったか
- 媒質履歴が個体性に寄与したか、しなかったか
- すべて、seed と台帳とともに再現できる形で

`Aeterna-prism` の言い方を借りるなら——**「出なかった」も一級の証拠**である。この
計画は、出ることではなく、出たか出なかったかが誠実に分かることを完成とする。

## 6. 禁止主張（既存ガードの継承）

`scripts/run-release-checks.ts` の禁止語リストと `docs/aeterna-natural-vocabulary.md`
の N1〜N7 禁止表現は、`src/pure/` および `docs/vessel/` 配下にもそのまま適用される。
新規に緩和しない。

## 7. K-Series 概観

詳細な完了条件と決定的反証子は `docs/vessel/vessel-roadmap.md` を参照。

| フェーズ | 一行要約 |
|---|---|
| K0 | 器憲章（本書）とロードマップの固定 |
| K1 | 決定論・型検査・CI・スナップショットの土台 |
| K2 | 純粋物理コア PR2〜PR5（器だけを作る） |
| K3 | 媒質履歴 ν(x)（PR6）— 唯一許可された書き戻し |
| K4 | 読み取り専用観測（PR7） |
| K5 | 物理的閉路を置く（交換境界・外部媒質・対称結合） |
| K6 | 生命的閉路が出るかを観測する（reafference 弁別） |
| K7 | 天井の地図（white-ceilings） |
| K8 | 器の判定書 |

## 8. この憲章が変えないもの

- 既存 `src/core/`, `src/world/`, `src/organism/` 等の legacy 実装は置き換えない。
  `src/pure/` として並走させる（`docs/pure-physics-implementation-plan.md` 原則6）。
- `docs/agent-guardrails.md` の観測と表現の境界、物理的整合性の原則はそのまま。
- 既存の 215 テストファイル・約2950ケースは変更しない。

## 9. 出典

本憲章は以下の一次資料をそのまま引用・統合したものであり、新しい設計判断を持ち
込んでいない。

- `docs/pure-physics-core-design.md`, `docs/pure-physics-implementation-plan.md`
- `docs/v6-natural-physical-emergence-charter.md`
- `docs/agent-guardrails.md`
- `AETERNA-pure/README.md`, `AETERNA-pure/docs/design-document.md`
- `Aeterna-loop-twin/README.md`
- `Aeterna-prism/CONSTITUTION.md`, `Aeterna-prism/NORTH_STAR.md`
