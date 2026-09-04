/**
 * PUT-IN: PureCoreParams (N, seed), TorusGeometry
 * EMERGED: the field state container - psi (real/imag) seeded from the
 *   PRNG only, nu(x) initialized uniformly to nu0
 * claim-tier: C2 (unit-validated - same seed produces bit-identical
 *   state; see src/tests/pure/pureFieldState.test.ts)
 * floors (誠実な床): time evolution is not implemented here (PR3+).
 *   This module only constructs the initial state.
 *
 * psi(x,0) の初期振幅は物理的に意味のある値ではなく、微小摂動の
 * スケールとして PURE_FIELD_INITIAL_AMPLITUDE で明示的に名付ける
 * （docs/pure-physics-implementation-plan.md 原則: 「追加パラメータは
 * 物理・幾何・離散化・数値解法のどれかとして説明できるか」— これは
 * 実験条件（初期擾乱の大きさ）に分類される）。
 */

import type { PureCoreParams } from '../params.ts';
import type { TorusGeometry } from '../geometry/torus.ts';
import { createSeededRandom } from '../random/seededPrng.ts';

/** Scale of the seeded random initial perturbation to psi. Experimental condition, not a physical constant. */
export const PURE_FIELD_INITIAL_AMPLITUDE = 0.01;

export interface PureFieldState {
  readonly N: number;
  /** psi real part, row-major flattened, length N*N. */
  real: Float64Array;
  /** psi imaginary part, row-major flattened, length N*N. */
  imag: Float64Array;
  /** Medium history field nu(x), row-major flattened, length N*N. Uniformly nu0 at t=0. */
  nu: Float64Array;
  /** Tick counter. 0 at construction. */
  tick: number;
}

/**
 * Constructs the initial pure-core field state. The only randomness
 * anywhere in this function comes from createSeededRandom(params.seed) -
 * no Math.random, no Date.now (docs/pure-physics-implementation-plan.md
 * §9 forbidden list).
 */
export function createPureFieldState(params: PureCoreParams, geometry: TorusGeometry): PureFieldState {
  if (geometry.N !== params.N) {
    throw new Error(`createPureFieldState: geometry.N (${geometry.N}) does not match params.N (${params.N})`);
  }

  const size = params.N * params.N;
  const random = createSeededRandom(params.seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  const nu = new Float64Array(size);

  for (let i = 0; i < size; i++) {
    // random() in [0,1) -> centered in [-amplitude/2, amplitude/2)
    real[i] = (random() - 0.5) * PURE_FIELD_INITIAL_AMPLITUDE;
    imag[i] = (random() - 0.5) * PURE_FIELD_INITIAL_AMPLITUDE;
    nu[i] = params.nu0;
  }

  return { N: params.N, real, imag, nu, tick: 0 };
}
