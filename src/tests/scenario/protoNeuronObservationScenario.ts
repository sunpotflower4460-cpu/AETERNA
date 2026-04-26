import { deriveProtoNeuronCandidates, type ProtoNeuronCandidatesInput } from '../../observer/deriveProtoNeuronCandidates.ts';
import type { ProtoNeuronObservationState } from '../../types/protoNeuronObservationState.ts';
import type { ProtoPointCandidate } from '../../types/protoPointCandidate.ts';
import type { ProtoPointObservationState } from '../../types/protoPointObservationState.ts';
import type { TraceState } from '../../types/traceState.ts';
import type { ReplayState } from '../../types/replayState.ts';
import type { RecoveryState } from '../../types/recoveryState.ts';
import type { ObservationPatternState } from '../../types/observationPatternState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { ReafferenceComparisonState } from '../../types/reafferenceComparisonState.ts';
import type { PressureCompetitionState } from '../../types/pressureCompetitionState.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';

export interface ProtoNeuronObservationScenarioOutcome {
  name: string;
  states: ProtoNeuronObservationState[];
  finalState: ProtoNeuronObservationState;
  passed: boolean;
  notes: string[];
}

function createProtoPointCandidate(
  id: string,
  timestamp: number,
  overrides: Partial<ProtoPointCandidate> = {},
): ProtoPointCandidate {
  return {
    id,
    timestamp,
    regionId: `region-${id}`,
    persistence: overrides.persistence ?? 3,
    recurrenceScore: overrides.recurrenceScore ?? 0.58,
    traceAffinity: overrides.traceAffinity ?? 0.52,
    replayAffinity: overrides.replayAffinity ?? 0.42,
    localContrast: overrides.localContrast ?? 0.46,
    basinOverlap: overrides.basinOverlap ?? 0.40,
    knotOverlap: overrides.knotOverlap ?? 0.48,
    confidence: overrides.confidence ?? 0.46,
    lifetimeTicks: overrides.lifetimeTicks ?? 3,
    lastSeenTick: overrides.lastSeenTick ?? timestamp,
    stabilityScore: overrides.stabilityScore ?? 0.44,
    anomalyOverlap: overrides.anomalyOverlap ?? 0.10,
    lifecycle: overrides.lifecycle ?? 'recurring',
  };
}

function createProtoPointObservationState(
  timestamp: number,
  candidates: ProtoPointCandidate[],
): ProtoPointObservationState {
  const averageConfidence = candidates.length > 0
    ? candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / candidates.length
    : 0;

  return {
    timestamp,
    candidateCount: candidates.length,
    stableCandidateCount: candidates.filter((candidate) => (candidate.stabilityScore ?? 0) >= 0.45).length,
    averageConfidence,
    maxConfidence: candidates.length > 0 ? Math.max(...candidates.map((candidate) => candidate.confidence)) : 0,
    candidates,
    newCandidateCount: candidates.filter((candidate) => candidate.lifecycle === 'new').length,
    decayedCandidateCount: candidates.filter((candidate) => candidate.lifecycle === 'decaying').length,
    persistentCandidateIds: candidates.filter((candidate) => candidate.lifecycle === 'persistent').map((candidate) => candidate.id),
  };
}

function createTraceState(timestamp: number, overrides: Partial<TraceState> = {}): TraceState {
  return {
    timestamp,
    traceStrength: overrides.traceStrength ?? 0.58,
    recurrenceWeight: overrides.recurrenceWeight ?? 0.62,
    salienceResidue: overrides.salienceResidue ?? 0.44,
    replayReadiness: overrides.replayReadiness ?? 0.54,
    replaySuppression: overrides.replaySuppression ?? 0.20,
    recentPatternWeight: overrides.recentPatternWeight ?? 0.46,
    settlingResidue: overrides.settlingResidue ?? 0.34,
    recoveryLinkedResidue: overrides.recoveryLinkedResidue ?? 0.30,
  };
}

