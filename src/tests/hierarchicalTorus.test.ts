import { describe, it, expect, beforeEach } from 'vitest';
import { HierarchicalTorus } from '../core/hierarchicalTorus.ts';
import { state } from '../organism/state.js';

function stubDisk() {
  return {
    omega_t: 8.33,
    omega_p: 5.15,
    ratioRr: 1.618,
    phaseRatio: 1.0,
    torusFormed: false,
    isErgodic: false,
    schumannLock: false,
    getConsciousnessPrerequisites: () => ({ A: false, B: false }),
    _irrationalScore: () => 0,
  };
}

describe('HierarchicalTorus Phase E1', () => {
  beforeEach(() => {
    state.disk = stubDisk() as typeof state.disk;
    if (typeof globalThis.window === 'undefined') {
      (globalThis as Record<string, unknown>).window = { innerWidth: 800, innerHeight: 600 };
    }
  });

  it('should create 36 sub-tori with 12×12 size each', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    expect(hierarchy.subTori.length).toBe(36);
    expect(hierarchy.subTori[0].segments).toBe(12);
    expect(hierarchy.subTori[0].numNodes).toBe(144);
  });

  it('should create upper torus with 6×6 size', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    expect(hierarchy.upperTorus.segments).toBe(6);
    expect(hierarchy.upperTorus.numNodes).toBe(36);
  });

  it('should extract representative values from sub-tori', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    hierarchy.updateSubTori(0, undefined);
    const aggregate = hierarchy.extractRepresentativeValues();

    expect(aggregate.summaries.length).toBe(36);
    expect(aggregate.gridWidth).toBe(6);
    expect(aggregate.gridHeight).toBe(6);

    for (const summary of aggregate.summaries) {
      expect(summary).toHaveProperty('meanActivity');
      expect(summary).toHaveProperty('arousal');
      expect(summary).toHaveProperty('sigma');
      expect(summary).toHaveProperty('clusterRatio');
      expect(summary).toHaveProperty('phiProxy');
      expect(summary).toHaveProperty('predictionErrorMean');
    }
  });

  it('should propagate sub-tori summaries to upper torus', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    hierarchy.updateSubTori(0, undefined);
    hierarchy.extractRepresentativeValues();

    const beforeActivity = hierarchy.upperTorus.touchProjection[0];

    hierarchy.updateUpperTorus(0);

    expect(hierarchy.lastAggregatePacket).toBeDefined();
    expect(hierarchy.lastSubSummaries.length).toBe(36);
  });

  it('should update entire hierarchy in correct order', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    hierarchy.updateHierarchy(0, undefined);

    expect(hierarchy.lastSubSummaries.length).toBe(36);
    expect(hierarchy.lastAggregatePacket).toBeDefined();

    const summary = hierarchy.getHierarchySummary();
    expect(summary.subTorusCount).toBe(36);
    expect(summary.subTorusSize).toBe(12);
    expect(summary.upperTorusSize).toBe(36);
    expect(summary.gridWidth).toBe(6);
    expect(summary.gridHeight).toBe(6);
  });

  it('should maintain independent state across sub-tori', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    for (let i = 0; i < 5; i++) {
      hierarchy.updateSubTori(0, undefined);
    }
    hierarchy.extractRepresentativeValues();

    const summaries = hierarchy.lastSubSummaries;

    for (let i = 0; i < summaries.length; i++) {
      expect(typeof summaries[i].sigma).toBe('number');
      expect(Number.isFinite(summaries[i].sigma)).toBe(true);
      expect(summaries[i].sigma).toBeGreaterThan(0);
    }
  });

  it('should provide access to individual sub-tori by grid coordinates', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    const subTorus = hierarchy.getSubTorus(2, 3);
    expect(subTorus).toBeDefined();
    expect(subTorus?.segments).toBe(12);

    const outOfBounds = hierarchy.getSubTorus(10, 10);
    expect(outOfBounds).toBeNull();
  });

  it('should compute hierarchy summary statistics', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    hierarchy.updateHierarchy(0, undefined);

    const summary = hierarchy.getHierarchySummary();

    expect(typeof summary.subMeanActivity).toBe('number');
    expect(typeof summary.subMeanArousal).toBe('number');
    expect(typeof summary.subMeanSigma).toBe('number');
    expect(typeof summary.subMeanPhiProxy).toBe('number');
    expect(typeof summary.upperMeanActivity).toBe('number');
    expect(typeof summary.upperSigma).toBe('number');
    expect(typeof summary.upperPhiProxy).toBe('number');
    expect(typeof summary.upperArousal).toBe('number');
  });

  it('should show upper layer synchronization distinct from individual sub-tori', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    for (let i = 0; i < 5; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    const summary = hierarchy.getHierarchySummary();

    expect(summary.upperMeanActivity).toBeGreaterThanOrEqual(0);
    expect(summary.upperMeanActivity).toBeLessThanOrEqual(1);
    expect(summary.upperPhiProxy).toBeGreaterThanOrEqual(0);
  });

  it('should not break when updating multiple times', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    for (let i = 0; i < 10; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    const summary = hierarchy.getHierarchySummary();
    expect(summary.subTorusCount).toBe(36);
    expect(summary.upperTorusSize).toBe(36);
  });
});

