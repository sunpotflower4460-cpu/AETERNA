/**
 * AETERNA Phase 8: Relational Proto-Self
 *
 * Purpose: Track minimal long-term traces of specific interaction partners.
 * This is NOT friendship AI or relationship演出.
 * This is the minimal apparatus for:
 * - Specific partner traces persisting in organism slow state
 * - Boundary permeability adjusting per partner
 * - Absence drift when familiar partner is gone
 * - Proto-communication as internal state leakage
 *
 * Key principle: Relational state sits thinly on top of organism core.
 * It does NOT override,演出, or personify. It tracks long-term partner traces.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Relational state interface
 * Tracks traces of specific interaction partners
 */
export interface RelationalState {
  // Partner trace strength (how strong is the long-term trace)
  partnerTraceStrength: number;

  // Partner familiarity (how much repeated interaction has occurred)
  partnerFamiliarity: number;

  // Partner valence (positive/negative tilting of interactions)
  partnerValence: number;

  // Partner absence drift (slow drift when familiar partner is absent)
  partnerAbsenceDrift: number;

  // Boundary permeability (how open/closed organism is to this partner)
  boundaryPermeability: number;

  // Relational stability bias (weak tendency to maintain relational coherence)
  relationalStabilityBias: number;

  // Proto-communication pressure (internal pressure toward state leakage)
  protoCommunicationPressure: number;

  // Optional extended state
  partnerTouchStyleSignature: Float32Array;  // Touch pattern signature
  partnerInteractionRhythm: number;          // Typical interaction tempo
  partnerContinuityConfidence: number;       // Confidence this is same partner

  // Temporal tracking
  lastPartnerInteractionTime: number;
  totalPartnerInteractions: number;
  consecutivePartnerAbsenceFrames: number;
}

/**
 * Initialize relational state
 * Starts neutral - no partner traces yet
 */
export function createInitialRelationalState(numNodes: number): RelationalState {
  return {
    partnerTraceStrength: 0.0,          // No trace yet
    partnerFamiliarity: 0.0,            // No familiarity yet
    partnerValence: 0.0,                // Neutral valence
    partnerAbsenceDrift: 0.0,           // No drift yet
    boundaryPermeability: 0.5,          // Neutral permeability
    relationalStabilityBias: 0.5,       // Neutral stability
    protoCommunicationPressure: 0.0,    // No pressure yet
    partnerTouchStyleSignature: new Float32Array(8),  // 8-dim signature
    partnerInteractionRhythm: 100.0,    // Default ~1.67s
    partnerContinuityConfidence: 0.0,   // No confidence yet
    lastPartnerInteractionTime: -Infinity,
    totalPartnerInteractions: 0,
    consecutivePartnerAbsenceFrames: 0,
  };
}

/**
 * Update relational state based on current interaction
 * This is called every tick to track partner presence/absence
 *
 * For Phase 8: single-partner assumption (multi-user deferred)
 * Partner is approximated by interaction source continuity
 */
