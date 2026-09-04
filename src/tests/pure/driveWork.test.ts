import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createTorusGeometry, weightedNormSquared, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { evaluateDrive, type DriveSpec } from '../../pure/drive/drive.ts';
import { applyDriveStep } from '../../pure/field/stepDrive.ts';
import { runDriveTick, runDissipationTick } from '../../pure/ledger/energy.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

const DRIVE_SOURCE = readFileSync(resolve(__dirname, '../../pure/drive/drive.ts'), 'utf8');

/** Same mention-vs-use distinction as pureCoreForbiddenPatterns.test.ts: strip comments before scanning code. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function uniformPhaseField(size: number, amplitude: number, phase: number): ComplexField {
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = amplitude * Math.cos(phase);
    imag[i] = amplitude * Math.sin(phase);
  }
  return { real, imag };
}

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

describe('pure core drive: J(x,t) is a pure function of (x,t), never of psi (docs/pure-physics-implementation-plan.md PR5 gate)', () => {
  it('evaluateDrive source never references psi as code (only in doc-comment prose explaining that it does not) - the sole external input channel does not read the field', () => {
    expect(stripComments(DRIVE_SOURCE)).not.toMatch(/\bpsi\b/i);
  });

  it('matches the analytic form J(x,t) = spatialProfile(x) * exp(i*(omega*t+phase))', () => {
    const spatialProfile = Float64Array.from([0.1, 0.2, 0.3, 0.4]);
    const spec: DriveSpec = { spatialProfile, omega: 2.5, phase: 0.4 };
    const t = 1.3;

    const field = evaluateDrive(spec, t);

    const theta = spec.omega * t + spec.phase;
    for (let i = 0; i < spatialProfile.length; i++) {
      expect(field.real[i]).toBeCloseTo(spatialProfile[i] * Math.cos(theta), 12);
      expect(field.imag[i]).toBeCloseTo(spatialProfile[i] * Math.sin(theta), 12);
    }
  });
});

describe('pure core drive step: psi <- psi + J*dt (docs/pure-physics-implementation-plan.md PR5 gate)', () => {
  it('matches the exact arithmetic', () => {
    const psi: ComplexField = { real: Float64Array.from([1, 2]), imag: Float64Array.from([-1, 0.5]) };
    const drive: ComplexField = { real: Float64Array.from([0.1, -0.2]), imag: Float64Array.from([0.3, 0.4]) };
    const dt = 0.05;

    const result = applyDriveStep(psi, drive, dt);

    expect(result.real[0]).toBeCloseTo(1 + 0.1 * dt, 12);
    expect(result.real[1]).toBeCloseTo(2 - 0.2 * dt, 12);
    expect(result.imag[0]).toBeCloseTo(-1 + 0.3 * dt, 12);
    expect(result.imag[1]).toBeCloseTo(0.5 + 0.4 * dt, 12);
  });

  it('does not mutate the input field', () => {
    const psi: ComplexField = { real: Float64Array.from([1, 2]), imag: Float64Array.from([-1, 0.5]) };
    const original = { real: Float64Array.from(psi.real), imag: Float64Array.from(psi.imag) };
    const drive: ComplexField = { real: Float64Array.from([0.1, -0.2]), imag: Float64Array.from([0.3, 0.4]) };

    applyDriveStep(psi, drive, 0.05);

    expect(psi.real).toEqual(original.real);
    expect(psi.imag).toEqual(original.imag);
  });

  it('throws if drive length does not match psi length', () => {
    const psi: ComplexField = { real: Float64Array.from([1, 2]), imag: Float64Array.from([1, 2]) };
    const drive: ComplexField = { real: Float64Array.from([1]), imag: Float64Array.from([1]) };
    expect(() => applyDriveStep(psi, drive, 0.01)).toThrow();
  });
});

describe('pure core drive: positive-phase drive records positive driveWork (docs/pure-physics-implementation-plan.md PR5 merge gate)', () => {
  it('a drive in phase with psi strictly increases |psi|^2 at every cell (isolated, no ledger)', () => {
    const size = 16;
    const phi0 = 0.7;
    const amplitude = 1;
    const psi = uniformPhaseField(size, amplitude, phi0);
    const profileValue = 0.3;
    const spec: DriveSpec = { spatialProfile: Float64Array.from({ length: size }, () => profileValue), omega: 0, phase: phi0 };
    const dt = 0.01;

    const driveField = evaluateDrive(spec, 0);
    const psiAfter = applyDriveStep(psi, driveField, dt);

    for (let i = 0; i < size; i++) {
      const before = psi.real[i] * psi.real[i] + psi.imag[i] * psi.imag[i];
      const after = psiAfter.real[i] * psiAfter.real[i] + psiAfter.imag[i] * psiAfter.imag[i];
      expect(after).toBeGreaterThan(before);
    }
  });

  it('driveWork_N > 0 through the full ledger (runDriveTick) when the drive is in phase with psi, nu=0 to isolate the drive effect', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 5 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 0.5;
    const dt = 0.005;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = new Float64Array(size);

    const phi0 = -0.3;
    const psi = uniformPhaseField(size, 1, phi0);
    const spec: DriveSpec = { spatialProfile: Float64Array.from({ length: size }, () => 0.2), omega: 0, phase: phi0 };

    const { ledger } = runDriveTick(psi, stepper, geometry, alpha, g, nu, spec, 0, dt);

    expect(ledger.driveWorkN).toBeGreaterThan(0);
  });
});

describe('pure core drive: zero-amplitude drive is a no-op, reproducing PR4 exactly (drive以外の経路でψが変更されない, docs/pure-physics-implementation-plan.md PR5 gate)', () => {
  it('runDriveTick with an all-zero spatialProfile matches runDissipationTick bit-for-bit on psi and the shared ledger fields', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1.1;
    const g = 1.3;
    const dt = 0.01;
    const nu = Float64Array.from({ length: size }, () => 0.3);
    const psi = randomComplexField(size, 7);

    const stepperA = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const stepperB = createConservativeStepper(operator, geometry, { alpha, g, dt });

    const zeroSpec: DriveSpec = { spatialProfile: new Float64Array(size), omega: 1, phase: 0.5 };
    const { psi: psiFromDrive, ledger: driveLedger } = runDriveTick(psi, stepperA, geometry, alpha, g, nu, zeroSpec, 3.7, dt);
    const { psi: psiFromDissipation, ledger: dissipationLedger } = runDissipationTick(psi, stepperB, geometry, alpha, g, nu, dt);

    expect(psiFromDrive.real).toEqual(psiFromDissipation.real);
    expect(psiFromDrive.imag).toEqual(psiFromDissipation.imag);
    expect(driveLedger.driveWorkN).toBe(0);
    expect(driveLedger.driveWorkH).toBe(0);
    expect(driveLedger.nAfterDrive).toBe(dissipationLedger.nAfterDissipation);
    expect(driveLedger.hAfterDrive).toBe(dissipationLedger.hAfterDissipation);
    expect(driveLedger.dissipationLossN).toBe(dissipationLedger.dissipationLossN);
    expect(driveLedger.residualN).toBe(dissipationLedger.residualN);
    expect(driveLedger.residualH).toBe(dissipationLedger.residualH);
  });
});

describe('pure core drive: the ledger closes with drive active (駆動ありでも帳簿が閉じる, docs/pure-physics-implementation-plan.md PR5 merge gate)', () => {
  it('N(t+1) = N(t) + driveWork_N - dissipationLoss_N + residual_N holds every tick', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 1.2;
    const dt = 0.01;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = Float64Array.from({ length: size }, () => 0.2);
    const spec: DriveSpec = { spatialProfile: Float64Array.from({ length: size }, () => 0.05), omega: 3, phase: 0.2 };

    let psi = randomComplexField(size, 9, 0.2);
    for (let tick = 0; tick < 40; tick++) {
      const t = tick * dt;
      const { psi: nextPsi, ledger } = runDriveTick(psi, stepper, geometry, alpha, g, nu, spec, t, dt);
      const predictedNAfter = ledger.nBefore + ledger.driveWorkN - ledger.dissipationLossN + ledger.residualN;
      expect(ledger.nAfterDrive).toBeCloseTo(predictedNAfter, 10);
      psi = nextPsi;
    }
  });

  it('H(t+1) = H(t) + driveWork_H - dissipationLoss_H + numericalDrift_H + residual_H holds every tick', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 0.9;
    const g = 1.6;
    const dt = 0.008;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = Float64Array.from({ length: size }, () => 0.25);
    const spec: DriveSpec = { spatialProfile: Float64Array.from({ length: size }, () => 0.04), omega: 5, phase: -0.6 };

    let psi = randomComplexField(size, 15, 0.2);
    for (let tick = 0; tick < 40; tick++) {
      const t = tick * dt;
      const { psi: nextPsi, ledger } = runDriveTick(psi, stepper, geometry, alpha, g, nu, spec, t, dt);
      const predictedHAfter = ledger.hBefore + ledger.driveWorkH - ledger.dissipationLossH + ledger.numericalDriftH + ledger.residualH;
      expect(ledger.hAfterDrive).toBeCloseTo(predictedHAfter, 8);
      psi = nextPsi;
    }
  });
});
