import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { ObservationPatternState } from '../types/observationPatternState.ts';
import type { PressureCompetitionState } from '../types/pressureCompetitionState.ts';
import type { ProtoNeuronCandidate, ProtoNeuronCandidateLifecycle } from '../types/protoNeuronCandidate.ts';
import type {
  ProtoNeuronCoActivationPairSummary,
  ProtoNeuronObservationState,
} from '../types/protoNeuronObservationState.ts';
import type { ProtoPointCandidate } from '../types/protoPointCandidate.ts';
import type { ProtoPointObservationState } from '../types/protoPointObservationState.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';
import type { RecoveryState } from '../types/recoveryState.ts';
import type { ReplayState } from '../types/replayState.ts';
import type { TraceState } from '../types/traceState.ts';

export interface ProtoNeuronCandidatesInput {
  timestamp: number;
  traceState: TraceState | null;
  replayState: ReplayState | null;
  recoveryState: RecoveryState | null;
  observationPatternState: ObservationPatternState | null;
  protoPointObservationState: ProtoPointObservationState | null;
  bodyWorldClosureState: BodyWorldClosureState | null;
  reafferenceComparisonState: ReafferenceComparisonState | null;
  pressureCompetitionState: PressureCompetitionState | null;
  actuationPulse: ActuationPulse | null;
  activityHistory: number[];
  localPropagationHistory: number[];
  meanActivity: number;
  baselineActivity: number;
  ongoingness: number;
  previousState: ProtoNeuronObservationState | null;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function recentMean(history: number[], limit: number): number {
  if (history.length === 0) return 0;
  return average(history.slice(-Math.min(history.length, limit)).map((value) => clamp01(value)));
}

function recentPeak(history: number[], limit: number): number {
  if (history.length === 0) return 0;
  return Math.max(...history.slice(-Math.min(history.length, limit)).map((value) => clamp01(value)));
}

function countThresholdCrossings(history: number[], threshold: number, limit: number): number {
  if (history.length < 2) return 0;
  const slice = history.slice(-Math.min(history.length, limit));
  let crossings = 0;
  for (let index = 1; index < slice.length; index += 1) {
    if (slice[index - 1] < threshold && slice[index] >= threshold) {
      crossings += 1;
    }
  }
  return crossings;
}

function computeConfidence(candidate: Omit<ProtoNeuronCandidate, 'id' | 'timestamp' | 'regionId' | 'lifecycle'>): number {
  return clamp01(
    0.16 * candidate.excitability +
    0.12 * candidate.refractoryPattern +
    0.14 * candidate.localPropagation +
    0.14 * candidate.traceRetention +
    0.14 * candidate.recurrenceScore +
    0.12 * candidate.coActivationScore +
    0.10 * candidate.weakPlasticityScore +
    0.08 * candidate.closureCoupling,
  );
}

function deriveLifecycle(
  lifetimeTicks: number,
  confidence: number,
  stabilityScore: number,
  decaying: boolean,
): ProtoNeuronCandidateLifecycle {
  if (decaying) return 'decaying';
  if (lifetimeTicks <= 1) return 'new';
  if (lifetimeTicks >= 8 && stabilityScore >= 0.62 && confidence >= 0.48) return 'persistent';
  if (lifetimeTicks >= 4 && stabilityScore >= 0.48 && confidence >= 0.42) return 'stabilizing';
  return 'recurring';
}

function buildCandidate(
  timestamp: number,
  protoPointCandidate: ProtoPointCandidate,
  scores: {
    excitability: number;
    refractoryPattern: number;
    localPropagation: number;
    traceRetention: number;
    recurrenceScore: number;
    coActivationScore: number;
    weakPlasticityScore: number;
    closureCoupling: number;
  },
  previousCandidate: ProtoNeuronCandidate | undefined,
): ProtoNeuronCandidate {
  const lifetimeTicks = (previousCandidate?.lifetimeTicks ?? 0) + 1;
  const replayAffinity = clamp01(protoPointCandidate.replayAffinity ?? 0);
  const basinOverlap = clamp01(protoPointCandidate.basinOverlap ?? 0);
  const knotOverlap = clamp01(protoPointCandidate.knotOverlap ?? 0);

  const baseCandidate: Omit<ProtoNeuronCandidate, 'id' | 'timestamp' | 'regionId' | 'lifecycle'> = {
    ...scores,
    confidence: 0,
    lifetimeTicks,
    lastSeenTick: timestamp,
    stabilityScore: 0,
    replayAffinity,
    basinOverlap,
    knotOverlap,
  };

  const confidence = computeConfidence(baseCandidate);
  const stabilityScore = clamp01(confidence * 0.6 + Math.min(lifetimeTicks / 10, 1) * 0.4);
  const lifecycle = deriveLifecycle(
    lifetimeTicks,
    confidence,
    stabilityScore,
    confidence < 0.34 && lifetimeTicks > 2,
  );

  return {
    id: `proto-neuron-${protoPointCandidate.id}`,
    timestamp,
    regionId: protoPointCandidate.regionId,
    ...scores,
    confidence,
    lifetimeTicks,
    lastSeenTick: timestamp,
    stabilityScore,
    replayAffinity,
    basinOverlap,
    knotOverlap,
    lifecycle,
  };
}

function deriveCoActivationSummary(
  candidates: ProtoNeuronCandidate[],
  previousState: ProtoNeuronObservationState | null,
): {
  clusterCount: number;
  averageScore: number;
  repeatedCount: number;
  strongestPair: ProtoNeuronCoActivationPairSummary | null;
} {
  if (candidates.length < 2) {
    return {
      clusterCount: 0,
      averageScore: average(candidates.map((candidate) => candidate.coActivationScore)),
      repeatedCount: 0,
      strongestPair: null,
    };
  }

  const previousPairs = new Set<string>();
  const previousCandidateIds = previousState?.candidates.map((candidate) => candidate.id) ?? [];
  for (let i = 0; i < previousCandidateIds.length; i += 1) {
    for (let j = i + 1; j < previousCandidateIds.length; j += 1) {
      previousPairs.add([previousCandidateIds[i], previousCandidateIds[j]].sort().join('::'));
    }
  }

  let repeatedCount = 0;
  let strongestPair: ProtoNeuronCoActivationPairSummary | null = null;

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const candidateIds = [candidates[i].id, candidates[j].id].sort() as [string, string];
      const score = clamp01((candidates[i].coActivationScore + candidates[j].coActivationScore) / 2);
      const key = candidateIds.join('::');
      if (previousPairs.has(key)) repeatedCount += 1;
      if (strongestPair == null || score > strongestPair.score) {
        strongestPair = { candidateIds, score };
      }
    }
  }

  const highPairs = strongestPair != null && strongestPair.score >= 0.45 ? 1 : 0;
  return {
    clusterCount: highPairs,
    averageScore: average(candidates.map((candidate) => candidate.coActivationScore)),
    repeatedCount,
    strongestPair,
  };
}

