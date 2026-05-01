# Language / Claim QA

## Scope

U8 では以下の user-facing copy を監査する。

- Now Summary
- Guide Explanation
- Scenario descriptions
- Event Timeline text
- Layer tooltip / disclaimer copy
- Integrity notes
- Overview labels
- UI/UX docs の要約文

## Forbidden expressions to avoid in UI copy

### English

- thinking
- wants
- feels
- lonely
- conscious
- self-aware
- understands
- remembered you
- emotion
- desire
- will
- intention
- learned meaning
- memory formed

### Japanese

- 考えています
- 欲しがっています
- 感じています
- 寂しい
- 意識
- 自我
- 理解しました
- 覚えました
- 感情
- 欲求
- 意思
- 意図
- 意味を学習
- 記憶しました

## Preferred observational vocabulary

- observed / candidate observed
- detected
- increased / decreased
- returned / delayed
- persisting / fading
- proxy
- pre-semantic
- 観測 / 検出 / 上昇 / 低下 / 戻り / 遅延 / 残存 / 減衰 / 候補を観測

## U8 findings

- Guide / Summary / Scenario generated copy remains observation-based.
- Field layer disclaimers were tightened to avoid banned claim words in tooltip copy.
- Overview integrity label `Consciousness Claim` was renamed to `Claim Guard`.
- `guideClaimGuard` replacement copy was made neutral so fallback UI text also avoids claim words.

## Manual re-check steps

1. Open Guide and read Current explanation / What to look at / Try next / Integrity notes.
2. Open layer legend / tooltips and confirm they use observation vocabulary.
3. Open Scenarios and confirm expectedSignals are described as possible observations, not guarantees.
4. Open Event Timeline and confirm entries describe observed deltas only.
