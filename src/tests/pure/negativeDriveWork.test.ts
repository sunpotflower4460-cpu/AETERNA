import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { evaluateDrive, type DriveSpec } from '../../pure/drive/drive.ts';
import { applyDriveStep } from '../../pure/field/stepDrive.ts';
import { runDriveTick } from '../../pure/ledger/energy.ts';

function uniformPhaseField(size: number, amplitude: number, phase: number): ComplexField {
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = amplitude * Math.cos(phase);
    imag[i] = amplitude * Math.sin(phase);
  }
  return { real, imag };
}

describe('pure core drive: anti-phase drive records negative driveWork (docs/pure-physics-implementation-plan.md PR5 merge gate)', () => {
  it('a drive exactly out of phase with psi (phase shifted by pi) strictly decreases |psi|^2 at every cell (isolated, no ledger)', () => {
    const size = 16;
    const phi0 = 0.7;
    const amplitude = 1;
    const psi = uniformPhaseField(size, amplitude, phi0);
    const profileValue = 0.05;
    // profileValue*dt must stay well under amplitude so |psi| shrinks
    // without crossing zero (which would make the "decrease" claim
    // ambiguous at the single-cell level, though N would still fall).
    const spec: DriveSpec = { spatialProfile: Float64Array.from({ length: size }, () => profileValue), omega: 0, phase: phi0 + Math.PI };
    const dt = 0.01;

    const driveField = evaluateDrive(spec, 0);
    const psiAfter = applyDriveStep(psi, driveField, dt);

    for (let i = 0; i < size; i++) {
      const before = psi.real[i] * psi.real[i] + psi.imag[i] * psi.imag[i];
      const after = psiAfter.real[i] * psiAfter.real[i] + psiAfter.imag[i] * psiAfter.imag[i];
      expect(after).toBeLessThan(before);
    }
  });

  it('driveWork_N < 0 through the full ledger (runDriveTick) when the drive opposes psi\'s phase, nu=0 to isolate the drive effect', () => {
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
    const spec: DriveSpec = { spatialProfile: Float64Array.from({ length: size }, () => 0.2), omega: 0, phase: phi0 + Math.PI };

    const { ledger } = runDriveTick(psi, stepper, geometry, alpha, g, nu, spec, 0, dt);

    expect(ledger.driveWorkN).toBeLessThan(0);
  });

  it('the sign of driveWork_N tracks cos(drivePhase - psiPhase) as the relative phase sweeps a full turn', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 5 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 0.5;
    const dt = 0.005;
    const nu = new Float64Array(size);
    const phi0 = 0.9;
    const psi = uniformPhaseField(size, 1, phi0);

    for (const relativePhase of [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4]) {
      const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
      const spec: DriveSpec = { spatialProfile: Float64Array.from({ length: size }, () => 0.1), omega: 0, phase: phi0 + relativePhase };
      const { ledger } = runDriveTick(psi, stepper, geometry, alpha, g, nu, spec, 0, dt);

      const cosRelativePhase = Math.cos(relativePhase);
      if (cosRelativePhase > 1e-6) {
        expect(ledger.driveWorkN).toBeGreaterThan(0);
      } else if (cosRelativePhase < -1e-6) {
        expect(ledger.driveWorkN).toBeLessThan(0);
      } else {
        // phase exactly perpendicular (pi/2, 3pi/2): to first order in dt
        // the norm change is second-order small (O(dt^2)), and the tiny
        // phase rotation the conservative step applies before the drive
        // step (g*|psi|^2*dt) can push it to either side of 0 - only
        // require it stays tiny.
        expect(Math.abs(ledger.driveWorkN)).toBeLessThan(1e-3);
      }
    }
  });
});
