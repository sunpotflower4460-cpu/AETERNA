import { describe, expect, it } from 'vitest';
import { exportVesselReportJson, EMERGENCE_CEILING_MAP } from '../../pure/run/exportVesselReport.ts';
import { runReafferenceStudy, type ReafferenceStudyConfig } from '../../pure/reafference/runReafferenceStudy.ts';

function smallConfig(): ReafferenceStudyConfig {
  return {
    N: 6,
    M: 20,
    shiftCellsPerTick: 2,
    alpha: 1,
    g: 1,
    nu0: 0.2,
    kappa: 1,
    rho: 0.3,
    lambda: 20,
    dt: 0.01,
    shoutAmplitude: 0.5,
    shoutOmega: 5,
    shoutPhase: 0.3,
    shoutTicks: 5,
    windowHalfWidth: 2,
    observeAfterTicks: 3,
    calibrationSeed: 0,
    baseSeed: 1,
    seedCount: 3,
  };
}

describe('pure core K8 vessel report: required fields (docs/vessel/vessel-roadmap.md K8 完了条件: "seed・params・solverStepOrder・ticks・台帳サマリ・零仮説比較・到達レベル・天井理由が全て入り、再現できる")', () => {
  it('the report contains seed range, params, solverStepOrder, ticks, ledger summary, null hypothesis comparison, and the emergence ceiling map', () => {
    const config = smallConfig();
    const result = runReafferenceStudy(config);
    const report = exportVesselReportJson(config, result);

    expect(report.baseSeed).toBe(config.baseSeed);
    expect(report.seedCount).toBe(config.seedCount);
    expect(report.calibrationSeed).toBe(config.calibrationSeed);
    expect(report.params).toEqual(config);
    expect(report.solverStepOrder).toEqual(['conservative', 'dissipation', 'drive', 'exchange', 'mediumHistory', 'observe']);
    expect(typeof report.ticks).toBe('number');
    expect(report.ticks).toBeGreaterThan(0);

    expect(Number.isFinite(report.ledgerSummary.finalTargetEnergy)).toBe(true);
    expect(Number.isFinite(report.ledgerSummary.finalControlAmplitude)).toBe(true);
    expect(report.ledgerSummary.seedCount).toBe(config.seedCount);

    expect(report.nullHypothesisComparison.boundaryDensity).toEqual(result.boundaryDensityComparison);
    expect(report.nullHypothesisComparison.coherence).toEqual(result.coherenceComparison);
    expect(report.nullHypothesisComparison.distinguishable).toBe(result.distinguishable);

    expect(report.emergenceCeilingMap.length).toBeGreaterThan(0);
    for (const entry of report.emergenceCeilingMap) {
      expect(typeof entry.white).toBe('string');
      expect(typeof entry.reachedLevel).toBe('string');
      expect(typeof entry.stopReason).toBe('string');
      expect(typeof entry.nextMissingCause).toBe('string');
    }
  });

  it('is fully reproducible: the same config produces a bit-identical report', () => {
    const config = smallConfig();
    const r1 = exportVesselReportJson(config, runReafferenceStudy(config));
    const r2 = exportVesselReportJson(config, runReafferenceStudy(config));
    expect(r1).toEqual(r2);
  });

  it('is JSON-serializable without loss (round-trips through JSON.stringify/parse)', () => {
    const config = smallConfig();
    const report = exportVesselReportJson(config, runReafferenceStudy(config));
    const roundTripped = JSON.parse(JSON.stringify(report));
    expect(roundTripped).toEqual(report);
  });

  it('EMERGENCE_CEILING_MAP transcribes docs/vessel/white-ceilings.md K7 table: no white is silently dropped', () => {
    const whites = EMERGENCE_CEILING_MAP.map((e) => e.white);
    expect(whites.some((w) => w.includes('K2 PR5'))).toBe(true);
    expect(whites.some((w) => w.includes('K3'))).toBe(true);
    expect(whites.some((w) => w.includes('K5'))).toBe(true);
    expect(whites.some((w) => w.includes('K6'))).toBe(true);
  });
});
