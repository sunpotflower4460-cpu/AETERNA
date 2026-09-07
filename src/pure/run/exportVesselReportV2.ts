/**
 * PUT-IN: nothing (this module transcribes already-published K9-K15
 *   results from docs/vessel/vessel-roadmap.md into structured data,
 *   plus the shared emergenceCeilingMap.ts)
 * EMERGED: `VesselReportV2`, a JSON-serializable consolidation of K9
 *   through K15's key measured results (nulls included) and a derived
 *   系サイズ・時間スケール・世界の有無 pivot table
 * claim-tier: C1 (formatting/consolidation utility; every quantitative
 *   claim it carries was already validated where it was measured - see
 *   each entry's own K-phase section in docs/vessel/vessel-roadmap.md,
 *   cited inline below)
 * floors (誠実な床): this is a NEW file, not an extension of V1
 *   (src/pure/run/exportVesselReport.ts) - see docs/vessel/K16-report-
 *   v2-design.md Choice 1. Its numbers are a MANUAL TRANSCRIPTION from
 *   vessel-roadmap.md, not a fresh computation or a re-run of any
 *   experiment - K16 consolidates, it does not re-measure. There is no
 *   automated check that this transcription matches vessel-roadmap.md
 *   (unlike emergenceCeilingMap.ts, which IS the single source of truth
 *   white-ceilings.md generates from) - a transcription error here
 *   would only be caught by manual review against vessel-roadmap.md,
 *   which was done once before this file was committed (K16-report-v2-
 *   design.md Choice 3's own disclosed floor). The size/timescale/world-
 *   presence table (`buildSizeTimescaleWorldTable`) IS a mechanical
 *   derivation from emergenceCeilingMap.ts (no manual re-entry), so that
 *   part inherits emergenceCeilingMap.ts's own sync guarantee.
 *
 *   `newTests` per phase is verified against a fresh `npx vitest run` of
 *   that phase's own dedicated test file(s) plus the dynamic
 *   pureCoreForbiddenPatterns.test.ts increment for each new src/pure/
 *   file added that phase - not copied from vessel-roadmap.md's prose,
 *   which this transcription caught disagreeing with itself in one spot
 *   (K14's own count, corrected here to the verified 22). Deliberately
 *   does NOT carry a cumulative "total tests after this phase" field:
 *   vessel-roadmap.md itself is inconsistent about what that number
 *   counts (K9-K13 report a `src/tests/pure/`-only cumulative count;
 *   K14's checkpoint report and K15's completion record switch to the
 *   whole-suite total including legacy tests) - propagating either
 *   convention here would misrepresent the other phases, so this floor
 *   is disclosed instead of silently resolved.
 */

import { EMERGENCE_CEILING_MAP, type EmergenceCeilingEntry, type WorldPresence } from './emergenceCeilingMap.ts';

export interface K9PerformanceRow {
  N: number;
  solverKind: string;
  setupMs: number;
  ticksPerSecond: number;
}

export interface K9Summary {
  /** docs/vessel/vessel-roadmap.md K9節. */
  performanceTable: readonly K9PerformanceRow[];
  newTests: number;
  floorDeferred: string;
}

export interface K10Summary {
  /** docs/vessel/vessel-roadmap.md K10節. */
  crossProcessRun: { N: number; ticks: number; bitIdentical: boolean };
  chainedRun: { N: number; totalTicks: number; checkpointResumeCycles: number; ticksPerSecondRange: readonly [number, number]; stoppedEarly: boolean };
  memoryGrowth: { fromMb: number; toMb: number; overTicks: number; note: string };
  honestShortfall: string;
  newTests: number;
}

export interface K11Summary {
  /** docs/vessel/vessel-roadmap.md K11節. */
  instrumentsBuilt: number;
  decisiveFalsifierResult: string;
  observerNonInterference: { ticksRun: number; literalTarget: number; result: string };
  honestShortfall: string;
  newTests: number;
}

export interface K12ArmResult {
  armName: string;
  configCount: number;
  seedCount: number;
  l2SatisfiedFraction: string;
  maxPersistenceTicks: number;
  varianceAcrossAllRuns: number;
  verdict: string;
}

export interface K12Summary {
  /** docs/vessel/vessel-roadmap.md K12節. */
  arms: readonly K12ArmResult[];
  decisiveFalsifierVerdict: string;
  newTests: number;
}

export interface K13ComparisonRow {
  metric: string;
  real: string;
  delayLine: string;
  distinguished: string;
}

export interface K13Summary {
  /** docs/vessel/vessel-roadmap.md K13節. */
  N: number;
  seedCount: number;
  comparison: readonly K13ComparisonRow[];
  decisiveFalsifierVerdict: string;
  newTests: number;
}

export interface K14L2Row {
  N: number;
  l2Satisfied: string;
  maxPersistenceTicksMedianRange: string;
  finalCandidateCountMedianRange: string;
}

export interface K14L3L4Row {
  condition: string;
  nPsiMedianRange: string;
  maxPersistenceTicksMedianRange: string;
  l3Satisfied: string;
}

