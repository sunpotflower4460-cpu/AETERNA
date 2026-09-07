# K16 設計メモ — 器の判定書 第二版・天井の地図 第二版

**Status:** approved-by-continuation（うえきさんの「OK お願いします」を実装
続行の承認として扱う）。

## 計画本文にない完了条件を自分で決める

`docs/vessel/K-series-II-brain-and-universe-plan.md` K16節は1段落のみで、
K9〜K15の他フェーズが持つ目的／完了条件／決定的反証子のテンプレートを
持たない。実装着手前にこの文書で補う。

**目的（計画本文どおり）:** K9〜K15の全結果を`VESSEL_REPORT.md`（やさしい
日本語）と`vessel-report.json`（機械可読）の第二版として、系サイズ・
時間スケール・世界の有無ごとの到達レベル表とともに出す。
`EMERGENCE_CEILING_MAP`のdocs/code二重管理を解消し、JSONを単一の真実に
してdocs側を生成する。

**完了条件（本文書で定める）:**
- `EMERGENCE_CEILING_MAP`相当のデータがコード上に**単一の場所**でのみ
  定義され、`white-ceilings.md`の該当表はそこから生成される
- 生成されたdocsの内容と、生成元データから今すぐ再生成した内容が一致する
  ことをテストで機械的に確認できる（ドキュメント側のドリフト検知）
- V2のJSON・mdの両方がK9〜K15の主要な実測結果（null含む）を含む
- 系サイズ・時間スケール・世界の有無ごとの到達レベル表が存在する

**決定的反証子（本文書で定める）:** 生成元データを変更してdocsを
再生成し忘れた場合に、既存のコミット済みdocsとの不一致を検知できなければ、
このフェーズは「二重管理を解消した」と主張できない。

## 選択1: V1（K8）は凍結し、V2はV1を変更せず新規に作る

**選んだもの:** `src/pure/run/exportVesselReport.ts`・`VESSEL_REPORT.md`・
`docs/vessel/vessel-report.json`・それらのテスト（`vesselReportFormat.
test.ts`・`vesselReportJsonUpToDate.test.ts`）は**一切変更しない**。V1の
`EMERGENCE_CEILING_MAP`はK8完了時点（K7まで）の凍結されたスナップショット
として、K10のlongRun.ts・K13のsnapshot.tsと同じ「新しい仕組みは新しい
ファイルで、既存の実験の再現性を壊さない」という本セッション全体の原則に
従って残す。

**理由:** V1の完了条件は「K6の凍結configから再現できること」であり、天井
地図の鮮度そのものはV1自身の完了条件ではなかった（`vesselReportFormat.
test.ts`もこれを弱くしか検査していない——4フィールドの型のみ、内容の
網羅性は検査していない）。過去のフェーズを遡って書き換えるのではなく、
V2で正しい仕組みを新たに作ることで、二重管理を将来にわたって解消する。

**誠実な床:** V1の`EMERGENCE_CEILING_MAP`はK7までで止まったまま残る。
`exportVesselReport.ts`のヘッダーコメントに「V2と正準データソースを
参照せよ」という1行を追記する（コード・exportの変更は伴わない、
docsコメントのみの追記）。

## 選択2: 正準データソースは新規`emergenceCeilingMap.ts`、white-ceilings.mdはそこから生成する

**選んだもの:** `src/pure/run/emergenceCeilingMap.ts`を新設し、K2〜K14の
全17行（V1の10行 + `white-ceilings.md`が既に持つがV1コードには無い7行:
K12腕A・K12腕B・K13・K14-PR3・K14-PR4・K14-PR5(L6)・K14-PR5(K6対照群)）を
1箇所で定義する。各行は既存の4フィールド（white/reachedLevel/stopReason/
nextMissingCause）に加え、系サイズ・時間スケール・世界の有無の3フィールド
（`systemSizes: number[] | null`、`ticks: number | null`、
`worldPresence: 'none' | 'ring-chi' | 'world-chi' | 'delay-line' | 'n/a'`）
を持つ。`scripts/k16-generate-ceiling-map-docs.ts`がこの配列から
`white-ceilings.md`内の生成対象ブロック（HTMLコメントのマーカーで囲む）を
再生成する。`src/tests/pure/emergenceCeilingMapDocSync.test.ts`が
「今すぐ再生成した内容」と「コミット済みのブロック内容」の一致を検査する
——一致しなければ、正準データソースを変更したのにdocsを再生成し忘れた
ことを機械的に検知する。

