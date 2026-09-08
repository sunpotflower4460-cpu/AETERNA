/**
 * PUT-IN: psi (the field AFTER conservative+dissipation+drive this tick,
 *   per the fixed solverStepOrder), the current nu(x), {kappa, rho, nu0}, dt
 * EMERGED: nu(x) advanced by one tick of medium-history relaxation. psi
 *   itself is not returned here at all - this step has no way to touch it
 *   (see mediumNonContact.test.ts)
 * claim-tier: C3 (see this file's tests: mediumHistory.test.ts for the
 *   exact-ODE-solution check and the "responds to local |psi|^2, not an
 *   observer value" check; noNuClamp.test.ts for the non-negativity proof
 *   made concrete, including the kappa=rho=0 degenerate case;
 *   nonUniformDissipationHamiltonianSign.test.ts for the downstream
 *   consequence this creates for dissipationLoss_H)
 * floors (誠実な床): integrates the LOCAL ODE per cell only - Phi(x) and
 *   d(nu)/dt are both pointwise in x, no coupling between neighboring
 *   cells in this equation. |psi(x)|^2 is held frozen at its tick-final
 *   value for the duration of dt (the exact solution of a *linear* ODE in
 *   nu obtained by that freezing - not a self-consistent solve of nu and
 *   psi together within the tick).
 *
 * docs/pure-physics-implementation-plan.md PR6 基本式:
 *
 *   Phi(x) = nu(x)*|psi(x)|^2
 *   d(nu)/dt = -kappa*Phi + rho*(nu0 - nu)
 *
 * 厳密解（|psi|^2をtick内で凍結した線形ODE。nu以外は全て定数）:
 *
 *   nu(t+dt) = nu* + (nu(t) - nu*) * exp(-(kappa*|psi|^2 + rho)*dt)
 *   nu*      = rho*nu0 / (kappa*|psi|^2 + rho)
 *
 * ## なぜ max(nu,0) なしで nu>=0 が保証されるか
 *
 * rate = kappa*|psi|^2 + rho > 0 のとき、decay = exp(-rate*dt) は
 * kappa,rho,|psi|^2,dt >= 0 なので (0,1] に入る。このとき
 *
 *   nu(t+dt) = nu*・(1-decay) + nu(t)・decay
 *
 * は nu* と nu(t) の凸結合である（係数 decay と (1-decay) がともに
 * [0,1] で和が1）。nu(t)>=0（前ステップまでに保証済み・初期値も
 * nu0>=0）、nu* = rho*nu0/rate >= 0（分子分母とも非負）なので、
 * 凸結合である nu(t+dt) も代数的に非負になる。max(nu,0) は不要であり、
 * pure core 内には存在しない（noNuClamp.test.ts でソーススキャンにより
 * 直接確認する）。
 *
 * rate = 0 になる退化ケース（kappa=0 かつ rho=0、または
 * kappa*|psi|^2=0 かつ rho=0）はゼロ除算になる。この場合
 * d(nu)/dt = -kappa*nu*|psi|^2 + rho*(nu0-nu) は両項とも0なので、
 * nuは変化しない。ここでは明示的に nu(t+dt)=nu(t) を返し、0/0を避ける。
 */

import type { ComplexField } from '../geometry/torus.ts';

export interface MediumHistoryParams {
  /** Medium plasticity rate (kappa in d(nu)/dt = -kappa*Phi + rho*(nu0-nu)). Must be >= 0. */
  kappa: number;
  /** Medium relaxation rate (rho in the same equation). Must be >= 0. */
  rho: number;
  /** Baseline dissipation rate nu relaxes toward in the absence of field energy. Must be >= 0. */
  nu0: number;
}

export function applyMediumHistoryStep(
  psi: ComplexField,
  nu: Float64Array,
  params: MediumHistoryParams,
  dt: number,
): Float64Array {
  const size = psi.real.length;
  if (nu.length !== size) {
    throw new Error(`applyMediumHistoryStep: nu length (${nu.length}) does not match psi length (${size})`);
  }
  const { kappa, rho, nu0 } = params;
  const nuNext = new Float64Array(size);

  for (let i = 0; i < size; i++) {
    const amplitudeSquared = psi.real[i] * psi.real[i] + psi.imag[i] * psi.imag[i];
    const rate = kappa * amplitudeSquared + rho;
    if (rate === 0) {
      nuNext[i] = nu[i];
      continue;
    }
    const nuStar = (rho * nu0) / rate;
    const decay = Math.exp(-rate * dt);
    nuNext[i] = nuStar + (nu[i] - nuStar) * decay;
  }

  return nuNext;
}
