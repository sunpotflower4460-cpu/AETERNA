/**
 * Derive Body Surface State
 *
 * W1: Body Surface Introduction
 *
 * This helper derives BodySurfaceState from existing organism state.
 * It is a pure read-only derivation: it reads from existing states and
 * returns a BodySurfaceState. It does NOT modify any core organism variable.
 *
 * Design principles:
 * - Pure function (no side effects, no mutation)
 * - Observer-adjacent: does not feed back directly into organism dynamics
 * - All outputs clamped to [0, 1]; no NaN or Infinity
 * - Graceful fallback when input states are absent
 * - Body Surface is NOT a semantic layer — no meaning, labels, or goals
 *
 * Derivation sources:
 *   RecoveryState        → boundaryIntegrity, recoveryShielding, outputReadiness
 *   PredictionMismatch   → surfaceSensitivity, localIrritability, permeability
 *   PressureCompetition  → outputReadiness, permeability, contactReadiness
 *   TraceState           → localIrritability, surfaceFatigue
 *   Ongoingness/activity → boundaryIntegrity, contactReadiness
 *   Homeostatic state    → boundaryIntegrity, permeability, surfaceTension
 */

import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { RecoveryState } from '../types/recoveryState.ts';
import type { PredictionMismatchState } from '../types/predictionMismatchState.ts';
import type { PressureCompetitionState } from '../types/pressureCompetitionState.ts';
import type { TraceState } from '../types/traceState.ts';

export interface DeriveBodySurfaceStateInput {
  timestamp: number;

  /** Recovery state (may be null if unavailable) */
  recoveryState: RecoveryState | null;

  /** Prediction mismatch state (may be null if unavailable) */
  mismatchState: PredictionMismatchState | null;

  /** Pressure competition state (may be null if unavailable) */
  pressureState: PressureCompetitionState | null;

  /** Trace state (may be null if unavailable) */
  traceState: TraceState | null;

  /** Current mean activity level (0–∞, clamped internally) */
  meanActivity?: number;

  /** Homeostatic boundary integrity (0–1) */
  homeostaticBoundaryIntegrity?: number;

  /** Homeostatic collapse risk (0–1) */
  collapseRisk?: number;

  /** Current overload level (0–1.5) */
  overload?: number;

  /** Recent perturbation history (sliding window of magnitudes) */
  recentPerturbationHistory?: number[];
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function clampFinite(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function recentMean(values: number[], window = 40): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  return slice.reduce((sum, v) => sum + clampFinite(v, 0, 2), 0) / slice.length;
}

function recentPeak(values: number[], window = 20): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  return slice.reduce((peak, v) => Math.max(peak, clampFinite(v, 0, 2)), 0);
}

/**
 * Derive BodySurfaceState from existing organism states.
 *
 * All outputs are in [0, 1]. Missing inputs fall back to neutral defaults.
 * This function must remain a pure derivation — it must not modify any
 * external state.
 */
