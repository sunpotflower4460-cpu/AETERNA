# AETERNA

## Signal Runtime v0

### Signal方式について

Signal方式は API方式と完全に別ルートとして実装されています。

Signal方式の処理順:

```
外刺激
→ 刺激受容 (createStimulusPacket)
→ 反応起動 (activateSignals)
→ 自己ループ (runSelfLoop)
→ 境界ループ (runBoundaryLoop)
→ 同時発火の場形成 (buildSignalField)
→ 結びつき (bindSignals)
→ Proto-Meaning (deriveProtoMeanings)
→ 意思決定 (decideSignalUtterance)
→ 単語候補化 (lexicalizeProtoMeanings)
→ 句の結合 (bindSignalPhrases)
→ 文骨格生成 (buildSignalSentencePlan)
→ 発話 (renderSignalUtterance)
→ revision / memory 記録 (memory.ts)
```

今回は CPU ベースの最小 Signal Runtime を導入。  
GPGPU は次段階。

### Experience Mode

コントロールパネルから `EXPERIENCE MODE` セレクタで `signal_runtime` を選ぶと、
Signal方式ランタイムが有効になります。

- `internal_mock` — 従来の内部モック動作
- `signal_runtime` — Signal方式ランタイム（このREADMEで説明する新しいルート）

### Observe Mode

Observe Panel（右側の REALITY GUIDE パネル）で Signal Runtime の中身を確認できます:

- **Stimulus** — salience / novelty / emotionalCharge / explicitQuestion
- **Signals** — other / self / belief の多層発火一覧（dominant / coactive / background / suppressed）
- **Boundary** — permeability / selfOuterSeparation / shockAbsorption / externalPressure
- **Field** — closeness / fragility / urgency / answerPressure / unfinishedness
- **Proto Meanings** — 結びつきから導かれた意味の種
- **Decision** — stance / replyIntent / shouldAnswerQuestion / shouldStayOpen
- **Sentence Plan** — reaction / core / answer / nextStep

### 開発コマンド

```bash
npm install
npm run dev        # 開発サーバー (Vite)
npm run build      # TypeScript 型チェック + Vite ビルド
npm run lint       # ESLint (src/signal/**/*.ts)
npm run test:run   # Vitest テスト実行
```