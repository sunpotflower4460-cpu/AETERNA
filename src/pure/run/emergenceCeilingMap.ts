/**
 * PUT-IN: nothing (this module only defines static data transcribed
 *   verbatim from docs/vessel/white-ceilings.md's "K7 天井の地図" table)
 * EMERGED: the single canonical list of emergence-ceiling entries (K2
 *   through K14), used by both `scripts/k16-generate-ceiling-map-docs.ts`
 *   (which regenerates white-ceilings.md's table from this array) and
 *   `src/pure/run/exportVesselReportV2.ts` (K16's V2 report)
 * claim-tier: C1 (data transcription; the underlying physics claims
 *   were already validated where they were measured - see each entry's
 *   own K-phase section in docs/vessel/vessel-roadmap.md)
 * floors (誠実な床): this is the SINGLE canonical source K16 introduces
 *   to resolve the docs/code duplication flagged in
 *   src/pure/run/exportVesselReport.ts's own header comment - that
 *   file's `EMERGENCE_CEILING_MAP` (K8, frozen at K7) is INTENTIONALLY
 *   left untouched as a historical snapshot (docs/vessel/K16-report-v2-
 *   design.md Choice 1), not migrated to this module. `systemSizes`/
 *   `ticks`/`worldPresence` are new fields this module adds beyond V1's
 *   4-string shape, to support K16's "系サイズ・時間スケール・世界の
 *   有無ごとの到達レベル表". For a row where multiple conditions were
 *   compared in one experiment (e.g. K13's real-world vs delay-line, or
 *   K14-PR4's open/closed/delay-line three-way), `worldPresence` names
 *   the NEWEST/primary condition being tested, not every condition in
 *   the comparison - the full nuance stays in `reachedLevel`/
 *   `stopReason`/`nextMissingCause`'s prose, transcribed verbatim from
 *   white-ceilings.md's own markdown (bold/backticks/em-dashes kept
 *   as-is, since `scripts/k16-generate-ceiling-map-docs.ts` writes this
 *   text straight into the regenerated table cells).
 *   Entries scored 判定対象外 with no scored dynamical run (K2 PR2/PR3/
 *   PR4/PR7, K6) deliberately have `systemSizes: null, ticks: null,
 *   worldPresence: 'n/a'` - forcing a size/tick figure into the pivot
 *   table would misrepresent what those rows are for. K7追加（探索的）
 *   is scored 判定対象外 in white-ceilings.md's OTHER table
 *   ("現時点でのステータス") but its 天井の地図 row (transcribed here)
 *   reports a real finding from a real N=10/1200-tick run, so it gets
 *   real systemSizes/ticks/worldPresence despite the 判定対象外 label
 *   living elsewhere in the source doc.
 */

export type WorldPresence = 'none' | 'ring-chi' | 'world-chi' | 'foreign-chi' | 'delay-line' | 'n/a';

export interface EmergenceCeilingEntry {
  phase: string;
  white: string;
  reachedLevel: string;
  stopReason: string;
  nextMissingCause: string;
  /** N values actually run, or null for a row with no scored dynamical run. */
  systemSizes: readonly number[] | null;
  /** Total ticks of the run this entry reports on, or null (see floors). */
  ticks: number | null;
  worldPresence: WorldPresence;
}

