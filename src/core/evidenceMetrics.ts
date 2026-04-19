/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AETERNA Phase 7: Self-Origin Evidence Metrics
 *
 * These metrics quantify observable patterns consistent with:
 * - Identity persistence
 * - Self-preservation tendency
 * - Non-instrumental action
 * - Endogenous drift
 * - History-dependent individuality
 *
 * IMPORTANT: These are EVIDENCE metrics, not proof metrics.
 * All values are [PROXY] or [DERIVED] - see docs/self-origin-evidence.md
 */

export interface EvidenceMetrics {
  // Identity persistence
  identityConsistencyScore: number;  // [PROXY] Slow variable consistency over time

  // Self-preservation
  selfPreservationEvidenceScore: number;  // [DERIVED] Recovery/restoration tendency

  // Endogenous changes
  endogenousDriftScore: number;  // [DERIVED] State changes without input

  // History dependence
  historyDependentDivergence: number;  // [DERIVED] Response差 after different histories

  // Non-instrumental action
  nonInstrumentalActionRate: number;  // [DERIVED] Actions per 1000 quiet frames

  // Composite self-origin candidate score
  selfOriginCandidateScore: number;  // [PROXY] Aggregate evidence strength
}

/**
 * Compute identity consistency score
 * Measures how much slow variables maintain characteristic values over time
 */
export function computeIdentityConsistencyScore(
  network: any,
  history: { fatigue: number[]; preferredErgodicity: number[]; longBaselineTone: number[] }
): number {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // If insufficient history, return neutral
  if (history.fatigue.length < 50) return 0.5;

  // Compute variance of each slow variable
  const computeVariance = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sqDiffs = arr.map(x => (x - mean) ** 2);
    return sqDiffs.reduce((a, b) => a + b, 0) / arr.length;
  };

  const fatigueVar = computeVariance(history.fatigue);
  const ergodicityVar = computeVariance(history.preferredErgodicity);
  const baselineVar = computeVariance(history.longBaselineTone);

  // Low variance = high consistency
  // Normalize by expected range
  const fatigueConsistency = 1.0 - clamp(fatigueVar / 0.05, 0, 1);
  const ergodicityConsistency = 1.0 - clamp(ergodicityVar / 0.04, 0, 1);
  const baselineConsistency = 1.0 - clamp(baselineVar / 0.01, 0, 1);

  // Weighted average
  return clamp(
    fatigueConsistency * 0.35 +
    ergodicityConsistency * 0.35 +
    baselineConsistency * 0.30,
    0, 1
  );
}

/**
 * Compute self-preservation evidence score
 * Measures tendency toward restoration/recovery in stress conditions
 */
export function computeSelfPreservationEvidenceScore(network: any): number {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  const homeostaticState = network.homeostaticState;
  if (!homeostaticState) return 0;

  // Evidence 1: Recovery drive rises appropriately
  const recoveryEvidence = homeostaticState.overloadLevel > 0.4
    ? clamp(homeostaticState.recoveryDrive / 0.5, 0, 1)
    : 0;

  // Evidence 2: Restoration bias increases under stress
  const restorationEvidence = clamp(
    (homeostaticState.restorationBias - 0.5) / 0.3,
    0, 1
  );

  // Evidence 3: Self-preservation bias correlates with vulnerability
  const isVulnerable =
    homeostaticState.energyReserve < 0.3 ||
    homeostaticState.overloadLevel > 0.6 ||
    homeostaticState.boundaryIntegrity < 0.7;
  const preservationEvidence = isVulnerable
    ? clamp((homeostaticState.selfPreservationBias - 0.5) / 0.2, 0, 1)
    : 0;

  // Evidence 4: Collapse risk inversely correlated with preservation tendency
  const collapseAvoidance = homeostaticState.collapseRisk > 0.3
    ? clamp(1.0 - homeostaticState.collapseRisk, 0, 1)
    : 0;

  return clamp(
    recoveryEvidence * 0.3 +
    restorationEvidence * 0.25 +
    preservationEvidence * 0.25 +
    collapseAvoidance * 0.2,
    0, 1
  );
}

/**
 * Compute endogenous drift score
 * Measures state changes during no-input periods
 */
