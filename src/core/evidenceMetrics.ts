/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AETERNA Phase 7-8: Self-Origin Evidence Metrics
 *
 * These metrics quantify observable patterns consistent with:
 * - Identity persistence
 * - Self-preservation tendency
 * - Non-instrumental action
 * - Endogenous drift
 * - History-dependent individuality
 * - Relational proto-self (Phase 8)
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

  // Phase 8: Relational proto-self evidence
  relationalTraceScore?: number;          // [PROXY] Partner trace accumulation
  relationalFamiliarityGain?: number;     // [DERIVED] Familiarity growth rate
  boundaryPermeabilityShift?: number;     // [DERIVED] Permeability change with partner
  partnerAbsenceEffect?: number;          // [DERIVED] State drift during absence
  partnerConditionedDivergence?: number;  // [DERIVED] Response difference by partner history
  protoCommunicationLeakage?: number;     // [DERIVED] State leakage signal strength
  relationalInfluenceScore?: number;      // [PROXY] Aggregate relational evidence
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
    // Phase 8: Relational metrics
    relationalTraceScore: 0,
    relationalFamiliarityGain: 0,
    boundaryPermeabilityShift: 0,
    partnerAbsenceEffect: 0,
    partnerConditionedDivergence: 0,
    protoCommunicationLeakage: 0,
    relationalInfluenceScore: 0,
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
    // Phase 8: Relational metrics (preserved from previous if present)
    relationalTraceScore: previousMetrics.relationalTraceScore,
    relationalFamiliarityGain: previousMetrics.relationalFamiliarityGain,
    boundaryPermeabilityShift: previousMetrics.boundaryPermeabilityShift,
    partnerAbsenceEffect: previousMetrics.partnerAbsenceEffect,
    partnerConditionedDivergence: previousMetrics.partnerConditionedDivergence,
    protoCommunicationLeakage: previousMetrics.protoCommunicationLeakage,
    relationalInfluenceScore: previousMetrics.relationalInfluenceScore,
  };
}

/**
 * Phase 8: Compute relational trace score
 * Measures accumulation of partner-specific traces
 */
export function computeRelationalTraceScore(relationalState: any): number {
  if (!relationalState) return 0;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Trace score combines strength, familiarity, and continuity confidence
  return clamp(
    relationalState.partnerTraceStrength * 0.4 +
    relationalState.partnerFamiliarity * 0.35 +
    relationalState.partnerContinuityConfidence * 0.25,
    0, 1
  );
}

/**
 * Phase 8: Compute relational familiarity gain
 * Measures rate of familiarity accumulation
 */
export function computeRelationalFamiliarityGain(
  currentFamiliarity: number,
  previousFamiliarity: number,
  framesSinceLastMeasure: number
): number {
  if (framesSinceLastMeasure < 1) return 0;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Normalize gain by frame count
  const gain = (currentFamiliarity - previousFamiliarity) / framesSinceLastMeasure;

  // Positive gain normalized to 0-1
  return clamp(gain * 1000, 0, 1);
}

/**
 * Phase 8: Compute boundary permeability shift
 * Measures change in permeability from neutral baseline
 */
export function computeBoundaryPermeabilityShift(relationalState: any): number {
  if (!relationalState) return 0;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Shift from neutral (0.5)
  const shift = Math.abs(relationalState.boundaryPermeability - 0.5);

  return clamp(shift / 0.3, 0, 1);
}

/**
 * Phase 8: Compute partner absence effect
 * Measures state drift during partner absence
 */
export function computePartnerAbsenceEffect(relationalState: any): number {
  if (!relationalState) return 0;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Absence effect combines drift and consecutive absence frames
  const absenceDriftScore = relationalState.partnerAbsenceDrift;
  const absenceLengthScore = clamp(relationalState.consecutiveAbsenceFrames / 1000, 0, 1);

  return clamp(
    absenceDriftScore * 0.6 +
    absenceLengthScore * 0.4,
    0, 1
  );
}

/**
 * Phase 8: Compute partner-conditioned divergence
 * Measures how response differs based on relational history
 */
export function computePartnerConditionedDivergence(
  responseWithFamiliarPartner: number,
  responseWithNoRelationalHistory: number
): number {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  if (responseWithNoRelationalHistory === 0) return 0;

  const divergence = Math.abs(responseWithFamiliarPartner - responseWithNoRelationalHistory) /
                     Math.max(responseWithNoRelationalHistory, 0.01);

  return clamp(divergence / 0.5, 0, 1);
}

/**
 * Phase 8: Compute proto-communication leakage
 * Measures internal state leakage signal strength
 */
export function computeProtoCommunicationLeakage(relationalState: any): number {
  if (!relationalState) return 0;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  // Leakage combines communication pressure and trace strength
  return clamp(
    relationalState.protoCommunicationPressure * 0.6 +
    relationalState.partnerTraceStrength * 0.4,
    0, 1
  );
}

/**
 * Phase 8: Compute relational influence score
 * Aggregates all relational evidence metrics
 */
export function computeRelationalInfluenceScore(
  traceScore: number,
  familiarityGain: number,
  permeabilityShift: number,
  absenceEffect: number,
  conditionedDivergence: number,
  communicationLeakage: number
): number {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

  return clamp(
    traceScore * 0.25 +
    familiarityGain * 0.15 +
    permeabilityShift * 0.15 +
    absenceEffect * 0.20 +
    conditionedDivergence * 0.15 +
    communicationLeakage * 0.10,
    0, 1
  );
}

/**
 * Phase 8: Update relational evidence metrics
 * This should be called periodically to compute relational metrics
 */
export function updateRelationalEvidenceMetrics(
  relationalState: any,
  previousMetrics: EvidenceMetrics,
  framesSinceLastMeasure: number,
  comparisonData?: {
    responseWithFamiliarPartner: number;
    responseWithNoRelationalHistory: number;
  }
): Partial<EvidenceMetrics> {
  if (!relationalState) {
    return {
      relationalTraceScore: 0,
      relationalFamiliarityGain: 0,
      boundaryPermeabilityShift: 0,
      partnerAbsenceEffect: 0,
      partnerConditionedDivergence: 0,
      protoCommunicationLeakage: 0,
      relationalInfluenceScore: 0,
    };
  }

  const traceScore = computeRelationalTraceScore(relationalState);

  const familiarityGain = computeRelationalFamiliarityGain(
    relationalState.partnerFamiliarity,
    previousMetrics.relationalTraceScore ?? 0,  // Using previous trace as proxy
    framesSinceLastMeasure
  );

  const permeabilityShift = computeBoundaryPermeabilityShift(relationalState);

  const absenceEffect = computePartnerAbsenceEffect(relationalState);

  const conditionedDivergence = comparisonData
    ? computePartnerConditionedDivergence(
        comparisonData.responseWithFamiliarPartner,
        comparisonData.responseWithNoRelationalHistory
      )
    : previousMetrics.partnerConditionedDivergence ?? 0;

  const communicationLeakage = computeProtoCommunicationLeakage(relationalState);

  const influenceScore = computeRelationalInfluenceScore(
    traceScore,
    familiarityGain,
    permeabilityShift,
    absenceEffect,
    conditionedDivergence,
    communicationLeakage
  );

  return {
    relationalTraceScore: traceScore,
    relationalFamiliarityGain: familiarityGain,
    boundaryPermeabilityShift: permeabilityShift,
    partnerAbsenceEffect: absenceEffect,
    partnerConditionedDivergence: conditionedDivergence,
    protoCommunicationLeakage: communicationLeakage,
    relationalInfluenceScore: influenceScore,
  };
}
