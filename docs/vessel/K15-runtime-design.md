# K15 実装ADR — ランタイム: デバイス／サーバー上で在り続ける器

**Status:** approved-by-continuation（うえきさんの「OK 続きお願いします」を
実装続行の承認として扱う。技術選択そのものへの異議があれば、この文書を読んだ
上で差し戻すことができる）。`docs/vessel/K-series-II-brain-and-universe-plan.md`
K15節が要求する新規機構の具体化であり、K5-exchange-medium-adr.mdと同じ作法
（選択→比較検討した代替案→理由→誠実な床）で記録する。

## 前提として確認した事実（実装着手前の調査）

- `docs/pure-physics-implementation-plan.md`には文字どおりの`legacy/`隔離計画は
  存在しない。実際にある原則は §0原則6「既存coreを置き換えず、src/pure/として
  並走させる」と §9「pure coreからlegacy/organism層へimportしない」——**一方向の
  import禁止**であり、「既存コードを`legacy/`フォルダへ移動する」という要求では
  ない。K14までのK-series-II計画本文が「設計書§1が最初から要求していたこと」と
  述べているのは正確ではなく、実際には原則6・§9の一般化である。この訂正を
  ここに明記する（結果を見てからの言い訳ではなく、実装着手前の文書調査で発覚）。
- 現在の唯一のエントリポイントは`index.html`→`src/main.ts`→legacy
  `AeternaNetwork`（`src/core/`）+ Three.js（`index.html`のCDN scriptタグによる
  グローバル、`src/render/RealityVisualLayer.js`が消費。`package.json`の`three`
  npm依存は実際には使われていない）。pure coreへの参照はゼロ。
- `src/pure/persist/snapshot.ts`の`PureCoreSnapshot`は既に`chiReal`/`chiImag`
  という**オプショナル**フィールドを持つが、これはK5の1次元リングχ用に設計
  されたものであり、K13の2次元世界χ（自分自身の独立したPureCoreParams・
  chiNu・分布境界のk/λを持つ）には形が合わない。K13完了時点の誠実な床として
  既に明記済み（「PureCoreSnapshotのχオプション・K10のlongRun.tsはいずれも
  K13のψ+χ+分布境界構成をまだサポートしていない」）。
- `src/pure/run/longRun.ts`は`runMediumHistoryTick`（K2 PR6構成、ψ+ν(x)のみ）
  しか駆動しない。K13の`runWorldTick`（ψ+χ+分布境界）を連続実行する経路は
  存在しない。
- WebSocket/HTTPサーバーの実装・依存は現在ゼロ。

## 選択1: 「長寿命プロセス」はまずNodeプロセスとして実装し、Web Workerは今回見送る

**選んだもの:** `tsx`で起動するNode長寿命プロセス（`scripts/`と同じ実行方式）
を今回のK15の対象とする。計画が言う「同じTSを両方で使う」という将来目標は
維持するが、ブラウザWeb Worker側のホスト（メッセージング・シリアライズ境界・
ブラウザのpage visibility/sleep対策）は別のADRを要する規模の作業であり、
今回のADRのスコープには含めない。

**比較検討した代替案:**
1. 最初からNode/Web Worker両対応の抽象化層を設計する。→ 却下（今回は
   見送り）。K10のlongRun.tsは既にNode/ブラウザ両方から呼べる純関数として
   書かれており、K15の追加コード（worldLongRun.ts等）も同じ書き方をすれば
   Web Worker対応は将来「呼び出し側を足すだけ」で済む。今回、呼び出し側
   （ホスト）を2つ同時に作ることは、決定的反証子（観測API/入力経路の非干渉）
   の検証に集中する上で不要な複雑さを増やす。
2. ブラウザのみ（Web Worker）を先に作る。→ 却下。24時間連続運転という完了
   条件はNode側の方がテスト・自動化しやすい（ブラウザのタブスリープ・
   バックグラウンドスロットリングという交絡因子が入らない）。

**理由:** 完了条件（24時間連続運転・入力ログからのリプレイ・観測API接続の
有無での場のビット一致）は、ホストがNodeでもブラウザでも同じpure core呼び出し
規約を守れば成立する。今回はより検証しやすいNode側を先に実装し、Web Worker側
は将来の拡張として`floors`に明記する。

**誠実な床:** K15はNode環境でのみ検証される。ブラウザWeb Worker上での挙動
（特にタイマー精度・GCの違い）は未検証のまま残る。

## 選択2: K13世界のチェックポイント形式は新規ファイルにする（既存snapshot.tsを拡張しない）

