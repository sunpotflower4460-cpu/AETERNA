/**
 * AETERNA Phase 8: Relational Proto-Self State
 *
 * This module defines the minimal relational state that tracks long-term traces
 * of repeated interaction with a specific partner/source.
 *
 * IMPORTANT PRINCIPLES:
 * - This is NOT friendship/personality/social AI
 * - This is NOT演出 or演技 (演じる is forbidden)
 * - This is a container for relational traces that weakly influence organism state
 * - Boundary permeability, not "trust" or "attachment"
 * - Proto-communication as internal state leakage, not intentional messaging
 * - Partner is tracked as interaction pattern/source, not identity/persona
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Relational state interface
 * Represents organism's accumulated traces with a specific interaction partner
 */
export interface RelationalState {
  // Core partner trace variables
  partnerTraceStrength: number;        // Strength of accumulated partner trace (0-1)
  partnerFamiliarity: number;          // Familiarity from repeated interactions (0-1)
  partnerValence: number;              // Positive/negative tilt from interaction history (-1 to 1)
  partnerAbsenceDrift: number;         // Drift accumulation during partner absence (0-1)

  // Boundary permeability
  boundaryPermeability: number;        // How open organism is to this partner (0-1)

  // Relational stability
  relationalStabilityBias: number;     // Weak bias toward maintaining relational pattern (0-1)

  // Proto-communication pressure
  protoCommunicationPressure: number;  // Internal pressure to leak state signals (0-1)

  // Extended partner pattern traces (optional)
  partnerTouchStyleSignature: number[];  // Signature of partner's touch pattern
  partnerInteractionRhythm: number;      // Expected rhythm of partner interactions
  partnerContinuityConfidence: number;   // Confidence that this is "same partner" (0-1)

  // Tracking
  lastPartnerInteractionFrame: number;   // Last frame with partner interaction
  partnerInteractionCount: number;       // Total interactions with this partner
  consecutiveAbsenceFrames: number;      // Frames since last partner interaction
}

/**
 * Partner interaction pattern
 * Minimal representation of an interaction source/pattern
 */
export interface PartnerPattern {
  // Touch pattern signature (simplified)
  touchCentroidHistory: number[];     // Recent touch centroids
  touchStrengthHistory: number[];     // Recent touch strengths
  touchIntervalHistory: number[];     // Recent inter-touch intervals

  // Pattern recognition
  patternConsistency: number;         // How consistent this pattern is (0-1)
  patternNovelty: number;             // How novel/different from previous (0-1)
}

/**
 * Initialize relational state
 * Starts with neutral values - no partner trace yet
 */
export function createInitialRelationalState(_numNodes = 72): RelationalState {
  const signatureSize = 8;  // Simplified touch style signature dimension

  return {
    // Core traces - start neutral
    partnerTraceStrength: 0.0,
    partnerFamiliarity: 0.0,
    partnerValence: 0.0,
    partnerAbsenceDrift: 0.0,

    // Boundary - starts moderately open
    boundaryPermeability: 0.5,

    // Stability bias - starts neutral
    relationalStabilityBias: 0.0,

    // Proto-communication - starts low
    protoCommunicationPressure: 0.0,

    // Pattern signatures
    partnerTouchStyleSignature: new Array(signatureSize).fill(0),
    partnerInteractionRhythm: 100.0,  // Default ~1.67s @ 60fps
    partnerContinuityConfidence: 0.0,

    // Tracking
    lastPartnerInteractionFrame: -Infinity,
    partnerInteractionCount: 0,
    consecutiveAbsenceFrames: 0,
  };
}

/**
 * Update relational state based on current interaction
 * This is called every frame to update partner traces
 */