export function updateRelationalState(
  relationalState: RelationalState,
  network: any,
  {
    activeTouchCount = 0,
    touchIntensity = 0,
    touchSurprise = 0,
    touchPattern = null as any,
    stability = 0.5,
    overload = 0,
    recoveryDrive = 0,
    simTime = 0,
  }: {
    activeTouchCount?: number;
    touchIntensity?: number;
    touchSurprise?: number;
    touchPattern?: any;
    stability?: number;
    overload?: number;
    recoveryDrive?: number;
    simTime?: number;
  } = {},
): void {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  const isInteracting = activeTouchCount > 0;

  // 1. Update partner trace strength
  // Increases with interaction, slowly decays without
  if (isInteracting) {
    const traceIncrease = 0.002;  // Very slow accumulation
    relationalState.partnerTraceStrength = clamp(
      relationalState.partnerTraceStrength + traceIncrease,
      0,
      1,
    );
  } else {
    const traceDecay = 0.9999;  // Extremely slow decay
    relationalState.partnerTraceStrength = clamp(
      relationalState.partnerTraceStrength * traceDecay,
      0,
      1,
    );
  }

  // 2. Update partner familiarity
  // Builds with repeated interactions
  if (isInteracting) {
    // Check if this is continuation or new interaction
    const timeSinceLastInteraction = simTime - relationalState.lastPartnerInteractionTime;
    const isContinuation = timeSinceLastInteraction < 50;  // Within ~0.83s

    if (!isContinuation && relationalState.lastPartnerInteractionTime > -Infinity) {
      relationalState.totalPartnerInteractions++;
    }

    // Familiarity increases with total interactions and continuity
    const familiarityIncrease = 0.001 + (isContinuation ? 0.0005 : 0.0);
    relationalState.partnerFamiliarity = clamp(
      relationalState.partnerFamiliarity + familiarityIncrease,
      0,
      1,
    );

    // Update continuity confidence
    relationalState.partnerContinuityConfidence = clamp(
      relationalState.partnerContinuityConfidence + 0.01,
      0,
      1,
    );

    relationalState.lastPartnerInteractionTime = simTime;
    relationalState.consecutivePartnerAbsenceFrames = 0;
  } else {
    // No interaction - decay familiarity slowly, decay continuity faster
    relationalState.partnerFamiliarity *= 0.9998;
    relationalState.partnerContinuityConfidence *= 0.995;
    relationalState.consecutivePartnerAbsenceFrames++;
  }

  // 3. Update partner valence
  // Tilts based on whether interactions are stabilizing or destabilizing
  if (isInteracting) {
    // Positive valence: stable, low surprise, low overload
    // Negative valence: high surprise, high overload, instability
    const positiveInfluence = clamp(
      stability * 0.3 + (1 - touchSurprise) * 0.2 + (1 - overload) * 0.2,
      0,
      1,
    );
    const negativeInfluence = clamp(
      touchSurprise * 0.3 + overload * 0.3 + (1 - stability) * 0.2,
      0,
      1,
    );

    const valenceDelta = (positiveInfluence - negativeInfluence) * 0.005;
    relationalState.partnerValence = clamp(
      relationalState.partnerValence + valenceDelta,
      -0.5,
      0.5,
    );
  } else {
    // Slowly drift toward neutral during absence
    relationalState.partnerValence *= 0.9995;
  }

  // 4. Update boundary permeability
  // Increases with familiar/positive patterns, decreases with harsh/destabilizing
  const familiarityEffect = relationalState.partnerFamiliarity * 0.3;
  const valenceEffect = relationalState.partnerValence * 0.2;
  const overloadEffect = -overload * 0.15;
  const surpriseEffect = -touchSurprise * 0.1;

  const permeabilityTarget = clamp(
    0.5 + familiarityEffect + valenceEffect + overloadEffect + surpriseEffect,
    0.2,
    0.8,
  );

  const permeabilitySmoothing = 0.002;
  relationalState.boundaryPermeability = clamp(
    relationalState.boundaryPermeability * (1 - permeabilitySmoothing) +
      permeabilityTarget * permeabilitySmoothing,
    0.2,
    0.8,
  );

  // 5. Update partner absence drift
  // Accumulates when familiar partner is absent
  const absenceThreshold = 200;  // ~3.3s
  const isFamiliar = relationalState.partnerFamiliarity > 0.3;
  const isAbsent = relationalState.consecutivePartnerAbsenceFrames > absenceThreshold;

  if (isFamiliar && isAbsent) {
    const absenceDriftIncrease = 0.0008;
    relationalState.partnerAbsenceDrift = clamp(
      relationalState.partnerAbsenceDrift + absenceDriftIncrease,
      0,
      0.5,
    );
  } else {
    // Decay when partner returns or was never familiar
    relationalState.partnerAbsenceDrift *= 0.998;
  }

  // 6. Update relational stability bias
  // Tendency to maintain coherence in relational context
  const hasStrongTrace = relationalState.partnerTraceStrength > 0.4;
  const stabilityBiasTarget = hasStrongTrace
    ? clamp(0.5 + relationalState.partnerFamiliarity * 0.2, 0.3, 0.8)
    : 0.5;

  const stabilityBiasSmoothing = 0.001;
  relationalState.relationalStabilityBias = clamp(
    relationalState.relationalStabilityBias * (1 - stabilityBiasSmoothing) +
      stabilityBiasTarget * stabilityBiasSmoothing,
    0.3,
    0.8,
  );

  // 7. Update proto-communication pressure
  // Internal pressure that can leak to observer/environment
  // Increases with:
  // - Partner absence drift (organism state wants to leak when familiar partner absent)
  // - High internal arousal/recovery drive
  // - Low boundary permeability (paradoxically - closed boundary builds pressure)
  const absencePressure = relationalState.partnerAbsenceDrift * 0.4;
  const internalPressure = recoveryDrive * 0.2;
  const boundaryPressure = (1 - relationalState.boundaryPermeability) * 0.15;

  const communicationTarget = clamp(
    absencePressure + internalPressure + boundaryPressure,
    0,
    1,
  );

  const communicationSmoothing = 0.01;
  relationalState.protoCommunicationPressure = clamp(
    relationalState.protoCommunicationPressure * (1 - communicationSmoothing) +
      communicationTarget * communicationSmoothing,
    0,
    1,
  );

  // 8. Update touch style signature (optional, minimal)
  // Track characteristic touch pattern of this partner
  if (isInteracting && touchPattern) {
    const signatureSmoothing = 0.01;
    // Simple 8-dim signature: hold, tap, stroke, repeat, gentle, harsh, rhythmic, erratic
    const currentSignature = [
      touchPattern.hold ?? 0,
      touchPattern.tap ?? 0,
      touchPattern.stroke ?? 0,
      touchPattern.repeat ?? 0,
      clamp(touchIntensity * (1 - touchSurprise), 0, 1),  // gentle
      clamp(touchIntensity * touchSurprise, 0, 1),        // harsh
      clamp(1 - Math.abs(touchIntensity - 0.5), 0, 1),    // rhythmic proxy
      clamp(touchSurprise, 0, 1),                         // erratic proxy
    ];

    for (let i = 0; i < 8; i++) {
      relationalState.partnerTouchStyleSignature[i] = clamp(
        relationalState.partnerTouchStyleSignature[i] * (1 - signatureSmoothing) +
          currentSignature[i] * signatureSmoothing,
        0,
        1,
      );
    }
  }

  // 9. Update interaction rhythm
  // Track typical tempo of interactions with this partner
  if (isInteracting) {
    const timeSinceLastInteraction = simTime - relationalState.lastPartnerInteractionTime;
    if (
      relationalState.lastPartnerInteractionTime > -Infinity &&
      timeSinceLastInteraction < 500 &&
      timeSinceLastInteraction > 10
    ) {
      const rhythmSmoothing = 0.02;
      relationalState.partnerInteractionRhythm = clamp(
        relationalState.partnerInteractionRhythm * (1 - rhythmSmoothing) +
          timeSinceLastInteraction * rhythmSmoothing,
        10,
        500,
      );
    }
  }
}

