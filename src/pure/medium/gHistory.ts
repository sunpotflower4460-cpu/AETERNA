/**
 * PUT-IN: psi (the field AFTER conservative+dissipation+drive+exchange+
 *   mediumHistory this tick, per solverStepOrder), the current g(x),
 *   {kappaG, rhoG, g0, g1}, dt
 * EMERGED: g(x) advanced by one tick of the SAME exact-ODE convex-
 *   combination relaxation src/pure/medium/history.ts already uses for
 *   nu(x), generalized to two bounds (g0, g1) instead of one bound and
 *   an implicit zero. psi itself is not returned here at all - this
 *   step has no way to touch it, mirroring history.ts's own non-contact
 *   guarantee.
 * claim-tier: C2 (unit-validated against the exact-ODE-solution
 *   identity and the structural-boundedness proof
 *   docs/vessel/K12-memory-channel-adr.md's Choice 1 spells out
 *   algebraically - see src/tests/pure/gHistory.test.ts)
 * floors (誠実な床): integrates the LOCAL ODE per cell only - rate and
 *   d(g)/dt are both pointwise in x, no coupling between neighboring
 *   cells. |psi(x)|^2 is held frozen at its tick-final value for the
 *   duration of dt (the exact solution of a *linear* ODE in g obtained
 *   by that freezing - not a self-consistent solve of g and psi
 *   together within the tick). Identical floor to history.ts's own.
 *
 * docs/vessel/K12-memory-channel-adr.md Choice 1:
 *
 *   rate  = kappaG*|psi(x)|^2 + rhoG
 *   g*(x) = (rhoG*g0 + kappaG*|psi(x)|^2*g1) / rate
 *
 * 厳密解（|psi|^2をtick内で凍結した線形ODE。gCurrent以外は全て定数）:
 *
 *   g(t+dt) = g*(x) + (g(t) - g*(x)) * exp(-rate*dt)
 *
 * ## なぜ clamp なしで g が常に [min(g0,g1), max(g0,g1)] に収まるか
 *
 * rate > 0 のとき decay = exp(-rate*dt) は (0,1] に入る (kappaG, rhoG,
 * |psi|^2, dt が全て >= 0 なので)。このとき
 *
 *   g(t+dt) = g*(x)・(1-decay) + g(t)・decay
 *
 * は g*(x) と g(t) の凸結合である（係数の和が1）。さらに g*(x) 自体が
 * g0 と g1 の凸結合（係数 rhoG/rate と kappaG*|psi|^2/rate は共に
 * [0,1] で和が1）。g(t) が帰納的に [min(g0,g1),max(g0,g1)] に
 * 収まっていれば g(t+dt) もこの区間に収まる。初期値 g(x,0)=g0 は
 * この区間に収まる（区間の端点そのもの）ので、以降すべてのtickで
 * clamp なしに構造的に有界であることが代数的に保証される
 * （history.ts の nu 非負性証明と同一の論法の一般化）。
 *
 * rate = 0 になる退化ケース（kappaG=0 かつ rhoG=0、または
 * kappaG*|psi|^2=0 かつ rhoG=0）は0/0を避けるため、history.ts と
 * 同様に g(t+dt)=g(t) を明示的に返す。
 */

import type { ComplexField } from '../geometry/torus.ts';

export interface GHistoryParams {
  /** Analogous to kappa in history.ts's medium plasticity - how strongly local flow pulls g toward g1. Must be >= 0. */
  kappaG: number;
  /** Analogous to rho - relaxation rate pulling g back toward g0 in the absence of flow. Must be >= 0. */
  rhoG: number;
  /** The bound g relaxes toward when |psi|^2 is 0 (no local flow). Also g's uniform initial value. */
  g0: number;
  /** The bound g relaxes toward as kappaG*|psi|^2 dominates rhoG (heavily-flowed cells). */
  g1: number;
}

export function applyGHistoryStep(
  psi: ComplexField,
  g: Float64Array,
  params: GHistoryParams,
  dt: number,
): Float64Array {
  const size = psi.real.length;
  if (g.length !== size) {
    throw new Error(`applyGHistoryStep: g length (${g.length}) does not match psi length (${size})`);
  }
  const { kappaG, rhoG, g0, g1 } = params;
  const gNext = new Float64Array(size);

  for (let i = 0; i < size; i++) {
    const amplitudeSquared = psi.real[i] * psi.real[i] + psi.imag[i] * psi.imag[i];
    const rate = kappaG * amplitudeSquared + rhoG;
    if (rate === 0) {
      gNext[i] = g[i];
      continue;
    }
    const gStar = (rhoG * g0 + kappaG * amplitudeSquared * g1) / rate;
    const decay = Math.exp(-rate * dt);
    gNext[i] = gStar + (g[i] - gStar) * decay;
  }

  return gNext;
}