export interface K14L6Result {
  seedCount: number;
  satisfiesL6Fraction: string;
  survivalTicksMedianRange: string;
  censoredCount: number;
}

export interface K14K6ControlResult {
  nPsiRelativeDiff: string;
  nPsiVerdict: string;
  maxPersistenceRelativeDiff: string;
  maxPersistenceVerdict: string;
}

export interface K14Summary {
  /** docs/vessel/vessel-roadmap.md K14節. */
  l2: readonly K14L2Row[];
  l3l4: readonly K14L3L4Row[];
  l6: K14L6Result;
  k6Control: K14K6ControlResult;
  secondPeriodDecisiveFalsifierHonestShortfall: string;
  newTests: number;
}

export interface K15ValidationRow {
  property: string;
  method: string;
  result: string;
}

export interface K15Summary {
  /** docs/vessel/vessel-roadmap.md K15節. */
  validation: readonly K15ValidationRow[];
  honestShortfall: string;
  newTests: number;
}

export interface SizeTimescaleWorldRow {
  phase: string;
  systemSizes: readonly number[];
  ticks: number;
  worldPresence: WorldPresence;
  reachedLevel: string;
}

/** Mechanical derivation from EMERGENCE_CEILING_MAP - not manually re-entered, so it cannot drift from that single source. Excludes n/a rows (no scored dynamical run to place in the pivot). */
export function buildSizeTimescaleWorldTable(entries: readonly EmergenceCeilingEntry[] = EMERGENCE_CEILING_MAP): readonly SizeTimescaleWorldRow[] {
  return entries
    .filter((e): e is EmergenceCeilingEntry & { systemSizes: readonly number[]; ticks: number } => e.systemSizes !== null && e.ticks !== null)
    .map((e) => ({ phase: e.phase, systemSizes: e.systemSizes, ticks: e.ticks, worldPresence: e.worldPresence, reachedLevel: e.reachedLevel }));
}

export interface VesselReportV2 {
  formatVersion: 2;
  coveredPhases: readonly string[];
  k9: K9Summary;
  k10: K10Summary;
  k11: K11Summary;
  k12: K12Summary;
  k13: K13Summary;
  k14: K14Summary;
  k15: K15Summary;
  emergenceCeilingMap: readonly EmergenceCeilingEntry[];
  sizeTimescaleWorldTable: readonly SizeTimescaleWorldRow[];
}