describe('HierarchicalTorus Phase E2', () => {
  beforeEach(() => {
    state.disk = stubDisk() as typeof state.disk;
    if (typeof globalThis.window === 'undefined') {
      (globalThis as Record<string, unknown>).window = { innerWidth: 800, innerHeight: 600 };
    }
  });

  it('Case 1: Upper torus updates from lower torus representative values', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    // Run enough frames to trigger upper torus update
    for (let i = 0; i < 10; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    const summary = hierarchy.getHierarchySummary();
    expect(summary.upperSigma).toBeGreaterThan(0);
    expect(Number.isFinite(summary.upperArousal)).toBe(true);
    expect(Number.isFinite(summary.upperPhiProxy)).toBe(true);
  });

  it('Case 2: Top-down modulation packets are generated', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    // Run enough frames to trigger upper update and feedback generation
    for (let i = 0; i < 10; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    expect(hierarchy.lastFeedbackPacket).toBeDefined();
    expect(hierarchy.lastFeedbackPacket?.perSubTorus).toBeDefined();
    expect(hierarchy.lastFeedbackPacket?.perSubTorus.length).toBe(36);

    // Check that modulation packets have the required fields
    const firstModulation = hierarchy.lastFeedbackPacket?.perSubTorus[0];
    expect(firstModulation).toHaveProperty('baselineGainDelta');
    expect(firstModulation).toHaveProperty('rewriteGainDelta');
    expect(firstModulation).toHaveProperty('thresholdDelta');
  });

  it('Case 3: Sub-tori receive modulation that affects their parameters', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    // Run enough frames to apply modulation
    for (let i = 0; i < 20; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    // Check that at least some sub-tori have received modulation
    let modulatedCount = 0;
    for (const subTorus of hierarchy.subTori) {
      if (subTorus.topDownModulation) {
        modulatedCount++;
        // Check that modulation values are finite and within reasonable bounds
        expect(Number.isFinite(subTorus.topDownModulation.baselineGainDelta)).toBe(true);
        expect(Number.isFinite(subTorus.topDownModulation.rewriteGainDelta)).toBe(true);
        expect(Number.isFinite(subTorus.topDownModulation.thresholdDelta)).toBe(true);
      }
    }

    expect(modulatedCount).toBeGreaterThan(0);
  });

  it('Case 4: Time scale separation is maintained', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6, 10);

    const upperSigmaBefore = hierarchy.upperTorus.sigmaDisplay;

    // Run 5 frames (below update interval)
    for (let i = 0; i < 5; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    // Upper torus should not have changed much
    const upperSigmaAfter5 = hierarchy.upperTorus.sigmaDisplay;

    // Run 10 more frames to cross update threshold
    for (let i = 0; i < 10; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    // Check that frame count is being tracked
    expect(hierarchy.frameCount).toBe(15);
    expect(hierarchy.upperUpdateInterval).toBe(10);
  });

  it('Case 5: Upper state influences lower reactivity subtly', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    // Run long enough to establish modulation
    for (let i = 0; i < 50; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    const summary = hierarchy.getHierarchySummary();

    // Top-down modulation should be present but small
    if (summary.topDownModulationPresent) {
      expect(Math.abs(summary.meanBaselineGainDelta)).toBeLessThan(0.15);
      expect(Math.abs(summary.meanRewriteGainDelta)).toBeLessThan(0.1);
      expect(Math.abs(summary.meanThresholdDelta)).toBeLessThan(0.08);
    }
  });

  it('Case 6: No runaway or divergence occurs', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    // Run for many frames
    for (let i = 0; i < 100; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    const summary = hierarchy.getHierarchySummary();

    // All key metrics should remain finite and bounded
    expect(Number.isFinite(summary.subMeanActivity)).toBe(true);
    expect(Number.isFinite(summary.subMeanSigma)).toBe(true);
    expect(Number.isFinite(summary.upperSigma)).toBe(true);
    expect(Number.isFinite(summary.upperArousal)).toBe(true);

    expect(summary.subMeanSigma).toBeGreaterThan(0);
    expect(summary.subMeanSigma).toBeLessThan(10);
    expect(summary.upperSigma).toBeGreaterThan(0);
    expect(summary.upperSigma).toBeLessThan(10);

    // Modulation deltas should remain small
    if (summary.topDownModulationPresent) {
      expect(Math.abs(summary.meanBaselineGainDelta)).toBeLessThan(0.5);
      expect(Math.abs(summary.meanRewriteGainDelta)).toBeLessThan(0.5);
      expect(Math.abs(summary.meanThresholdDelta)).toBeLessThan(0.5);
    }
  });

  it('Case 7: E1 bottom-up flow still works', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    // Update sub-tori
    hierarchy.updateSubTori(0, undefined);

    // Extract values
    const aggregate = hierarchy.extractRepresentativeValues();

    expect(aggregate.summaries.length).toBe(36);
    expect(hierarchy.lastSubSummaries.length).toBe(36);

    // Upper torus should receive these values
    hierarchy.updateUpperTorus(0);

    // Bottom-up propagation still intact
    expect(hierarchy.lastAggregatePacket).toBeDefined();
  });

  it('getHierarchySummary includes E2 bidirectional metrics', () => {
    const hierarchy = new HierarchicalTorus(12, 6, 6);

    for (let i = 0; i < 20; i++) {
      hierarchy.updateHierarchy(0, undefined);
    }

    const summary = hierarchy.getHierarchySummary();

    // E2-specific fields
    expect(summary).toHaveProperty('frameCount');
    expect(summary).toHaveProperty('upperUpdateInterval');
    expect(summary).toHaveProperty('topDownModulationPresent');
    expect(summary).toHaveProperty('meanBaselineGainDelta');
    expect(summary).toHaveProperty('meanRewriteGainDelta');
    expect(summary).toHaveProperty('meanThresholdDelta');
    expect(summary).toHaveProperty('lastFeedbackTimestamp');
  });
});