/**
 * Get relational influence on organism slow state
 * These are WEAK modulations, not overrides
 *
 * Relational state affects:
 * - Touch need baseline (more open if familiar positive partner)
 * - Long baseline tone (affected by absence drift)
 * - Prediction sensitivity (familiar patterns reduce surprise sensitivity)
 * - Restoration bias (relational stability affects self-restoration)
 * - Boundary integrity (permeability affects boundary)
 * - Preferred ergodicity (very weak, relational coherence affects flow)
 */
export function getRelationalInfluence(relationalState: RelationalState): {
  touchNeedBaselineModifier: number;
  longBaselineToneModifier: number;
  predictionSensitivityModifier: number;
  restorationBiasModifier: number;
  boundaryIntegrityModifier: number;
  preferredErgodicityModifier: number;
  touchSurpriseModifier: number;
} {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : (min + max) / 2));

  // Touch need baseline: familiar positive partner increases openness
  const familiarPositive = relationalState.partnerFamiliarity * Math.max(0, relationalState.partnerValence);
  const touchNeedBaselineModifier = clamp(
    1.0 + familiarPositive * 0.15 - relationalState.partnerAbsenceDrift * 0.08,
    0.85,
    1.15,
  );

  // Long baseline tone: absence drift affects ongoing tone
  const longBaselineToneModifier = clamp(
    1.0 + relationalState.partnerAbsenceDrift * 0.1,
    0.9,
    1.12,
  );

  // Prediction sensitivity: familiarity slightly reduces surprise sensitivity
  const predictionSensitivityModifier = clamp(
    1.0 - relationalState.partnerFamiliarity * 0.08,
    0.88,
    1.05,
  );

  // Restoration bias: relational stability bias affects organism restoration
  const restorationBiasModifier = clamp(
    1.0 + (relationalState.relationalStabilityBias - 0.5) * 0.12,
    0.92,
    1.1,
  );

  // Boundary integrity: permeability affects boundary (inversely - high permeability = lower boundary)
  const boundaryIntegrityModifier = clamp(
    1.0 - (relationalState.boundaryPermeability - 0.5) * 0.1,
    0.93,
    1.08,
  );

  // Preferred ergodicity: very weak effect from relational coherence
  const relationalCoherence = relationalState.partnerTraceStrength * relationalState.partnerContinuityConfidence;
  const preferredErgodicityModifier = clamp(
    1.0 + relationalCoherence * 0.05,
    0.97,
    1.03,
  );

  // Touch surprise: familiar patterns reduce surprise magnitude
  const touchSurpriseModifier = clamp(
    1.0 - relationalState.partnerFamiliarity * 0.12,
    0.8,
    1.0,
  );

  return {
    touchNeedBaselineModifier,
    longBaselineToneModifier,
    predictionSensitivityModifier,
    restorationBiasModifier,
    boundaryIntegrityModifier,
    preferredErgodicityModifier,
    touchSurpriseModifier,
  };
}

