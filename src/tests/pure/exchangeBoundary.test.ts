import { describe, expect, it } from 'vitest';
import { createTorusGeometry } from '../../pure/geometry/torus.ts';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';
import { selectExchangeBoundaryCell, createExchangeCouplingConfig } from '../../pure/exchange/boundary.ts';

describe('pure core exchange boundary S: single-cell selection at the outer equator (docs/vessel/K5-exchange-medium-adr.md choice 2)', () => {
  it('selects the row whose cell-center theta is closest to 0 (the outer equator, where dA is maximized)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const cellIndex = selectExchangeBoundaryCell(geometry, 0);

    // dTheta = 2pi/8 = pi/4; theta[0] = 0.5*dTheta = pi/8 is the smallest possible angular distance to 0.
    const row = Math.floor(cellIndex / geometry.N);
    expect(row).toBe(0);
  });

  it('the selected cell has the maximum cellArea on the grid (dA is maximized at the outer equator)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 10 });
    const cellIndex = selectExchangeBoundaryCell(geometry, 3);
    const maxArea = Math.max(...geometry.cellArea);
    expect(geometry.cellArea[cellIndex]).toBeCloseTo(maxArea, 12);
  });

  it('respects a non-default phiIndex for the column while still picking the theta=0 row', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const cellIndex = selectExchangeBoundaryCell(geometry, 4);
    expect(cellIndex % geometry.N).toBe(4);
  });

  it('throws for an out-of-range phiIndex', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    expect(() => selectExchangeBoundaryCell(geometry, 6)).toThrow();
    expect(() => selectExchangeBoundaryCell(geometry, -1)).toThrow();
  });
});

describe('pure core exchange coupling config: chi geometry must match the boundary cellArea exactly', () => {
  it('builds a valid config when chi.dx equals the boundary cell\'s cellArea', () => {
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
    const chiGeometry = createExchangeRingGeometry(20, psiGeometry.cellArea[boundaryCellIndex]);

    const config = createExchangeCouplingConfig(psiGeometry, chiGeometry, 0.5);

    expect(config.boundaryCellIndex).toBe(boundaryCellIndex);
    expect(config.portCellIndex).toBe(0);
    expect(config.lambda).toBe(0.5);
  });

  it('throws when chi.dx does not match the boundary cell\'s cellArea', () => {
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const chiGeometry = createExchangeRingGeometry(20, 0.001); // deliberately mismatched
    expect(() => createExchangeCouplingConfig(psiGeometry, chiGeometry, 0.5)).toThrow();
  });

  it('throws for a negative lambda', () => {
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
    const chiGeometry = createExchangeRingGeometry(20, psiGeometry.cellArea[boundaryCellIndex]);
    expect(() => createExchangeCouplingConfig(psiGeometry, chiGeometry, -0.1)).toThrow();
  });

  it('lambda=0 is accepted (the cutoff-control / open-system limit)', () => {
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
    const chiGeometry = createExchangeRingGeometry(20, psiGeometry.cellArea[boundaryCellIndex]);
    const config = createExchangeCouplingConfig(psiGeometry, chiGeometry, 0);
    expect(config.lambda).toBe(0);
  });
});
