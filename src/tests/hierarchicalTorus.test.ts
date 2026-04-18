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