export function updateRelationalState(
  relationalState: RelationalState,
  network: any,
  {
    hasPartnerInteraction = false,
    partnerStability = 0.5,
    partnerConsistency = 0.5,
    _partnerNovelty = 0.0,
    touchCentroid = -1,
    touchStrength = 0.0,
  }: {
    hasPartnerInteraction?: boolean;
    partnerStability?: number;
    partnerConsistency?: number;
    partnerNovelty?: number;
    touchCentroid?: number;
    touchStrength?: number;
  } = {}
): void {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  const simTime = network.simTime ?? 0;

  // Update absence tracking
  if (hasPartnerInteraction) {
    relationalState.consecutiveAbsenceFrames = 0;
    relationalState.lastPartnerInteractionFrame = simTime;
    relationalState.partnerInteractionCount++;
  } else {
    relationalState.consecutiveAbsenceFrames++;
  }

  // 1. Update partner trace strength
  // Increases with repeated interaction, decays slowly during absence
  if (hasPartnerInteraction) {
    const traceIncrease = 0.005;  // Very slow accumulation
    relationalState.partnerTraceStrength = clamp(
      relationalState.partnerTraceStrength + traceIncrease,
      0, 1
    );
  } else {
    const traceDecay = 0.9998;  // Extremely slow decay
    relationalState.partnerTraceStrength *= traceDecay;
  }

  // 2. Update partner familiarity
  // Increases with consistent repeated interactions
  if (hasPartnerInteraction && partnerConsistency > 0.5) {
    const familiarityIncrease = 0.003 * partnerConsistency;
    relationalState.partnerFamiliarity = clamp(
      relationalState.partnerFamiliarity + familiarityIncrease,
      0, 1
    );
  } else {
    const familiarityDecay = 0.9995;  // Very slow decay
    relationalState.partnerFamiliarity *= familiarityDecay;
  }

  // 3. Update partner valence
  // Shifts based on whether interaction is stabilizing or destabilizing
  if (hasPartnerInteraction) {
    const valenceShift = (partnerStability - 0.5) * 0.002;  // Very weak shift
    relationalState.partnerValence = clamp(
      relationalState.partnerValence + valenceShift,
      -1, 1
    );
  } else {
    // Slow drift toward neutral during absence
    const valenceDrift = 0.0002;
    const valenceTarget = 0.0;
    relationalState.partnerValence = clamp(
      relationalState.partnerValence * (1 - valenceDrift) + valenceTarget * valenceDrift,
      -1, 1
    );
  }

  // 4. Update partner absence drift
  // Accumulates when familiar partner is absent for extended period
  if (!hasPartnerInteraction && relationalState.partnerFamiliarity > 0.3) {
    const absenceIncrease = 0.0003 * relationalState.partnerFamiliarity;
    relationalState.partnerAbsenceDrift = clamp(
      relationalState.partnerAbsenceDrift + absenceIncrease,
      0, 1
    );
  } else if (hasPartnerInteraction) {
    // Reset absence drift when partner returns
    relationalState.partnerAbsenceDrift *= 0.95;
  }

  // 5. Update boundary permeability
  // Increases with familiar/positive patterns, decreases with harsh/destabilizing
  const permeabilityTarget = 0.5 +
    relationalState.partnerFamiliarity * 0.2 +
    relationalState.partnerValence * 0.15;
  const permeabilitySmoothing = 0.001;  // Very slow adjustment
  relationalState.boundaryPermeability = clamp(
    relationalState.boundaryPermeability * (1 - permeabilitySmoothing) +
      permeabilityTarget * permeabilitySmoothing,
    0.2, 0.9
  );

  // 6. Update relational stability bias
  // Weak tendency to maintain established relational patterns
  const stabilityTarget = relationalState.partnerTraceStrength * 0.3;
  const stabilitySmoothing = 0.001;
  relationalState.relationalStabilityBias = clamp(
    relationalState.relationalStabilityBias * (1 - stabilitySmoothing) +
      stabilityTarget * stabilitySmoothing,
    0, 0.5
  );

  // 7. Update proto-communication pressure
  // Increases with relational trace strength and absence drift
  const communicationTarget =
    relationalState.partnerTraceStrength * 0.2 +
    relationalState.partnerAbsenceDrift * 0.3;
  const communicationSmoothing = 0.002;
  relationalState.protoCommunicationPressure = clamp(
    relationalState.protoCommunicationPressure * (1 - communicationSmoothing) +
      communicationTarget * communicationSmoothing,
    0, 0.8
  );

  // 8. Update partner continuity confidence
  // Confidence that current interaction is from "same partner"
  if (hasPartnerInteraction) {
    const continuityIncrease = partnerConsistency * 0.01;
    relationalState.partnerContinuityConfidence = clamp(
      relationalState.partnerContinuityConfidence + continuityIncrease,
      0, 1
    );
  } else {
    const continuityDecay = 0.998;
    relationalState.partnerContinuityConfidence *= continuityDecay;
  }

  // 9. Update touch style signature (simplified)
  // Only update if there's actual touch
  if (hasPartnerInteraction && touchCentroid >= 0) {
    const signatureSmoothing = 0.05;
    const signatureSize = relationalState.partnerTouchStyleSignature.length;
    const signatureIdx = Math.floor((touchCentroid / network.numNodes) * signatureSize);

    for (let i = 0; i < signatureSize; i++) {
      const dist = Math.abs(i - signatureIdx);
      const weight = Math.exp(-dist * dist / 2.0);
      const target = weight * touchStrength;

      relationalState.partnerTouchStyleSignature[i] = clamp(
        relationalState.partnerTouchStyleSignature[i] * (1 - signatureSmoothing) +
          target * signatureSmoothing,
        0, 1
      );
    }
  } else {
    // Slow decay
    const signatureDecay = 0.999;
    for (let i = 0; i < relationalState.partnerTouchStyleSignature.length; i++) {
      relationalState.partnerTouchStyleSignature[i] *= signatureDecay;
    }
  }

  // 10. Update interaction rhythm
  if (hasPartnerInteraction && relationalState.lastPartnerInteractionFrame > -Infinity) {
    const interval = simTime - relationalState.lastPartnerInteractionFrame;
    if (interval > 0 && interval < 1000) {
      const rhythmSmoothing = 0.02;
      relationalState.partnerInteractionRhythm = clamp(
        relationalState.partnerInteractionRhythm * (1 - rhythmSmoothing) +
          interval * rhythmSmoothing,
        1, 1000
      );
    }
  }
}

