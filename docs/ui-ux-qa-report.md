# UI / UX QA Report

## 実施した QA 項目

- Visual QA checklist 作成と静的監査
- Scientific QA checklist 作成と source/test 対応確認
- Language / Claim QA 実施
- Fake Visual QA 実施
- Raw / Smooth / Diagnostic QA 実施
- Coverage QA 実施
- Guide / Scenario / Mobile / Performance / visual baseline の docs 監査
- build / lint / test 実行

## 通った項目

- Renderer / layer registry / coverage / diagnostic は runtime dynamics 非変更のまま維持
- Raw / Smooth / Diagnostic distinction is explicit in renderer types and manager
- fake visual function names are absent from audited UI source
- Guide / Summary / Scenario generated copy remains observation-based
- Safe-area CSS and mobile bottom-nav structure are present

## 問題が残る項目

- `npm run lint` は observer 系の既存 2 errors で失敗
- repo-wide `npm run test:run` は既存 behavioral/import failures が残る
- mobile nav の `View` / `Touch` ラベルは camera mode ではなく panel shortcuts に見えやすく、用語面の改善余地がある
- explicit `devicePixelRatio` cap は未実装

## すぐ直した小修正

- Overview integrity label `Consciousness Claim` → `Claim Guard`
- Semantic Leak row に `always 0` note を追加
- Guide fallback copy を neutral wording に変更
- Layer disclaimers から claim-like wording を除去

## 次フェーズに回す改善

- viewport-based screenshot baseline の自動化
- mobile nav wording refinement
- DPR cap / adaptive resolution policy の明示
- existing non-U8 failing tests / lint issues の別フェーズ修正

## runtime / integrity confirmation

- runtime dynamics 未変更
- fake visual 未追加
- fake event 未追加
- semantic / consciousness / emotion claim を user-facing UI copy から除去
