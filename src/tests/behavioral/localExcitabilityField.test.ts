/**
 * S5: Local Excitability Field — Behavioral Tests
 *
 * These tests verify the Local Excitability Field derivation:
 * - No neuron nodes are created.
 * - No path formation occurs.
 * - No semantic labels, meanings, or concepts appear in the output.
 * - The derivation is read-only (does not mutate inputs).
 * - Output values are always finite and in [0, 1].
 * - Field responds correctly to upstream conditions.
 */

import { describe, expect, it } from 'vitest';
import { deriveLocalExcitabilityField } from '../../observer/deriveLocalExcitabilityField.ts';
import { runScenario } from '../../experiments/runScenario.ts';
import { runLocalExcitabilityScenarioSuite } from '../scenario/localExcitabilityScenario.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      if (nested !== null && typeof nested === 'object' && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
  }
  return value;
}

describe('S5: Local Excitability Field', () => {
  it('derives finite fallback values when all upstream states are null / missing', () => {
    const field = deriveLocalExcitabilityField({
      trace: null,
      returns: [],
      closure: null,
      mediumProfile: null,
      viability: null,
      previousField: null,
      dt: 1 / 60,
    });

    expect(field.regionCount).toBeGreaterThan(0);
    expect(Number.isFinite(field.averageExcitability)).toBe(true);
    expect(Number.isFinite(field.maxExcitability)).toBe(true);
    expect(Number.isFinite(field.fieldConfidence)).toBe(true);

    for (const key of ['averageExcitability', 'maxExcitability', 'averageThresholdProximity',
      'averageTraceResidue', 'averageReturnInfluence', 'averagePropagationTendency',
      'fieldConfidence'] as const) {
      expect(field[key]).toBeGreaterThanOrEqual(0);
      expect(field[key]).toBeLessThanOrEqual(1);
    }

    for (const cell of field.cells) {
      for (const key of ['activationLevel', 'excitability', 'thresholdProximity', 'refractoryDepth',
        'recoveryProgress', 'traceResidue', 'returnInfluence', 'propagationTendency',
        'localResistance', 'localDissipation', 'confidence'] as const) {
        expect(Number.isFinite(cell[key])).toBe(true);
        expect(cell[key]).toBeGreaterThanOrEqual(0);
        expect(cell[key]).toBeLessThanOrEqual(1);
      }
    }
  });

  // S5-A: Quiet field — no false hotspots
  it('S5-A: quiet field produces low highExcitabilityRegionCount', () => {
    const outcomes = runLocalExcitabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.field]));

    const quietField = scenarioMap['S5-A-quiet-field'];
    expect(quietField).toBeDefined();
    // In a very quiet field with minimal trace / returns / viability, hotspots should be minimal
    expect(quietField.highExcitabilityRegionCount).toBeLessThanOrEqual(4);
    expect(quietField.averageExcitability).toBeLessThan(0.5);
  });

  // S5-B: Repeated local return raises threshold proximity and trace residue
  it('S5-B: repeated return raises averageThresholdProximity and averageTraceResidue vs quiet', () => {
    const outcomes = runLocalExcitabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.field]));

    const quiet = scenarioMap['S5-A-quiet-field'];
    const repeated = scenarioMap['S5-B-repeated-return-raises-threshold'];
    expect(repeated.averageThresholdProximity).toBeGreaterThan(quiet.averageThresholdProximity);
    expect(repeated.averageTraceResidue).toBeGreaterThan(quiet.averageTraceResidue);
    expect(repeated.averageReturnInfluence).toBeGreaterThan(quiet.averageReturnInfluence);
  });

  // S5-C: Refractory reduces excitability
  it('S5-C: high overCoupling/saturation raises refractoryDepth and lowers excitability', () => {
    const outcomes = runLocalExcitabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.field]));

    const refractory = scenarioMap['S5-C-refractory-reduces-excitability'];
    const baseline = scenarioMap['S5-B-repeated-return-raises-threshold'];
    const avgRefractoryDepth = refractory.cells.reduce((sum, c) => sum + c.refractoryDepth, 0) / refractory.cells.length;
    const baselineRefractoryDepth = baseline.cells.reduce((sum, c) => sum + c.refractoryDepth, 0) / baseline.cells.length;
    expect(avgRefractoryDepth).toBeGreaterThan(baselineRefractoryDepth);
    // Average excitability should be lower than in repeated-return scenario
    expect(refractory.averageExcitability).toBeLessThan(baseline.averageExcitability);
  });

  // S5-D: Recovery restores excitability
  it('S5-D: good viability and high traceContinuity raises recoveryProgress and excitability', () => {
    const outcomes = runLocalExcitabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.field]));

    const recovering = scenarioMap['S5-D-recovery-restores-excitability'];
    const quiet = scenarioMap['S5-A-quiet-field'];
    const avgRecovery = recovering.cells.reduce((sum, c) => sum + c.recoveryProgress, 0) / recovering.cells.length;
    const quietRecovery = quiet.cells.reduce((sum, c) => sum + c.recoveryProgress, 0) / quiet.cells.length;
    expect(avgRecovery).toBeGreaterThan(quietRecovery);
    expect(recovering.averageExcitability).toBeGreaterThan(quiet.averageExcitability);
  });

  // S5-E: High resistance lowers propagation tendency
  it('S5-E: high localResistance reduces propagationTendency', () => {
    const outcomes = runLocalExcitabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.field]));

    const highRes = scenarioMap['S5-E-high-resistance-lowers-propagation'];
    const baseline = scenarioMap['S5-G-read-only-observation'];
    expect(highRes.averagePropagationTendency).toBeLessThan(baseline.averagePropagationTendency);
    const avgResistance = highRes.cells.reduce((sum, c) => sum + c.localResistance, 0) / highRes.cells.length;
    const baselineResistance = baseline.cells.reduce((sum, c) => sum + c.localResistance, 0) / baseline.cells.length;
    expect(avgResistance).toBeGreaterThan(baselineResistance);
  });

  // S5-F: Low dissipation preserves trace
  it('S5-F: low dissipation produces higher traceResidue than high dissipation', () => {
    const outcomes = runLocalExcitabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.field]));

    const lowDiss = scenarioMap['S5-F-low-dissipation-preserves-trace'];
    const quiet = scenarioMap['S5-A-quiet-field'];
    expect(lowDiss.averageTraceResidue).toBeGreaterThan(quiet.averageTraceResidue);
    const avgDissipation = lowDiss.cells.reduce((sum, c) => sum + c.localDissipation, 0) / lowDiss.cells.length;
    const quietDissipation = quiet.cells.reduce((sum, c) => sum + c.localDissipation, 0) / quiet.cells.length;
    expect(avgDissipation).toBeLessThan(quietDissipation);
  });

  // S5-G: Read-only observation — inputs are not mutated
  it('S5-G: deriveLocalExcitabilityField does not mutate any input', () => {
    const trace = deepFreeze({
      timestamp: 100,
      traceStrength: 0.38,
      recurrenceWeight: 0.34,
      salienceResidue: 0.3,
      replayReadiness: 0.32,
      replaySuppression: 0.16,
      settlingResidue: 0.28,
      recoveryLinkedResidue: 0.24,
    });
    const returns = deepFreeze([{
      timestamp: 101,
      channel: 'simulatedLight' as const,
      intensity: 0.52,
      novelty: 0.34,
      locality: 0.42,
      rhythm: 0.36,
      worldOriginStrength: 0.72,
      returnDelayHint: 0.36,
      mediumStabilityHint: 0.7,
    }]);
    const closure = deepFreeze({
      timestamp: 100,
      loopGain: 0.92,
      roundTripDelay: 0.38,
      returnStrength: 0.5,
      selfCausedMatch: 0.62,
      worldMismatch: 0.2,
      closureStability: 0.68,
      closureDrift: 0.16,
      unresolvedReturn: 0.12,
      feedbackSaturationRisk: 0.24,
      comparisonConfidence: 0.7,
      returnMismatch: 0.08,
    });

    // Should not throw even with frozen inputs
    const field = deriveLocalExcitabilityField({
      trace,
      returns: returns as SensoryReturnPacket[],
      closure,
      mediumProfile: null,
      viability: null,
      previousField: null,
      dt: 1 / 60,
    });

    // Verify inputs were not mutated (frozen objects would throw on write)
    expect(trace.traceStrength).toBe(0.38);
    expect(returns[0].intensity).toBe(0.52);
    expect(closure.loopGain).toBe(0.92);
    expect(field.regionCount).toBeGreaterThan(0);
  });

  // S5-H: No semantic leak
  it('S5-H: field cells and state contain no semantic or consciousness fields', () => {
    const semanticForbiddenFields = [
      'label', 'meaning', 'concept', 'category', 'sameObject',
      'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
      'languageMeaning', 'consciousness', 'selfAwareness', 'lifeForce',
      'neuron', 'brain', 'memory', 'emotion',
    ];

    const outcomes = runLocalExcitabilityScenarioSuite();
    for (const outcome of outcomes) {
      // Verify inputs were not mutated
      expect(outcome.inputSignature).toBe(outcome.postSignature);

      // Check field-level keys
      const fieldKeys = Object.keys(outcome.field);
      for (const forbidden of semanticForbiddenFields) {
        expect(fieldKeys).not.toContain(forbidden);
      }

      // Check cell-level keys
      for (const cell of outcome.field.cells) {
        const cellKeys = Object.keys(cell);
        for (const forbidden of semanticForbiddenFields) {
          expect(cellKeys).not.toContain(forbidden);
        }
        // regionId must not contain semantic labels
        expect(cell.regionId).not.toMatch(/cat|memory|sadness|user|emotion|brain|neuron|meaning|label/i);
      }
    }
  });

  it('all region IDs use coordinate notation (u\\d-v\\d), not semantic labels', () => {
    const field = deriveLocalExcitabilityField({
      trace: null,
      returns: [],
      closure: null,
      mediumProfile: null,
      viability: null,
      previousField: null,
      dt: 1 / 60,
    });

    for (const cell of field.cells) {
      expect(cell.regionId).toMatch(/^u\d+-v\d+$/);
    }
  });

  it('excitability decreases when refractoryDepth is maximal', () => {
    // Build a scenario where overCoupling/saturation is extreme
    const highRefractory = deriveLocalExcitabilityField({
      viability: {
        timestamp: 100,
        flowContinuity: 0.3,
        energyThroughput: 0.3,
        dissipationBalance: 0.4,
        resistanceBalance: 0.4,
        delayCoherence: 0.4,
        boundaryExchange: 0.4,
        underCouplingRisk: 0.1,
        overCouplingRisk: 0.95,
        saturationRisk: 0.95,
        extinctionRisk: 0.2,
        viabilityConfidence: 0.22,
      },
      trace: null,
      returns: [],
      closure: null,
      mediumProfile: null,
      previousField: null,
      dt: 1 / 60,
    });

    const normalField = deriveLocalExcitabilityField({
      viability: {
        timestamp: 100,
        flowContinuity: 0.6,
        energyThroughput: 0.55,
        dissipationBalance: 0.55,
        resistanceBalance: 0.55,
        delayCoherence: 0.6,
        boundaryExchange: 0.55,
        underCouplingRisk: 0.2,
        overCouplingRisk: 0.15,
        saturationRisk: 0.18,
        extinctionRisk: 0.15,
        viabilityConfidence: 0.68,
      },
      trace: null,
      returns: [],
      closure: null,
      mediumProfile: null,
      previousField: null,
      dt: 1 / 60,
    });

    // Refractory field should have lower excitability than normal
    expect(highRefractory.averageExcitability).toBeLessThanOrEqual(normalField.averageExcitability);
  });

  it('adds Local Excitability Field to scenario observer snapshots', async () => {
    const result = await runScenario({
      name: 'S5-observer-local-excitability',
      totalFrames: 120,
      metricsInterval: 20,
      collectMetrics: true,
    });

    const lefSnapshots = result.metrics.filter((m) => m.lef_averageExcitability !== undefined);
    expect(lefSnapshots.length).toBeGreaterThan(0);
    expect(result.summary.avgLefAverageExcitability).toBeTypeOf('number');
    expect(result.summary.avgLefFieldConfidence).toBeTypeOf('number');
    expect(result.summary.avgLefAveragePropagationTendency).toBeTypeOf('number');

    // Verify values are in [0,1]
    for (const snapshot of lefSnapshots) {
      for (const key of ['lef_averageExcitability', 'lef_maxExcitability',
        'lef_averageThresholdProximity', 'lef_averageTraceResidue',
        'lef_fieldConfidence'] as const) {
        const val = snapshot[key];
        if (val !== undefined) {
          expect(Number.isFinite(val)).toBe(true);
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('neuron node is not created: cells have no id/lifecycle/plasticityScore fields', () => {
    const field = deriveLocalExcitabilityField({
      trace: null,
      returns: [],
      closure: null,
      mediumProfile: null,
      viability: null,
      previousField: null,
      dt: 1 / 60,
    });

    const neuronForbiddenFields = [
      'id', 'lifecycle', 'weakPlasticityScore', 'coActivationScore',
      'closureCoupling', 'traceRetention', 'refractoryPattern',
      'stabilityScore', 'lifetimeTicks', 'lastSeenTick', 'basinOverlap', 'knotOverlap',
    ];

    for (const cell of field.cells) {
      const cellKeys = Object.keys(cell);
      for (const forbidden of neuronForbiddenFields) {
        expect(cellKeys).not.toContain(forbidden);
      }
    }
  });
});
