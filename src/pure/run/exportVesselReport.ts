/**
 * PUT-IN: a ReafferenceStudyConfig (the exact frozen K6 config) and its
 *   ReafferenceStudyResult (from running runReafferenceStudy on it)
 * EMERGED: a JSON-serializable VesselReport bundling everything K8
 *   requires - seed range, params, solverStepOrder, ticks, a ledger
 *   summary, the null-hypothesis comparison, and the K7 emergence
 *   ceiling map - reproducible by re-running the same config
 * claim-tier: C1 (formatting utility; the physics/statistics claims it
 *   packages were already validated where they were computed - see
 *   src/tests/pure/reafferenceFrozenFinding.test.ts for the pinned
 *   result and src/tests/pure/vesselReportFormat.test.ts for this
 *   module's own required-fields check)
 * floors (誠実な床): emergenceCeilingMap is a HARDCODED transcription of
 *   docs/vessel/white-ceilings.md's K7 table, not something computed at
 *   runtime - it is data about what has and hasn't been measured, kept
 *   here so the machine-readable report is self-contained per K8's
 *   completion condition, not a fresh analysis. If white-ceilings.md's
 *   table changes, this constant must be updated to match (there is no
 *   single source of truth enforced across the two by tooling - a known,
 *   accepted floor for a docs-and-code duplication of this kind).
 */

import type { ReafferenceStudyConfig, ReafferenceStudyResult } from '../reafference/runReafferenceStudy.ts';
import { computeReturnWindow } from '../reafference/conditions.ts';
import { PURE_CORE_SOLVER_STEP_ORDER } from '../params.ts';

export interface VesselReportEmergenceEntry {
  white: string;
  reachedLevel: string;
  stopReason: string;
  nextMissingCause: string;
}

export const EMERGENCE_CEILING_MAP: readonly VesselReportEmergenceEntry[] = [
  { white: 'K2 PR2 (器のみ)', reachedLevel: '判定対象外', stopReason: '時間発展が存在しない', nextMissingCause: 'PR3の実装（完了済み）' },
  { white: 'K2 PR3 (保存部のみ)', reachedLevel: '判定対象外', stopReason: '保存系はエネルギー注入源を持たず持続構造を生まない', nextMissingCause: 'PR4-PR5の実装（完了済み）' },
  { white: 'K2 PR4 (+散逸)', reachedLevel: '判定対象外', stopReason: '駆動なしの散逸系は単調減衰する', nextMissingCause: 'PR5の実装（完了済み）' },
  { white: 'K2 PR5 (+駆動J、ν均一・chiなし)', reachedLevel: 'L2未達（実測済み）', stopReason: '5 seed全てで最大持続1tick、tau_min=500に遠く及ばない', nextMissingCause: 'tau_minを実際の力学スケール（数十tick）に合わせ直した新しい事前登録実験' },
  { white: 'K2 PR6 / K3 (+媒質履歴、chiあり)', reachedLevel: 'L2未達（実測済み）', stopReason: '5 seed全てで最大持続34-39tick。ν均一条件の30倍以上だがtau_min=500の1/10未満', nextMissingCause: '同上。加えて30倍差の機構的説明' },
  { white: 'K2 PR7 / K4 (読み取り専用観測)', reachedLevel: '判定対象外（測定器）', stopReason: '測定器の凍結のみで測定は未実行だったが、K7追加runで実際に使用した', nextMissingCause: '—' },
  { white: 'K5 (物理的閉路)', reachedLevel: 'L2未達（実測済み、K2 PR6/K3の行と同一run）', stopReason: '同上', nextMissingCause: '同上' },
  { white: 'K6 (reafference弁別)', reachedLevel: '判定対象外（emergence level測定ではない）', stopReason: '—', nextMissingCause: 'docs/vessel/vessel-roadmap.md K6節の誠実な限界を参照' },
  { white: 'K7追加 (自然発展下でのL2実測)', reachedLevel: 'L2未達（条件1・条件2とも、5 seed全て）', stopReason: 'tau_min=500という選定が実際の力学の持続スケール（数十tick）に対して過大だった可能性がある（実測後の気づき、事後調整せず）', nextMissingCause: 'tau_minを実スケールに合わせ直した新実験。L3/L4用の新しい測定器' },
];

export interface VesselReportLedgerSummary {
  finalTargetEnergy: number;
  finalControlAmplitude: number;
  seedCount: number;
  roundTripTicks: number;
  observationTick: number;
}

export interface VesselReport {
  baseSeed: number;
  seedCount: number;
  calibrationSeed: number;
  params: ReafferenceStudyConfig;
  solverStepOrder: readonly string[];
  ticks: number;
  ledgerSummary: VesselReportLedgerSummary;
  nullHypothesisComparison: {
    boundaryDensity: ReafferenceStudyResult['boundaryDensityComparison'];
    coherence: ReafferenceStudyResult['coherenceComparison'];
    distinguishable: boolean;
  };
  emergenceCeilingMap: readonly VesselReportEmergenceEntry[];
}

export function exportVesselReportJson(config: ReafferenceStudyConfig, result: ReafferenceStudyResult): VesselReport {
  const window = computeReturnWindow(config);
  return {
    baseSeed: config.baseSeed,
    seedCount: config.seedCount,
    calibrationSeed: config.calibrationSeed,
    params: config,
    solverStepOrder: PURE_CORE_SOLVER_STEP_ORDER,
    ticks: window.observationTick,
    ledgerSummary: {
      finalTargetEnergy: result.targetEnergy,
      finalControlAmplitude: result.controlAmplitude,
      seedCount: result.perSeed.length,
      roundTripTicks: window.roundTripTicks,
      observationTick: window.observationTick,
    },
    nullHypothesisComparison: {
      boundaryDensity: result.boundaryDensityComparison,
      coherence: result.coherenceComparison,
      distinguishable: result.distinguishable,
    },
    emergenceCeilingMap: EMERGENCE_CEILING_MAP,
  };
}
