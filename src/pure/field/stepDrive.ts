/**
 * PUT-IN: a complex field psi, an already-evaluated drive field J(x,t), dt
 * EMERGED: psi advanced by psi <- psi + J*dt
 * claim-tier: C2 (unit-validated arithmetic; the physically meaningful
 *   claims - driveWork sign, ledger closure with drive active - are C3,
 *   checked in src/tests/pure/driveWork.test.ts and
 *   negativeDriveWork.test.ts)
 * floors (誠実な床): does not itself measure driveWork_N/H - that needs
 *   N/H before and after this step, which is
 *   src/pure/ledger/energy.ts's runDriveTick's job.
 *
 * docs/pure-physics-implementation-plan.md PR5:「ψ ← ψ + J・dt を適用」。
 *
 * ## なぜここは陽解法(Euler)でよいのか
 *
 * `linearCayleyStep.ts` が前進オイラーを禁じる理由は、線形項
 * i*alpha*L*psi が psi 自身に比例するフィードバック項であり、
 * |1+i*lambda*dt| > 1 で無条件不安定になるからである（`docs/
 * pure-physics-implementation-plan.md` §3）。
 *
 * J(x,t) は psi に依存しない外部強制項である（`drive.ts` 参照 -
 * evaluateDrive は psi を受け取らない）。したがって psi += J*dt は
 * 「自分自身に比例するフィードバックを増幅する」操作ではなく、
 * 有限の外部項を有限のdtだけ足すだけの操作であり、不安定性の議論は
 * 適用されない。
 */

import type { ComplexField } from '../geometry/torus.ts';

export function applyDriveStep(psi: ComplexField, drive: ComplexField, dt: number): ComplexField {
  const size = psi.real.length;
  if (drive.real.length !== size) {
    throw new Error(`applyDriveStep: drive length (${drive.real.length}) does not match psi length (${size})`);
  }
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = psi.real[i] + drive.real[i] * dt;
    imag[i] = psi.imag[i] + drive.imag[i] * dt;
  }
  return { real, imag };
}
