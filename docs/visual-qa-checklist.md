# Visual QA Checklist

AETERNA U8 の Visual QA で使う確認票。
status は `pass / issue / n/a` で記録する。

## Torus Visibility

- [ ] 初期表示でトーラス全体が見える
- [ ] backside / inner rim を観察できる
- [ ] inactive surface が faint に見える
- [ ] grid / diagnostic view で形状が分かる
- [ ] カメラ操作で迷子にならない
- [ ] reset view で安全に戻れる

## Layout

- [ ] Main Field View が主役になっている
- [ ] HUD が邪魔にならない
- [ ] Research Panel がトーラスを過度に隠さない
- [ ] Overview が最初に見える
- [ ] Explain button が見つけやすい
- [ ] Raw / Advanced が初期画面で前面に出すぎない

## Mobile

- [ ] bottom nav が使いやすい
- [ ] bottom sheet がトーラスを潰しすぎない
- [ ] safe area に対応している
- [ ] ボタンが小さすぎない
- [ ] gesture と touch mode が衝突しない

## Visual Integrity

- [ ] 値がない場所を強く光らせていない
- [ ] fake energy / fake flow / fake trace がない
- [ ] red / warning 表示が過剰ではない
- [ ] bloom / glow が値の読み取りを邪魔しない
- [ ] Raw / Smooth / Diagnostic の違いが分かる

## Evidence to capture

- Initial view
- Raw mode
- Smooth mode `[S]`
- Diagnostic mode
- Layer overlay
- Guide open
- Scenario panel
- Mobile collapsed / half sheet