export function exportVesselReportV2Json(): VesselReportV2 {
  return {
    formatVersion: 2,
    coveredPhases: ['K9', 'K10', 'K11', 'K12', 'K13', 'K14', 'K15'],
    k9: {
      performanceTable: [
        { N: 24, solverKind: 'dense', setupMs: 875, ticksPerSecond: 621 },
        { N: 32, solverKind: 'spectral', setupMs: 1, ticksPerSecond: 311 },
        { N: 64, solverKind: 'spectral', setupMs: 2, ticksPerSecond: 162 },
        { N: 128, solverKind: 'spectral', setupMs: 14, ticksPerSecond: 61 },
        { N: 256, solverKind: 'spectral', setupMs: 16, ticksPerSecond: 23 },
      ],
      newTests: 56,
      floorDeferred: 'F7（ゼロアロケーション）はK10へ明示的に先送り',
    },
    k10: {
      crossProcessRun: { N: 32, ticks: 100000, bitIdentical: true },
      chainedRun: { N: 128, totalTicks: 300000, checkpointResumeCycles: 14, ticksPerSecondRange: [51.5, 53.4], stoppedEarly: false },
      memoryGrowth: { fromMb: 184, toMb: 210, overTicks: 200000, note: '約14%の増加、単調増加傾向の確証はしていない（プロセス間競合が交絡）' },
      honestShortfall: '文字どおりの10^6tickには届いていない。52tick/sでの推定約5.3時間に対し、実際には300,000tick（目標の30%）で報告した',
      newTests: 26,
    },
    k11: {
      instrumentsBuilt: 13,
      decisiveFalsifierResult: '観測ON/OFFで1ビットでも差が出れば測定器は無効。→ 差は出なかった。',
      observerNonInterference: { ticksRun: 2000, literalTarget: 10000, result: 'MATCH: bit-identical psi and nu with observe on vs off' },
      honestShortfall: '完了条件はN=128・10^4tickでの観測ON/OFFビット一致を要求するが、実際にはN=128・2,000tick（目標の20%）で確認した',
      newTests: 74,
    },
    k12: {
      arms: [
        {
          armName: '腕A（時間スケール掃引、既存ν(x)）',
          configCount: 7,
          seedCount: 10,
          l2SatisfiedFraction: '0/10（全設定）',
          maxPersistenceTicks: 2,
          varianceAcrossAllRuns: 0,
          verdict: 'K3仮説棄却',
        },
        {
          armName: '腕B（第二の記憶チャンネルg(x)）',
          configCount: 7,
          seedCount: 10,
          l2SatisfiedFraction: '0/10（全設定）',
          maxPersistenceTicks: 2,
          varianceAcrossAllRuns: 0,
          verdict: '腕Aと同型の棄却',
        },
      ],
      decisiveFalsifierVerdict: '成立。maxPersistenceTicksは140 run全て（腕A・腕B、7設定×10 seedの全組み合わせ）で厳密に2tickだった（分散ゼロ）',
      newTests: 34,
    },
    k13: {
      N: 8,
      seedCount: 5,
      comparison: [
        { metric: 'L2満足', real: '0/5', delayLine: '0/5', distinguished: '区別できない' },
        { metric: 'L3満足', real: '5/5', delayLine: '5/5', distinguished: '区別できない（既知の飽和）' },
        { metric: 'run終了時のN_ψ（範囲）', real: '0.009029〜0.009130', delayLine: '0.000002〜0.000003', distinguished: '区別された（3000倍以上の差）' },
        { metric: 'maxPersistenceTicks（範囲）', real: '141〜233', delayLine: '160〜281', distinguished: '明確な傾向なし' },
      ],
      decisiveFalsifierVerdict: '区別された',
      newTests: 43,
    },
    k14: {
      l2: [
        { N: 64, l2Satisfied: '0/10', maxPersistenceTicksMedianRange: '11（10〜14）', finalCandidateCountMedianRange: '51（44〜72）' },
        { N: 128, l2Satisfied: '0/10', maxPersistenceTicksMedianRange: '19（18〜21）', finalCandidateCountMedianRange: '0（0〜4）' },
        { N: 256, l2Satisfied: '0/10', maxPersistenceTicksMedianRange: '52（46〜63）', finalCandidateCountMedianRange: '3409（3150〜3608）' },
      ],
      l3l4: [
        { condition: '開放系', nPsiMedianRange: '1.107795（1.107689〜1.107941）', maxPersistenceTicksMedianRange: '2（1〜2）', l3Satisfied: '20/20' },
        { condition: '閉鎖系（K13世界）', nPsiMedianRange: '0.003165（0.003158〜0.003168）', maxPersistenceTicksMedianRange: '11（10〜15）', l3Satisfied: '20/20' },
        { condition: '遅延線対照', nPsiMedianRange: '0.000005（0.000004〜0.000005）', maxPersistenceTicksMedianRange: '14（13〜18）', l3Satisfied: '20/20' },
      ],
      l6: { seedCount: 10, satisfiesL6Fraction: '0/10', survivalTicksMedianRange: '65.5（60〜82）', censoredCount: 0 },
      k6Control: {
        nPsiRelativeDiff: '約11,100%',
        nPsiVerdict: '区別された（ただし較正不一致でconfound、解釈不能）',
        maxPersistenceRelativeDiff: '約9.1%',
        maxPersistenceVerdict: '区別できない（事前登録した20%基準未満）',
      },
      secondPeriodDecisiveFalsifierHonestShortfall:
        '文字どおりのN=256・10^6tickには届いていない（1seedあたり約4.3日と見積もり）。L3が飽和しているため、代わりにL2・L6という2つの独立指標が到達した全規模で一貫してnullだったことを暫定的な根拠として記録した',
      newTests: 22, // verified via npx vitest run: deriveTauMin.test.ts(5) + foreignFieldControl.test.ts(5) + worldSelfSustainingClosure.test.ts(9) + 3 dynamic pureCoreForbiddenPatterns.test.ts increments
    },
    k15: {
      validation: [
        { property: 'チェックポイント/再起動のビット一致', method: '本物の別プロセスでcheckpoint→resume、非中断runの最終snapshotとdiff', result: 'IDENTICAL（バイト完全一致）' },
        { property: '入力ログからのリプレイのビット一致', method: 'ライブ生成ロジックにアクセスしない別プロセスでのリプレイとdiff', result: 'IDENTICAL（バイト完全一致）' },
        { property: '観測API接続 vs 非接続', method: '実wsクライアントを実サーバーに接続し続けた状態での比較', result: 'ビット完全一致' },
        { property: '帳簿の継続的な閉鎖', method: 'N=32・4分間（240.8秒）の実時間soak run', result: '10,100tick完走、停止条件なし' },
        { property: 'メモリの安定性', method: '同soak runでのRSSサンプリング', result: '187.5〜211.9MB、単調増加傾向なし' },
        { property: 'チェックポイント・入力ログ・観測APIの同時機能', method: '同soak run: 20回のチェックポイント、73回の信号注入、3687件のブロードキャスト', result: '全て正常に動作' },
      ],
      honestShortfall:
        '計画が要求する文字どおりの「24時間連続運転」は実行していない（実時間の制約、tick数の問題ではない）。可視化のpure coreへの結線・legacy UI隔離も時間の制約で未着手',
      newTests: 78,
    },
    emergenceCeilingMap: EMERGENCE_CEILING_MAP,
    sizeTimescaleWorldTable: buildSizeTimescaleWorldTable(),
  };
}