**選んだもの:** `src/pure/persist/worldSnapshot.ts`を新規に作る。
`WorldSnapshot`は次を保持する: `formatVersion`、`tick`、`psiParams`
（psi自身のPureCoreParams）、`chiParams`（chi自身のPureCoreParams、K13の
設計どおりpsiとは独立）、`solverSettings`、`psiReal/psiImag/psiNu`、
`chiReal/chiImag/chiNu`、`k`（分布境界のセル対数）、`lambda`（結合強度）、
`provenance?`。既存の`PureCoreSnapshot`（K5リングχ用の`chiReal/chiImag`
オプション）は**無改変で並存**させる——「新しい現象＝新しいファイル」という
このセッション全体で守ってきた原則をそのままK15にも適用する。

**比較検討した代替案:**
1. `PureCoreSnapshot`に`chiNu`・`chiParams`・`k`・`lambda`をオプショナルで
   追加する。→ 却下。既存のK5リングχ利用者（K13-delay-line-preregistration.md
   の実験等、ただし実際にはK13はまだ`PureCoreSnapshot`を使っていない）が
   将来この形式を使うときに、「K5リング用のchiフィールドなのかK13世界用の
   フィールドなのか」を型で区別できなくなる。オプショナルフィールドの
   組み合わせ爆発は、後から読む人が復元ロジックを誤読する具体的なリスクを生む。
2. `PureCoreSnapshot`を汎用化し、`chiKind: 'ring' | 'world'`のような
   discriminated unionにする。→ 却下（今回は）。既存の`restoreSnapshot`の
   検証ロジック（chiReal/chiImagの有無・長さの一致）をdiscriminated union対応に
   書き換える変更は、K5リングχ側の既存テスト・利用箇所への影響範囲を広げる。
   K13の世界χはpsiとは別のPureCoreParamsを持つ（Nすら異なりうる）という
   K5リングχには無い要件があり、型の共通化にそもそも無理がある。

**理由:** K13世界のチェックポイントはpsi・chiそれぞれに独立したPureCoreParams
を要求する——これはK5リングχの前提（chiはψと同じN・dtを共有するがpsiとは
異なる1次元幾何）と構造的に異なる。別ファイルにすることで、K13完了時点で
明記した誠実な床（「PureCoreSnapshotのχオプションはK13構成をサポートしない」）
をコード上でも正直に反映する。

**誠実な床:** `worldSnapshot.ts`は遅延線対照（`delayLineControl.ts`の
`DelayLineBuffer`）の状態を保存しない——K15の対象はK13の実χ世界であり、
遅延線対照はチェックポイント可能なランタイムの対象外として今回は明記する。

## 選択3: 世界版long-runは既存longRun.tsを変更せず、新規worldLongRun.tsを作る

**選んだもの:** `src/pure/run/worldLongRun.ts`。`runLongRun`と同型のAPI
（`WorldLongRunConfig`/`WorldLongRunResult`）だが、`runMediumHistoryTick`
ではなく`runWorldTick`をtickごとに呼ぶ。停止条件はpsi・chi**両方**の
非有限値、および`WorldFourBookLedgerEntry`の4つの残差
（psiLedger.residualN/H、chiLedger.residualN/H、または交換の同額逆符号が
破れた場合）を検査する。`resumeFrom`は`WorldSnapshot`から復元した
`{tick, psi, psiNu, chi, chiNu}`を受け取る。

**比較検討した代替案:**
1. `longRun.ts`に`worldConfig?`のようなオプショナル分岐を追加する。→ 却下。
   `longRun.ts`自身のfloorsが既に「chi/exchange closed loopを駆動しない」と
   明記しており、この文書はそれを変更せず正しいままにしておくことに価値が
   ある（K2〜K12の既存実測の再現性を保証する、というこのセッション全体の
   規律）。
2. `runWorldTick`ではなく`runWorldTickWithDelayLine`も同じファイルで
   サポートする。→ 却下（今回は）。ランタイムの主対象はK13の実χ世界であり、
   遅延線対照は零仮説の測定装置であって「在り続ける器」そのものではない。

**理由:** 「新しい現象＝新しいファイル、既存を変更しない」をworldLongRun.ts
にも適用する。K10のlongRun.ts・K10の実測（300,000tick、N=128）は無傷のまま
残る。

## 選択4: 入力ポート（signal→J_χ変換器）は「純関数・ψ非参照」を型とソーススキャンの両方で強制する