export const EMERGENCE_CEILING_MAP: readonly EmergenceCeilingEntry[] = [
  {
    phase: 'K2 PR2',
    white: 'K2 PR2（器のみ）',
    reachedLevel: '判定対象外',
    stopReason: '時間発展そのものが存在しない',
    nextMissingCause: 'PR3の実装（既に完了）',
    systemSizes: null,
    ticks: null,
    worldPresence: 'n/a',
  },
  {
    phase: 'K2 PR3',
    white: 'K2 PR3（保存部のみ）',
    reachedLevel: '判定対象外',
    stopReason: '保存系はエネルギー注入源を持たず、初期条件の自由分散が続くだけで「白」として持続しない',
    nextMissingCause: 'PR4〜PR5の実装（既に完了）',
    systemSizes: null,
    ticks: null,
    worldPresence: 'n/a',
  },
  {
    phase: 'K2 PR4',
    white: 'K2 PR4（+散逸）',
    reachedLevel: '判定対象外',
    stopReason: '駆動なしの散逸系は単調減衰する吸収体であり、持続構造を生まない',
    nextMissingCause: 'PR5の実装（既に完了）',
    systemSizes: null,
    ticks: null,
    worldPresence: 'n/a',
  },
  {
    phase: 'K2 PR5',
    white: 'K2 PR5（+駆動J、ν=ν₀均一）',
    reachedLevel: '**L2未達（実測済み）**。5 seed全てで最大持続1tick、最終tickでは渦候補0個',
    stopReason: '`tau_min=500`tickに対し実際の持続はその1/500以下。持続的構造を生む自由度が無い',
    nextMissingCause:
      'K7追加事前登録が既に実施済み（`docs/vessel/K7-natural-emergence-preregistration.md`）。**次はtau_minを実際の力学スケール（〜数十tick）に合わせた新しい事前登録実験**',
    systemSizes: [10],
    ticks: 1200,
    worldPresence: 'none',
  },
  {
    phase: 'K2 PR6 / K3',
    white: 'K2 PR6 / K3（+媒質履歴ν(x)）',
    reachedLevel: '**L2未達（実測済み、条件2の一部として）**。5 seed全てで最大持続34〜39tick——条件1の30倍以上だが`tau_min=500`の1/10未満',
    stopReason: '媒質履歴+交換結合ありでも、持続がtau_minに対して依然として2桁足りない',
    nextMissingCause: '上記と同じtau_min再選定に加え、なぜ条件2が条件1よりおよそ30倍長く持続するかの機構的説明（未解明）',
    systemSizes: [10],
    ticks: 1200,
    worldPresence: 'ring-chi',
  },
  {
    phase: 'K2 PR7 / K4',
    white: 'K2 PR7 / K4（読み取り専用観測）',
    reachedLevel: '判定対象外（測定器）',
    stopReason: '測定器を凍結しただけで、測定を実行していない',
    nextMissingCause: '上記のPR5/K3のrunを、この測定器で実際に見る（**K7追加で実施済み**）',
    systemSizes: null,
    ticks: null,
    worldPresence: 'n/a',
  },
  {
    phase: 'K5',
    white: 'K5（物理的閉路：χ・𝒮・対称結合）',
    reachedLevel: '**L2未達（実測済み、条件2として）**。K2 PR6/K3の行と同一の実測（媒質履歴+χを組み合わせた条件2）',
    stopReason: '同上',
    nextMissingCause: '同上',
    systemSizes: [10],
    ticks: 1200,
    worldPresence: 'ring-chi',
  },
  {
    phase: 'K6',
    white: 'K6（reafference弁別）',
    reachedLevel: '判定対象外（自他弁別の測定であり、emergence levelの測定ではない）',
    stopReason: '—',
    nextMissingCause: '上記「誠実な限界」節・`vessel-roadmap.md` K6節参照',
    systemSizes: null,
    ticks: null,
    worldPresence: 'n/a',
  },
  {
    phase: 'K7追加',
    white: 'K7追加: 自然発展下でのL2実測',
    reachedLevel: '**L2未達（条件1・条件2とも、5 seed全て）**。詳細は`vessel-roadmap.md` K7節参照',
    stopReason: '`tau_min=500`という選定が、実際の力学の持続スケール（〜数十tick）に対して過大だった可能性がある（実測後の気づきであり、事後に閾値を下げて再判定はしていない）',
    nextMissingCause: 'tau_minを実際のスケールに合わせ直した新しい事前登録実験',
    systemSizes: [10],
    ticks: 1200,
    worldPresence: 'none',
  },
  {
    phase: 'K7追加（探索的）',
    white: 'K7追加（探索的）: 持続優位性の機構分離',
    reachedLevel: '条件2の持続優位性（30倍）は**χ単独でほぼ完全に再現**（5 seed全て、条件2と1tick以内の一致）。媒質履歴単独では**優位性ゼロ**（条件1と完全一致）',
    stopReason: 'χの単一セル結合が、空間一様な駆動だけでは破れない局所的対称性の破れを持続的に与える（仮説、証明はしていない）',
    nextMissingCause: 'この機構（局所対称性の破れ→欠陥核形成）の直接的な検証。χの結合強度λを振った場合の持続時間の依存性',
    systemSizes: [10],
    ticks: 1200,
    worldPresence: 'ring-chi',
  },
  {
    phase: 'K12腕A',
    white: 'K12腕A: 時間スケール掃引（既存ν(x)、χなし）',
    reachedLevel: '**L2未達・K3仮説棄却（7設定×10 seed全て）**。全ての(κ,ρ)組（対照含む）でL2満足0/10、maxPersistenceTicksは全設定・全seedで厳密に2tick（分散ゼロ）',
    stopReason:
      'ρを1/3ρ0.3〜1/1000ρ0.3（33,333tick）まで3桁振っても、χ不在では持続tickが物理定数から完全に独立——媒質履歴だけでは持続を左右する自由度になっていない。K7追加の探索的follow-up（χ単独が優位性のほぼ全てを再現）と整合する',
    nextMissingCause: 'κ・ρの掃引そのものはこれ以上不要（決定的反証子成立）。K13でχを世界へ拡張した後、同じ掃引をχあり構成で再試行する価値はある（媒質履歴がχと組み合わさって初めて効くかは未検証）',
    systemSizes: [64],
    ticks: 8000,
    worldPresence: 'none',
  },
  {
    phase: 'K12腕B',
    white: 'K12腕B: 第二の記憶チャンネルg(x)（χなし）',
    reachedLevel: '**L2未達・K3仮説と同型の腕Bの棄却（7設定×10 seed全て）**。腕Aと完全に同一のパターン（L2満足0/10、maxPersistenceTicks厳密に2tick、分散ゼロ）',
    stopReason:
      '腕Aと同一の機構的理由。g(x)という「置き場所」を変えても、χ不在で持続を左右する自由度にはならない——(a)時間スケールの問題ではなく(b)チャンネルの置き場所の問題でもなく、χの不在そのものが律速している可能性を示唆する',
    nextMissingCause:
      '上記K12腕Aと同じ。誠実な限界: L3満足は7設定×10 seed全て（腕A・B合わせて140/140）で100%だったが、これは`src/pure/observe/vortexTracking.ts`が自ら明記する床（`circulation != 0`は検出器の設計上つねに真、`com_velocity != 0`は2tick生存する候補ならほぼ自動的に満たされる）による飽和であり、L3が意味のある弁別を行った結果ではない。この飽和はL2には及ばない（L2は独立に0/10で棄却が成立している）ため、K3仮説棄却という結論自体はL3の飽和に依存していない',
    systemSizes: [64],
    ticks: 8000,
    worldPresence: 'none',
  },
  {
    phase: 'K13',
    white: 'K13: 世界χ・遅延線零仮説（N=8、5 seed）',
    reachedLevel: '**L2未達（実測済み、5/5）。決定的反証子は「区別された」**（run終了時のN_ψが条件Real vs 条件DelayLineで3000倍以上差、事前登録した20%閾値を大幅超過）',
    stopReason:
      'χを場として置いたことはN_ψという直接指標では明確に何かを買っているが、L2/L3レベルの構造獲得への寄与はまだ確認されていない。差の主因が「χがエネルギーを受け取れる場であること」と「χが分散・非線形の内部力学を持つこと」のどちらかは、この単一比較では分離できていない',
    nextMissingCause: 'N=8のみでの実行。系サイズを広げた再測定（K14が担当）。DelayLine側にも同等のエネルギー収支を与えた対照を追加する別実験（未着手）',
    systemSizes: [8],
    ticks: 2000,
    worldPresence: 'world-chi',
  },
  {
    phase: 'K14-PR3',
    white: 'K14-PR3: L2再測定（独立導出tau_min、N=64/128/256）',
    reachedLevel: '**L2未達（30 run全て、3つのN共通）**。maxPersistenceTicksはNとともに増加（11→19→52中央値）するが、tau_min=667tickの1/6にも届かない',
    stopReason: 'K7が観測した過去の値から逆算しない独立導出tau_min（667tick）に対しても、実際の持続は依然として1桁以上不足する。系サイズを64→256まで広げても質的に変わらない',
    nextMissingCause: 'tau_minという閾値の問題ではないことが確定した以上、次に足りない自由度を探すにはL2以外の白（3次元・多成分等）を検討する段階に近づいている',
    systemSizes: [64, 128, 256],
    ticks: 2000,
    worldPresence: 'world-chi',
  },
  {
    phase: 'K14-PR4',
    white: 'K14-PR4: L3/L4（開放系・閉鎖系・遅延線対照、N=64、各20 seed）',
    reachedLevel: '**決定的反証子は「区別された」**（N_ψ・maxPersistenceTicksとも事前登録した20%閾値を大幅超過。L3満足は3条件とも100%で飽和のため弁別に使えない）',
    stopReason:
      '世界（χ）を持つ構成は開放系より明確に異なるN_ψ・持続性を示すが、これは「構造がより高いレベルに到達した」ことの直接証拠ではなく、エネルギー収支の違いを反映している可能性がK13から持ち越されたまま未分離',
    nextMissingCause: 'K13と同じ：エネルギー収支を揃えた対照実験。L4（内外コントラスト等）はK14では未実行',
    systemSizes: [64],
    ticks: 2000,
    worldPresence: 'world-chi',
  },
  {
    phase: 'K14-PR5 (L6)',
    white: 'K14-PR5: L6（K13世界版の自己維持閉環、N=64、10 seed）',
    reachedLevel: '**L6未達（10/10）**。駆動停止後、構造指標は要求される散逸時間666.7tickの1/8未満（60〜82tick）で閾値を割り込む。censoredは0件——「まだ分からない」ではなく確定した不成立',
    stopReason:
      'K13の実世界構成は、この設計・このパラメータ域では、外部エネルギー流入を止めた後の自己維持を示さない。χの内部力学だけでは、自己維持に必要な「エネルギーを蓄える・遅く放出する」自由度が不足している可能性',
    nextMissingCause: 'λ（結合強度）やχ自身の散逸ν0を振ったパラメータ探索（未着手）。structureThreshold自体の零仮説較正（K14-L6-preregistration.mdの誠実な限界参照）',
    systemSizes: [64],
    ticks: 3000,
    worldPresence: 'world-chi',
  },
  {
    phase: 'K14-PR5 (K6対照群)',
    white: 'K14-PR5: K6対照群（自己由来χ vs 外部由来χ′、結合形式固定、20 seed）',
    reachedLevel: '**混在した結果**: N_ψは巨大に異なるが較正不一致にconfound（解釈不能）。maxPersistenceTicksは自己・外部で**区別できない**（相対差9.1%、事前登録した20%基準未満）',
    stopReason: '結合の形式（対称ラビ回転）を揃えた上では、渦持続性という指標でψは由来（自己か外部か）を弁別しなかった——これはK6本体が残した「回転vs加法」交絡を分離した上での、初めての由来限定の観測',
    nextMissingCause: 'エネルギーを較正したinjectionStrengthでの再確認（今回は事前登録上あえて較正しなかった）。N_ψ以外の、振幅スケールに左右されにくい指標を増やす',
    systemSizes: [64],
    ticks: 2000,
    worldPresence: 'foreign-chi',
  },
];
