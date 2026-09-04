/**
 * PUT-IN: a PureExperimentResult, and a caller-supplied list of
 *   PureReportFact prose (this module never generates interpretive
 *   sentences itself - see floors)
 * EMERGED: a JSON-serializable report object and a Markdown rendering of
 *   it, both in the "Observed facts / In one sentence / How it appears /
 *   Possibility / Still unknown" format
 * claim-tier: C1 (implemented; this is a formatting utility, not a
 *   physics claim - see src/tests/pure/pureReportFormat.test.ts for the
 *   required-fields check)
 * floors (誠実な床): deliberately does NOT auto-generate the
 *   "In one sentence / How it appears / Possibility / Still unknown"
 *   prose from the raw ledger/observation numbers. Doing so here would
 *   bake an interpretation into the instrument itself, which is exactly
 *   what docs/vessel/anti-delusion-apparatus.md's 第8監査 (evaluation
 *   gates and initial conditions must not encode the same causal
 *   structure as the conclusion) warns against. Writing real facts from
 *   real runs is a K6/K7 concern, done by a human or a separately
 *   pre-registered analysis step reviewing this module's raw JSON - not
 *   something this export function decides on its own.
 *
 * docs/pure-physics-implementation-plan.md PR7 合流条件:
 * 「JSON/Markdown exportにseed・params・solver settings・
 * solverStepOrder・ticks・ledger summaryが含まれる」「優劣判断や
 * 意識確定をしない」。
 */

import type { PureExperimentResult } from './runPureExperiment.ts';
import type { DriveTickLedgerEntry } from '../ledger/energy.ts';
import type { PureCoreParams, PureCoreSolverSettings } from '../params.ts';

export interface PureReportFact {
  inOneSentence: string;
  howItAppears: string;
  possibility: string;
  stillUnknown: string;
}

export interface PureLedgerSummary {
  finalN: number;
  finalH: number;
  totalDissipationLossN: number;
  totalDissipationLossH: number;
  totalDriveWorkN: number;
  totalDriveWorkH: number;
  maxAbsResidualN: number;
  maxAbsResidualH: number;
}

export interface PureReport {
  seed: number;
  params: PureCoreParams;
  solverSettings: PureCoreSolverSettings;
  ticks: number;
  ledgerSummary: PureLedgerSummary;
  observedFacts: PureReportFact[];
}

export function buildLedgerSummary(ledgerHistory: readonly DriveTickLedgerEntry[]): PureLedgerSummary {
  if (ledgerHistory.length === 0) {
    return {
      finalN: NaN,
      finalH: NaN,
      totalDissipationLossN: 0,
      totalDissipationLossH: 0,
      totalDriveWorkN: 0,
      totalDriveWorkH: 0,
      maxAbsResidualN: 0,
      maxAbsResidualH: 0,
    };
  }

  let totalDissipationLossN = 0;
  let totalDissipationLossH = 0;
  let totalDriveWorkN = 0;
  let totalDriveWorkH = 0;
  let maxAbsResidualN = 0;
  let maxAbsResidualH = 0;

  for (const entry of ledgerHistory) {
    totalDissipationLossN += entry.dissipationLossN;
    totalDissipationLossH += entry.dissipationLossH;
    totalDriveWorkN += entry.driveWorkN;
    totalDriveWorkH += entry.driveWorkH;
    maxAbsResidualN = Math.max(maxAbsResidualN, Math.abs(entry.residualN));
    maxAbsResidualH = Math.max(maxAbsResidualH, Math.abs(entry.residualH));
  }

  const last = ledgerHistory[ledgerHistory.length - 1];
  return {
    finalN: last.nAfterDrive,
    finalH: last.hAfterDrive,
    totalDissipationLossN,
    totalDissipationLossH,
    totalDriveWorkN,
    totalDriveWorkH,
    maxAbsResidualN,
    maxAbsResidualH,
  };
}

export function exportPureReportJson(result: PureExperimentResult, observedFacts: PureReportFact[]): PureReport {
  return {
    seed: result.params.seed,
    params: result.params,
    solverSettings: result.solverSettings,
    ticks: result.finalTick,
    ledgerSummary: buildLedgerSummary(result.ledgerHistory),
    observedFacts,
  };
}

export function exportPureReportMarkdown(report: PureReport): string {
  const lines: string[] = [];
  lines.push('# Observed facts');
  lines.push('');
  lines.push(`- seed: ${report.seed}`);
  lines.push(`- params: ${JSON.stringify(report.params)}`);
  lines.push(`- solver settings: ${JSON.stringify(report.solverSettings)}`);
  lines.push(`- solverStepOrder: ${JSON.stringify(report.solverSettings.solverStepOrder)}`);
  lines.push(`- ticks: ${report.ticks}`);
  lines.push(`- ledger summary: ${JSON.stringify(report.ledgerSummary)}`);
  lines.push('');

  for (const [index, fact] of report.observedFacts.entries()) {
    lines.push(`## Fact ${index + 1}`);
    lines.push('');
    lines.push(`→ In one sentence: ${fact.inOneSentence}`);
    lines.push(`→ How it appears: ${fact.howItAppears}`);
    lines.push(`→ Possibility: ${fact.possibility}`);
    lines.push(`→ Still unknown: ${fact.stillUnknown}`);
    lines.push('');
  }

  return lines.join('\n');
}
