import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import { updateWaveCapableMediumDampingLedger } from '../../world/waveCapableMediumDampingLedger.ts';
import type { WaveCapableMediumConfig } from '../../types/waveCapableMedium.ts';

const baseConfig: WaveCapableMediumConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localElasticCoupling: 1,
  localWaveDamping: 0,
  amplitudeClamp: 10,
  dt: 1,
  tolerance: 1e-9,
};

const forbiddenResultTerms = [
  'coherenceTarget',
  'phaseLockingRate',
  'naturalFrequencyPull',
  'desiredOrderParameter',
  'globalDecayRate',
];

describe('wave capable medium damping ledger', () => {
  it('keeps zero field zero and closes the damping ledger with no dissipated energy', () => {
    const state = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });

    const result = updateWaveCapableMediumDampingLedger(state, {
      ...baseConfig,
      localWaveDamping: 0.5,
    });

    expect(result.state.tick).toBe(1);
    expect(Array.from(result.state.mediumRealField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(result.state.mediumRealVelocityField)).toEqual([0, 0, 0, 0]);
    expect(result.report.dissipatedEnergy).toBe(0);
    expect(result.report.energyCheck.ledger.status).toBe('closed');
    expect(result.report.energyCheck.ledger.conservationResidual).toBe(0);
  });

  it('accounts local velocity damping into the named wave dissipation field', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealVelocityField: [1, 1, 1, 1] },
    );

    const result = updateWaveCapableMediumDampingLedger(state, {
      ...baseConfig,
      localWaveDamping: 0.5,
      dt: 1,
    });

    expect(result.report.dampingFactor).toBe(0.5);
    expect(result.report.energyBeforeDamping.totalEnergy).toBe(2);
    expect(result.report.energyAfter.totalEnergy).toBe(0.5);
    expect(result.report.dissipatedEnergy).toBe(1.5);
    expect(Array.from(result.state.mediumRealVelocityField)).toEqual([0.5, 0.5, 0.5, 0.5]);
    expect(Array.from(result.state.waveEnergyDissipationField)).toEqual([0.375, 0.375, 0.375, 0.375]);
    expect(result.report.energyCheck.dissipatedEnergy).toBe(1.5);
    expect(result.report.energyCheck.ledger.status).toBe('closed');
    expect(result.report.energyCheck.ledger.conservationResidual).toBe(0);
  });

  it('does not mutate the previous state object', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealVelocityField: [1, 1, 1, 1] },
    );
    const beforeVelocity = Array.from(state.mediumRealVelocityField);
    const beforeDissipation = Array.from(state.waveEnergyDissipationField);

    updateWaveCapableMediumDampingLedger(state, {
      ...baseConfig,
      localWaveDamping: 0.5,
    });

    expect(Array.from(state.mediumRealVelocityField)).toEqual(beforeVelocity);
    expect(Array.from(state.waveEnergyDissipationField)).toEqual(beforeDissipation);
    expect(state.tick).toBe(0);
  });

  it('clamps over-strong damping to zero velocity and reports a warning', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealVelocityField: [1, 1, 1, 1] },
    );

    const result = updateWaveCapableMediumDampingLedger(state, {
      ...baseConfig,
      localWaveDamping: 2,
      dt: 1,
    });

    expect(result.report.dampingFactor).toBe(0);
    expect(Array.from(result.state.mediumRealVelocityField)).toEqual([0, 0, 0, 0]);
    expect(result.report.dissipatedEnergy).toBe(2);
    expect(result.report.warnings.join('\n')).toContain('dampingFactor was clamped to 0');
    expect(result.report.energyCheck.ledger.status).toBe('closed');
  });

  it('keeps destination accounting separate from field and velocity update', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealVelocityField: [1, 0, 0, 0] },
    );

    const result = updateWaveCapableMediumDampingLedger(state, {
      ...baseConfig,
      localWaveDamping: 0.25,
      dt: 1,
    });

    const dissipationTotal = Array.from(result.state.waveEnergyDissipationField).reduce((sum, value) => sum + value, 0);
    expect(dissipationTotal).toBeCloseTo(result.report.dissipatedEnergy, 12);
    expect(Array.from(result.state.waveEnergyResidueField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(result.state.waveEnergyOutflowField)).toEqual([0, 0, 0, 0]);
  });

  it('does not include result-coded coherence identifiers in damping ledger source', () => {
    const source = readFileSync('src/world/waveCapableMediumDampingLedger.ts', 'utf8');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
