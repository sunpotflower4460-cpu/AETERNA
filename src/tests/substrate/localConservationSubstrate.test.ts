import { describe, expect, it } from 'vitest';
import {
  createLocalConservationSubstrate,
  sumLocalConservationStorage,
  updateLocalConservationSubstrate,
} from '../../substrate/localConservationSubstrate.ts';
import type { LocalConservationSubstrateConfig } from '../../types/localConservationSubstrate.ts';

const baseConfig: LocalConservationSubstrateConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localExchangeCoefficient: 0,
  localDissipationCoefficient: 0.1,
  residueConversionCoefficient: 0.2,
  outflowCoefficient: 0.3,
  dt: 1,
  tolerance: 1e-9,
};

describe('local conservation substrate', () => {
  it('creates local storage and named destination fields', () => {
    const state = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 2, 3, 4],
    );

    expect(state.storageField.length).toBe(4);
    expect(state.dissipationField.length).toBe(4);
    expect(state.residueField.length).toBe(4);
    expect(state.outflowField.length).toBe(4);
    expect(sumLocalConservationStorage(state)).toBe(10);
  });

  it('transfers lost storage into named destination fields and closes the ledger', () => {
    const state = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [10, 0, 0, 0],
    );

    const result = updateLocalConservationSubstrate(state, baseConfig);
    const report = result.report;

    const destinationTotal =
      report.dissipatedEnergy +
      report.residueConvertedEnergy +
      report.measuredOutflowEnergy +
      report.clampLossOrOverflow;

    expect(report.inputEnergy).toBe(0);
    expect(report.internalEnergyAfter).toBeLessThan(report.internalEnergyBefore);
    expect(destinationTotal).toBeCloseTo(report.internalEnergyBefore - report.internalEnergyAfter, 12);
    expect(report.ledger.status).toBe('closed');
    expect(report.ledger.conservationResidual).toBeCloseTo(0, 12);
  });

  it('local exchange redistributes without changing total storage when no destinations are active', () => {
    const state = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [10, 0, 0, 0],
    );

    const result = updateLocalConservationSubstrate(state, {
      ...baseConfig,
      localExchangeCoefficient: 0.1,
      localDissipationCoefficient: 0,
      residueConversionCoefficient: 0,
      outflowCoefficient: 0,
    });

    expect(result.report.exchangeMagnitude).toBeGreaterThan(0);
    expect(result.report.internalEnergyAfter).toBeCloseTo(result.report.internalEnergyBefore, 12);
    expect(result.report.ledger.status).toBe('closed');
    expect(Array.from(result.state.storageField)).not.toEqual(Array.from(state.storageField));
  });

  it('does not implement supply-cutoff as an outcome rule', () => {
    const state = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 1, 1, 1],
    );

    const noLoss = updateLocalConservationSubstrate(state, {
      ...baseConfig,
      localDissipationCoefficient: 0,
      residueConversionCoefficient: 0,
      outflowCoefficient: 0,
    });

    expect(noLoss.report.inputEnergy).toBe(0);
    expect(noLoss.report.internalEnergyAfter).toBeCloseTo(noLoss.report.internalEnergyBefore, 12);

    const withLocalLoss = updateLocalConservationSubstrate(state, baseConfig);
    expect(withLocalLoss.report.inputEnergy).toBe(0);
    expect(withLocalLoss.report.internalEnergyAfter).toBeLessThan(withLocalLoss.report.internalEnergyBefore);
    expect(withLocalLoss.report.ledger.status).toBe('closed');
  });

  it('does not create life, breath, heartbeat, or rhythm claims', () => {
    const state = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 0, 0, 0],
    );
    const result = updateLocalConservationSubstrate(state, baseConfig);
    const text = JSON.stringify(result.report);

    expect(text).not.toContain('alive');
    expect(text).not.toContain('breath');
    expect(text).not.toContain('heartbeat');
    expect(text).not.toContain('rhythm');
  });
});
