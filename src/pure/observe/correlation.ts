/**
 * PUT-IN: the medium history field nu(x), the complex field psi, the
 *   TorusGeometry
 * EMERGED: a single scalar - the dA-weighted Pearson correlation
 *   coefficient between nu(x) and |psi(x)|^2, in [-1,1]
 * claim-tier: C2 (unit-validated against hand-constructed nu/psi pairs
 *   with known correlation: identical patterns give +1, exactly inverted
 *   patterns give -1, an amplitude-uniform psi against any nu gives a
 *   value within floating-point noise of 0 via the degenerate-variance
 *   rule below)
 * floors (誠実な床): this is a same-tick, purely spatial correlation - it
 *   says nothing by itself about whether nu(x)'s CURRENT shape reflects
 *   psi's PAST shape (the actual "history dependence" claim) versus
 *   simply tracking psi's present shape. Distinguishing those requires
 *   the caller to compare this value against psi from earlier ticks
 *   (a run.ts / K6 concern, not this file's). The exact-zero-variance
 *   guard below only fires on a bit-exact-zero variance sum - it is not
 *   an epsilon threshold, so a constant field can still leave a
 *   floating-point-scale (~1e-16) nonzero result rather than a literal
 *   0 (see src/tests/pure/observerMeasurements.test.ts, which asserts
 *   "close to 0", not "exactly 0", for that case). This module never
 *   reads N, H, or any ledger value beyond nu and psi themselves, and
 *   has no reachable path into src/pure/field, src/pure/ledger,
 *   src/pure/drive, or src/pure/medium.
 *
 * ## 定義（dA重み付きピアソン相関係数）
 *
 *   mean(x) = sum_k dA_k*x_k / totalArea
 *   corr(nu, |psi|^2) =
 *     sum_k dA_k*(nu_k-mean(nu))*(amp2_k-mean(amp2))
 *     / sqrt( sum_k dA_k*(nu_k-mean(nu))^2 * sum_k dA_k*(amp2_k-mean(amp2))^2 )
 *
 * 分散のどちらかが厳密に0（例えばnuが完全に一様、あるいはpsiの振幅が
 * 完全に一様）の場合、相関は定義できない。この場合は明示的に0を返す
 * （NaNを伝播させず、「一様な場からは信号が読み取れない」という
 * 誠実な既定値として扱う）。
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { TorusGeometry } from '../geometry/torus.ts';

export function computeNuFieldEnergyCorrelation(nu: Float64Array, psi: ComplexField, geometry: TorusGeometry): number {
  const { cellArea, totalArea } = geometry;
  const size = psi.real.length;
  if (nu.length !== size) {
    throw new Error(`computeNuFieldEnergyCorrelation: nu length (${nu.length}) does not match psi length (${size})`);
  }

  const amplitudeSquared = new Float64Array(size);
  for (let k = 0; k < size; k++) {
    amplitudeSquared[k] = psi.real[k] * psi.real[k] + psi.imag[k] * psi.imag[k];
  }

  let nuMean = 0;
  let ampMean = 0;
  for (let k = 0; k < size; k++) {
    nuMean += cellArea[k] * nu[k];
    ampMean += cellArea[k] * amplitudeSquared[k];
  }
  nuMean /= totalArea;
  ampMean /= totalArea;

  let covariance = 0;
  let nuVariance = 0;
  let ampVariance = 0;
  for (let k = 0; k < size; k++) {
    const nuDelta = nu[k] - nuMean;
    const ampDelta = amplitudeSquared[k] - ampMean;
    covariance += cellArea[k] * nuDelta * ampDelta;
    nuVariance += cellArea[k] * nuDelta * nuDelta;
    ampVariance += cellArea[k] * ampDelta * ampDelta;
  }

  if (nuVariance === 0 || ampVariance === 0) {
    return 0;
  }

  return covariance / Math.sqrt(nuVariance * ampVariance);
}
