import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  cloneWaveCapableMediumState,
  createWaveCapableMediumState,
  deriveWaveAccelerationPreview,
  deriveWaveEnergyLedgerCheck,
  deriveWaveEnergySnapshot,
  updateWaveCapableMediumNoop,
} from '../../world/waveCapableMedium.ts';
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
  'vital',
  'breath',
  'heartbeat',
  'pulse',
  'metabolic',
  'lifeDrive',
  '呼吸',
  '鼓動',
  '生命',
  '心拍',
];

describe('wave capable medium math foundation', () => {
  it('creates zero wave fields and named destination fields', () => {
    const state = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });

    expect(state.mediumRealField.length).toBe(4);
    expect(state.mediumImagField.length).toBe(4);
    expect(state.mediumRealVelocityField.length).toBe(4);
    expect(state.mediumImagVelocityField.length).toBe(4);
    expect(state.waveEnergyDissipationField.length).toBe(4);
    expect(state.waveEnergyResidueField.length).toBe(4);
    expect(state.waveEnergyOutflowField.length).toBe(4);
    expect(Array.from(state.mediumRealField)).toEqual([0, 0, 0, 0]);
  });

  it('reports zero energy for a zero field', () => {
    const state = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });
    const energy = deriveWaveEnergySnapshot(state, baseConfig);

    expect(energy.kineticEnergy).toBe(0);
    expect(energy.elasticEnergy).toBe(0);
    expect(energy.totalEnergy).toBe(0);
    expect(energy.finiteCellCount).toBe(4);
    expect(energy.nonFiniteCellCount).toBe(0);
    expect(energy.metricKind).toBe('derived');
  });

  it('reports positive kinetic energy from finite velocity fields', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealVelocityField: [1, 0, 0, 0],
        mediumImagVelocityField: [0, 2, 0, 0],
      },
    );
    const energy = deriveWaveEnergySnapshot(state, baseConfig);

    expect(energy.kineticEnergy).toBe(2.5);
    expect(energy.elasticEnergy).toBe(0);
    expect(energy.totalEnergy).toBe(2.5);
  });

  it('reports positive elastic energy from neighboring field differences', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 0, 0],
      },
    );
    const energy = deriveWaveEnergySnapshot(state, baseConfig);

    expect(energy.kineticEnergy).toBe(0);
    expect(energy.elasticEnergy).toBeGreaterThan(0);
    expect(energy.totalEnergy).toBe(energy.elasticEnergy);
  });

  it('makes elastic energy zero when localElasticCoupling is zero', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 0, 0],
      },
    );
    const energy = deriveWaveEnergySnapshot(state, {
      ...baseConfig,
      localElasticCoupling: 0,
    });

    expect(energy.elasticEnergy).toBe(0);
    expect(energy.totalEnergy).toBe(0);
  });

  it('closes a zero-input zero-change wave energy ledger', () => {
    const state = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });
    const energyBefore = deriveWaveEnergySnapshot(state, baseConfig);
    const energyAfter = deriveWaveEnergySnapshot(state, baseConfig);
    const check = deriveWaveEnergyLedgerCheck({
      energyBefore,
      energyAfter,
      tolerance: 1e-9,
    });

    expect(check.source).toBe('wave-energy-math-foundation');
    expect(check.ledger.status).toBe('closed');
    expect(check.ledger.verifiedModeledFlow).toBe(true);
    expect(check.ledger.conservationResidual).toBe(0);
  });

  it('closes when a wave energy decrease is accounted as named dissipation', () => {
    const energyBefore = {
      kineticEnergy: 1,
      elasticEnergy: 1,
      totalEnergy: 2,
      finiteCellCount: 4,
      nonFiniteCellCount: 0,
      metricKind: 'derived' as const,
    };
    const energyAfter = {
      ...energyBefore,
      kineticEnergy: 0.5,
      elasticEnergy: 1,
      totalEnergy: 1.5,
    };
    const check = deriveWaveEnergyLedgerCheck({
      energyBefore,
      energyAfter,
      dissipatedEnergy: 0.5,
      tolerance: 1e-9,
    });

    expect(check.ledger.status).toBe('closed');
    expect(check.dissipatedEnergy).toBe(0.5);
    expect(check.ledger.conservationResidual).toBe(0);
  });

  it('clones wave state without sharing field arrays', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealField: [1, 0, 0, 0] },
    );
    const clone = cloneWaveCapableMediumState(state);

    clone.mediumRealField[0] = 9;

    expect(state.mediumRealField[0]).toBe(1);
    expect(clone.mediumRealField[0]).toBe(9);
    expect(clone.tick).toBe(state.tick);
  });

  it('noop step advances tick but does not change any wave field sample', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 0, 0],
        mediumImagField: [0, 1, 0, 0],
        mediumRealVelocityField: [0.5, 0, 0, 0],
        mediumImagVelocityField: [0, 0.25, 0, 0],
      },
    );
    const before = {
      real: Array.from(state.mediumRealField),
      imag: Array.from(state.mediumImagField),
      realVelocity: Array.from(state.mediumRealVelocityField),
      imagVelocity: Array.from(state.mediumImagVelocityField),
      dissipation: Array.from(state.waveEnergyDissipationField),
      residue: Array.from(state.waveEnergyResidueField),
      outflow: Array.from(state.waveEnergyOutflowField),
    };

    const result = updateWaveCapableMediumNoop(state, baseConfig);

    expect(result.state.tick).toBe(state.tick + 1);
    expect(Array.from(result.state.mediumRealField)).toEqual(before.real);
    expect(Array.from(result.state.mediumImagField)).toEqual(before.imag);
    expect(Array.from(result.state.mediumRealVelocityField)).toEqual(before.realVelocity);
    expect(Array.from(result.state.mediumImagVelocityField)).toEqual(before.imagVelocity);
    expect(Array.from(result.state.waveEnergyDissipationField)).toEqual(before.dissipation);
    expect(Array.from(result.state.waveEnergyResidueField)).toEqual(before.residue);
    expect(Array.from(result.state.waveEnergyOutflowField)).toEqual(before.outflow);
    expect(result.report.changedFieldCount).toBe(0);
  });

  it('noop step keeps wave energy unchanged and ledger closed', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 0, 0],
        mediumRealVelocityField: [0.5, 0, 0, 0],
      },
    );

    const result = updateWaveCapableMediumNoop(state, baseConfig);

    expect(result.report.energyBefore.totalEnergy).toBe(result.report.energyAfter.totalEnergy);
    expect(result.report.energyCheck.ledger.status).toBe('closed');
    expect(result.report.energyCheck.ledger.conservationResidual).toBe(0);
    expect(result.report.metricKind).toBe('derived');
  });

  it('noop step does not mutate the previous state object', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealField: [1, 2, 3, 4] },
    );
    const beforeTick = state.tick;
    const beforeField = Array.from(state.mediumRealField);

    updateWaveCapableMediumNoop(state, baseConfig);

    expect(state.tick).toBe(beforeTick);
    expect(Array.from(state.mediumRealField)).toEqual(beforeField);
  });

  it('acceleration preview is zero for a uniform finite field with zero velocity', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealField: [1, 1, 1, 1] },
    );

    const preview = deriveWaveAccelerationPreview(state, baseConfig);

    expect(Array.from(preview.realAccelerationField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(preview.imagAccelerationField)).toEqual([0, 0, 0, 0]);
    expect(preview.maxAccelerationMagnitude).toBe(0);
    expect(preview.accelerationEnergyProxy).toBe(0);
    expect(preview.finiteCellCount).toBe(4);
    expect(preview.nonFiniteCellCount).toBe(0);
    expect(preview.metricKind).toBe('derived');
  });

  it('acceleration preview reads local neighbor differences without mutating state', () => {
    const state = createWaveCapableMediumState(
      { width: 3, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1, 0, 0] },
    );
    const before = Array.from(state.mediumRealField);

    const preview = deriveWaveAccelerationPreview(state, {
      ...baseConfig,
      width: 3,
      height: 1,
      localElasticCoupling: 1,
    });

    expect(Array.from(preview.realAccelerationField)).toEqual([-4, 2, 2]);
    expect(Array.from(preview.imagAccelerationField)).toEqual([0, 0, 0]);
    expect(preview.maxAccelerationMagnitude).toBe(4);
    expect(preview.accelerationEnergyProxy).toBe(12);
    expect(Array.from(state.mediumRealField)).toEqual(before);
  });

  it('acceleration preview respects localElasticCoupling and localWaveDamping', () => {
    const state = createWaveCapableMediumState(
      { width: 3, height: 1, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 0],
        mediumRealVelocityField: [2, 0, 0],
      },
    );

    const preview = deriveWaveAccelerationPreview(state, {
      ...baseConfig,
      width: 3,
      height: 1,
      localElasticCoupling: 0.5,
      localWaveDamping: 0.25,
    });

    expect(Array.from(preview.realAccelerationField)).toEqual([-2.5, 1, 1]);
    expect(Array.from(preview.imagAccelerationField)).toEqual([0, 0, 0]);
  });

  it('acceleration preview treats non-finite cells as zero and reports warnings', () => {
    const state = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealField: [Number.NaN, 0, 0, 0] },
    );

    const preview = deriveWaveAccelerationPreview(state, baseConfig);

    expect(preview.nonFiniteCellCount).toBe(1);
    expect(preview.finiteCellCount).toBe(3);
    expect(preview.warnings.join('\n')).toContain('non-finite wave cell');
  });

  it('does not include result-coded coherence identifiers in wave source files', () => {
    const source = [
      readFileSync('src/types/waveCapableMedium.ts', 'utf8'),
      readFileSync('src/world/waveCapableMedium.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

  it('does not include result-coded coherence identifiers in source-facing state strings', () => {
    const state = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });
    const text = JSON.stringify(state);

    for (const term of forbiddenResultTerms) {
      expect(text.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
