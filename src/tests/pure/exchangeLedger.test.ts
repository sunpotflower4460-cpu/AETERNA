import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';
import { createRingLaplacian } from '../../pure/exchange/ringLaplacian.ts';
import { selectExchangeBoundaryCell, createExchangeCouplingConfig } from '../../pure/exchange/boundary.ts';
import { runClosedLoopTick } from '../../pure/exchange/exchangeLedger.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
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

function setupClosedLoop(lambda: number, N = 6, M = 24) {
  const psiGeometry = createTorusGeometry({ R: 3, r: 1, N });
  const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
  const alpha = 1;
  const g = 1;
  const dt = 0.01;
  const stepper = createConservativeStepper(psiOperator, psiGeometry, { alpha, g, dt });
  const nu = Float64Array.from({ length: N * N }, () => 0.2);
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N), omega: 0, phase: 0 }; // zero drive to isolate exchange

  const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
  const chiGeometry = createExchangeRingGeometry(M, psiGeometry.cellArea[boundaryCellIndex]);
  const chiOperator = createRingLaplacian(chiGeometry);
  const alphaChi = 1;
  const shiftCellsPerTick = 1;
  const nuChi = Float64Array.from({ length: M }, () => 0.15);

  const couplingConfig = createExchangeCouplingConfig(psiGeometry, chiGeometry, lambda);

  return { psiGeometry, psiOperator, stepper, alpha, g, dt, nu, drive, chiGeometry, chiOperator, alphaChi, shiftCellsPerTick, nuChi, couplingConfig };
}

describe('pure core exchange ledger: N bookkeeping closes exactly, same amount opposite sign (docs/pure-physics-implementation-plan.md analog for K5; closed-life-loop-design.md §帳簿)', () => {
  it('exchangeWork_N_psi = -exchangeWork_N_chi exactly, across many ticks and lambda values', () => {
    for (const lambda of [0.5, 2, 10]) {
      const setup = setupClosedLoop(lambda);
      let psi = randomComplexField(setup.psiGeometry.N * setup.psiGeometry.N, 5, 0.2);
      let chi = randomComplexField(setup.chiGeometry.M, 9, 0.2);

      for (let tick = 0; tick < 25; tick++) {
        const t = tick * setup.dt;
        const result = runClosedLoopTick(
          psi, setup.stepper, setup.psiGeometry, setup.alpha, setup.g, setup.nu, setup.drive, t, setup.dt,
          chi, setup.chiOperator, setup.chiGeometry, setup.alphaChi, setup.shiftCellsPerTick, setup.nuChi, setup.couplingConfig,
        );
        expect(result.ledger.exchangeWorkNPsi).toBeCloseTo(-result.ledger.exchangeWorkNChi, 10);
        psi = result.psi;
        chi = result.chi;
      }
    }
  });

  it('with lambda=0, exchangeWork_N is exactly 0 on both sides every tick (no exchange at all)', () => {
    const setup = setupClosedLoop(0);
    let psi = randomComplexField(setup.psiGeometry.N * setup.psiGeometry.N, 15, 0.2);
    let chi = randomComplexField(setup.chiGeometry.M, 17, 0.2);

    for (let tick = 0; tick < 10; tick++) {
      const t = tick * setup.dt;
      const result = runClosedLoopTick(
        psi, setup.stepper, setup.psiGeometry, setup.alpha, setup.g, setup.nu, setup.drive, t, setup.dt,
        chi, setup.chiOperator, setup.chiGeometry, setup.alphaChi, setup.shiftCellsPerTick, setup.nuChi, setup.couplingConfig,
      );
      expect(result.ledger.exchangeWorkNPsi).toBe(0);
      expect(result.ledger.exchangeWorkNChi).toBe(0);
      psi = result.psi;
      chi = result.chi;
    }
  });
});

describe('pure core exchange ledger: H bookkeeping is measured, not assumed symmetric (誠実な床 - see exchangeLedger.ts module doc)', () => {
  it('exchangeWork_H_psi and exchangeWork_H_chi are each finite and nonzero for lambda>0, but are NOT generally equal-and-opposite (gradient/neighbor terms break the local symmetry N has)', () => {
    const setup = setupClosedLoop(3);
    let psi = randomComplexField(setup.psiGeometry.N * setup.psiGeometry.N, 25, 0.3);
    let chi = randomComplexField(setup.chiGeometry.M, 27, 0.3);

    let sawNonCancellation = false;
    for (let tick = 0; tick < 15; tick++) {
      const t = tick * setup.dt;
      const result = runClosedLoopTick(
        psi, setup.stepper, setup.psiGeometry, setup.alpha, setup.g, setup.nu, setup.drive, t, setup.dt,
        chi, setup.chiOperator, setup.chiGeometry, setup.alphaChi, setup.shiftCellsPerTick, setup.nuChi, setup.couplingConfig,
      );
      expect(Number.isFinite(result.ledger.exchangeWorkHPsi)).toBe(true);
      expect(Number.isFinite(result.ledger.exchangeWorkHChi)).toBe(true);
      const sum = result.ledger.exchangeWorkHPsi + result.ledger.exchangeWorkHChi;
      if (Math.abs(sum) > 1e-9) sawNonCancellation = true;
      psi = result.psi;
      chi = result.chi;
    }
    // This documents the actual, measured behavior (an honest finding, not
    // a failure): unlike N, H's exchange terms do not cancel exactly,
    // because H includes each side's own gradient/neighbor energy, which
    // the single-cell coupling does not touch symmetrically.
    expect(sawNonCancellation).toBe(true);
  });

  it('with lambda=0, exchangeWork_H is exactly 0 on both sides (no exchange, so no gradient disturbance either)', () => {
    const setup = setupClosedLoop(0);
    let psi = randomComplexField(setup.psiGeometry.N * setup.psiGeometry.N, 35, 0.2);
    let chi = randomComplexField(setup.chiGeometry.M, 37, 0.2);

    for (let tick = 0; tick < 10; tick++) {
      const t = tick * setup.dt;
      const result = runClosedLoopTick(
        psi, setup.stepper, setup.psiGeometry, setup.alpha, setup.g, setup.nu, setup.drive, t, setup.dt,
        chi, setup.chiOperator, setup.chiGeometry, setup.alphaChi, setup.shiftCellsPerTick, setup.nuChi, setup.couplingConfig,
      );
      expect(result.ledger.exchangeWorkHPsi).toBe(0);
      expect(result.ledger.exchangeWorkHChi).toBe(0);
      psi = result.psi;
      chi = result.chi;
    }
  });
});
