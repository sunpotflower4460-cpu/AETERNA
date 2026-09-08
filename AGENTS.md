# AGENTS.md — AETERNA 運用契約

このリポジトリで作業する全てのエージェント（Claude Code, Codex, 人間を問わず）は、
実装前に以下を読むこと。

1. `docs/agent-guardrails.md`（観測と表現の境界、物理的整合性の原則）
2. `docs/vessel/VESSEL_CHARTER.md`（器の定義、K-Series 概観）
3. `docs/vessel/vessel-roadmap.md`（現在のフェーズの完了条件と決定的反証子）
4. `docs/pure-physics-core-design.md` と `docs/pure-physics-implementation-plan.md`
   （`src/pure/` に触れる場合。承認済み実装憲法として扱う）

## 最優先の3原則（`Destiny-Dice/AGENTS.md` より移植）

1. **1セッション = 1フェーズだけ。先回り実装は禁止。** `docs/vessel/vessel-roadmap.md`
   の K フェーズを一つ進めたら、次のフェーズの実装に着手する前に立ち止まる。
2. **自己採点をしない。「できたと思う」は完了ではない。** 完了は、そのフェーズの
   完了条件に対応する実コマンドの出力を貼り付けることでのみ成立する。
3. **迷ったら実装せず質問する。** 仕様判断（値・挙動・命名）を勝手に発明しない。
   特に物理定数・閾値・タイムスケールは、聴感や見た目ではなく物理的根拠を要する
   （`docs/energy-realness-principles.md`）。

## 変更規律

- 既存 `src/core/`, `src/world/`, `src/organism/` 等の legacy 実装を置き換えない。
  `src/pure/` として並走させる。
- 1つの PR は1つの責務だけを持つ。UI・runtime・organism ロジックを1つの PR で
  同時に触らない（repo hygiene の PR を除く）。
- **新しい現象と、その現象を判定する測定器を同一 PR で確定しない**
  （`AETERNA-TORUS` 原則より移植）。測定器は現象を実装する前に凍結する。
- `docs/vessel/` への変更は ADR 相当の記録を残す（`docs/vessel/anti-delusion-apparatus.md`
  環4）。

## 停止条件

以下が起きたら、隠さず停止・報告する。停止は失敗ではない。破綻をリミッターで
隠す方が失敗である（`AETERNA-TORUS/CLAUDE.md` より）。

- NaN / Infinity
- エネルギー帳簿（N/H）が閉じない
- 保存則テスト（自己随伴性、N保存、H有界性）が通らない
- 同一 seed・同一入力で結果が再現しない
- pure core 内に `clamp` / `maxDelta` / `amplitudeClamp` / `Math.random` /
  `Date.now` が見つかった
- 文書と実装が矛盾している
- 観測 ON/OFF で場の状態が変化する

## 報告の分離

`Aeterna-Genesis/AGENTS.md` の恒久ルールを継承する。報告は常に別々に出す。

1. うえきさんへのやさしい説明（専門用語には一行の説明、質問は一度に1つ）
2. 監査用の厳密な報告書（`docs/vessel/vessel-roadmap.md` の完了条件に対応する形式）

## 自己検証プロトコル

各 K フェーズの完了報告前に、以下を実コマンド出力とともに提示する。

1. そのフェーズの完了条件を1つずつ確認したコマンドと出力
2. そのフェーズの決定的反証子が成立しなかったことの確認（成立してしまった
   場合は、フェーズを完了として報告せず、`docs/vessel/white-ceilings.md` に
   記録した上で立ち止まる）
3. `npm run check:release` の出力（存在する場合）
4. `npm run test:run` の出力（存在する場合）

## 参照

- `docs/agent-guardrails.md` — 観測と表現の境界（既存）
- `docs/vessel/VESSEL_CHARTER.md` — 器の定義
- `docs/vessel/vessel-roadmap.md` — K0〜K8 完了条件と決定的反証子
- `docs/vessel/closed-life-loop-design.md` — K5/K6 設計
- `docs/vessel/anti-delusion-apparatus.md` — 環1〜環4
- `docs/vessel/claim-ladder.md` — 主張の階段
- `docs/vessel/white-ceilings.md` — 天井の地図
- `docs/vessel/imports-from-siblings.md` — 兄弟リポジトリからの移植一覧