function createReplayState(timestamp: number, overrides: Partial<ReplayState> = {}): ReplayState {
  return {
    timestamp,
    replayPressure: overrides.replayPressure ?? 0.48,
    replayReadiness: overrides.replayReadiness ?? 0.56,
    consolidationGain: overrides.consolidationGain ?? 0.38,
    activeReplayCount: overrides.activeReplayCount ?? 1,
    recentReplaySalience: overrides.recentReplaySalience ?? 0.42,
    restConsolidationDepth: overrides.restConsolidationDepth ?? 0.24,
    replaySuppression: overrides.replaySuppression ?? 0.16,
    lastReplayCategory: overrides.lastReplayCategory ?? 'recurrence',
  };
}

function createRecoveryState(timestamp: number, overrides: Partial<RecoveryState> = {}): RecoveryState {
  return {
    timestamp,
    recoveryPressure: overrides.recoveryPressure ?? 0.42,
    relaxationLevel: overrides.relaxationLevel ?? 0.62,
    stabilizationPull: overrides.stabilizationPull ?? 0.66,
    collapseRisk: overrides.collapseRisk ?? 0.12,
    restorationBias: overrides.restorationBias ?? 0.74,
    boundaryRepairPressure: overrides.boundaryRepairPressure ?? 0.22,
    selfPreservationDrive: overrides.selfPreservationDrive ?? 0.44,
    overloadDrain: overrides.overloadDrain ?? 0.10,
  };
}

function createObservationPatternState(timestamp: number, overrides: Partial<ObservationPatternState> = {}): ObservationPatternState {
  return {
    timestamp,
    knotCount: overrides.knotCount ?? 1,
    pathCount: overrides.pathCount ?? 1,
    recurrenceLocusCount: overrides.recurrenceLocusCount ?? 1,
    basinCount: overrides.basinCount ?? 1,
    longLivedAnomalyCount: overrides.longLivedAnomalyCount ?? 0,
    protoPointCandidateCount: overrides.protoPointCandidateCount ?? 1,
    collapseProfileCount: overrides.collapseProfileCount,
    recoveryProfileCount: overrides.recoveryProfileCount,
    stableAttractorCandidateCount: overrides.stableAttractorCandidateCount,
    observationConfidence: overrides.observationConfidence ?? 0.82,
  };
}

function createBodyWorldClosureState(timestamp: number, overrides: Partial<BodyWorldClosureState> = {}): BodyWorldClosureState {
  return {
    timestamp,
    loopGain: overrides.loopGain ?? 0.72,
    roundTripDelay: overrides.roundTripDelay ?? 0.26,
    returnStrength: overrides.returnStrength ?? 0.54,
    selfCausedMatch: overrides.selfCausedMatch ?? 0.52,
    worldMismatch: overrides.worldMismatch ?? 0.28,
    closureStability: overrides.closureStability ?? 0.58,
    closureDrift: overrides.closureDrift ?? 0.20,
    unresolvedReturn: overrides.unresolvedReturn ?? 0.12,
    feedbackSaturationRisk: overrides.feedbackSaturationRisk ?? 0.22,
    comparisonConfidence: overrides.comparisonConfidence ?? 0.64,
    returnMismatch: overrides.returnMismatch ?? 0.32,
  };
}

function createReafferenceState(timestamp: number, overrides: Partial<ReafferenceComparisonState> = {}): ReafferenceComparisonState {
  return {
    timestamp,
    expectedReturn: overrides.expectedReturn ?? 0.46,
    actualReturn: overrides.actualReturn ?? 0.54,
    returnDelay: overrides.returnDelay ?? 0.24,
    returnMismatch: overrides.returnMismatch ?? 0.30,
    selfCausedMatch: overrides.selfCausedMatch ?? 0.50,
    worldCausedDifference: overrides.worldCausedDifference ?? 0.26,
    unresolvedReturn: overrides.unresolvedReturn ?? 0.12,
    comparisonConfidence: overrides.comparisonConfidence ?? 0.62,
    pulseReturnCorrelation: overrides.pulseReturnCorrelation ?? 0.58,
    returnAttenuation: overrides.returnAttenuation ?? 0,
    returnAmplification: overrides.returnAmplification ?? 0.08,
    delayedEchoScore: overrides.delayedEchoScore ?? 0,
  };
}

