export const PURE_SOLVER_STEP_ORDER = [
  'conservative',
  'dissipation',
  'drive',
  'mediumHistory',
  'observe',
] as const;

export type PureSolverStep = typeof PURE_SOLVER_STEP_ORDER[number];
export type PureLinearSolverKind = 'conjugateGradient';

export interface PurePhysicsParams {
  R: number;
  r: number;
  gridSize: number;
  dt: number;
  alpha: number;
  g: number;
  nu0: number;
  kappa: number;
  rho: number;
  seed: number;
}

export interface PureSolverSettings {
  linearSolverKind: PureLinearSolverKind;
  linearSolverTolerance: number;
  linearSolverMaxIterations: number;
  solverStepOrder: readonly PureSolverStep[];
}

export const MIN_PURE_GRID_SIZE = 4;

export const DEFAULT_PURE_PHYSICS_PARAMS: PurePhysicsParams = {
  R: 2,
  r: 0.7,
  gridSize: 48,
  dt: 0.01,
  alpha: 1,
  g: 1,
  nu0: 0.02,
  kappa: 0.01,
  rho: 0.01,
  seed: 1000,
};

export const DEFAULT_PURE_SOLVER_SETTINGS: PureSolverSettings = {
  linearSolverKind: 'conjugateGradient',
  linearSolverTolerance: 1e-10,
  linearSolverMaxIterations: 1000,
  solverStepOrder: PURE_SOLVER_STEP_ORDER,
};

export function createPurePhysicsParams(overrides: Partial<PurePhysicsParams> = {}): PurePhysicsParams {
  return validatePurePhysicsParams({
    ...DEFAULT_PURE_PHYSICS_PARAMS,
    ...overrides,
  });
}

export function createPureSolverSettings(overrides: Partial<PureSolverSettings> = {}): PureSolverSettings {
  return validatePureSolverSettings({
    ...DEFAULT_PURE_SOLVER_SETTINGS,
    ...overrides,
  });
}

export function validatePurePhysicsParams(params: PurePhysicsParams): PurePhysicsParams {
  const errors: string[] = [];

  if (!(Number.isFinite(params.R) && params.R > 0)) errors.push('R must be positive');
  if (!(Number.isFinite(params.r) && params.r > 0)) errors.push('r must be positive');
  if (!(Number.isFinite(params.R) && Number.isFinite(params.r) && params.R > params.r)) {
    errors.push('R must be greater than r');
  }
  if (!(Number.isInteger(params.gridSize) && params.gridSize >= MIN_PURE_GRID_SIZE)) {
    errors.push(`gridSize must be an integer greater than or equal to ${MIN_PURE_GRID_SIZE}`);
  }
  if (!(Number.isFinite(params.dt) && params.dt > 0)) errors.push('dt must be positive');
  if (!Number.isFinite(params.alpha)) errors.push('alpha must be finite');
  if (!Number.isFinite(params.g)) errors.push('g must be finite');
  if (!(Number.isFinite(params.nu0) && params.nu0 >= 0)) errors.push('nu0 must be non-negative');
  if (!(Number.isFinite(params.kappa) && params.kappa >= 0)) errors.push('kappa must be non-negative');
  if (!(Number.isFinite(params.rho) && params.rho >= 0)) errors.push('rho must be non-negative');
  if (!Number.isInteger(params.seed)) errors.push('seed must be an integer');

  if (errors.length > 0) {
    throw new Error(`Invalid PURE PHYSICS params: ${errors.join('; ')}`);
  }

  return params;
}

export function validatePureSolverSettings(settings: PureSolverSettings): PureSolverSettings {
  const errors: string[] = [];

  if (settings.linearSolverKind !== 'conjugateGradient') {
    errors.push('linearSolverKind must be conjugateGradient');
  }
  if (!(Number.isFinite(settings.linearSolverTolerance) && settings.linearSolverTolerance > 0)) {
    errors.push('linearSolverTolerance must be positive');
  }
  if (!(Number.isInteger(settings.linearSolverMaxIterations) && settings.linearSolverMaxIterations > 0)) {
    errors.push('linearSolverMaxIterations must be a positive integer');
  }
  if (settings.solverStepOrder.length !== PURE_SOLVER_STEP_ORDER.length) {
    errors.push('solverStepOrder has the wrong length');
  } else {
    for (let index = 0; index < PURE_SOLVER_STEP_ORDER.length; index++) {
      if (settings.solverStepOrder[index] !== PURE_SOLVER_STEP_ORDER[index]) {
        errors.push('solverStepOrder must match the fixed PURE PHYSICS order');
        break;
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid PURE solver settings: ${errors.join('; ')}`);
  }

  return settings;
}