export function deriveProtoNeuronCandidates(
  input: ProtoNeuronCandidatesInput,
): ProtoNeuronObservationState {
  const {
    timestamp,
    traceState,
    replayState,
    recoveryState,
    observationPatternState,
    protoPointObservationState,
    bodyWorldClosureState,
    reafferenceComparisonState,
    pressureCompetitionState,
    actuationPulse,
    activityHistory,
    localPropagationHistory,
    meanActivity,
    baselineActivity,
    ongoingness,
    previousState,
  } = input;

  const protoPointCandidates = protoPointObservationState?.candidates ?? [];
  const previousMap = new Map<string, ProtoNeuronCandidate>((previousState?.candidates ?? []).map((candidate) => [candidate.id, candidate]));
  const activityAboveBaseline = clamp01(
    (meanActivity - baselineActivity) / Math.max(Math.abs(baselineActivity) + 0.08, 0.12),
  );
  const activationMean = recentMean(activityHistory, 24);
  const activationPeak = recentPeak(activityHistory, 24);
  const recurrenceBursts = countThresholdCrossings(activityHistory, Math.max(baselineActivity + 0.03, 0.08), 30);
  const propagationMean = recentMean(localPropagationHistory, 20);
  const propagationPeak = recentPeak(localPropagationHistory, 20);
  const propagationSupport = clamp01(
    propagationMean * 0.55 +
    propagationPeak * 0.25 +
    clamp01((observationPatternState?.pathCount ?? 0) / 2) * 0.20,
  );

  const traceStrength = clamp01(traceState?.traceStrength ?? 0);
  const recurrenceWeight = clamp01(traceState?.recurrenceWeight ?? 0);
  const salienceResidue = clamp01(traceState?.salienceResidue ?? 0);
  const settlingResidue = clamp01(traceState?.settlingResidue ?? 0);
  const recoveryLinkedResidue = clamp01(traceState?.recoveryLinkedResidue ?? 0);
  const replayReadiness = clamp01(replayState?.replayReadiness ?? 0);
  const consolidationGain = clamp01(replayState?.consolidationGain ?? 0);
  const replaySuppression = clamp01(replayState?.replaySuppression ?? 0);
  const recentReplaySalience = clamp01(replayState?.recentReplaySalience ?? 0);
  const relaxationLevel = clamp01(recoveryState?.relaxationLevel ?? 0);
  const stabilizationPull = clamp01(recoveryState?.stabilizationPull ?? 0);
  const competitionStability = clamp01(pressureCompetitionState?.competitionStability ?? 0);

  const closureCouplingBase = clamp01(
    clamp01((bodyWorldClosureState?.loopGain ?? 0) / 1.1) * 0.20 +
    clamp01(bodyWorldClosureState?.returnStrength ?? 0) * 0.18 +
    clamp01(bodyWorldClosureState?.closureDrift ?? 0) * 0.10 +
    clamp01(bodyWorldClosureState?.closureStability ?? 0) * 0.12 +
    clamp01(reafferenceComparisonState?.returnMismatch ?? bodyWorldClosureState?.returnMismatch ?? 0) * 0.12 +
    clamp01(reafferenceComparisonState?.selfCausedMatch ?? bodyWorldClosureState?.selfCausedMatch ?? 0) * 0.10 +
    clamp01(reafferenceComparisonState?.worldCausedDifference ?? bodyWorldClosureState?.worldMismatch ?? 0) * 0.10 +
    clamp01(ongoingness) * 0.08,
  );

  const activeCandidateCount = protoPointCandidates.length;
  const baseCoActivation = activeCandidateCount > 1
    ? clamp01((activeCandidateCount - 1) / 2)
    : 0;

  const candidates: ProtoNeuronCandidate[] = [];

  for (const protoPointCandidate of protoPointCandidates) {
    const protoPointConfidence = clamp01(protoPointCandidate.confidence);
    const recurrenceScore = clamp01(
      protoPointCandidate.recurrenceScore * 0.45 +
      recurrenceWeight * 0.20 +
      clamp01(recurrenceBursts / 4) * 0.20 +
      clamp01(protoPointCandidate.replayAffinity) * 0.15,
    );

    const excitability = clamp01(
      protoPointCandidate.localContrast * 0.24 +
      activityAboveBaseline * 0.24 +
      activationMean * 0.14 +
      activationPeak * 0.10 +
      recurrenceScore * 0.18 +
      protoPointConfidence * 0.10,
    );

    const refractoryPattern = clamp01(
      relaxationLevel * 0.24 +
      stabilizationPull * 0.18 +
      replaySuppression * 0.18 +
      settlingResidue * 0.16 +
      (1 - clamp01(recurrenceBursts / 6)) * 0.14 +
      competitionStability * 0.10,
    );

    const localPropagation = clamp01(
      propagationSupport * 0.46 +
      clamp01((observationPatternState?.pathCount ?? 0) / 2) * 0.20 +
      clamp01(1 - (actuationPulse?.locality ?? 1)) * 0.14 +
      protoPointCandidate.localContrast * 0.10 +
      protoPointConfidence * 0.10,
    );

    const traceRetention = clamp01(
      clamp01(protoPointCandidate.traceAffinity) * 0.34 +
      traceStrength * 0.22 +
      salienceResidue * 0.14 +
      settlingResidue * 0.14 +
      recoveryLinkedResidue * 0.10 +
      recentReplaySalience * 0.06,
    );

    const coActivationScore = clamp01(
      baseCoActivation * 0.55 +
      clamp01(previousState?.averageCoActivationScore ?? 0) * 0.15 +
      clamp01((protoPointObservationState?.candidateCount ?? 0) / 3) * 0.15 +
      clamp01(protoPointCandidate.basinOverlap ?? 0) * 0.15,
    );

    const previousCandidate = previousMap.get(`proto-neuron-${protoPointCandidate.id}`);
    const lifetimeTicks = (previousCandidate?.lifetimeTicks ?? 0) + 1;
    const weakPlasticityScore = clamp01(
      recurrenceScore * 0.24 +
      coActivationScore * 0.22 +
      consolidationGain * 0.20 +
      recurrenceWeight * 0.14 +
      replayReadiness * 0.10 +
      Math.min(lifetimeTicks / 10, 1) * 0.10,
    );

    const closureCoupling = clamp01(
      closureCouplingBase * 0.78 +
      clamp01(protoPointCandidate.replayAffinity) * 0.10 +
      clamp01((bodyWorldClosureState?.feedbackSaturationRisk ?? 0)) * 0.04 +
      clamp01(actuationPulse?.intensity ?? 0) * 0.08,
    );

    const conditionsMet =
      (excitability >= 0.38 ? 1 : 0) +
      (refractoryPattern >= 0.30 ? 1 : 0) +
      (localPropagation >= 0.34 ? 1 : 0) +
      (traceRetention >= 0.34 ? 1 : 0) +
      (recurrenceScore >= 0.36 ? 1 : 0) +
      (coActivationScore >= 0.24 ? 1 : 0) +
      (weakPlasticityScore >= 0.30 ? 1 : 0) +
      (closureCoupling >= 0.20 ? 1 : 0);

    if (protoPointConfidence < 0.28 || conditionsMet < 4) {
      continue;
    }

    const candidate = buildCandidate(
      timestamp,
      protoPointCandidate,
      {
        excitability,
        refractoryPattern,
        localPropagation,
        traceRetention,
        recurrenceScore,
        coActivationScore,
        weakPlasticityScore,
        closureCoupling,
      },
      previousCandidate,
    );

    if (candidate.confidence >= 0.40) {
      candidates.push(candidate);
    }
  }

  for (const previousCandidate of previousState?.candidates ?? []) {
    if (candidates.some((candidate) => candidate.id === previousCandidate.id)) {
      continue;
    }
    if ((timestamp - (previousCandidate.lastSeenTick ?? previousCandidate.timestamp)) > 2) {
      continue;
    }
    const decayedConfidence = clamp01(previousCandidate.confidence * 0.72);
    if (decayedConfidence < 0.20) {
      continue;
    }
    candidates.push({
      ...previousCandidate,
      timestamp,
      confidence: decayedConfidence,
      lifecycle: 'decaying',
      stabilityScore: clamp01((previousCandidate.stabilityScore ?? previousCandidate.confidence) * 0.82),
    });
  }

  const coActivationSummary = deriveCoActivationSummary(candidates, previousState);
  const candidateCount = candidates.length;
  const stableCandidates = candidates.filter((candidate) => candidate.lifecycle === 'stabilizing' || candidate.lifecycle === 'persistent');
  const averageConfidence = average(candidates.map((candidate) => candidate.confidence));
  const maxConfidence = candidateCount > 0 ? Math.max(...candidates.map((candidate) => candidate.confidence)) : 0;
  const averageExcitability = average(candidates.map((candidate) => candidate.excitability));
  const averagePropagation = average(candidates.map((candidate) => candidate.localPropagation));
  const averageTraceRetention = average(candidates.map((candidate) => candidate.traceRetention));
  const averageClosureCoupling = average(candidates.map((candidate) => candidate.closureCoupling));

  return {
    timestamp,
    candidateCount,
    stableCandidateCount: stableCandidates.length,
    averageConfidence,
    maxConfidence,
    averageExcitability,
    averagePropagation,
    averageTraceRetention,
    averageClosureCoupling,
    candidates,
    newCandidateCount: candidates.filter((candidate) => candidate.lifecycle === 'new').length,
    decayedCandidateCount: candidates.filter((candidate) => candidate.lifecycle === 'decaying').length,
    persistentCandidateIds: candidates.filter((candidate) => candidate.lifecycle === 'persistent').map((candidate) => candidate.id),
    coActivationClusterCount: coActivationSummary.clusterCount,
    averageCoActivationScore: coActivationSummary.averageScore,
    repeatedCoActivationCount: coActivationSummary.repeatedCount,
    strongestCoActivationPair: coActivationSummary.strongestPair,
  };
}
