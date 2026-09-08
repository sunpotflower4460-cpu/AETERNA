import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { applyMediumHistoryStep } from '../../pure/medium/history.ts';
import { runDriveTick, runMediumHistoryTick } from '../../pure/ledger/energy.ts';
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

describe('pure core medium history: non-contact with psi/N/H (docs/pure-physics-implementation-plan.md PR6 merge gate: 「媒質履歴ステップ前後でψは変わらない」「…N/Hは変わらない」)', () => {
  it('applyMediumHistoryStep has no way to return a modified psi - it only returns a nu array', () => {
    const psi: ComplexField = { real: Float64Array.from([1, 2]), imag: Float64Array.from([0.5, -0.5]) };
    const nu = Float64Array.from([0.3, 0.3]);
    const originalPsi = { real: Float64Array.from(psi.real), imag: Float64Array.from(psi.imag) };

    const nuNext = applyMediumHistoryStep(psi, nu, { kappa: 2, rho: 0.5, nu0: 0.4 }, 0.1);

    // The input psi itself is untouched...
    expect(psi.real).toEqual(originalPsi.real);
    expect(psi.imag).toEqual(originalPsi.imag);
    // ...and the return value is a Float64Array (nu), not a ComplexField.
    expect(nuNext).toBeInstanceOf(Float64Array);
    expect(nuNext.length).toBe(2);
  });

  it('runMediumHistoryTick returns exactly the psi and ledger that runDriveTick alone would produce (medium history adds no field-affecting path)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 1.2;
    const dt = 0.01;
    const nu = Float64Array.from({ length: size }, () => 0.35);
    const spec: DriveSpec = { spatialProfile: Float64Array.from({ length: size }, () => 0.05), omega: 2, phase: 0.3 };
    const psi = randomComplexField(size, 5, 0.2);
    const t = 1.7;

    const stepperA = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const stepperB = createConservativeStepper(operator, geometry, { alpha, g, dt });

    const { psi: psiFromDrive, ledger: driveLedger } = runDriveTick(psi, stepperA, geometry, alpha, g, nu, spec, t, dt);
    const { psi: psiFromMedium, ledger: mediumLedger, nu: nuNext } = runMediumHistoryTick(
      psi,
      stepperB,
      geometry,
      alpha,
      g,
      nu,
      spec,
      t,
      dt,
      { kappa: 3, rho: 0.6, nu0: 0.2 },
    );

    expect(psiFromMedium.real).toEqual(psiFromDrive.real);
    expect(psiFromMedium.imag).toEqual(psiFromDrive.imag);
    expect(mediumLedger).toEqual(driveLedger);
    // nu was in fact allowed to change (medium history is not a no-op overall - only psi/N/H are untouched)
    expect(nuNext.length).toBe(size);
  });

  it('a strong medium-history response (large kappa) still leaves N/H exactly as runDriveTick measured them', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 5 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 0.8;
    const dt = 0.02;
    const nu = Float64Array.from({ length: size }, () => 0.5);
    const spec: DriveSpec = { spatialProfile: new Float64Array(size), omega: 0, phase: 0 };
    const psi = randomComplexField(size, 31, 0.4);
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });

    const { ledger: driveLedger } = runDriveTick(psi, stepper, geometry, alpha, g, nu, spec, 0, dt);
    const stepper2 = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const { ledger: mediumLedger } = runMediumHistoryTick(psi, stepper2, geometry, alpha, g, nu, spec, 0, dt, {
      kappa: 1000,
      rho: 1000,
      nu0: 0.9,
    });

    expect(mediumLedger.nAfterDrive).toBe(driveLedger.nAfterDrive);
    expect(mediumLedger.hAfterDrive).toBe(driveLedger.hAfterDrive);
  });
});