**比較検討した代替案:**
1. `white-ceilings.md`自体は手書きのまま、コード側だけ`white-ceilings.md`
   の内容を検査するテストを足す。→ 却下。「JSONを単一の真実にしてdocs側を
   生成する」という計画本文の明示的な要求に反する——検査だけでは二重管理は
   解消されない（どちらが真実かが曖昧なまま）。
2. `white-ceilings.md`全体を生成対象にする。→ 却下。この文書は仮説・訂正
   履歴・誠実な限界など、表以外の重要な散文を大量に持つ。表の部分だけを
   生成対象ブロックとして切り出す方が、人間が書く部分と機械が生成する
   部分の境界が明確になる。

**理由:** 「JSON（実際にはTS配列、ビルド時にJSON化も可能）を単一の真実に
して、docs側を生成する」という計画の文言をそのまま実装する。

**誠実な床:** 生成対象は「K7 天井の地図」表のみ（15行→17行に拡張）。
「現時点でのステータス」表・冒頭の仮説表は手書きのまま残す（表現が
生成向けの定型フォーマットに馴染まないナラティブを含むため）。

## 選択3: V2は新しい型・新しいファイルで、K9〜K15の実測結果を構造化データとして持つ

**選んだもの:** `src/pure/run/exportVesselReportV2.ts`（新規）。
`VesselReportV2`型は、K9（性能表）・K10（永続性実測）・K11（決定的反証子の
結果）・K12（棄却判定）・K13（区別された判定+表）・K14（L2/L3-L4/L6/K6対照群
の4表）・K15（6項目の実測結果表）を、既存の`vessel-roadmap.md`に書かれた
数値をそのまま構造化データとして転記したものとして持つ。加えて選択2の
`emergenceCeilingMap`をそのまま含み、系サイズ・時間スケール・世界の有無
での集計ビュー（同じ配列を3軸でグループ化しただけの導出）を持つ。

**比較検討した代替案:**
1. 既存の`VesselReport`型を拡張する。→ 却下（選択1参照）。
2. K9〜K15の生データを再計算・再実行して集計する。→ 却下。今回は
   「vessel-roadmap.mdに書かれた既に確定した数値の転記・集計」であり、
   新しい実測ではない。再実行はK9〜K15それぞれの既存の事前登録・実行
   スクリプトの仕事であり、K16で重複させない。

**理由:** 転記元（vessel-roadmap.md）と転記先（V2）の対応が誰でも
追える形にする。数値そのものの正しさはK9〜K15各フェーズの完了条件が
既に検証済みであり、K16はそれを「まとめて出す」フェーズである。

**誠実な床:** V2の数値はvessel-roadmap.mdからの**手動転記**であり、
転記ミスを機械的に防ぐ仕組みは今回持たない（emergenceCeilingMapの
ようなdocsとの往復生成はしていない）。転記後、vessel-roadmap.mdの
該当箇所と目視で照合したことを完了条件とする。

## PR分割

- K16-PR1: `emergenceCeilingMap.ts`（正準データ、K2〜K14全17行）
- K16-PR2: `scripts/k16-generate-ceiling-map-docs.ts` + `white-ceilings.md`
  のK7天井の地図表を生成対象ブロック化 + ドリフト検知テスト
- K16-PR3: `exportVesselReportV2.ts` + V2の`vessel-report-v2.json`生成
- K16-PR4: `VESSEL_REPORT_V2.md`（やさしい日本語）+ 完了記録