**選んだもの:** `src/pure/runtime/transducer.ts`。
```ts
export interface ChiTransducer<TSignal> {
  id: string; // "K15-M{n}" 形式、番号付き写像カタログに登録
  description: string;
  toChiDriveContribution: (signal: TSignal, t: number, chiGeometryN: number) => Float64Array;
}
```
`toChiDriveContribution`のシグネチャは**信号とtickの時刻とχの格子サイズしか
受け取らない**——ψ・chi自身の現在の場・観測器の出力のいずれも引数に存在
しない。ランタイムのtickループは、この関数の戻り値を`runWorldTick`の
`drive`引数（chiの駆動、K13の構造上ここしか存在しない入口）にのみ渡す。
これをソーススキャンテストで確認する（K13の`worldTick.test.ts`と同型:
`runWorldTick(psi`呼び出しの引数リストに変換器の戻り値の変数名が
現れないこと、`runWorldTick(...)`の`drive`位置の変数が変換器の戻り値で
あることを両方検査)。適用された全ての信号は`{tick, transducerId, signal}`を
追記専用JSONLログに記録し、リプレイ（同一seed・同一チェックポイント・
同一ログを与えたときのビット一致）の入力とする。

**比較検討した代替案:**
1. 変換器がψの現在値を読み取れるようにする（例: 適応的なフィードバック
   変換）。→ 却下。計画の完了条件そのもの（「観測APIまたは入力経路の
   いずれかがψに直接触れる経路を1本でも持てば、ランタイムは無効」）に
   反する。読み取り専用の観測とは別に「ψを読んでχへの入力を変える」経路が
   1本でもあれば、それは事実上のobserver→core書き戻しである。
2. 型レベルの強制のみで済ませ、ソーススキャンは省略する。→ 却下。
   K13の`ψが駆動引数を持たない`という強制がTypeScriptの型だけでなく
   ソーススキャンテストで実際のコード文字列を検査していたのと同じ理由——
   将来の変更が構造的な保証を静かに破ることを防ぐ。

**理由:** 「入力ポートは世界χにのみ」という計画の要求を、レビューでの
確認ではなく構造として強制する。K13で確立した「シグネチャに存在しない
引数は渡しようがない」という手法をそのまま再利用する。

**誠実な床:** 変換器の「意味のある」実装（センサー・音・テキストの
エネルギー化）は今回のADRでは1つも確定しない。K15-PR3では最小限の
テスト用変換器（一定振幅・矩形波等）のみを実装し、意味のある変換器の
設計は将来のK15追加PRまたは別ADRに委ねる——「新しい現象と、その現象を
判定する測定器を同一PRで確定しない」という`AETERNA-TORUS`原則をここでも守る。

## 選択5: 観測APIはWebSocket（`ws`パッケージ）+ Node `http`。読み取り専用をimportの制限とソーススキャンで強制する

**選んだもの:** 新規依存として`ws`（Node向けの標準的なWebSocket実装）を
追加する。`src/pure/runtime/observationApi.ts`は、ランタイムのtickループが
書き込む共有の読み取り専用スナップショット
（`src/pure/runtime/observationState.ts`の`ObservationSnapshot`型: |ψ|²・
位相・ν(x)・|χ|²・4本の帳簿・K11の測定値の一部）を一定間隔で
JSON化してWebSocketクライアントへブロードキャストする**だけ**の
モジュールにする。`observationApi.ts`は`run/`・`field/`・`world/worldTick.ts`・
`drive/`・`medium/`のいずれからもimportしない——importできるのは
`observe/`配下の読み取り専用関数と`observationState.ts`の型のみである
ことをソーススキャンテストで確認する。

**比較検討した代替案:**
1. Node組み込みの`http`+`crypto`だけで生のWebSocketフレーミングを手書き
   する。→ 却下。マスキング・フラグメンテーション・ping/pongを正しく
   実装するのは誤りやすく、監査済みの標準的な実装（`ws`、週間ダウンロード
   数が非常に多い枯れたライブラリ）を使う方が「読み取り専用である」という
   保証の検証に集中できる。この依存追加はphysicsのショートカットではなく
   インフラの選択であり、K9のFFT実装（自前で書いた）のように物理の正しさが
   問われる部分とは性質が違う。
2. WebSocketではなくSSE（Server-Sent Events、単方向）にする。→ 検討したが
   不採用。計画本文が明示的に「WebSocketストリーム」と指定しているため、
   その指定に従う。SSEも単方向で読み取り専用の要件は満たせるが、計画の
   文言をそのまま実装する方が後から読む人にとって分かりやすい。

**理由:** 「観測APIがψに直接触れる経路を1本でも持てば無効」という決定的
反証子を、importの静的な制限として検証可能にする。

