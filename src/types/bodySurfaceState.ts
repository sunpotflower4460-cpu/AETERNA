/**
 * Body Surface State
 *
 * W1: Body Surface Introduction
 *
 * BodySurfaceState represents the boundary layer through which AETERNA's
 * torus life-field interfaces with the external world. This is NOT a UI
 * state or a semantic layer. It is a pre-semantic body boundary —
 * analogous to a membrane, skin, or boundary surface — that mediates
 * how external perturbations enter the life-field and prepares the
 * ground for future outward actuation.
 *
 * Design principles:
 * - All values are continuous in [0, 1] range
 * - This is a derived / proxy layer only — it does not drive core dynamics directly
 * - No semantic nodes, object labels, or meaning structures
 * - outputReadiness is a preparation value for W2 Actuation Pulse (not yet implemented)
 * - Relates to existing boundary / recovery / pressure / perturbation states
 *
 * Relationship to existing concepts:
 *   boundaryIntegrity   ← boundary maintenance / self-preservation
 *   permeability        ← how open the boundary is to external influence
 *   surfaceSensitivity  ← how reactive the surface is to incoming perturbation
 *   recoveryShielding   ← protective tendency during recovery
 *   outputReadiness     ← preparation for future Actuation Pulse (W2)
 */

export interface BodySurfaceState {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Boundary integrity: how well the body boundary is maintained.
   * High = stable boundary; low = degraded / eroded boundary.
   * Derived from: boundaryIntegrity (homeostatic), recovery state.
   * Range: 0–1
   */
  boundaryIntegrity: number;

  /**
   * Surface sensitivity: how readily the surface responds to incoming perturbation.
   * High = strongly reactive to external perturbation signals.
   * Low = dampened / habituated surface.
   * Range: 0–1
   */
  surfaceSensitivity: number;

  /**
   * Permeability: how open the boundary is to external influence entering the field.
   * High = external perturbations enter more easily.
   * Low = boundary closed; less external influence admitted.
   * Range: 0–1
   */
  permeability: number;

  /**
   * Contact readiness: how prepared the surface is to receive external contact.
   * Related to touch / perturbation input pipeline.
   * High = open to receiving contact signals.
   * Range: 0–1
   */
  contactReadiness: number;

  /**
   * Output readiness: preparation value for future Actuation Pulse (W2).
   * W1 only computes this value; no actuation output is implemented yet.
   * Derived from internal pressure and boundary state.
   * Range: 0–1
   */
  outputReadiness: number;

  /**
   * Local irritability: localized hypersensitivity of the surface.
   * Rises under repeated perturbation or overload conditions.
   * Range: 0–1
   */
  localIrritability: number;

  /**
   * Recovery shielding: tendency of the boundary to close protectively during recovery.
   * High = boundary partially shields the field from external input during repair.
   * Range: 0–1
   */
  recoveryShielding: number;

  /**
   * Surface tension (optional): tautness of the boundary surface.
   * Higher tension = boundary is more rigid and less permeable.
   * Range: 0–1
   */
  surfaceTension?: number;

  /**
   * Surface fatigue (optional): accumulated wear on the boundary surface.
   * Rises with sustained overload or repeated perturbation.
   * Range: 0–1
   */
  surfaceFatigue?: number;

  /**
   * Protective closure (optional): active tendency to close the boundary.
   * Distinct from recoveryShielding — this applies even outside of recovery.
   * Range: 0–1
   */
  protectiveClosure?: number;

  /**
   * External contact load (optional): current load of external perturbations
   * arriving at the boundary surface.
   * Range: 0–1
   */
  externalContactLoad?: number;
}