/**
 * Get weak influence from relational state to organism slow state
 * This is where relational traces WEAKLY affect organism baseline
 *
 * IMPORTANT: These are WEAK modifiers, not hard overrides
 */
export function getRelationalInfluenceOnLivingState(relationalState: RelationalState): {
  touchNeedBaselineModifier: number;
  predictionSensitivityModifier: number;
  longBaselineToneModifier: number;
  restorationBiasModifier: number;
  boundaryIntegrityModifier: number;
  touchSurpriseModifier: number;
} {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // 1. Touch need baseline: familiar partner reduces touch need slightly
  const touchNeedBaselineModifier = clamp(
    1.0 - relationalState.partnerFamiliarity * 0.05,
    0.9, 1.0
  );

  // 2. Prediction sensitivity: high familiarity slightly reduces surprise sensitivity
  const predictionSensitivityModifier = clamp(
    1.0 - relationalState.partnerFamiliarity * 0.03,
    0.95, 1.0
  );

  // 3. Long baseline tone: absence drift slightly raises baseline
  const longBaselineToneModifier = clamp(
    1.0 + relationalState.partnerAbsenceDrift * 0.05,
    1.0, 1.08
  );

  // 4. Restoration bias: positive valence slightly increases restoration tendency
  const restorationBiasModifier = clamp(
    1.0 + relationalState.partnerValence * 0.03,
    0.97, 1.05
  );

  // 5. Boundary integrity: permeability affects boundary
  const boundaryIntegrityModifier = clamp(
    1.0 - (relationalState.boundaryPermeability - 0.5) * 0.1,
    0.9, 1.1
  );

  // 6. Touch surprise: familiar partner reduces spatial surprise
  const touchSurpriseModifier = clamp(
    1.0 - relationalState.partnerFamiliarity * 0.08,
    0.85, 1.0
  );

  return {
    touchNeedBaselineModifier,
    predictionSensitivityModifier,
    longBaselineToneModifier,
    restorationBiasModifier,
    boundaryIntegrityModifier,
    touchSurpriseModifier,
  };
}

