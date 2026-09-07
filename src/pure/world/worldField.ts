/**
 * PUT-IN: a PureCoreParams describing chi's OWN geometry/physics (R, r,
 *   N, dt, alpha, g, nu0, kappa, rho, seed - chi's world can have a
 *   different N than psi's, per docs/vessel/K13-world-constitution-adr.md
 *   Choice 1's "the world's grid may be larger")
 * EMERGED: chi's own geometry/operator/conservative-stepper/medium-
 *   history-params bundle, built with the EXACT SAME functions psi has
 *   used since K2 (createTorusGeometry, createLaplaceBeltramiOperator,
 *   createConservativeStepper) - no new physics code
 * claim-tier: C2 (this module is a thin construction wrapper; every
 *   physical/numerical guarantee it carries - N conservation, self-
 *   adjointness, Cayley unitarity, K9 spectral correctness - was
 *   already proven for these same functions when applied to psi; see
 *   src/tests/pure/worldField.test.ts for the confirmation that
 *   applying them to chi's own bundle produces the same properties)
 * floors (誠実な床): does not itself run any tick - src/pure/world/
 *   (K13-PR3/PR4) composes this with the distributed exchange boundary
 *   and the no-drive-to-psi orchestration. This module only answers
 *   "how is chi's own physics built," per docs/vessel/K13-world-
 *   constitution-adr.md Choice 1: chi's law is exactly psi's law,
 *   reused, not reinvented.
 */

import { createTorusGeometry, type TorusGeometry } from '../geometry/torus.ts';
import { createLaplaceBeltramiOperator, type LaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { createConservativeStepper, type ConservativeStepper } from '../field/stepConservative.ts';
import { createPureFieldState, type PureFieldState } from '../field/state.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import type { PureCoreParams, LinearSolverKind } from '../params.ts';

export interface WorldFieldConfig {
  /** Chi's own full physical/geometric/experimental parameter set - independent of psi's. */
  params: PureCoreParams;
  linearSolverKind?: LinearSolverKind;
}

export interface WorldField {
  readonly params: PureCoreParams;
  readonly geometry: TorusGeometry;
  readonly operator: LaplaceBeltramiOperator;
  readonly stepper: ConservativeStepper;
  readonly mediumParams: MediumHistoryParams;
}

/** Builds chi's own geometry/operator/stepper/medium-params bundle. Does not construct chi's initial field state - see createWorldInitialState. */
export function createWorldField(config: WorldFieldConfig): WorldField {
  const { params } = config;
  const geometry = createTorusGeometry({ R: params.R, r: params.r, N: params.N });
  const operator = createLaplaceBeltramiOperator(geometry);
  const stepper = createConservativeStepper(operator, geometry, { alpha: params.alpha, g: params.g, dt: params.dt, linearSolverKind: config.linearSolverKind });
  const mediumParams: MediumHistoryParams = { kappa: params.kappa, rho: params.rho, nu0: params.nu0 };
  return { params, geometry, operator, stepper, mediumParams };
}

/** Chi's own seeded initial state (chi(x,0) small random noise, nu_chi(x,0)=nu0 uniform) - the same construction psi has always used, applied to chi's own params/geometry/seed. */
export function createWorldInitialState(world: WorldField): PureFieldState {
  return createPureFieldState(world.params, world.geometry);
}