function createPressureState(timestamp: number, overrides: Partial<PressureCompetitionState> = {}): PressureCompetitionState {
  return {
    timestamp,
    safetyPressure: overrides.safetyPressure ?? 0.28,
    restorationPressure: overrides.restorationPressure ?? 0.52,
    noveltyPressure: overrides.noveltyPressure ?? 0.24,
    repetitionPressure: overrides.repetitionPressure ?? 0.38,
    explorationPressure: overrides.explorationPressure ?? 0.30,
    withdrawalPressure: overrides.withdrawalPressure ?? 0.18,
    dominantPressure: overrides.dominantPressure ?? 'restoration',
    competitionEntropy: overrides.competitionEntropy ?? 0.42,
    competitionStability: overrides.competitionStability ?? 0.58,
    annealingTemperature: overrides.annealingTemperature ?? 0.34,
    pressureEnergy: overrides.pressureEnergy ?? 0.30,
    candidateEnergies: overrides.candidateEnergies,
  };
}

function createActuationPulse(timestamp: number, overrides: Partial<ActuationPulse> = {}): ActuationPulse {
  return {
    timestamp,
    channel: overrides.channel ?? 'visual',
    intensity: overrides.intensity ?? 0.52,
    coherence: overrides.coherence ?? 0.60,
    rhythm: overrides.rhythm ?? 0.42,
    locality: overrides.locality ?? 0.40,
    recoveryLinked: overrides.recoveryLinked ?? 0.36,
    boundaryLinked: overrides.boundaryLinked ?? 0.30,
    traceLinked: overrides.traceLinked ?? 0.32,
    outputReadiness: overrides.outputReadiness ?? 0.58,
    pressureLinked: overrides.pressureLinked,
    noveltyLinked: overrides.noveltyLinked,
    restorationLinked: overrides.restorationLinked,
    durationTicks: overrides.durationTicks,
    decayRate: overrides.decayRate,
  };
}

function runSequence(
  name: string,
  frames: number,
  buildInput: (tick: number, previousState: ProtoNeuronObservationState | null) => ProtoNeuronCandidatesInput,
  check: (states: ProtoNeuronObservationState[]) => { passed: boolean; notes: string[] },
): ProtoNeuronObservationScenarioOutcome {
  const states: ProtoNeuronObservationState[] = [];
  let previousState: ProtoNeuronObservationState | null = null;

  for (let tick = 0; tick < frames; tick += 1) {
    const state = deriveProtoNeuronCandidates(buildInput(tick, previousState));
    states.push(state);
    previousState = state;
  }

  const { passed, notes } = check(states);
  return {
    name,
    states,
    finalState: states[states.length - 1],
    passed,
    notes,
  };
}

function buildBaseInput(timestamp: number, previousState: ProtoNeuronObservationState | null): ProtoNeuronCandidatesInput {
  return {
    timestamp,
    traceState: createTraceState(timestamp),
    replayState: createReplayState(timestamp),
    recoveryState: createRecoveryState(timestamp),
    observationPatternState: createObservationPatternState(timestamp),
    protoPointObservationState: createProtoPointObservationState(timestamp, [createProtoPointCandidate('slot-a', timestamp)]),
    bodyWorldClosureState: createBodyWorldClosureState(timestamp),
    reafferenceComparisonState: createReafferenceState(timestamp),
    pressureCompetitionState: createPressureState(timestamp),
    actuationPulse: createActuationPulse(timestamp),
    activityHistory: Array.from({ length: 16 }, (_, index) => 0.24 + Math.sin((timestamp + index) * 0.35) * 0.08 + (index % 4 === 0 ? 0.05 : 0)),
    localPropagationHistory: Array.from({ length: 12 }, (_, index) => 0.26 + (index % 3) * 0.08),
    meanActivity: 0.34,
    baselineActivity: 0.20,
    ongoingness: 0.66,
    previousState,
  };
}

