import { describe, expect, it } from 'vitest';

import { defaultMembraneConfig } from '../../config/membraneConfig.ts';
import { createMembraneState, updateMembraneState } from '../../boundary/membrane.ts';

const baseState = () => createMembraneState({
  segments: 4,
  timestamp: 0,
  initialPermeability: 0.4,
  initialTension: 0.45,
});

describe('membrane boundary helpers', () => {
  it('creates a membrane state with segments squared cells', () => {
    const membrane = baseState();
    expect(membrane.segments).toBe(4);
    expect(membrane.cells).toHaveLength(16);
    membrane.cells.forEach((cell) => {
      expect(Number.isFinite(cell.permeability)).toBe(true);
      expect(Number.isFinite(cell.tension)).toBe(true);
      expect(Number.isFinite(cell.deformation)).toBe(true);
    });
  });

  it('applies actuation imprint and deformation', () => {
    const next = updateMembraneState({
      previous: baseState(),
      actuationPulse: {
        timestamp: 1,
        channel: 'visual',
        intensity: 0.8,
        coherence: 0.7,
        rhythm: 0.4,
        locality: 0.8,
        recoveryLinked: 0.3,
        boundaryLinked: 0.6,
        traceLinked: 0.2,
        outputReadiness: 0.5,
      },
      config: defaultMembraneConfig,
      timestamp: 1,
      dt: 1,
    });

    expect(next.averageActuationImprint).toBeGreaterThan(0);
    expect(next.averageDeformation).toBeGreaterThan(0);
  });

  it('applies return imprint and raises two-sidedness on overlap', () => {
    const acted = updateMembraneState({
      previous: baseState(),
      actuationPulse: {
        timestamp: 1,
        channel: 'visual',
        intensity: 0.9,
        coherence: 0.8,
        rhythm: 0.2,
        locality: 0.9,
        recoveryLinked: 0.3,
        boundaryLinked: 0.5,
        traceLinked: 0.1,
        outputReadiness: 0.7,
      },
      config: defaultMembraneConfig,
      timestamp: 1,
      dt: 1,
    });

    const next = updateMembraneState({
      previous: acted,
      sensoryReturns: [{
        timestamp: 2,
        channel: 'simulatedLight',
        intensity: 0.9,
        novelty: 0.3,
        locality: 0.9,
        rhythm: 0.2,
        worldOriginStrength: 0.9,
        returnDelayHint: 0.4,
        mediumStabilityHint: 0.7,
      }],
      config: defaultMembraneConfig,
      timestamp: 2,
      dt: 1,
    });

    expect(next.averageReturnImprint).toBeGreaterThan(0);
    expect(next.averageTwoSidedness).toBeGreaterThan(0);
  });

  it('recovery reduces deformation over time', () => {
    const membrane = updateMembraneState({
      previous: baseState(),
      actuationPulse: {
        timestamp: 1,
        channel: 'simulatedForce',
        intensity: 1,
        coherence: 1,
        rhythm: 0,
        locality: 1,
        recoveryLinked: 0,
        boundaryLinked: 0,
        traceLinked: 0,
        outputReadiness: 1,
      },
      config: { ...defaultMembraneConfig, recoveryRate: 0.5 },
      timestamp: 1,
      dt: 1,
    });

    const recovered = updateMembraneState({
      previous: membrane,
      config: { ...defaultMembraneConfig, recoveryRate: 0.5 },
      timestamp: 2,
      dt: 1,
    });

    expect(recovered.averageDeformation).toBeLessThan(membrane.averageDeformation);
    expect(recovered.averageRecovery).toBeGreaterThanOrEqual(membrane.averageRecovery);
  });

  it('clamps permeability, tension, and deformation to safe ranges', () => {
    const next = updateMembraneState({
      previous: baseState(),
      actuationPulse: {
        timestamp: 1,
        channel: 'visual',
        intensity: 10,
        coherence: 10,
        rhythm: 0,
        locality: 1,
        recoveryLinked: 1,
        boundaryLinked: 1,
        traceLinked: 1,
        outputReadiness: 1,
      },
      sensoryReturns: [{
        timestamp: 2,
        channel: 'simulatedLight',
        intensity: 10,
        novelty: 0,
        locality: 1,
        rhythm: 0,
        worldOriginStrength: 1,
        returnDelayHint: 1,
        mediumStabilityHint: 1,
      }],
      config: defaultMembraneConfig,
      timestamp: 2,
      dt: 1,
    });

    next.cells.forEach((cell) => {
      expect(cell.permeability).toBeGreaterThanOrEqual(defaultMembraneConfig.permeabilityMin);
      expect(cell.permeability).toBeLessThanOrEqual(defaultMembraneConfig.permeabilityMax);
      expect(cell.tension).toBeGreaterThanOrEqual(defaultMembraneConfig.tensionMin);
      expect(cell.tension).toBeLessThanOrEqual(defaultMembraneConfig.tensionMax);
      expect(cell.deformation).toBeLessThanOrEqual(defaultMembraneConfig.deformationClamp);
      expect(Number.isFinite(cell.localResistance)).toBe(true);
      expect(Number.isFinite(cell.localAttenuation)).toBe(true);
    });
  });

  it('keeps weakCoupling default off and observerOnly without runtime coupling', () => {
    expect(defaultMembraneConfig.mode).toBe('observerOnly');
    expect(defaultMembraneConfig.couplingToWorld).toBe(0);
    expect(defaultMembraneConfig.couplingToBody).toBe(0);
  });
});