export function computeEndogenousDriftScore(
  network: any,
  quietFrameHistory: {
    fatigueDrift: number;
    ergodicityDrift: number;
    baselineDrift: number;
    modePressureDrift: number;
  }
): number {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Sum absolute drifts, normalized
  const totalDrift = clamp(
    Math.abs(quietFrameHistory.fatigueDrift) * 20.0 +
    Math.abs(quietFrameHistory.ergodicityDrift) * 25.0 +
    Math.abs(quietFrameHistory.baselineDrift) * 50.0 +
    Math.abs(quietFrameHistory.modePressureDrift) * 10.0,
    0, 2.0
  );

  // Drift above noise floor = endogenous evidence
  const noiseFloor = 0.05;
  return clamp((totalDrift - noiseFloor) / 0.5, 0, 1);
}

/**
 * Compute history-dependent divergence
 * Measures how much response differs based on prior history
 */
export function computeHistoryDependentDivergence(
  responseAfterQuiet: number,
  responseAfterActive: number
): number {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  if (responseAfterQuiet === 0) return 0;

  const divergence = Math.abs(responseAfterActive - responseAfterQuiet) /
                     Math.max(responseAfterQuiet, 0.01);

  return clamp(divergence / 0.5, 0, 1);
}

/**
 * Compute non-instrumental action rate
 * Counts actions per 1000 quiet frames (no touch for 100+ frames prior)
 */
export function computeNonInstrumentalActionRate(
  quietFrameActionCount: number,
  totalQuietFrames: number
): number {
  if (totalQuietFrames < 100) return 0;

  const rate = (quietFrameActionCount / totalQuietFrames) * 1000;
  return rate;
}

/**
 * Compute composite self-origin candidate score
 * Aggregates all evidence metrics
 */
export function computeSelfOriginCandidateScore(
  identityConsistency: number,
  selfPreservation: number,
  endogenousDrift: number,
  historyDivergence: number,
  nonInstrumentalRate: number
): number {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Normalize non-instrumental rate to 0-1
  const normalizedNI = clamp(nonInstrumentalRate / 2.0, 0, 1);

  return clamp(
    identityConsistency * 0.25 +
    selfPreservation * 0.25 +
    endogenousDrift * 0.20 +
    historyDivergence * 0.15 +
    normalizedNI * 0.15,
    0, 1
  );
}

/**
 * Initialize evidence metrics with default values
 */
export function createInitialEvidenceMetrics(): EvidenceMetrics {
  return {
    identityConsistencyScore: 0.5,
    selfPreservationEvidenceScore: 0,
    endogenousDriftScore: 0,
    historyDependentDivergence: 0,
    nonInstrumentalActionRate: 0,
    selfOriginCandidateScore: 0.1,
  };
}

/**
 * Update evidence metrics from network state
 * This should be called periodically (e.g., every 100 frames)
 */
export function updateEvidenceMetrics(
  network: any,
  previousMetrics: EvidenceMetrics,
  slowVariableHistory: {
    fatigue: number[];
    preferredErgodicity: number[];
    longBaselineTone: number[];
  },
  quietFrameData: {
    actionCount: number;
    totalFrames: number;
    fatigueDrift: number;
    ergodicityDrift: number;
    baselineDrift: number;
    modePressureDrift: number;
  },
  historyComparisonData?: {
    responseAfterQuiet: number;
    responseAfterActive: number;
  }
): EvidenceMetrics {
  const identityConsistency = computeIdentityConsistencyScore(
    network,
    slowVariableHistory
  );

  const selfPreservation = computeSelfPreservationEvidenceScore(network);

  const endogenousDrift = computeEndogenousDriftScore(
    network,
    {
      fatigueDrift: quietFrameData.fatigueDrift,
      ergodicityDrift: quietFrameData.ergodicityDrift,
      baselineDrift: quietFrameData.baselineDrift,
      modePressureDrift: quietFrameData.modePressureDrift,
    }
  );

  const historyDivergence = historyComparisonData
    ? computeHistoryDependentDivergence(
        historyComparisonData.responseAfterQuiet,
        historyComparisonData.responseAfterActive
      )
    : previousMetrics.historyDependentDivergence;

  const nonInstrumentalRate = computeNonInstrumentalActionRate(
    quietFrameData.actionCount,
    quietFrameData.totalFrames
  );

  const selfOriginCandidate = computeSelfOriginCandidateScore(
    identityConsistency,
    selfPreservation,
    endogenousDrift,
    historyDivergence,
    nonInstrumentalRate
  );

  return {
    identityConsistencyScore: identityConsistency,
    selfPreservationEvidenceScore: selfPreservation,
    endogenousDriftScore: endogenousDrift,
    historyDependentDivergence: historyDivergence,
    nonInstrumentalActionRate: nonInstrumentalRate,
    selfOriginCandidateScore: selfOriginCandidate,
  };
}
