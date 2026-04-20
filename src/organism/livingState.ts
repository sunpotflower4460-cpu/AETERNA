/**
 * AETERNA Persistent Living State
 *
 * Phase 2: Organism state that persists across frames/ticks/scenarios.
 * This is NOT reactive computation - these variables slowly drift,
 * accumulate, and carry over between moments.
 *
 * Purpose: Transform AETERNA from "momentary reaction" to "living individual
 * with ongoing baseline tendencies, fatigue, memory, and slow drift."
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Persistent living state interface
 * These variables define the "current lived condition" of the organism
 */
export interface LivingState {
  // Fatigue from extended activity
  fatigue: number;

  // Memory of recent coherence/stability
  coherenceMemory: number;

  // Preferred ergodicity (flow preference of this individual)
  preferredErgodicity: number;

  // Long baseline tone (very slow drift)
  longBaselineTone: number;

  // Recent history bias (EMA of recent perturbations)
  recentHistoryBias: number;

  // Residue bias (how easily residue accumulates)
  residueBias: number;

  // Prediction sensitivity (changes with experience)
  predictionSensitivity: number;

  // Touch need baseline (openness to tactile input)
  touchNeedBaseline: number;

  // Optional: track major perturbations
  lastMajorPerturbationAt: number;

  // Optional: stability memory
  stabilityMemory: number;

  // Optional: overload memory
  overloadMemory: number;
}

/**
 * Initialize living state with organism-typical defaults
 * These are NOT reset every frame - they persist
 */
export function createInitialLivingState(): LivingState {
  return {
    fatigue: 0.08,                    // starts low but accumulates
    coherenceMemory: 0.5,              // neutral starting memory
    preferredErgodicity: 0.5,          // neutral flow preference
    longBaselineTone: 0.12,            // low baseline ongoing tone
    recentHistoryBias: 0.0,            // no history yet
    residueBias: 0.5,                  // neutral residue accumulation
    predictionSensitivity: 0.5,        // neutral sensitivity
    touchNeedBaseline: 0.5,            // neutral openness
    lastMajorPerturbationAt: 0,        // no perturbation yet
    stabilityMemory: 0.5,              // neutral stability
    overloadMemory: 0.0,               // no overload memory
  };
}

/**
 * Update living state variables based on current conditions
 * This is called EVERY tick/heartbeat, even when nothing external happens
 *
 * Key principle: slow drift, not instant response
 *
 * Phase 8: Now incorporates weak relational influences
 * Phase BL-L3: Now accepts Beautiful Loop modulation deltas
 */