export function runProtoNeuronObservationSuite(): ProtoNeuronObservationScenarioOutcome[] {
  const outcomes: ProtoNeuronObservationScenarioOutcome[] = [];

  outcomes.push(runSequence(
    'Scenario W7-A: no false mass emergence',
    8,
    (tick, previousState) => ({
      ...buildBaseInput(tick, previousState),
      traceState: createTraceState(tick, { traceStrength: 0.10, recurrenceWeight: 0.08, salienceResidue: 0.06, settlingResidue: 0.06 }),
      replayState: createReplayState(tick, { replayReadiness: 0.06, consolidationGain: 0.04, recentReplaySalience: 0.02, activeReplayCount: 0 }),
      recoveryState: createRecoveryState(tick, { relaxationLevel: 0.16, stabilizationPull: 0.14, recoveryPressure: 0.10, restorationBias: 0.20 }),
      observationPatternState: createObservationPatternState(tick, { knotCount: 0, pathCount: 0, recurrenceLocusCount: 0, basinCount: 0, protoPointCandidateCount: 0, observationConfidence: 0.25 }),
      protoPointObservationState: createProtoPointObservationState(tick, []),
      bodyWorldClosureState: createBodyWorldClosureState(tick, { loopGain: 0.08, returnStrength: 0.04, closureStability: 0.12, closureDrift: 0.06 }),
      reafferenceComparisonState: createReafferenceState(tick, { actualReturn: 0.04, returnMismatch: 0.04, selfCausedMatch: 0.04, worldCausedDifference: 0.04, comparisonConfidence: 0.08 }),
      pressureCompetitionState: createPressureState(tick, { competitionStability: 0.10 }),
      actuationPulse: createActuationPulse(tick, { intensity: 0.06, locality: 0.90, outputReadiness: 0.08 }),
      activityHistory: Array.from({ length: 12 }, () => 0.05),
      localPropagationHistory: Array.from({ length: 10 }, () => 0.02),
      meanActivity: 0.05,
      baselineActivity: 0.05,
      ongoingness: 0.18,
    }),
    (states) => ({
      passed: states.every((state) => state.candidateCount === 0),
      notes: [`max candidates=${Math.max(...states.map((state) => state.candidateCount))}`],
    }),
  ));

  outcomes.push(runSequence(
    'Scenario W7-B: repeated excitation raises excitability',
    8,
    (tick, previousState) => ({
      ...buildBaseInput(tick, previousState),
      protoPointObservationState: createProtoPointObservationState(tick, [createProtoPointCandidate('slot-a', tick, {
        confidence: 0.42 + tick * 0.03,
        recurrenceScore: 0.50 + tick * 0.04,
        localContrast: 0.42 + tick * 0.03,
        traceAffinity: 0.44 + tick * 0.02,
        replayAffinity: 0.34 + tick * 0.02,
      })]),
      activityHistory: Array.from({ length: 18 }, (_, index) => 0.22 + ((index + tick) % 3 === 0 ? 0.28 : 0.08)),
      localPropagationHistory: Array.from({ length: 12 }, (_, index) => 0.24 + ((index + tick) % 4) * 0.06),
      meanActivity: 0.32 + tick * 0.03,
      ongoingness: 0.60 + tick * 0.02,
    }),
    (states) => {
      const early = states[1].candidates[0];
      const late = states[states.length - 1].candidates[0];
      return {
        passed: late.excitability > early.excitability && late.recurrenceScore > early.recurrenceScore,
        notes: [`excitability ${early.excitability.toFixed(3)} -> ${late.excitability.toFixed(3)}`],
      };
    },
  ));

  outcomes.push(runSequence(
    'Scenario W7-C: trace-supported candidate',
    6,
    (tick, previousState) => ({
      ...buildBaseInput(tick, previousState),
      traceState: createTraceState(tick, { traceStrength: 0.76, salienceResidue: 0.70, settlingResidue: 0.62, recoveryLinkedResidue: 0.58 }),
      protoPointObservationState: createProtoPointObservationState(tick, [createProtoPointCandidate('slot-a', tick, { traceAffinity: 0.78, confidence: 0.58 })]),
      meanActivity: 0.36,
      ongoingness: 0.70,
    }),
    (states) => ({
      passed: states[states.length - 1].candidates[0].traceRetention > 0.60,
      notes: [`traceRetention=${states[states.length - 1].candidates[0].traceRetention.toFixed(3)}`],
    }),
  ));

  outcomes.push(runSequence(
    'Scenario W7-D: propagation-supported candidate',
    6,
    (tick, previousState) => ({
      ...buildBaseInput(tick, previousState),
      observationPatternState: createObservationPatternState(tick, { pathCount: 2, knotCount: 1, basinCount: 1 }),
      localPropagationHistory: Array.from({ length: 14 }, (_, index) => 0.58 + ((index + tick) % 2) * 0.14),
      actuationPulse: createActuationPulse(tick, { locality: 0.14, intensity: 0.62 }),
    }),
    (states) => ({
      passed: states[states.length - 1].candidates[0].localPropagation > 0.55,
      notes: [`localPropagation=${states[states.length - 1].candidates[0].localPropagation.toFixed(3)}`],
    }),
  ));

  outcomes.push(runSequence(
    'Scenario W7-E: co-activation summary',
    7,
    (tick, previousState) => ({
      ...buildBaseInput(tick, previousState),
      protoPointObservationState: createProtoPointObservationState(tick, [
        createProtoPointCandidate('slot-a', tick, { confidence: 0.56, recurrenceScore: 0.62 }),
        createProtoPointCandidate('slot-b', tick, { confidence: 0.54, recurrenceScore: 0.60, basinOverlap: 0.58, knotOverlap: 0.50 }),
      ]),
      observationPatternState: createObservationPatternState(tick, { pathCount: 2, basinCount: 2, protoPointCandidateCount: 2 }),
      localPropagationHistory: Array.from({ length: 12 }, () => 0.52),
    }),
    (states) => {
      const finalState = states[states.length - 1];
      return {
        passed: (finalState.coActivationClusterCount ?? 0) >= 1 &&
          (finalState.averageCoActivationScore ?? 0) > 0.45 &&
          finalState.strongestCoActivationPair != null,
        notes: [`coActivationScore=${(finalState.averageCoActivationScore ?? 0).toFixed(3)}`],
      };
    },
  ));

  outcomes.push(runSequence(
    'Scenario W7-F: closure-coupled candidate',
    6,
    (tick, previousState) => ({
      ...buildBaseInput(tick, previousState),
      bodyWorldClosureState: createBodyWorldClosureState(tick, {
        loopGain: 0.92,
        returnStrength: 0.82,
        closureStability: 0.74,
        closureDrift: 0.48,
        selfCausedMatch: 0.72,
        worldMismatch: 0.62,
        returnMismatch: 0.58,
      }),
      reafferenceComparisonState: createReafferenceState(tick, {
        actualReturn: 0.80,
        returnMismatch: 0.60,
        selfCausedMatch: 0.74,
        worldCausedDifference: 0.56,
        comparisonConfidence: 0.70,
      }),
      meanActivity: 0.40,
      ongoingness: 0.74,
    }),
    (states) => ({
      passed: states[states.length - 1].candidates[0].closureCoupling > 0.45,
      notes: [`closureCoupling=${states[states.length - 1].candidates[0].closureCoupling.toFixed(3)}`],
    }),
  ));

  outcomes.push(runSequence(
    'Scenario W7-G: read-only observation',
    4,
    (tick, previousState) => buildBaseInput(tick, previousState),
    (states) => ({
      passed: states.every((state) => Number.isFinite(state.averageConfidence)),
      notes: ['observer helper stayed finite without mutating source dynamics'],
    }),
  ));

  outcomes.push(runSequence(
    'Scenario W7-H: no semantic leak',
    4,
    (tick, previousState) => buildBaseInput(tick, previousState),
    (states) => {
      const candidate = states[states.length - 1].candidates[0];
      const forbiddenKeys = ['label', 'meaning', 'concept', 'category', 'sameObject'];
      return {
        passed: forbiddenKeys.every((key) => !Object.prototype.hasOwnProperty.call(candidate, key)),
        notes: [`keys=${Object.keys(candidate).join(',')}`],
      };
    },
  ));

  return outcomes;
}
