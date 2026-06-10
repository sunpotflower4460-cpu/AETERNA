import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PURE_PHYSICS_PARAMS,
  DEFAULT_PURE_SOLVER_SETTINGS,
  PURE_SOLVER_STEP_ORDER,
  createPurePhysicsParams,
  createPureSolverSettings,
  validatePurePhysicsParams,
} from '../../pure/params.ts';

describe('PURE PHYSICS params', () => {
  it('validates the default physical params and solver settings', () => {
    expect(() => validatePurePhysicsParams(DEFAULT_PURE_PHYSICS_PARAMS)).not.toThrow();
    expect(() => createPureSolverSettings()).not.toThrow();
  });

  it('rejects invalid torus geometry', () => {
    expect(() => createPurePhysicsParams({ R: 0 })).toThrow('R must be positive');
    expect(() => createPurePhysicsParams({ R: 0.5, r: 0.7 })).toThrow('R must be greater than r');
  });

  it('keeps solver step order fixed', () => {
    expect(DEFAULT_PURE_SOLVER_SETTINGS.solverStepOrder).toEqual([
      'conservative',
      'dissipation',
      'drive',
      'mediumHistory',
      'observe',
    ]);
    expect(DEFAULT_PURE_SOLVER_SETTINGS.solverStepOrder).toBe(PURE_SOLVER_STEP_ORDER);
  });

  it('does not include test tolerances in runtime params', () => {
    const params = createPurePhysicsParams();
    const solverSettings = createPureSolverSettings();
    const runtimeKeys = [...Object.keys(params), ...Object.keys(solverSettings)];

    expect(runtimeKeys).not.toContain('tolerance');
    expect(runtimeKeys).not.toContain('testTolerance');
    expect(runtimeKeys).not.toContain('selfAdjointTolerance');
  });
});
