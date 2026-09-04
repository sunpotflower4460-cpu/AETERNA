/**
 * PUT-IN: a per-cell spatial amplitude profile, an angular frequency
 *   omega, a phase offset, and the current time t
 * EMERGED: J(x,t), the sole external forcing term the pure core accepts
 * claim-tier: C1 (implemented; the physically meaningful claims about
 *   what J does to the field - driveWork sign, ledger closure - are
 *   checked where J is actually applied and measured:
 *   src/tests/pure/driveWork.test.ts and negativeDriveWork.test.ts)
 * floors (誠実な床): this function never reads psi. That is the literal
 *   content of "唯一の外部入力"（唯一の, sole/only, external input） -
 *   nothing about the field's own current state can feed back into what
 *   J is at a given t. Whether J happens to align or oppose psi's phase
 *   at some t is a choice the CALLER makes (by picking omega/phase
 *   relative to a psi it already knows about), not something evaluateDrive
 *   can see or react to.
 *
 * docs/pure-physics-implementation-plan.md PR5:
 *   「J(x,t) を返す純関数を実装」
 *
 *   J(x,t) = spatialProfile(x) * exp(i*(omega*t + phase))
 */

import type { ComplexField } from '../geometry/torus.ts';

export interface DriveSpec {
  /** Per-cell real amplitude profile. Same length as the field being driven. Not psi-dependent. */
  spatialProfile: Float64Array;
  /** Angular frequency of the drive's oscillation. */
  omega: number;
  /** Phase offset. */
  phase: number;
}

export function evaluateDrive(spec: DriveSpec, t: number): ComplexField {
  const size = spec.spatialProfile.length;
  const theta = spec.omega * t + spec.phase;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = spec.spatialProfile[i] * cosTheta;
    imag[i] = spec.spatialProfile[i] * sinTheta;
  }
  return { real, imag };
}