export function updateLivingState(
  livingState: LivingState,
  network: any,
  {
    arousal = 0,
    coherence = 0,
    residueLevel = 0,
    predictionError = 0,
    activeTouchCount = 0,
    recentPerturbationIntensity = 0,
    stability = 0.5,
    overload = 0,
    relationalInfluence = null,
    blModulation = null,
  }: {
    arousal?: number;
    coherence?: number;
    residueLevel?: number;
    predictionError?: number;
    activeTouchCount?: number;
    recentPerturbationIntensity?: number;
    stability?: number;
    overload?: number;
    relationalInfluence?: {
      touchNeedBaselineModifier?: number;
      predictionSensitivityModifier?: number;
      longBaselineToneModifier?: number;
      restorationBiasModifier?: number;
      boundaryIntegrityModifier?: number;
    } | null;
    blModulation?: {
      touchOpennessDelta?: number;
      noveltyBiasDelta?: number;
    } | null;
  } = {},
): void {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // 1. Fatigue: increases with activity, slowly decreases in quiet
  const activityLevel = clamp(arousal * 0.6 + activeTouchCount * 0.4, 0, 1);
  const fatigueIncrease = activityLevel * 0.0008;  // very slow accumulation
  const fatigueDecay = 0.9998;  // very slow recovery
  livingState.fatigue = clamp(
    livingState.fatigue * fatigueDecay + fatigueIncrease,
    0,
    0.8,  // max fatigue cap
  );

  // 2. Coherence memory: smoothed memory of recent coherence
  const coherenceTarget = clamp(coherence, 0, 1);
  const coherenceSmoothing = 0.002;  // very slow integration
  livingState.coherenceMemory = clamp(
    livingState.coherenceMemory * (1 - coherenceSmoothing) +
      coherenceTarget * coherenceSmoothing,
    0,
    1,
  );

  // 3. Preferred ergodicity: very slow drift toward long-term average
  // (this would normally integrate over thousands of frames)
  const ergodicityDrift = 0.0001;  // extremely slow
  const ergodicityTarget = 0.5;  // neutral attractor
  livingState.preferredErgodicity = clamp(
    livingState.preferredErgodicity * (1 - ergodicityDrift) +
      ergodicityTarget * ergodicityDrift,
    0.2,
    0.8,
  );

  // 4. Long baseline tone: glacially slow drift
  // Phase 8: Weakly influenced by relational absence drift
  const baselineDrift = 0.00005;
  const relationalToneModifier = relationalInfluence?.longBaselineToneModifier ?? 1.0;
  const baselineTarget = (0.12 + residueLevel * 0.05) * relationalToneModifier;
  livingState.longBaselineTone = clamp(
    livingState.longBaselineTone * (1 - baselineDrift) +
      baselineTarget * baselineDrift,
    0.05,
    0.25,
  );

  // 5. Recent history bias: EMA of recent perturbations
  const historySmoothing = 0.01;  // moderate integration

  // Phase 3: Incorporate touch expectation violation into history bias
  let expectationViolationBias = 0;
  if (network.touchSurpriseMetrics) {
    expectationViolationBias = network.touchSurpriseMetrics.totalSurprise * 0.05;
  }

  const perturbationBias = clamp(recentPerturbationIntensity + expectationViolationBias, -1, 1);
  livingState.recentHistoryBias = clamp(
    livingState.recentHistoryBias * (1 - historySmoothing) +
      perturbationBias * historySmoothing,
    -0.5,
    0.5,
  );

  // 6. Residue bias: how easily residue accumulates
  const residueSmoothing = 0.001;
  const residueTarget = clamp(0.5 + residueLevel * 0.3, 0.3, 0.7);
  livingState.residueBias = clamp(
    livingState.residueBias * (1 - residueSmoothing) +
      residueTarget * residueSmoothing,
    0.2,
    0.8,
  );

  // 7. Prediction sensitivity: adapts based on prediction errors
  // BL-L3: Weakly influenced by novelty bias delta from self/world packet
  const sensitivitySmoothing = 0.002;
  const errorLevel = clamp(predictionError, 0, 2);

  // Phase 3: Apply touch expectation surprise influence
  let surpriseInfluence = 0;
  if (network.touchSurpriseMetrics) {
    surpriseInfluence = network.touchSurpriseMetrics.totalSurprise * 0.08;
  }

  // BL-L3: Apply novelty bias delta (weak modulation)
  const blNoveltyDelta = blModulation?.noveltyBiasDelta ?? 0;
  const sensitivityTarget = clamp(0.5 + errorLevel * 0.1 + surpriseInfluence + blNoveltyDelta, 0.3, 0.8);
  livingState.predictionSensitivity = clamp(
    livingState.predictionSensitivity * (1 - sensitivitySmoothing) +
      sensitivityTarget * sensitivitySmoothing,
    0.2,
    0.9,
  );

  // 8. Touch need baseline: adapts based on touch history
  // Phase 8: Weakly influenced by relational familiarity
  // BL-L3: Weakly influenced by relation engagement from self/world packet
  const touchSmoothing = 0.001;
  const touchPresence = activeTouchCount > 0 ? 1 : 0;
  const relationalTouchModifier = relationalInfluence?.touchNeedBaselineModifier ?? 1.0;
  // BL-L3: Apply touch openness delta
  const blTouchDelta = blModulation?.touchOpennessDelta ?? 0;
  const touchTarget = clamp((0.5 - touchPresence * 0.1 + blTouchDelta) * relationalTouchModifier, 0.2, 0.8);
  livingState.touchNeedBaseline = clamp(
    livingState.touchNeedBaseline * (1 - touchSmoothing) +
      touchTarget * touchSmoothing,
    0.2,
    0.8,
  );

  // 9. Track major perturbations
  if (recentPerturbationIntensity > 0.3) {
    livingState.lastMajorPerturbationAt = network.simTime ?? 0;
  }

  // 10. Stability memory: slow integration
  const stabilitySmoothing = 0.005;
  livingState.stabilityMemory = clamp(
    livingState.stabilityMemory * (1 - stabilitySmoothing) +
      stability * stabilitySmoothing,
    0,
    1,
  );

  // 11. Overload memory: tracks recent overload
  const overloadSmoothing = 0.008;
  livingState.overloadMemory = clamp(
    livingState.overloadMemory * (1 - overloadSmoothing) +
      overload * overloadSmoothing,
    0,
    1,
  );
}

/**
 * Get debug summary of living state for metrics/observation
 */
export function getLivingStateDebug(livingState: LivingState): Record<string, number> {
  return {
    fatigue: livingState.fatigue,
    coherenceMemory: livingState.coherenceMemory,
    preferredErgodicity: livingState.preferredErgodicity,
    longBaselineTone: livingState.longBaselineTone,
    recentHistoryBias: livingState.recentHistoryBias,
    residueBias: livingState.residueBias,
    predictionSensitivity: livingState.predictionSensitivity,
    touchNeedBaseline: livingState.touchNeedBaseline,
    lastMajorPerturbationAt: livingState.lastMajorPerturbationAt,
    stabilityMemory: livingState.stabilityMemory,
    overloadMemory: livingState.overloadMemory,
  };
}

/**
 * Apply living state influence to organism core mechanisms
 * This is where persistent state weakly affects current dynamics
 *
 * Important: these are WEAK influences, not hard overrides
 */
export function getLivingStateInfluence(livingState: LivingState): {
  baselineGainModifier: number;
  predictionSensitivityModifier: number;
  residueGainModifier: number;
  modeStabilityBias: number;
  rewriteGainModifier: number;
} {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Fatigue reduces baseline gain (less spontaneous activity when tired)
  const baselineGainModifier = clamp(1.0 - livingState.fatigue * 0.3, 0.5, 1.1);

  // Prediction sensitivity affects prediction error processing
  const predictionSensitivityModifier = clamp(
    0.8 + livingState.predictionSensitivity * 0.4,
    0.6,
    1.2,
  );

  // Residue bias affects residue accumulation
  const residueGainModifier = clamp(
    0.9 + livingState.residueBias * 0.2,
    0.8,
    1.15,
  );

  // Coherence memory biases toward stable regimes
  const modeStabilityBias = clamp(
    livingState.coherenceMemory * 0.15,
    0,
    0.2,
  );

  // Recent history bias affects rewrite tendency
  const rewriteGainModifier = clamp(
    1.0 + Math.abs(livingState.recentHistoryBias) * 0.1,
    0.95,
    1.1,
  );

  return {
    baselineGainModifier,
    predictionSensitivityModifier,
    residueGainModifier,
    modeStabilityBias,
    rewriteGainModifier,
  };
}
