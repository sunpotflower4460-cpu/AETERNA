import { describe, expect, it } from 'vitest';
import { runPureExperiment } from '../../pure/run/runPureExperiment.ts';
import { exportPureReportJson, exportPureReportMarkdown, buildLedgerSummary, type PureReportFact } from '../../pure/run/exportPureReport.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';

function sampleConfig(): { params: PureCoreParams; drive: DriveSpec } {
  const params: PureCoreParams = { R: 3, r: 1, N: 5, dt: 0.01, alpha: 1, g: 1, nu0: 0.3, kappa: 1, rho: 0.3, seed: 42 };
  const drive: DriveSpec = { spatialProfile: Float64Array.from({ length: 25 }, () => 0.05), omega: 2, phase: 0.1 };
  return { params, drive };
}

const SAMPLE_FACTS: PureReportFact[] = [
  {
    inOneSentence: 'A localized nonzero-winding plaquette was detected at tick 12.',
    howItAppears: 'One plaquette showed winding +1 for 3 consecutive ticks before disappearing.',
    possibility: 'This is consistent with a transient phase defect; whether it constitutes a self-maintaining structure is not established by this run alone.',
    stillUnknown: 'Whether this persists under a longer run or a different seed has not been tested.',
  },
];

describe('pure core report export: required fields (docs/pure-physics-implementation-plan.md PR7 merge gate: "JSON/Markdown exportにseed・params・solver settings・solverStepOrder・ticks・ledger summaryが含まれる")', () => {
  it('JSON export contains seed, params, solverSettings (with solverStepOrder), ticks, and ledgerSummary', () => {
    const { params, drive } = sampleConfig();
    const result = runPureExperiment({ params, drive, ticks: 10, observe: true });

    const report = exportPureReportJson(result, SAMPLE_FACTS);

    expect(report.seed).toBe(params.seed);
    expect(report.params).toEqual(params);
    expect(report.solverSettings.solverStepOrder).toEqual(['conservative', 'dissipation', 'drive', 'exchange', 'mediumHistory', 'observe']);
    expect(report.ticks).toBe(10);
    expect(report.ledgerSummary).toBeDefined();
    expect(Number.isFinite(report.ledgerSummary.finalN)).toBe(true);
    expect(Number.isFinite(report.ledgerSummary.finalH)).toBe(true);
    expect(report.observedFacts).toEqual(SAMPLE_FACTS);
  });

  it('buildLedgerSummary correctly totals dissipationLoss/driveWork across the run and tracks the max abs residual', () => {
    const { params, drive } = sampleConfig();
    const result = runPureExperiment({ params, drive, ticks: 20, observe: false });

    const summary = buildLedgerSummary(result.ledgerHistory);

    let expectedTotalDissipationLossN = 0;
    let expectedMaxAbsResidualN = 0;
    for (const entry of result.ledgerHistory) {
      expectedTotalDissipationLossN += entry.dissipationLossN;
      expectedMaxAbsResidualN = Math.max(expectedMaxAbsResidualN, Math.abs(entry.residualN));
    }

    expect(summary.totalDissipationLossN).toBeCloseTo(expectedTotalDissipationLossN, 12);
    expect(summary.maxAbsResidualN).toBeCloseTo(expectedMaxAbsResidualN, 12);
    expect(summary.finalN).toBe(result.ledgerHistory[result.ledgerHistory.length - 1].nAfterDrive);
  });

  it('buildLedgerSummary handles a zero-tick run without NaN propagation errors (explicit empty-history branch)', () => {
    const summary = buildLedgerSummary([]);
    expect(Number.isNaN(summary.finalN)).toBe(true);
    expect(summary.totalDissipationLossN).toBe(0);
  });

  it('Markdown export contains the required section labels and the seed/params/ticks/ledger-summary line', () => {
    const { params, drive } = sampleConfig();
    const result = runPureExperiment({ params, drive, ticks: 5, observe: true });
    const report = exportPureReportJson(result, SAMPLE_FACTS);

    const markdown = exportPureReportMarkdown(report);

    expect(markdown).toContain('# Observed facts');
    expect(markdown).toContain(`seed: ${params.seed}`);
    expect(markdown).toContain('solverStepOrder');
    expect(markdown).toContain('ticks: 5');
    expect(markdown).toContain('ledger summary');
    expect(markdown).toContain('→ In one sentence:');
    expect(markdown).toContain('→ How it appears:');
    expect(markdown).toContain('→ Possibility:');
    expect(markdown).toContain('→ Still unknown:');
    expect(markdown).toContain(SAMPLE_FACTS[0].inOneSentence);
  });

  it('an empty observedFacts list still produces a valid report (this module never fabricates facts on its own)', () => {
    const { params, drive } = sampleConfig();
    const result = runPureExperiment({ params, drive, ticks: 5, observe: true });
    const report = exportPureReportJson(result, []);
    const markdown = exportPureReportMarkdown(report);

    expect(report.observedFacts).toEqual([]);
    expect(markdown).toContain('# Observed facts');
    expect(markdown).not.toContain('Fact 1');
  });
});
