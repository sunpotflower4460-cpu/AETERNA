# AETERNA

## プロジェクト構成

- **src/** — 現在開発中のコードベース
  - **src/signal/** — Signal Runtime v0 実装
  - **src/main.ts** — アプリケーションのエントリポイント
- **archive/** — 旧コードの退避先
  - **archive/phase9.4-original.html** — 旧 App.jsx から退避した元のコード

現在は Signal Runtime v0 の開発を src/ 側で進めており、旧コアは archive/ に安全に退避されています。

## AeternaNetwork state summary

`src/core/AeternaNetwork.js` の CPU state は現在も source of truth です。  
PR10-C では内部状態を次のカテゴリで読む前提に整理しています。

- **core dynamic state** — `currentBuffer`, `prevBuffer`, `nextBuffer`, `spikeTrace`
- **sensory / perceptual state** — `rawTouch`, `touchOnset`, `touchOffset`, `touchTrace`, `touchNovelty`, `touchProjection`
- **prediction / error state** — `localPrediction`, `predictionError`, `predictionHistory`
- **plasticity / rewrite state** — `priorBias`, `rewritePressure`, `plasticityTrace`, `recentRewriteMask`, `priorChannels`
- **mode / ongoing-life state** — `baselineActivity`, `activityResidue`, `wakeDrive`, `sleepPressure`, `dreamPressure`, `modeState`
- **geometry / render state** — `basePositions`, `vertexPositions`, `normals`, `colors`
- **temporary / work buffers** — `injectedNodes`（transient event list）, `cachedMaxClusterSize` / `cachedPhiApprox` / `cachedPhaseCoherence`（derived cache）

将来 GPU texture 化する場合も、このカテゴリ分けをそのまま layout 候補として使い、意味の source は先に CPU state 側で保つ方針です。

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