/**
 * Get proto-communication leakage
 * This is internal state that can leak to observer/environment
 * NOT deliberate communication, but state pressure漏出
 */
export function getProtoCommunicationLeakage(relationalState: RelationalState): {
  leakagePressure: number;
  absenceSignal: number;
  boundaryTension: number;
  relationalCoherence: number;
} {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Overall leakage pressure
  const leakagePressure = clamp(relationalState.protoCommunicationPressure, 0, 1);

  // Absence signal: stronger when familiar partner is absent
  const absenceSignal = clamp(
    relationalState.partnerAbsenceDrift * relationalState.partnerFamiliarity,
    0,
    1,
  );

  // Boundary tension: mismatch between permeability and trace strength
  const boundaryTension = clamp(
    Math.abs(relationalState.boundaryPermeability - relationalState.partnerTraceStrength),
    0,
    1,
  );

  // Relational coherence: how coherent the relational state is
  const relationalCoherence = clamp(
    relationalState.partnerTraceStrength * relationalState.partnerContinuityConfidence *
      (1 - Math.abs(relationalState.partnerValence)),
    0,
    1,
  );

  return {
    leakagePressure,
    absenceSignal,
    boundaryTension,
    relationalCoherence,
  };
}

/**
 * Get debug summary for observer/metrics
 */
export function getRelationalDebugSummary(relationalState: RelationalState): Record<string, number> {
  const meanTouchStyleSignature =
    relationalState.partnerTouchStyleSignature.reduce((a, b) => a + b, 0) / 8;

  return {
    partnerTraceStrength: relationalState.partnerTraceStrength,
    partnerFamiliarity: relationalState.partnerFamiliarity,
    partnerValence: relationalState.partnerValence,
    partnerAbsenceDrift: relationalState.partnerAbsenceDrift,
    boundaryPermeability: relationalState.boundaryPermeability,
    relationalStabilityBias: relationalState.relationalStabilityBias,
    protoCommunicationPressure: relationalState.protoCommunicationPressure,
    partnerInteractionRhythm: relationalState.partnerInteractionRhythm,
    partnerContinuityConfidence: relationalState.partnerContinuityConfidence,
    totalPartnerInteractions: relationalState.totalPartnerInteractions,
    consecutivePartnerAbsenceFrames: relationalState.consecutivePartnerAbsenceFrames,
    meanTouchStyleSignature,
  };
}
