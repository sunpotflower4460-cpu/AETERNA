/**
 * lensGuideContext.test.ts
 * v1.9: Lens-aware AI Guide
 *
 * Tests for buildLensGuideContext.
 */

import { describe, it, expect } from 'vitest';
import { buildLensGuideContext } from '../../guide/buildLensGuideContext.ts';
import type { LensContextPacket } from '../../ui/lens/lensContextPacket.ts';
import type { CellObservation } from '../../types/cellObservation.ts';

function makeCellObservation(overrides?: Partial<CellObservation>): CellObservation {
  return {
    timestamp: 1000,
    tick: 42,
    cellIndex: 5,
    segments: 16,
    geometry: {
      i: 0,
      j: 5,
      majorAngle: 0.2,
      minorAngle: 0.3,
      regionLabel: 'outerRim',
      areaElement: 1.2,
      gaussianCurvature: 0.04,
      meanCurvature: 0.1,
      innerOuterBias: 0.7,
    },
    field: {
      amplitude: 0.55,
      phase: 1.2,
      phaseCoherenceLocal: 0.8,
      flowContinuityLocal: 0.6,
      energyThroughputLocal: 0.33,
    },
    vortex: {
      candidateConfidence: 0.7,
      topologicalCharge: 1,
      phaseWinding: 6.28,
    },
    membrane: {
      deformation: 0.3,
      tension: 0.2,
      permeability: 0.5,
      returnImprint: 0.1,
      twoSidedness: 0.4,
    },
    plasticity: {
      accumulatedTrace: 0.15,
      resistanceScale: 1.05,
    },
    ratios: {
      strongestMatchId: null,
      strongestMatchStrength: 0.6,
    },
    events: {
      recentEventIds: [],
      recentEventCount: 0,
    },
    diagnostics: {
      valueKinds: {
        geometry: 'measured',
        field: 'derived',
        vortex: 'proxy',
        membrane: 'proxy',
        plasticity: 'proxy',
        ratios: 'proxy',
        events: 'measured',
      },
      missingFieldCount: 0,
      hasUnavailableSource: false,
    },
    ...overrides,
  } as CellObservation;
}

function makeLensContextPacket(obs: CellObservation): LensContextPacket {
  return {
    timestamp: Date.now(),
    tick: 42,
    cellObservation: obs,
    activeLens: null,
    highlightedMetricValue: undefined,
    contextSummary: 'cell index=5 — full cell overview',
    epistemicNote: 'Multiple observer-side metrics shown.',
    isReplayMode: false,
  };
}

describe('buildLensGuideContext', () => {
  it('builds context without errors', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({ lensContext });
    expect(ctx).toBeDefined();
    expect(ctx.selectedCellSummary.cellIndex).toBe(5);
  });

  it('observationFacts is bounded to max 10 items', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({ lensContext });
    expect(ctx.observationFacts.length).toBeLessThanOrEqual(10);
  });

  it('does not include raw field arrays', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({ lensContext });
    // observationFacts should be strings, never raw typed arrays or objects
    for (const fact of ctx.observationFacts) {
      expect(typeof fact).toBe('string');
    }
  });

  it('does not include semantic nodes', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({ lensContext });
    // No semantic/graph-like structures
    const json = JSON.stringify(ctx);
    expect(json).not.toContain('semanticNode');
    expect(json).not.toContain('conceptGraph');
    expect(json).not.toContain('knowledgeGraph');
  });

  it('limitations array is always populated', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({ lensContext });
    expect(ctx.limitations.length).toBeGreaterThan(0);
    expect(ctx.limitations).toContain('All values are observer-side measurements.');
    expect(ctx.limitations).toContain('Correlation is not causation.');
    expect(ctx.limitations).toContain('Proxy values are not direct proof.');
  });

  it('includes causal trace summary when provided', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({
      lensContext,
      causalTrace: {
        id: 'ct1',
        targetCellIndex: 5,
        targetMetricId: 'field.amplitude',
        activeLensId: null,
        currentTick: 42,
        possibleContributingSignals: [],
        relatedObservations: [],
        strongestSignals: [],
        summary: ['Signal A observed.', 'Signal B nearby.'],
        cautions: ['Not causal proof.'],
        confidence: 'medium',
        generatedAt: Date.now(),
      },
    });
    expect(ctx.causalTraceSummary.length).toBeGreaterThan(0);
    expect(ctx.causalTraceSummary).toContain('Signal A observed.');
  });

  it('causal trace summary is bounded to max 5 lines', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({
      lensContext,
      causalTrace: {
        id: 'ct1',
        targetCellIndex: 5,
        targetMetricId: null,
        activeLensId: null,
        currentTick: 42,
        possibleContributingSignals: [],
        relatedObservations: [],
        strongestSignals: [],
        summary: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        cautions: [],
        confidence: 'low',
        generatedAt: Date.now(),
      },
    });
    expect(ctx.causalTraceSummary.length).toBeLessThanOrEqual(5);
  });

  it('includes replay summary when isReplayMode=true', () => {
    const obs = makeCellObservation();
    const lensContext: LensContextPacket = {
      ...makeLensContextPacket(obs),
      isReplayMode: true,
      replayTick: 30,
      liveTick: 42,
    };
    const ctx = buildLensGuideContext({ lensContext });
    expect(ctx.replaySummary?.isReplayMode).toBe(true);
    expect(ctx.replaySummary?.replayTick).toBe(30);
    expect(ctx.replaySummary?.liveTick).toBe(42);
  });

  it('includes layer correlation summary when provided', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({
      lensContext,
      layerCorrelation: {
        pairs: [
          {
            id: 'curvature×vortex',
            labelA: 'Curvature',
            metricKeyA: 'curvature',
            labelB: 'Vortex',
            metricKeyB: 'vortex',
            correlation: 0.72,
            sampleCount: 10,
            confidence: 'medium',
            caution: 'Correlation is not causation.',
          },
        ],
        timeWindowTicks: 50,
        snapshotCount: 10,
        earliestTick: 1,
        latestTick: 50,
        sufficientData: true,
        caution: 'Correlation is not causation.',
        generatedAt: Date.now(),
      },
    });
    expect(ctx.layerCorrelationSummary.length).toBeGreaterThan(0);
    expect(ctx.layerCorrelationSummary[0]).toContain('Curvature');
  });

  it('includes difference summary when provided', () => {
    const obs = makeCellObservation();
    const lensContext = makeLensContextPacket(obs);
    const ctx = buildLensGuideContext({
      lensContext,
      difference: {
        beforeTick: 10,
        afterTick: 20,
        activeLensId: null,
        items: [],
        largestChanges: [
          {
            metricId: 'field.amplitude',
            label: 'Field Amplitude',
            valueKind: 'Derived',
            valueBefore: 0.4,
            valueAfter: 0.6,
            delta: 0.2,
            relativeDelta: 0.5,
            sourceLayer: 'field',
          },
        ],
        cellObservationAvailable: true,
        globalSummaryAvailable: false,
        caution: 'Snapshot comparison only.',
        generatedAt: Date.now(),
      },
    });
    expect(ctx.differenceSummary.length).toBeGreaterThan(0);
    expect(ctx.differenceSummary[0]).toContain('Field Amplitude');
  });
});
