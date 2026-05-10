import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import { updateWaveCapableMediumLeapfrogPreview } from '../../world/waveCapableMediumLeapfrogPreview.ts';
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

describe('wave capable medium leapfrog preview', () => {
  it('keeps a zero field zero while advancing tick and closing the ledger', () => {
    const state = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });

    const result = updateWaveCapableMediumLeapfrogPreview(state, baseConfig);

    expect(result.state.tick).toBe(1);
    expect(Array.from(result.state.mediumRealField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(result.state.mediumImagField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(result.state.mediumRealVelocityField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(result.state.mediumImagVelocityField)).toEqual([0, 0, 0, 0]);
    expect(result.report.changedFieldCount).toBe(0);
    expect(result.report.energyCheck.ledger.status).toBe('closed');
    expect(result.report.energyCheck.ledger.conservationResidual).toBe(0);
  });

  it('advances a uniform velocity field without creating elastic energy', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealVelocityField: [1, 1, 1, 1] },
    );

    const result = updateWaveCapableMediumLeapfrogPreview(state, baseConfig);

    expect(Array.from(result.state.mediumRealField)).toEqual([1, 1, 1, 1]);
    expect(Array.from(result.state.mediumRealVelocityField)).toEqual([1, 1, 1, 1]);
    expect(result.report.energyAfter.elasticEnergy).toBe(0);
    expect(result.report.energyBefore.totalEnergy).toBe(result.report.energyAfter.totalEnergy);
    expect(result.report.energyCheck.ledger.status).toBe('closed');
  });

  it('uses local acceleration to update field and velocity without mutating previous state', () => {
    const state = createWaveCapableMediumState(
      { width: 3, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1, 0, 0] },
    );
    const beforeField = Array.from(state.mediumRealField);

    const result = updateWaveCapableMediumLeapfrogPreview(state, {
      ...baseConfig,
      width: 3,
      height: 1,
      dt: 0.1,
      tolerance: 1,
    });

    expect(Array.from(state.mediumRealField)).toEqual(beforeField);
    expect(result.state.tick).toBe(state.tick + 1);
    expect(result.state.mediumRealField[0]).toBeLessThan(1);
    expect(result.state.mediumRealField[1]).toBeGreaterThan(0);
    expect(result.state.mediumRealVelocityField[0]).toBeLessThan(0);
    expect(result.state.mediumRealVelocityField[1]).toBeGreaterThan(0);
    expect(result.report.accelerationBefore.metricKind).toBe('derived');
    expect(result.report.accelerationAfter.metricKind).toBe('derived');
  });

  it('rejects localWaveDamping in this conservative preview phase', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealVelocityField: [1, 1, 1, 1] },
    );

    const result = updateWaveCapableMediumLeapfrogPreview(state, {
      ...baseConfig,
      localWaveDamping: 0.5,
    });

    expect(result.report.warnings.join('\n')).toContain('localWaveDamping is rejected');
    expect(Array.from(result.state.mediumRealVelocityField)).toEqual([1, 1, 1, 1]);
  });

  it('does not include result-coded coherence identifiers in leapfrog preview source', () => {
    const source = readFileSync('src/world/waveCapableMediumLeapfrogPreview.ts', 'utf8');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
