import { describe, expect, it } from 'vitest';
import {
  deriveRunScenarioEnergyLedgerVisibility,
  runScenarioWithEnergyLedgerVisibility,
} from '../../experiments/runScenarioWithEnergyLedgerVisibility.ts';
import type { ScenarioResult } from '../../experiments/runScenario.ts';

function makeMinimalScenarioResult(): ScenarioResult {
  return {
    config: {
      name: 'minimal-ledger-visibility-fixture',
      totalFrames: 2,
      collectMetrics: true,
      metricsInterval: 1,
    },
    metrics: [
      {
        frame: 0,
        meanActivity: 1,
        maxActivity: 1,
        variance: 0,
        ignitionRatio: 0,
        phiApprox: 0,
        phaseCoherence: 0,
        meanPredictionError: 0,
        baselineLevel: 0,
        residueLevel: 0,
        meanRawTouch: 0,
        meanTouchOnset: 0,
        meanTouchOffset: 0,
        meanTouchNovelty: 0,
        activeTouchCount: 0,
        modeState: 'wake',
        actionState: 'idle',
        energy: 1,
        stability: 1,
        overload: 0,
        energyReserve: 1,
        hasNaN: false,
      },
      {
        frame: 1,
        meanActivity: 1.2,
        maxActivity: 1.4,
        variance: 0.1,
        ignitionRatio: 0,
        phiApprox: 0,
        phaseCoherence: 0,
        meanPredictionError: 0,
        baselineLevel: 0,
        residueLevel: 0,
        meanRawTouch: 0,
        meanTouchOnset: 0,
        meanTouchOffset: 0,
        meanTouchNovelty: 0,
        activeTouchCount: 0,
        modeState: 'wake',
        actionState: 'idle',
        energy: 1,
        stability: 1,
        overload: 0,
        energyReserve: 1,
        hasNaN: false,
      },
    ],
    summary: {
      totalFrames: 2,
      finalMeanActivity: 1.2,
      collapseFrames: 0,
      nanFrames: 0,
      meanResponseAmplitude: 0,
      peakActivity: 1.4,
      modeTransitions: 0,
      actionTransitions: 0,
      saturationFrames: 0,
      saturationRate: 0,
      collapseRate: 0,
      spontaneousIgnitionCount: 0,
      quietBaselineFloor: 1,
      ongoingnessScore: 1,
    },
    succeeded: true,
  };
}

describe('deriveRunScenarioEnergyLedgerVisibility', () => {
  it('maps existing scenario metric frames into insufficient ledger visibility without inferring missing terms', () => {
    const report = deriveRunScenarioEnergyLedgerVisibility(makeMinimalScenarioResult());

    expect(report.snapshots).toHaveLength(2);
    expect(report.summary.frameCount).toBe(2);
    expect(report.summary.insufficientCount).toBe(2);
    expect(report.summary.openCount).toBe(0);
    expect(report.summary.closedCount).toBe(0);
    expect(report.summary.verifiedModeledFlowCount).toBe(0);
    expect(report.summary.recommendedDisplayLine).toBe('Energy flow is not yet verified. Current values are diagnostic/proxy readings.');
  });

  it('does not treat visible activity as verified modeled energy flow', () => {
    const result = makeMinimalScenarioResult();
    result.metrics[0].meanActivity = 10;
    result.metrics[1].meanActivity = 20;

    const report = deriveRunScenarioEnergyLedgerVisibility(result);

    expect(report.summary.insufficientCount).toBe(2);
    expect(report.summary.verifiedModeledFlowCount).toBe(0);
  });
});

describe('runScenarioWithEnergyLedgerVisibility', () => {
  it('runs a tiny scenario and attaches ledger visibility as observer-side output', async () => {
    const result = await runScenarioWithEnergyLedgerVisibility({
      name: 'tiny-ledger-visibility-run',
      totalFrames: 5,
      touchScript: [],
      collectMetrics: true,
      metricsInterval: 1,
      segments: 12,
    });

    expect(result.succeeded).toBe(true);
    expect(result.energyLedgerVisibility.summary.frameCount).toBe(result.metrics.length);
    expect(result.energyLedgerVisibility.summary.verifiedModeledFlowCount).toBe(0);
    expect(result.energyLedgerVisibility.summary.recommendedDisplayLine).toBe('Energy flow is not yet verified. Current values are diagnostic/proxy readings.');
  });
});