export function deriveBodySurfaceState(input: DeriveBodySurfaceStateInput): BodySurfaceState {
  // ── Extract and clamp inputs ──────────────────────────────────────────────

  // Recovery-derived signals
  const collapseRisk = clamp01(
    input.collapseRisk ??
    input.recoveryState?.collapseRisk ??
    0
  );
  const recoveryPressure = clamp01(input.recoveryState?.recoveryPressure ?? 0);
  const relaxationLevel = clamp01(input.recoveryState?.relaxationLevel ?? 0.5);
  const boundaryRepairPressure = clamp01(input.recoveryState?.boundaryRepairPressure ?? 0);
  const selfPreservationDrive = clamp01(input.recoveryState?.selfPreservationDrive ?? 0);
  const overloadDrain = clamp01(input.recoveryState?.overloadDrain ?? 0);

  // Mismatch-derived signals
  const mismatchLevel = clamp01(input.mismatchState?.mismatchLevel ?? 0);
  const surprisePressure = clamp01(input.mismatchState?.surprisePressure ?? 0);
  const boundaryStress = clamp01(input.mismatchState?.boundaryStress ?? 0);
  const localInstability = clamp01(input.mismatchState?.localInstability ?? 0);

  // Pressure competition signals
  const withdrawalPressure = clamp01(input.pressureState?.withdrawalPressure ?? 0);
  const explorationPressure = clamp01(input.pressureState?.explorationPressure ?? 0);
  const safetyPressure = clamp01(input.pressureState?.safetyPressure ?? 0);
  const restorationPressure = clamp01(input.pressureState?.restorationPressure ?? 0);
  const pressureEnergy = clamp01((input.pressureState?.pressureEnergy ?? 0) / 1.2);

  // Trace-derived signals
  const traceStrength = clamp01(input.traceState?.traceStrength ?? 0);
  const salienceResidue = clamp01(input.traceState?.salienceResidue ?? 0);
  const recurrenceWeight = clamp01(input.traceState?.recurrenceWeight ?? 0);
  const replaySuppression = clamp01(input.traceState?.replaySuppression ?? 0);

  // Homeostatic signals
  const homeostaticBoundary = clamp01(input.homeostaticBoundaryIntegrity ?? 0.7);
  const overload = clampFinite(input.overload ?? (overloadDrain * 1.5), 0, 1.5);
  const overloadNorm = clamp01(overload / 1.5);

  // Perturbation history signals
  const perturbMean = recentMean(input.recentPerturbationHistory ?? [], 40);
  const perturbPeak = recentPeak(input.recentPerturbationHistory ?? [], 20);

  // Activity
  const meanActivity = clamp01((input.meanActivity ?? 0.5) / 2.0);

  // ── Derive boundary integrity ─────────────────────────────────────────────
  // How well the boundary is maintained. High = stable, intact boundary.
  // Weighted from: homeostatic boundary, boundary repair pressure, minus
  // boundary stress, collapse risk, overload drain.
  const boundaryIntegrity = clamp01(
    homeostaticBoundary * 0.45 +
    boundaryRepairPressure * 0.22 +
    selfPreservationDrive * 0.15 +
    relaxationLevel * 0.08 -
    boundaryStress * 0.18 -
    collapseRisk * 0.12 -
    overloadNorm * 0.1
  );

  // ── Derive surface sensitivity ────────────────────────────────────────────
  // How readily incoming perturbations are received at the surface.
  // High surprise + mismatch = more sensitive. Recovery shielding reduces it.
  const surfaceSensitivity = clamp01(
    surprisePressure * 0.32 +
    mismatchLevel * 0.22 +
    salienceResidue * 0.18 +
    localInstability * 0.12 +
    perturbMean * 0.12 -
    replaySuppression * 0.1 -
    recoveryPressure * 0.1
  );

  // ── Derive permeability ───────────────────────────────────────────────────
  // How open the boundary is to external influence entering.
  // Exploration pressure opens it; withdrawal/safety/overload closes it.
  const permeability = clamp01(
    explorationPressure * 0.28 +
    meanActivity * 0.2 +
    relaxationLevel * 0.18 -
    withdrawalPressure * 0.22 -
    safetyPressure * 0.14 -
    overloadNorm * 0.16 -
    collapseRisk * 0.14
  );

  // ── Derive contact readiness ──────────────────────────────────────────────
  // How prepared the surface is to receive external contact.
  // Moderate openness + stable boundary → higher contact readiness.
  const contactReadiness = clamp01(
    permeability * 0.35 +
    boundaryIntegrity * 0.28 +
    relaxationLevel * 0.18 +
    explorationPressure * 0.12 -
    collapseRisk * 0.18 -
    overloadNorm * 0.14
  );

  // ── Derive output readiness ───────────────────────────────────────────────
  // Preparation for future Actuation Pulse (W2). W1 derives this value only;
  // no outward pulse is emitted yet.
  // Internal pressure + boundary integrity + low overload → output readiness.
  const outputReadiness = clamp01(
    pressureEnergy * 0.30 +
    boundaryIntegrity * 0.25 +
    recoveryPressure * 0.18 +
    meanActivity * 0.12 -
    overloadNorm * 0.22 -
    collapseRisk * 0.12
  );

  // ── Derive local irritability ─────────────────────────────────────────────
  // Localized hypersensitivity. Rises with repeated perturbation, high trace,
  // and mismatch; decays with restoration and low perturbation.
  const localIrritability = clamp01(
    perturbPeak * 0.30 +
    recurrenceWeight * 0.22 +
    mismatchLevel * 0.18 +
    localInstability * 0.14 +
    salienceResidue * 0.10 -
    restorationPressure * 0.14 -
    relaxationLevel * 0.12
  );

  // ── Derive recovery shielding ─────────────────────────────────────────────
  // Protective tendency to close the boundary during recovery.
  // High recovery pressure + collapse risk + withdrawal → more shielding.
  const recoveryShielding = clamp01(
    recoveryPressure * 0.30 +
    selfPreservationDrive * 0.22 +
    withdrawalPressure * 0.18 +
    collapseRisk * 0.15 +
    safetyPressure * 0.10 -
    explorationPressure * 0.12 -
    relaxationLevel * 0.08
  );

  // ── Optional derived fields ───────────────────────────────────────────────

  // Surface tension: boundary rigidity; high when protective pressure is high
  const surfaceTension = clamp01(
    safetyPressure * 0.35 +
    selfPreservationDrive * 0.28 +
    (1 - permeability) * 0.22 +
    collapseRisk * 0.15
  );

  // Surface fatigue: accumulated wear from sustained perturbation
  const surfaceFatigue = clamp01(
    overloadNorm * 0.35 +
    traceStrength * 0.28 +
    perturbMean * 0.22 +
    boundaryStress * 0.15
  );

  // Protective closure: active closing tendency (even outside recovery)
  const protectiveClosure = clamp01(
    withdrawalPressure * 0.35 +
    collapseRisk * 0.28 +
    safetyPressure * 0.22 +
    overloadNorm * 0.15
  );

  // External contact load: current perturbation burden arriving at boundary
  const externalContactLoad = clamp01(
    perturbMean * 0.45 +
    mismatchLevel * 0.28 +
    boundaryStress * 0.18 +
    surprisePressure * 0.09
  );

  return {
    timestamp: input.timestamp,
    boundaryIntegrity,
    surfaceSensitivity,
    permeability,
    contactReadiness,
    outputReadiness,
    localIrritability,
    recoveryShielding,
    surfaceTension,
    surfaceFatigue,
    protectiveClosure,
    externalContactLoad,
  };
}
