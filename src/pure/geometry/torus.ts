/**
 * PUT-IN: R, r (torus radii), N (grid divisions)
 * EMERGED: cell area weights dA, the dA-weighted complex inner product
 * claim-tier: C3 (analytically validated - totalArea matches the exact
 *   torus surface area 4*pi^2*R*r; see src/tests/pure/torusGeometry.test.ts)
 * floors (誠実な床): orthogonal-coordinate metric only (standard torus
 *   embedding). No curvature-dependent metric perturbations.
 *
 * トーラス上の (theta, phi) in [0,2*pi)^2 パラメータ化。標準埋め込み:
 *   x = (R + r*cos(theta))*cos(phi)
 *   y = (R + r*cos(theta))*sin(phi)
 *   z = r*sin(theta)
 *
 * 計量: ds^2 = r^2 dtheta^2 + (R + r*cos(theta))^2 dphi^2 （直交座標）
 * 面積要素: dA = r*(R + r*cos(theta)) dtheta dphi
 *
 * セル中心を theta_i = (i+0.5)*dTheta, phi_j = (j+0.5)*dPhi に取る
 * （midpoint rule）。N点の等間隔な cos(theta_i) の和は任意の N>=2 に
 * 対して厳密に0になる（N次のべき根の実部の和がゼロになる離散直交性）
 * ため、離散全面積は連続極限の 4*pi^2*R*r に厳密に一致する。
 */

export interface TorusGeometryConfig {
  R: number;
  r: number;
  N: number;
}

export interface TorusGeometry {
  readonly R: number;
  readonly r: number;
  readonly N: number;
  readonly dTheta: number;
  readonly dPhi: number;
  /** Cell-centered theta for each row index i, length N. */
  readonly theta: Float64Array;
  /** Cell area weight, flattened row-major: cellArea[i*N+j], length N*N. Always > 0. */
  readonly cellArea: Float64Array;
  /** Sum of cellArea; equals 4*pi^2*R*r exactly (see module doc). */
  readonly totalArea: number;
}

export function createTorusGeometry(config: TorusGeometryConfig): TorusGeometry {
  const { R, r, N } = config;
  if (!(Number.isFinite(R) && R > 0)) {
    throw new Error(`createTorusGeometry: R must be a finite positive number, got ${R}`);
  }
  if (!(Number.isFinite(r) && r > 0)) {
    throw new Error(`createTorusGeometry: r must be a finite positive number, got ${r}`);
  }
  if (r >= R) {
    throw new Error(`createTorusGeometry: r (${r}) must be less than R (${R})`);
  }
  if (!Number.isInteger(N) || N < 2) {
    throw new Error(`createTorusGeometry: N must be an integer >= 2, got ${N}`);
  }

  const dTheta = (2 * Math.PI) / N;
  const dPhi = (2 * Math.PI) / N;
  const theta = new Float64Array(N);
  const cellArea = new Float64Array(N * N);
  let totalArea = 0;

  for (let i = 0; i < N; i++) {
    const thetaI = (i + 0.5) * dTheta;
    theta[i] = thetaI;
    const area = r * (R + r * Math.cos(thetaI)) * dTheta * dPhi;
    for (let j = 0; j < N; j++) {
      cellArea[i * N + j] = area;
    }
    totalArea += area * N;
  }

  return { R, r, N, dTheta, dPhi, theta, cellArea, totalArea };
}

export interface ComplexField {
  real: Float64Array;
  imag: Float64Array;
}

export interface ComplexInnerProduct {
  real: number;
  imag: number;
}

/**
 * dA重み付き内積: <a, b>_dA = sum_i conj(a_i) * b_i * dA_i
 * 複素場なので共役を含む: conj(a) = a.real - i*a.imag
 */
export function weightedInnerProduct(a: ComplexField, b: ComplexField, geometry: TorusGeometry): ComplexInnerProduct {
  const { cellArea } = geometry;
  let real = 0;
  let imag = 0;
  for (let i = 0; i < cellArea.length; i++) {
    const w = cellArea[i];
    // conj(a_i) * b_i = (a.real - i*a.imag)(b.real + i*b.imag)
    real += (a.real[i] * b.real[i] + a.imag[i] * b.imag[i]) * w;
    imag += (a.real[i] * b.imag[i] - a.imag[i] * b.real[i]) * w;
  }
  return { real, imag };
}

/** dA重み付きノルムの二乗: <a,a>_dA の実部（虚部は定義上0）。 */
export function weightedNormSquared(a: ComplexField, geometry: TorusGeometry): number {
  const { cellArea } = geometry;
  let sum = 0;
  for (let i = 0; i < cellArea.length; i++) {
    sum += (a.real[i] * a.real[i] + a.imag[i] * a.imag[i]) * cellArea[i];
  }
  return sum;
}
