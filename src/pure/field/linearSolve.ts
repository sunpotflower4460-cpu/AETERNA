/**
 * PUT-IN: a real dense square matrix A (row-major Float64Array)
 * EMERGED: an LU factorization of A (with partial pivoting), and a
 *   solve(b) function reusing that factorization
 * claim-tier: C2 (unit-validated - see src/tests/pure/linearSolve.test.ts)
 * floors (誠実な床): dense O(n^3) factorization / O(n^2) per solve. Not a
 *   sparse or iterative method - fine for the small-N test grids this
 *   PR targets (docs/pure-physics-implementation-plan.md's PR3 gate is
 *   correctness, not scaling to production grid sizes). Does not detect
 *   a genuinely singular matrix beyond a fixed pivot-magnitude floor.
 *
 * 数値解法の分類（docs/pure-physics-implementation-plan.md §6.2）:
 * これは `linearSolverKind: 'direct'` の実装である。行列は
 * シミュレーション全体で固定（alpha, dt, geometryが変わらない限り）
 * なので、LU分解を一度だけ行い、毎tickは前進代入・後退代入だけを
 * 行う設計にしている。
 */

export interface LuFactorization {
  readonly n: number;
  /** LU combined in one n*n matrix, row-major (L below diagonal implicit 1s, U on/above diagonal). */
  readonly lu: Float64Array;
  /** Row permutation from partial pivoting; pivot[i] is the original row now at position i. */
  readonly pivot: Int32Array;
}

const PIVOT_FLOOR = 1e-300;

/**
 * Factorizes `a` (row-major n*n) via Gaussian elimination with partial
 * pivoting. Throws if a pivot is smaller than PIVOT_FLOOR (numerically
 * singular), rather than silently producing garbage.
 */
export function luFactorize(a: Float64Array, n: number): LuFactorization {
  if (a.length !== n * n) {
    throw new Error(`luFactorize: matrix length ${a.length} does not match n*n (${n * n})`);
  }
  const lu = Float64Array.from(a);
  const pivot = new Int32Array(n);
  for (let i = 0; i < n; i++) pivot[i] = i;

  for (let k = 0; k < n; k++) {
    // Partial pivoting: find the largest-magnitude entry in column k, rows k..n-1.
    let maxRow = k;
    let maxAbs = Math.abs(lu[k * n + k]);
    for (let i = k + 1; i < n; i++) {
      const value = Math.abs(lu[i * n + k]);
      if (value > maxAbs) {
        maxAbs = value;
        maxRow = i;
      }
    }
    if (maxAbs < PIVOT_FLOOR) {
      throw new Error(`luFactorize: matrix is numerically singular at column ${k} (max pivot magnitude ${maxAbs})`);
    }
    if (maxRow !== k) {
      for (let col = 0; col < n; col++) {
        const tmp = lu[k * n + col];
        lu[k * n + col] = lu[maxRow * n + col];
        lu[maxRow * n + col] = tmp;
      }
      const tmpPivot = pivot[k];
      pivot[k] = pivot[maxRow];
      pivot[maxRow] = tmpPivot;
    }

    const pivotValue = lu[k * n + k];
    for (let i = k + 1; i < n; i++) {
      const factor = lu[i * n + k] / pivotValue;
      lu[i * n + k] = factor;
      for (let col = k + 1; col < n; col++) {
        lu[i * n + col] -= factor * lu[k * n + col];
      }
    }
  }

  return { n, lu, pivot };
}

/** Solves A*x = b using a precomputed factorization. Returns a new array; does not mutate b. */
export function luSolve(factorization: LuFactorization, b: Float64Array): Float64Array {
  const { n, lu, pivot } = factorization;
  if (b.length !== n) {
    throw new Error(`luSolve: rhs length ${b.length} does not match n (${n})`);
  }

  // Apply the same row permutation to b.
  const permuted = new Float64Array(n);
  for (let i = 0; i < n; i++) permuted[i] = b[pivot[i]];

  // Forward substitution: L*y = permuted (L has implicit unit diagonal).
  const y = permuted;
  for (let i = 0; i < n; i++) {
    let sum = y[i];
    for (let col = 0; col < i; col++) sum -= lu[i * n + col] * y[col];
    y[i] = sum;
  }

  // Back substitution: U*x = y.
  const x = y;
  for (let i = n - 1; i >= 0; i--) {
    let sum = x[i];
    for (let col = i + 1; col < n; col++) sum -= lu[i * n + col] * x[col];
    x[i] = sum / lu[i * n + i];
  }

  return x;
}
