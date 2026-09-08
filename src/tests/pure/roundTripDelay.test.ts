import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';
import { createRingLaplacian } from '../../pure/exchange/ringLaplacian.ts';
import { selectExchangeBoundaryCell, createExchangeCouplingConfig } from '../../pure/exchange/boundary.ts';
import { runClosedLoopTick } from '../../pure/exchange/exchangeLedger.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';

describe('pure core K5 round-trip delay: emerges from chi\'s path length and shift speed, not a placed parameter (docs/vessel/closed-life-loop-design.md K5 完了条件, docs/vessel/K5-exchange-medium-adr.md choice 1)', () => {
  it('a pulse circulating in chi perturbs psi\'s boundary cell in a step pattern timed exactly to M/shiftCellsPerTick, never in between', () => {
    const N = 6;
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
    // alpha=0, g=0, nu=0, zero drive: isolate psi so ONLY the exchange
    // coupling can move its boundary cell away from its zero start.
    const alpha = 0;
    const g = 0;
    const dt = 0.01;
    const nu = new Float64Array(N * N);
    const drive: DriveSpec = { spatialProfile: new Float64Array(N * N), omega: 0, phase: 0 };
    const stepper = createConservativeStepper(psiOperator, psiGeometry, { alpha, g, dt });

    const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
    const M = 12;
    const shiftCellsPerTick = 3;
    const roundTripTicks = M / shiftCellsPerTick; // exact integer: 4
    const chiGeometry = createExchangeRingGeometry(M, psiGeometry.cellArea[boundaryCellIndex]);
    const chiOperator = createRingLaplacian(chiGeometry);
    const alphaChi = 0; // chi's own H bookkeeping is irrelevant here; keep it inert too
    const nuChi = new Float64Array(M); // no dissipation - the pulse keeps its exact magnitude every lap
    const lambda = 30; // theta=lambda*dt=0.3 rad/tick: strong enough to see a clear step, weak enough that back-reaction on chi's pulse stays small over the ticks tested
    const couplingConfig = createExchangeCouplingConfig(psiGeometry, chiGeometry, lambda);

    let psi: ComplexField = { real: new Float64Array(N * N), imag: new Float64Array(N * N) };
    let chi: ComplexField = { real: new Float64Array(M), imag: new Float64Array(M) };
    chi.real[0] = 1; // a single pulse at the port cell, t=0

    const psiBoundaryMagnitude: number[] = [];
    for (let tick = 0; tick < roundTripTicks * 3; tick++) {
      const t = tick * dt;
      const result = runClosedLoopTick(
        psi, stepper, psiGeometry, alpha, g, nu, drive, t, dt,
        chi, chiOperator, chiGeometry, alphaChi, shiftCellsPerTick, nuChi, couplingConfig,
      );
      psi = result.psi;
      chi = result.chi;
      const real = psi.real[boundaryCellIndex];
      const imag = psi.imag[boundaryCellIndex];
      psiBoundaryMagnitude.push(Math.hypot(real, imag));
    }

    // shiftsApplied by the end of iteration `tick` (0-indexed) is tick+1;
    // the pulse is back at chi's port cell exactly when shiftsApplied is
    // a multiple of roundTripTicks (M/shiftCellsPerTick).
    for (let tick = 0; tick < psiBoundaryMagnitude.length; tick++) {
      const shiftsApplied = tick + 1;
      const isPeakTick = shiftsApplied % roundTripTicks === 0;
      const before = tick === 0 ? 0 : psiBoundaryMagnitude[tick - 1];
      const after = psiBoundaryMagnitude[tick];

      if (isPeakTick) {
        // The pulse reached the port cell this tick: psi's boundary cell
        // magnitude jumps up substantially. (The exact jump size varies
        // tick to tick under repeated Rabi-type coupling - what's fixed
        // is the TIMING, so this checks for a clear, non-trivial
        // increase rather than a specific formula-derived magnitude.)
        expect(after).toBeGreaterThan(before + 0.01);
      } else {
        // The pulse is elsewhere in the ring: chi's port cell is exactly
        // 0, so the coupling can only scale psi's boundary cell by
        // |cos(theta)|<=1 - magnitude can never increase off-peak,
        // regardless of the compounding history from earlier peaks.
        expect(after).toBeLessThanOrEqual(before + 1e-12);
      }
    }

    // Sanity: at least one real jump was actually observed (guards
    // against a vacuously-passing test if the coupling were accidentally
    // inert).
    const maxMagnitude = Math.max(...psiBoundaryMagnitude);
    expect(maxMagnitude).toBeGreaterThan(0.1);
  });

  it('changing M or shiftCellsPerTick changes the observed period exactly as M/shiftCellsPerTick predicts', () => {
    const N = 5;
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
    const alpha = 0;
    const g = 0;
    const dt = 0.01;
    const nu = new Float64Array(N * N);
    const drive: DriveSpec = { spatialProfile: new Float64Array(N * N), omega: 0, phase: 0 };
    const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);

    for (const [M, shiftCellsPerTick] of [
      [10, 2],
      [15, 5],
    ] as const) {
      const roundTripTicks = M / shiftCellsPerTick;
      const stepper = createConservativeStepper(psiOperator, psiGeometry, { alpha, g, dt });
      const chiGeometry = createExchangeRingGeometry(M, psiGeometry.cellArea[boundaryCellIndex]);
      const chiOperator = createRingLaplacian(chiGeometry);
      const nuChi = new Float64Array(M);
      const lambda = 30;
      const couplingConfig = createExchangeCouplingConfig(psiGeometry, chiGeometry, lambda);

      let psi: ComplexField = { real: new Float64Array(N * N), imag: new Float64Array(N * N) };
      let chi: ComplexField = { real: new Float64Array(M), imag: new Float64Array(M) };
      chi.real[0] = 1;

      let firstPeakTick = -1;
      for (let tick = 0; tick < roundTripTicks + 1 && firstPeakTick === -1; tick++) {
        const before = psi.real[boundaryCellIndex] ** 2 + psi.imag[boundaryCellIndex] ** 2;
        const result = runClosedLoopTick(psi, stepper, psiGeometry, alpha, g, nu, drive, tick * dt, dt, chi, chiOperator, chiGeometry, 0, shiftCellsPerTick, nuChi, couplingConfig);
        psi = result.psi;
        chi = result.chi;
        const after = psi.real[boundaryCellIndex] ** 2 + psi.imag[boundaryCellIndex] ** 2;
        if (after > before + 1e-6) firstPeakTick = tick;
      }

      // 0-indexed loop: the peak lands at tick index (roundTripTicks - 1).
      expect(firstPeakTick).toBe(roundTripTicks - 1);
    }
  });
});
