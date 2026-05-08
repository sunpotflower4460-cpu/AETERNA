import { describe, expect, it } from 'vitest';
import {
  createSpatialWorldMedium,
  sumSpatialWorldMediumStorage,
  updateSpatialWorldMedium,
} from '../../world/spatialWorldMedium.ts';
import type { SpatialWorldMediumConfig } from '../../types/spatialWorldMedium.ts';

const baseConfig: SpatialWorldMediumConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localExchangeCoefficient: 0,
  localDissipationCoefficient: 0.1,
  residueConversionCoefficient: 0.2,
  outflowCoefficient: 0.3,
  membraneExchangeCoefficient: 0.05,
  dt: 1,
  tolerance: 1e-9,
};

describe('spatial world medium', () => {
  it('creates spatial medium storage and named destination fields', () => {
    const state = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 2, 3, 4],
    );

    expect(state.mediumStorageField.length).toBe(4);
    expect(state.mediumDissipationField.length).toBe(4);
    expect(state.mediumResidueField.length).toBe(4);
    expect(state.mediumOutflowField.length).toBe(4);
    expect(state.membraneExchangeField.length).toBe(4);
    expect(sumSpatialWorldMediumStorage(state)).toBe(10);
  });

  it('accounts medium storage decrease into named destinations and closes ledger', () => {
    const state = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [10, 0, 0, 0],
    );

    const result = updateSpatialWorldMedium(state, baseConfig);
    const report = result.report;

    const destinationTotal =
      report.dissipatedEnergy +
      report.residueConvertedEnergy +
      report.measuredOutflowEnergy +
      report.membraneExchangeEnergy +
      report.clampLossOrOverflow;

    expect(report.inputEnergy).toBe(0);
    expect(report.mediumEnergyAfter).toBeLessThan(report.mediumEnergyBefore);
    expect(destinationTotal).toBeCloseTo(report.mediumEnergyBefore - report.mediumEnergyAfter, 12);
    expect(report.ledger.status).toBe('closed');
    expect(report.ledger.conservationResidual).toBeCloseTo(0, 12);
  });

  it('local exchange redistributes medium without changing total when destinations are inactive', () => {
    const state = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [10, 0, 0, 0],
    );

    const result = updateSpatialWorldMedium(state, {
      ...baseConfig,
      localExchangeCoefficient: 0.1,
      localDissipationCoefficient: 0,
      residueConversionCoefficient: 0,
      outflowCoefficient: 0,
      membraneExchangeCoefficient: 0,
    });

    expect(result.report.localExchangeMagnitude).toBeGreaterThan(0);
    expect(result.report.mediumEnergyAfter).toBeCloseTo(result.report.mediumEnergyBefore, 12);
    expect(result.report.ledger.status).toBe('closed');
    expect(Array.from(result.state.mediumStorageField)).not.toEqual(Array.from(state.mediumStorageField));
  });

  it('does not add external drive in v3.1', () => {
    const state = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 1, 1, 1],
    );

    const result = updateSpatialWorldMedium(state, baseConfig);

    expect(result.report.inputEnergy).toBe(0);
    expect(result.report.ledger.inputEnergy).toBe(0);
  });

  it('does not force decay just because input is zero', () => {
    const state = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 1, 1, 1],
    );

    const result = updateSpatialWorldMedium(state, {
      ...baseConfig,
      localDissipationCoefficient: 0,
      residueConversionCoefficient: 0,
      outflowCoefficient: 0,
      membraneExchangeCoefficient: 0,
    });

    expect(result.report.inputEnergy).toBe(0);
    expect(result.report.mediumEnergyAfter).toBeCloseTo(result.report.mediumEnergyBefore, 12);
    expect(result.report.ledger.status).toBe('closed');
  });

  it('does not create life, breath, heartbeat, rhythm, or energy-flow proof claims', () => {
    const state = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 0, 0, 0],
    );
    const result = updateSpatialWorldMedium(state, baseConfig);
    const text = JSON.stringify(result.report);

    expect(text).not.toContain('alive');
    expect(text).not.toContain('breath');
    expect(text).not.toContain('heartbeat');
    expect(text).not.toContain('rhythm');
    expect(text).not.toContain('Energy is flowing through AETERNA');
  });
});