**誠実な床:** `ws`はNode向け実装であり、ブラウザ側クライアント（選択6の
可視化）は標準の`WebSocket`グローバルを使う——サーバー側の実装ライブラリと
クライアント側で非対称だが、プロトコル自体は標準WebSocketなので相互運用に
問題はない。

## 選択6: ランタイムは単一Nodeプロセス内でtickループとWebSocketサーバーを同居させる（プロセス分離は今回見送り）

**選んだもの:** `src/pure/runtime/runtimeProcess.ts`が1つのプロセス内で
(a) tickループ（worldLongRun.tsのロジックを1tickずつ進める版、チェックポイント・
入力適用・observationState更新を担当）と(b) `observationApi.ts`のWebSocket
サーバーの両方を起動する。両者の間で共有されるのは読み取り専用の
`ObservationSnapshot`オブジェクトのみで、(b)から(a)の内部状態・関数への
参照経路は存在しない（同一プロセスなので技術的には可能だが、モジュール境界
としてimportさせない——選択5のソーススキャンがこれを検証する）。

**比較検討した代替案:**
1. tickループとAPIサーバーを別プロセスにし、IPC（子プロセスメッセージング
   またはUnixソケット）で結ぶ。→ 却下（今回は）。プロセス境界による分離は
   「1本の経路もない」という主張をより強く支持できるが、24時間連続運転・
   チェックポイント再起動という完了条件をまず満たすことを優先し、プロセス間
   IPCの複雑さ（両プロセスの再起動タイミングのずれ等）は今回のスコープに
   含めない。将来、より強い保証が必要になった場合の拡張として床に残す。

**理由:** モジュールレベルのimport制限は、プロセス分離より弱いが検証可能で
実装コストが低い。K13が「ψのdissipationTickにdrive引数が存在しない」という
シグネチャレベルの強制で十分な保証を得たのと同じ考え方を踏襲する。

**誠実な床:** 同一プロセスであるため、`observationApi.ts`が理論上
`runtimeProcess.ts`の他の変数に触れる**技術的な**可能性はゼロではない
（JSのモジュールシステムはプロセス分離ほど強い障壁ではない）。ソース
スキャンテストが検出するのは「実際にimportして参照しているか」であり、
「今後も参照しないことを実行時に強制する」型のサンドボックスではない。
より強い保証（プロセス分離、あるいはWorker Threadsでのメモリ空間分離）は
将来の課題として明記する。

## 選択7: 可視化の pure core への結線・legacy隔離は今回のADRの完了条件に含めない

**選んだもの:** 計画本文の「置くもの」には可視化結線・legacy隔離が
含まれるが、計画本文が明記する**完了条件**（24時間連続運転・リプレイ・
観測API有無での場のビット一致）にはこの2つは含まれない。今回のK15の
実装PRでは、決定的反証子に直結する4つの機構（世界チェックポイント・
世界long-run・入力変換器・観測API）を先に実装・実測し、可視化結線と
legacy隔離は**時間の許す範囲で後続PRとして扱う**——実行しない場合は
K15完了記録にその旨を事前登録済みの縮小として明記する。

**比較検討した代替案:**
1. 可視化・legacy隔離を最初のPRに含めてから機構を作る。→ 却下。
   決定的反証子（観測API・入力経路の非干渉）の検証は可視化の有無に
   依存しない。可視化はobservationApi.tsの1クライアントに過ぎず、
   可視化を先に作ることは検証の優先順位として逆である。

**理由:** 計画の完了条件を文字どおり満たすことを優先する。K10（10⁶→
300,000tick）・K14（N=256・10⁶tick未達）と同じく、事前に縮小方針を
明記した上で進める。

**誠実な床:** legacy隔離（`src/core/`・`src/render/`・`src/main.ts`を
`legacy/`へ移動）は本セッションでは着手しない可能性がある。着手しない
場合、README・エントリポイントの更新も行わない——中途半端な移動
（一部だけ移して動かなくする）より、「まだ移していない」という明確な
現状の方が誠実である。

## K15完了条件（計画本文をそのまま採用）

- 24時間連続運転（チェックポイント・再起動を含む）で帳簿が閉じ続ける
- 入力ログからのリプレイがビット一致する
- 観測APIを接続した状態と切った状態で場がビット一致する

**決定的反証子:** 観測APIまたは入力経路のいずれかがψに直接触れる経路を
1本でも持てば、ランタイムは無効。

**実行前に予告する縮小の可能性:** K10・K14の前例に倣い、24時間という
文字どおりの規模は、実測スループットを見てから機構としての実現可能性を
判断する。届かない場合は事前に（結果を見てからではなく）縮小を明記し、
その理由を記録する。
