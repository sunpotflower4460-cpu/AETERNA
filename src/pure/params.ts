/**
 * PUT-IN: nothing (this module only defines and validates parameter shapes)
 * EMERGED: nothing (no field computation here)
 * claim-tier: C1 (implemented; validated indirectly by every module that
 *   consumes PureCoreParams and PureCoreSolverSettings)
 * floors (誠実な床): parameter ranges are sanity checks (positivity, finiteness),
 *   not physical validity checks - a physically nonsensical but positive
 *   value (e.g. R=1e300) will pass validatePureCoreParams.
 *
 * docs/pure-physics-implementation-plan.md §6 の分類に従う。
 *
 * 6.1 基本パラメータ（9個。物理・幾何・離散化・実験のいずれかとして
 * 説明できることを採用基準とする）:
 *   R, r    : トーラス主半径・副半径（幾何）
 *   N       : 格子分割数（離散化）
 *   dt      : 時間刻み（離散化）
 *   alpha   : 分散係数（物理）
 *   g       : 非線形結合（物理）
 *   nu0     : 基準散逸率（物理）
 *   kappa   : 媒質可塑率（物理）
 *   rho     : 媒質緩和率（物理）
 *   seed    : 初期条件の乱数シード（実験）
 *
 * 6.2 数値解法設定（物理定数ではないが、runtime結果に影響するため
 * seed・dt・Nと同じくexportに含める）:
 *   linearSolverTolerance / linearSolverMaxIterations / linearSolverKind
 *   solverStepOrder（tick内ステップ順序。実験条件の一部）
 *
 * 6.3 テスト用tolerance（testTolerance等）はここに含めない。物理でも
 * runtimeでもなく、検証ハーネス側の設定である。
 */

export interface PureCoreParams {
  /** Torus major radius. Geometry. Must be > 0. */
  R: number;
  /** Torus minor radius. Geometry. Must be > 0 and < R (non-self-intersecting torus). */
  r: number;
  /** Grid divisions per angular direction (N x N grid on the torus). Discretization. */
  N: number;
  /** Time step. Discretization. Must be > 0. */
  dt: number;
  /** Dispersion coefficient (linear kinetic term strength, the alpha in i*alpha*Laplacian). Physical. */
  alpha: number;
  /** Nonlinear coupling strength (the g in -i*g*|psi|^2*psi). Physical. */
  g: number;
  /** Baseline dissipation rate (nu when the medium history field nu(x) is uniform). Physical. Must be >= 0. */
  nu0: number;
  /** Medium plasticity rate (kappa in d(nu)/dt = -kappa*nu*|psi|^2 + rho*(nu0-nu)). Physical. Must be >= 0. */
  kappa: number;
  /** Medium relaxation rate (rho in the same equation). Physical. Must be >= 0. */
  rho: number;
  /** Deterministic seed for initial-condition generation. Experimental. */
  seed: number;
}

export type LinearSolverKind = 'direct' | 'iterative' | 'spectral';

/** tick内ステップ順序。docs/pure-physics-implementation-plan.md §2 で固定された順序。 */
export const PURE_CORE_SOLVER_STEP_ORDER = [
  'conservative',
  'dissipation',
  'drive',
  'mediumHistory',
  'observe',
] as const;

export type PureCoreSolverStep = (typeof PURE_CORE_SOLVER_STEP_ORDER)[number];

export interface PureCoreSolverSettings {
  /** Convergence tolerance for the Cayley/CN linear solver (curved-metric path only, not needed until PR3). */
  linearSolverTolerance: number;
  /** Maximum iterations for the same. */
  linearSolverMaxIterations: number;
  /** Which linear solve strategy is used for the conservative step. */
  linearSolverKind: LinearSolverKind;
  /** Fixed tick-internal step order. Part of the experimental conditions, not a tunable. */
  solverStepOrder: typeof PURE_CORE_SOLVER_STEP_ORDER;
}

export function defaultPureCoreSolverSettings(): PureCoreSolverSettings {
  return {
    linearSolverTolerance: 1e-10,
    linearSolverMaxIterations: 200,
    linearSolverKind: 'direct',
    solverStepOrder: PURE_CORE_SOLVER_STEP_ORDER,
  };
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Validates a PureCoreParams object. Throws with a specific message
 * naming the offending field rather than returning a boolean, so a
 * misconfigured experiment fails loudly at construction time instead
 * of producing silently-wrong physics.
 */
export function validatePureCoreParams(params: PureCoreParams): void {
  if (!isFinitePositive(params.R)) {
    throw new Error(`PureCoreParams.R must be a finite positive number, got ${params.R}`);
  }
  if (!isFinitePositive(params.r)) {
    throw new Error(`PureCoreParams.r must be a finite positive number, got ${params.r}`);
  }
  if (params.r >= params.R) {
    throw new Error(`PureCoreParams.r (${params.r}) must be less than R (${params.R}) for a non-self-intersecting torus`);
  }
  if (!Number.isInteger(params.N) || params.N < 2) {
    throw new Error(`PureCoreParams.N must be an integer >= 2, got ${params.N}`);
  }
  if (!isFinitePositive(params.dt)) {
    throw new Error(`PureCoreParams.dt must be a finite positive number, got ${params.dt}`);
  }
  if (!Number.isFinite(params.alpha)) {
    throw new Error(`PureCoreParams.alpha must be finite, got ${params.alpha}`);
  }
  if (!Number.isFinite(params.g)) {
    throw new Error(`PureCoreParams.g must be finite, got ${params.g}`);
  }
  if (!isFiniteNonNegative(params.nu0)) {
    throw new Error(`PureCoreParams.nu0 must be a finite non-negative number, got ${params.nu0}`);
  }
  if (!isFiniteNonNegative(params.kappa)) {
    throw new Error(`PureCoreParams.kappa must be a finite non-negative number, got ${params.kappa}`);
  }
  if (!isFiniteNonNegative(params.rho)) {
    throw new Error(`PureCoreParams.rho must be a finite non-negative number, got ${params.rho}`);
  }
  if (!Number.isFinite(params.seed)) {
    throw new Error(`PureCoreParams.seed must be finite, got ${params.seed}`);
  }
}
