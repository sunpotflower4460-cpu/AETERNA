import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { runMediumHistoryTick } from '../../pure/ledger/energy.ts';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';
import { createRingLaplacian } from '../../pure/exchange/ringLaplacian.ts';
import { selectExchangeBoundaryCell, createExchangeCouplingConfig } from '../../pure/exchange/boundary.ts';
import { runFullClosedLoopTick } from '../../pure/exchange/exchangeLedger.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { MediumHistoryParams } from '../../pure/medium/history.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number, scale = 0.3): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * scale;
    imag[i] = (random() - 0.5) * scale;
  }
  return { real, imag };
}

describe('pure core K5 cutoff control: lambda=0 reproduces the K2-K4 open system bit-for-bit (docs/vessel/closed-life-loop-design.md K5 完了条件, 遮断対照)', () => {
  it('psi and nu trajectories are bit-identical between runMediumHistoryTick alone and runFullClosedLoopTick with lambda=0, across many ticks', () => {
    const N = 6;
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
    const alpha = 1;
    const g = 1.1;
    const dt = 0.01;
    const nu0 = Float64Array.from({ length: N * N }, () => 0.25);
    const drive: DriveSpec = { spatialProfile: Float64Array.from({ length: N * N }, () => 0.04), omega: 2, phase: 0.3 };
    const mediumParams: MediumHistoryParams = { kappa: 1, rho: 0.3, nu0: 0.25 };

    const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
    const M = 20;
    const chiGeometry = createExchangeRingGeometry(M, psiGeometry.cellArea[boundaryCellIndex]);
    const chiOperator = createRingLaplacian(chiGeometry);
    const alphaChi = 1;
    const shiftCellsPerTick = 1;
    const nuChi = Float64Array.from({ length: M }, () => 0.2);
    const couplingConfig = createExchangeCouplingConfig(psiGeometry, chiGeometry, 0); // lambda=0

    const stepperOpen = createConservativeStepper(psiOperator, psiGeometry, { alpha, g, dt });
    const stepperClosed = createConservativeStepper(psiOperator, psiGeometry, { alpha, g, dt });

    let psiOpen = randomComplexField(N * N, 9, 0.2);
    let nuOpen = Float64Array.from(nu0);
    let psiClosed = randomComplexField(N * N, 9, 0.2); // same seed -> same initial state
    let nuClosed = Float64Array.from(nu0);
    let chi = randomComplexField(M, 15, 0.2); // chi's own state - irrelevant to psi when lambda=0, but let it evolve

    for (let tick = 0; tick < 30; tick++) {
      const t = tick * dt;
      const openResult = runMediumHistoryTick(psiOpen, stepperOpen, psiGeometry, alpha, g, nuOpen, drive, t, dt, mediumParams);
      const closedResult = runFullClosedLoopTick(
        psiClosed, stepperClosed, psiGeometry, alpha, g, nuClosed, drive, t, dt,
        chi, chiOperator, chiGeometry, alphaChi, shiftCellsPerTick, nuChi, couplingConfig, mediumParams,
      );

      expect(closedResult.psi.real).toEqual(openResult.psi.real);
      expect(closedResult.psi.imag).toEqual(openResult.psi.imag);
      expect(closedResult.nu).toEqual(openResult.nu);

      psiOpen = openResult.psi;
      nuOpen = openResult.nu;
      psiClosed = closedResult.psi;
      nuClosed = closedResult.nu;
      chi = closedResult.chi;
    }
  });
});
