/**
 * PUT-IN: a complex field psi, g (nonlinear coupling), a half time step dtHalf
 * EMERGED: psi rotated in place by the exact solution of
 *   d(psi)/dt = -i*g*|psi|^2*psi
 * claim-tier: C3 (analytically validated - this is the *exact* solution
 *   of that ODE, not an approximation; see module doc below and
 *   src/tests/pure/nonlinearPhaseStep.test.ts)
 * floors (誠実な床): only valid for exactly this ODE (the nonlinear part
 *   of docs/pure-physics-implementation-plan.md's conservative block).
 *   Does not touch the linear (alpha*Laplacian) part at all.
 *
 * ## なぜ厳密解が使えるか
 *
 * d(psi)/dt = -i*g*|psi|^2*psi の下で |psi|^2 は保存される:
 *
 *   d(|psi|^2)/dt = 2*Re(conj(psi) * d(psi)/dt)
 *                 = 2*Re(conj(psi) * (-i*g*|psi|^2*psi))
 *                 = 2*Re(-i*g*|psi|^4)
 *                 = -2*g*|psi|^4 * Re(i)
 *                 = 0   (Re(i) = 0)
 *
 * したがって |psi(t)| = |psi(0)| は定数であり、この ODE は
 * 各セルで独立な純粋な位相回転になる:
 *
 *   psi(t) = psi(0) * exp(-i*g*|psi(0)|^2*t)
 *
 * これは近似ではなく厳密解であるため、Strang分割のこの部分に
 * 離散化誤差は入らない（線形部の Cayley/CN ステップにのみ
 * 数値誤差が生じる）。
 */

import type { ComplexField } from '../geometry/torus.ts';

/**
 * Applies the exact nonlinear phase rotation to `psi` in place, for a
 * duration `dtHalf` (named for its use as a Strang-split half-step, but
 * correct for any duration - the exact solution has no step-size
 * restriction).
 */
export function applyNonlinearPhaseStep(psi: ComplexField, g: number, dtHalf: number): void {
  const { real, imag } = psi;
  for (let i = 0; i < real.length; i++) {
    const a = real[i];
    const b = imag[i];
    const amplitudeSquared = a * a + b * b;
    const theta = g * amplitudeSquared * dtHalf;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    // psi * exp(-i*theta) = (a+bi)(cos(theta) - i*sin(theta))
    real[i] = a * cosTheta + b * sinTheta;
    imag[i] = b * cosTheta - a * sinTheta;
  }
}