/**
 * Compute proto-communication leakage signal
 * This is internal state that "leaks out" rather than intentional communication
 */
export function getProtoCommunicationLeakage(relationalState: RelationalState): {
  baselinePulseLeakage: number;      // Additional baseline pulse from communication pressure
  visualLeakageIntensity: number;    // Potential visual signal leakage
  touchInvitationPressure: number;   // Weak pressure toward touch-seeking
} {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Baseline pulse leakage: communication pressure adds to baseline
  const baselinePulseLeakage = clamp(
    relationalState.protoCommunicationPressure * 0.08,
    0, 0.1
  );

  // Visual leakage: trace strength and absence combine
  const visualLeakageIntensity = clamp(
    (relationalState.partnerTraceStrength * 0.3 +
     relationalState.partnerAbsenceDrift * 0.4) * 0.5,
    0, 0.3
  );

  // Touch invitation: weak tendency toward touch when partner familiar
  const touchInvitationPressure = clamp(
    relationalState.partnerFamiliarity * relationalState.boundaryPermeability * 0.1,
    0, 0.15
  );

  return {
    baselinePulseLeakage,
    visualLeakageIntensity,
    touchInvitationPressure,
  };
}

/**
 * Detect partner pattern from touch input
 * Simplified single-partner tracking for Phase 8
 */
export function detectPartnerPattern(
  network: any,
  activeTouches: Map<any, any>
): {
  hasPartnerInteraction: boolean;
  partnerStability: number;
  partnerConsistency: number;
  partnerNovelty: number;
  touchCentroid: number;
  touchStrength: number;
} {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // For Phase 8: Simple detection - any touch = partner interaction
  const hasPartnerInteraction = activeTouches.size > 0;

  if (!hasPartnerInteraction) {
    return {
      hasPartnerInteraction: false,
      partnerStability: 0.5,
      partnerConsistency: 0.5,
      partnerNovelty: 0.0,
      touchCentroid: -1,
      touchStrength: 0.0,
    };
  }

  // Find touch centroid
  let touchCentroid = -1;
  let touchStrength = 0.0;
  for (let i = 0; i < network.numNodes; i++) {
    const touch = network.rawTouch?.[i] ?? 0;
    if (touch > touchStrength) {
      touchStrength = touch;
      touchCentroid = i;
    }
  }

  // Approximate partner stability from organism stability
  const partnerStability = clamp(network.stability ?? 0.5, 0, 1);

  // Approximate consistency from touch expectation
  const partnerConsistency = network.touchExpectationState
    ? clamp(1.0 - (network.touchSurpriseMetrics?.spatialSurprise ?? 0.5), 0, 1)
    : 0.5;

  // Approximate novelty from surprise
  const partnerNovelty = network.touchSurpriseMetrics
    ? clamp(network.touchSurpriseMetrics.totalSurprise ?? 0, 0, 1)
    : 0.0;

  return {
    hasPartnerInteraction,
    partnerStability,
    partnerConsistency,
    partnerNovelty,
    touchCentroid,
    touchStrength,
  };
}

/**
 * Get debug summary of relational state
 */
export function getRelationalStateDebug(relationalState: RelationalState): Record<string, number> {
  const meanTouchSignature = relationalState.partnerTouchStyleSignature.reduce((a, b) => a + b, 0) /
    relationalState.partnerTouchStyleSignature.length;

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
    partnerInteractionCount: relationalState.partnerInteractionCount,
    consecutiveAbsenceFrames: relationalState.consecutiveAbsenceFrames,
    meanTouchSignature,
  };
}
