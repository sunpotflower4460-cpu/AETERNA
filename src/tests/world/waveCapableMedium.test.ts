import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createWaveCapableMediumState,
  deriveWaveEnergyLedgerCheck,
  deriveWaveEnergySnapshot,
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
