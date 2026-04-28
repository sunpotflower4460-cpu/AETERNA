/**
 * Headless/minimal-visual scenario runner for reproducible experiments
 *
 * This runner executes AETERNA organism updates in a controlled environment
 * without relying on browser rendering or user interaction.
 */

import { AeternaNetwork } from '../core/AeternaNetwork.js';
import { PhysicalDisk } from '../core/PhysicalDisk.js';
import { TouchMemory } from '../perception/TouchMemory.js';
import { updateHomeostaticState } from '../organism/survivalState.ts';
import { runInteroceptionStage } from '../stages/runInteroceptionStage.ts';
import { runSelfWorldModelStage } from '../stages/runSelfWorldModelStage.ts';
import { deriveFeltState } from '../organism/deriveFeltState.ts';
import { deriveArousalAwareness } from '../organism/deriveArousalAwareness.ts';
import { ReplayQueue } from '../organism/replayQueue.ts';
import { deriveTraceState } from '../organism/deriveTraceState.ts';
import { deriveReplayState } from '../organism/deriveReplayState.ts';
import { deriveNeedMotivation } from '../organism/deriveNeedMotivation.ts';
import { deriveOpenStateSnapshot } from '../organism/deriveOpenStateSnapshot.ts';
import { classifyCollapseMode, classifyRecoveryTrajectory, deriveRecoveryState } from '../organism/deriveRecoveryState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type {
    OrganismEnergyState,
    OrganismHomeostaticState,
    OrganismLivingState,
} from '../types/organismState.ts';
import type { ReplayState } from '../types/replayState.ts';
import type { TraceState } from '../types/traceState.ts';
import type { RecoveryState, RecoveryTrajectoryLabel, CollapseModeLabel } from '../types/recoveryState.ts';
import { derivePerturbationEvent } from '../perception/derivePerturbationEvent.ts';
import { derivePredictionMismatch } from '../prediction/derivePredictionMismatch.ts';
import { deriveObservationPatterns } from '../observer/deriveObservationPatterns.ts';
import type { ObservationPatternState } from '../types/observationPatternState.ts';
import { derivePressureCompetition } from '../organism/derivePressureCompetition.ts';
import { deriveProtoPointCandidates } from '../observer/deriveProtoPointCandidates.ts';
import type { ProtoPointObservationState } from '../types/protoPointObservationState.ts';
import { deriveBodySurfaceState } from '../body/deriveBodySurfaceState.ts';
import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import { deriveActuationPulse } from '../actuation/deriveActuationPulse.ts';
import type { ActuationPulse, ActuationPulseChannel } from '../types/actuationPulse.ts';
import { initializeWorldMediumState } from '../world/initializeWorldMediumState.ts';
import { updateWorldMedium } from '../world/updateWorldMedium.ts';
import { deriveSensoryReturn } from '../perception/deriveSensoryReturn.ts';
import { deriveReafferenceComparison } from '../closure/deriveReafferenceComparison.ts';
import { deriveBodyWorldClosureState } from '../closure/deriveBodyWorldClosureState.ts';
import { deriveDynamicViabilityState } from '../closure/deriveDynamicViabilityState.ts';
import { deriveMediumProfileState } from '../closure/deriveMediumProfileState.ts';
import { deriveMinimalNaturalFeedback } from '../closure/deriveMinimalNaturalFeedback.ts';
import { applyMinimalNaturalFeedback } from '../closure/applyMinimalNaturalFeedback.ts';
import { deriveProtoNeuronCandidates } from '../observer/deriveProtoNeuronCandidates.ts';
import { deriveLocalExcitabilityField } from '../observer/deriveLocalExcitabilityField.ts';
import { deriveRepeatedFlowPaths } from '../observer/deriveRepeatedFlowPaths.ts';
import { deriveProtoNetworkCandidates } from '../observer/deriveProtoNetworkCandidates.ts';
import type { ProtoNetworkObservationState } from '../types/protoNetworkCandidate.ts';
import type { ProtoNeuronCandidate } from '../types/protoNeuronCandidate.ts';
import type { ProtoNeuronObservationState, ProtoNeuronCoActivationPairSummary } from '../types/protoNeuronObservationState.ts';
import type { LocalExcitabilityFieldState } from '../types/localExcitabilityField.ts';
import type { RepeatedFlowPathObservationState } from '../types/repeatedFlowPath.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../types/dynamicViabilityState.ts';
import type { MediumProfileState } from '../types/mediumProfileState.ts';
import {
    createNeutralNaturalFeedbackAdjustment,
    normalizeNaturalFeedbackFlags,
    type NaturalFeedbackAblationFlags,
    type NaturalFeedbackAdjustment,
    type NaturalFeedbackApplicationReport,
    type NaturalFeedbackTarget,
} from '../types/naturalFeedbackAdjustment.ts';

export interface TouchEvent {
    frame: number;
    x: number;  // normalized 0-1
    y: number;  // normalized 0-1
    pressure?: number;
    duration?: number;  // frames to hold
}

export interface ScenarioConfig {
    name: string;
    seed?: number;
    totalFrames: number;
    dt?: number;  // time step in seconds (default 1/60)
    touchScript?: TouchEvent[];
    segments?: number;  // network size (default 72)
    collectMetrics?: boolean;  // whether to collect detailed metrics (default true)
    metricsInterval?: number;  // frames between metric snapshots (default 10)
    initialHomeostaticState?: Partial<OrganismHomeostaticState>;
    initialLivingState?: Partial<OrganismLivingState>;
    initialEnergyState?: Partial<OrganismEnergyState>;
    initialWorldMediumState?: Partial<WorldMediumState>;
    naturalFeedbackFlags?: Partial<NaturalFeedbackAblationFlags>;
}

export interface MetricsSnapshot {
    frame: number;
    meanActivity: number;
    maxActivity: number;
    variance: number;
    ignitionRatio: number;
    phiApprox: number;
    phaseCoherence: number;
    meanPredictionError: number;
    baselineLevel: number;
    residueLevel: number;
    meanRawTouch: number;
    meanTouchOnset: number;
    meanTouchOffset: number;
    meanTouchNovelty: number;
    activeTouchCount: number;
    modeState: string;
    actionState: string;
    energy: number;
    stability: number;
    overload: number;
    energyReserve: number;
    hasNaN: boolean;
    // Phase 2: Living state metrics
    fatigue?: number;
    coherenceMemory?: number;
    preferredErgodicity?: number;
    longBaselineTone?: number;
    recentHistoryBias?: number;
    residueBias?: number;
    predictionSensitivity?: number;
    touchNeedBaseline?: number;
    // Phase 3: Touch expectation metrics
    expectedTouchInterval?: number;
    expectedTouchStrength?: number;
    touchExpectationConfidence?: number;
    touchSpatialSurprise?: number;
    touchTemporalSurprise?: number;
    touchStrengthSurprise?: number;
    touchMissingSurprise?: number;
    touchReleaseSurprise?: number;
    touchTotalSurprise?: number;
    meanTouchHabituation?: number;
    holdContinuationExpectation?: number;
    touchAbsenceError?: number;
    isTouchHolding?: number;
    touchHoldDuration?: number;
    // Q1-2: Touch backaction metrics
    touchBackactionGain?: number;
    touchBackactionSurpriseGain?: number;
    touchBackactionBoundaryModulation?: number;
    touchBackactionOpennessModulation?: number;
    touchBackactionCoherenceShift?: number;
    touchBackactionAwarenessCoupling?: number;
    touchBackactionOverloadAmplification?: number;
    touchBackactionFamiliarityDamping?: number;
    // Phase 4: Homeostatic state metrics
    stabilityIndex?: number;
    boundaryIntegrity?: number;
    selfPreservationBias?: number;
    irritabilityLevel?: number;
    restorationBias?: number;
    collapseRisk?: number;
    homeostaticStress?: number;
    preferredStabilityBand?: number;
    consecutiveQuietFrames?: number;
    // Beautiful Loop L1: Interoception packet metrics
    bl_energySense?: number;
    bl_overloadSense?: number;
    bl_coherenceSense?: number;
    bl_boundarySense?: number;
    bl_restorationSense?: number;
    bl_perturbationPressure?: number;
    // Beautiful Loop L1: Self/World model packet metrics
    bl_selfCoherence?: number;
    bl_selfContinuity?: number;
    bl_worldPressure?: number;
    bl_relationEngagement?: number;
    // A1: Felt-state vector metrics
    felt_depletion?: number;
    felt_overload?: number;
    felt_coherence?: number;
    felt_boundaryIntegrity?: number;
    felt_restorationReadiness?: number;
    felt_perturbationLoad?: number;
    felt_openness?: number;
    // A2: Arousal / awareness split metrics
    arousalLevel?: number;
    awarenessWindow?: number;
    salienceOpenness?: number;
    foregroundPressure?: number;
    restDepth?: number;
    hyperreactivity?: number;
    settlingWindow?: number;
    // A3: Replay / consolidation metrics
    traceStrength?: number;
    recurrenceWeight?: number;
    salienceResidue?: number;
    replayPressure?: number;
    replayReadiness?: number;
    consolidationGain?: number;
    activeReplayCount?: number;
    recentReplaySalience?: number;
    restConsolidationDepth?: number;
    replaySuppression?: number;
    recentPatternWeight?: number;
    settlingResidue?: number;
    recoveryLinkedResidue?: number;
    weakConsolidationDelta?: number;
    replayContributionToStabilization?: number;
    replayQueueSize?: number;
    // A4: Need / motivation metrics
    energyNeed?: number;
    safetyNeed?: number;
    restorationNeed?: number;
    contactNeed?: number;
    noveltyMotivation?: number;
    repetitionMotivation?: number;
    explorationMotivation?: number;
    settlingMotivation?: number;
    withdrawMotivation?: number;
    // Q1-1: Open-State Snapshot metrics
    openState_stabilityIndex?: number;
    openState_mixtureEntropy?: number;
    openState_dominantPole?: string | null;
    // Phase 3: Recovery profile metrics
    recoveryPressure?: number;
    relaxationLevel?: number;
    stabilizationPull?: number;
    boundaryRepairPressure?: number;
    selfPreservationDrive?: number;
    overloadDrain?: number;
    recoveryTrajectory?: RecoveryTrajectoryLabel;
    collapseMode?: CollapseModeLabel;
    // Phase 2: Perturbation mismatch metrics
    p2_mismatchLevel?: number;
    p2_surprisePressure?: number;
    p2_boundaryStress?: number;
    p2_recoveryPull?: number;
    p2_perturbationMagnitude?: number;
    p2_perturbationNovelty?: number;
    p2_perturbationExpectedness?: number;
    // Phase 5: Observation pattern state (observer-side proxy, read-only)
    obs_knotCount?: number;
    obs_pathCount?: number;
    obs_recurrenceLocusCount?: number;
    obs_basinCount?: number;
    obs_longLivedAnomalyCount?: number;
    obs_protoPointCandidateCount?: number;
    obs_collapseProfileCount?: number;
    obs_recoveryProfileCount?: number;
    obs_stableAttractorCandidateCount?: number;
    obs_observationConfidence?: number;
    // Phase 6 / Q2-1: Pressure competition state
    pc_safetyPressure?: number;
    pc_restorationPressure?: number;
    pc_noveltyPressure?: number;
    pc_repetitionPressure?: number;
    pc_explorationPressure?: number;
    pc_withdrawalPressure?: number;
    pc_dominantPressure?: string | null;
    pc_competitionEntropy?: number;
    pc_competitionStability?: number;
    pc_annealingTemperature?: number;
    pc_pressureEnergy?: number;
    // Phase 7: Proto-point observation state (observer-side proxy, read-only)
    pp_candidateCount?: number;
    pp_stableCandidateCount?: number;
    pp_averageConfidence?: number;
    pp_maxConfidence?: number;
    pp_newCandidateCount?: number;
    pp_decayedCandidateCount?: number;
    // W7: Proto-neuron observation state (observer-side proxy, read-only)
    pn_candidateCount?: number;
    pn_stableCandidateCount?: number;
    pn_averageConfidence?: number;
    pn_maxConfidence?: number;
    pn_averageExcitability?: number;
    pn_averagePropagation?: number;
    pn_averageTraceRetention?: number;
    pn_averageClosureCoupling?: number;
    pn_averageCoActivationScore?: number;
    pn_coActivationClusterCount?: number;
    pn_repeatedCoActivationCount?: number;
    // W1: Body Surface (Boundary Layer) — derived / proxy, read-only
    bs_boundaryIntegrity?: number;
    bs_surfaceSensitivity?: number;
    bs_permeability?: number;
    bs_contactReadiness?: number;
    bs_outputReadiness?: number;
    bs_localIrritability?: number;
    bs_recoveryShielding?: number;
    bs_surfaceTension?: number;
    bs_surfaceFatigue?: number;
    bs_protectiveClosure?: number;
    bs_externalContactLoad?: number;
    // W2: Actuation Pulse (derived / proxy, read-only)
    ap_channel?: ActuationPulseChannel | null;
    ap_intensity?: number;
    ap_coherence?: number;
    ap_rhythm?: number;
    ap_locality?: number;
    ap_recoveryLinked?: number;
    ap_boundaryLinked?: number;
    ap_traceLinked?: number;
    ap_outputReadiness?: number;
    ap_generatedCount?: number;
    ap_nullCount?: number;
    // S2: Dynamic Viability (observer-side proxy, read-only)
    dv_flowContinuity?: number;
    dv_energyThroughput?: number;
    dv_dissipationBalance?: number;
    dv_resistanceBalance?: number;
    dv_delayCoherence?: number;
    dv_boundaryExchange?: number;
    dv_underCouplingRisk?: number;
    dv_overCouplingRisk?: number;
    dv_saturationRisk?: number;
    dv_extinctionRisk?: number;
    dv_viabilityConfidence?: number;
    dv_returnContinuity?: number;
    dv_traceContinuity?: number;
    dv_mediumExchangeBalance?: number;
    dv_closureViability?: number;
    // S4: Medium Profile / Delay-Echo-Resistance (observer-side, read-only)
    mp_delayAverageReturnDelay?: number;
    mp_delayMinReturnDelay?: number;
    mp_delayMaxReturnDelay?: number;
    mp_delayVariance?: number;
    mp_delayStableDelayWindow?: number;
    mp_delayUnstableDelayScore?: number;
    mp_delayDelayedEchoScore?: number;
    mp_echoStrength?: number;
    mp_echoDecayRate?: number;
    mp_echoPersistence?: number;
    mp_echoSaturationRisk?: number;
    mp_echoVisualResidue?: number;
    mp_echoForceResidue?: number;
    mp_echoReturnCoupling?: number;
    mp_resistanceWorldResistance?: number;
    mp_resistanceBoundaryResistance?: number;
    mp_resistanceReturnAttenuation?: number;
    mp_resistanceMediumAbsorption?: number;
    mp_resistanceTransmissionRatio?: number;
    mp_resistanceBalance?: number;
    mp_resistanceVariance?: number;
    mp_profileConfidence?: number;
    // S3: Minimal Natural Feedback (weak medium-condition adjustment)
    nf_echoDecayAdjustment?: number;
    nf_returnGainAdjustment?: number;
    nf_pulseLeakageAdjustment?: number;
    nf_boundaryPermeabilityAdjustment?: number;
    nf_sensoryAttenuationAdjustment?: number;
    nf_traceDecayAdjustment?: number;
    nf_worldResistanceAdjustment?: number;
    nf_delayWindowAdjustment?: number;
    nf_mediumAbsorptionAdjustment?: number;
    nf_adjustmentStrength?: number;
    nf_adjustmentConfidence?: number;
    nf_feedbackEffectEstimate?: number;
    nf_overcorrectionRisk?: number;
    nf_feedbackDominanceRisk?: number;
    nf_appliedTargetCount?: number;
    nf_appliedTargets?: NaturalFeedbackTarget[];
    nf_minimalNaturalFeedbackEnabled?: boolean;
    nf_worldMediumEnabled?: boolean;
    nf_sensoryReturnEnabled?: boolean;
    nf_actuationEnabled?: boolean;
    nf_bodySurfaceEnabled?: boolean;
    nf_traceEnabled?: boolean;
    // S5: Local Excitability Field (observer-side, read-only pre-neural field profile)
    lef_regionCount?: number;
    lef_averageExcitability?: number;
    lef_maxExcitability?: number;
    lef_averageThresholdProximity?: number;
    lef_averageTraceResidue?: number;
    lef_averageReturnInfluence?: number;
    lef_averagePropagationTendency?: number;
    lef_highExcitabilityRegionCount?: number;
    lef_nearThresholdRegionCount?: number;
    lef_recoveringRegionCount?: number;
    lef_fieldConfidence?: number;
    lef_excitabilityVariance?: number;
    lef_regionalGradientStrength?: number;
    lef_localHotspotCount?: number;
    // S6: Repeated Flow Path Candidates (observer-side, read-only pre-semantic path observation)
    rfp_pathCandidateCount?: number;
    rfp_stablePathCandidateCount?: number;
    rfp_averageConfidence?: number;
    rfp_maxConfidence?: number;
    rfp_averageRecurrenceStrength?: number;
    rfp_averagePropagationConsistency?: number;
    rfp_averageTraceSupport?: number;
    rfp_averageClosureCoupling?: number;
    rfp_observationConfidence?: number;
    // S7: Proto-Network Candidate Observation (observer-side, read-only pre-semantic network-like observation)
    pnc_networkCandidateCount?: number;
    pnc_stableNetworkCandidateCount?: number;
    pnc_averageConfidence?: number;
    pnc_maxConfidence?: number;
    pnc_averageCoActivation?: number;
    pnc_averagePropagation?: number;
    pnc_averageRecurrence?: number;
    pnc_averageTraceCorrelation?: number;
    pnc_averageReplayCoReturn?: number;
    pnc_averageClosureCoupling?: number;
    pnc_observationConfidence?: number;
}

export interface ScenarioResult {
    config: ScenarioConfig;
    metrics: MetricsSnapshot[];
    summary: {
        totalFrames: number;
        finalMeanActivity: number;
        collapseFrames: number;  // frames with meanActivity < 0.01
        nanFrames: number;
        meanResponseAmplitude: number;  // for touch scenarios
        peakActivity: number;
        modeTransitions: number;
        actionTransitions: number;
        // Beautiful Loop L2: Observer packet summaries
        avgEnergySense?: number;
        avgOverloadSense?: number;
        avgSelfCoherence?: number;
        avgSelfContinuity?: number;
        avgWorldPressure?: number;
        avgRelationEngagement?: number;
        maxPerturbationPressure?: number;
        minPerturbationPressure?: number;
        // A1: Felt-state summaries
        avgDepletion?: number;
        avgOverload?: number;
        avgCoherence?: number;
        avgBoundaryIntegrity?: number;
        avgRestorationReadiness?: number;
        avgPerturbationLoad?: number;
        avgOpenness?: number;
        maxOverload?: number;
        minCoherence?: number;
        // A2: Arousal / awareness summaries
        avgArousalLevel?: number;
        avgAwarenessWindow?: number;
        avgSalienceOpenness?: number;
        avgForegroundPressure?: number;
        maxArousalLevel?: number;
        minAwarenessWindow?: number;
        // A3: Replay / consolidation summaries
        avgTraceStrength?: number;
        avgRecurrenceWeight?: number;
        avgSalienceResidue?: number;
        totalReplayCount?: number;
        avgReplayPressure?: number;
        avgReplayReadiness?: number;
        avgConsolidationGain?: number;
        maxActiveReplayCount?: number;
        avgRecentReplaySalience?: number;
        avgRecentPatternWeight?: number;
        avgSettlingResidue?: number;
        avgRecoveryLinkedResidue?: number;
        avgWeakConsolidationDelta?: number;
        avgReplayContributionToStabilization?: number;
        avgQueueFillRatio?: number;
        // A4: Need / motivation summaries
        avgEnergyNeed?: number;
        avgSafetyNeed?: number;
        avgRestorationNeed?: number;
        avgContactNeed?: number;
        avgNoveltyMotivation?: number;
        avgRepetitionMotivation?: number;
        avgExplorationMotivation?: number;
        avgSettlingMotivation?: number;
        avgWithdrawMotivation?: number;
        maxEnergyNeed?: number;
        maxSafetyNeed?: number;
        maxNoveltyMotivation?: number;
        maxWithdrawMotivation?: number;
        // Q1-1: Open-State Snapshot summaries
        avgStabilityIndex?: number;
        avgMixtureEntropy?: number;
        dominantPoleDistribution?: Record<string, number>;
        // Q1-2: Touch backaction summaries
        avgBackactionGain?: number;
        avgBackactionSurpriseGain?: number;
        avgBackactionBoundaryModulation?: number;
        avgBackactionOpennessModulation?: number;
        avgBackactionCoherenceShift?: number;
        avgBackactionFamiliarityDamping?: number;
        maxBackactionOverloadAmplification?: number;
        avgRecoveryPressure?: number;
        avgRelaxationLevel?: number;
        avgStabilizationPull?: number;
        avgRecoveryCollapseRisk?: number;
        avgBoundaryRepairPressure?: number;
        avgSelfPreservationDrive?: number;
        avgOverloadDrain?: number;
        recoveryFrameCount?: number;
        shiftFrameCount?: number;
        degradeFrameCount?: number;
        partialRepairFrameCount?: number;
        softCollapseFrames?: number;
        hardCollapseFrames?: number;
        runawayFrames?: number;
        avgRecoveryTime?: number;
        avgSettlingTime?: number;
        repeatedOverloadDegradationSlope?: number;
        // Phase 2: Perturbation mismatch summaries
        avgMismatchLevel?: number;
        avgSurprisePressure?: number;
        avgBoundaryStress?: number;
        avgRecoveryPull?: number;
        maxMismatchLevel?: number;
        // Phase 5: Observation pattern summaries (observer-side proxy, read-only)
        avgKnotCount?: number;
        avgPathCount?: number;
        avgRecurrenceLocusCount?: number;
        avgBasinCount?: number;
        avgLongLivedAnomalyCount?: number;
        avgProtoPointCandidateCount?: number;
        maxProtoPointCandidateCount?: number;
        avgObservationConfidence?: number;
        protoPointEmergenceFrames?: number;
        repeatedEmergenceCount?: number;
        // Phase 6 / Q2-1: Pressure competition summaries
        avgSafetyPressure?: number;
        avgRestorationPressure?: number;
        avgNoveltyPressure?: number;
        avgRepetitionPressure?: number;
        avgExplorationPressure?: number;
        avgWithdrawalPressure?: number;
        avgCompetitionEntropy?: number;
        avgCompetitionStability?: number;
        avgAnnealingTemperature?: number;
        avgPressureEnergy?: number;
        dominantPressureDistribution?: Record<string, number>;
        // Phase 7: Proto-point observation summaries (observer-side proxy, read-only)
        avgProtoPointCandidateCount2?: number;
        avgProtoPointStableCandidateCount?: number;
        avgProtoPointAverageConfidence?: number;
        maxProtoPointConfidence?: number;
        avgProtoPointLifetime?: number;
        recurrenceSupportedCandidateFrames?: number;
        replaySupportedCandidateFrames?: number;
        basinOverlapCandidateFrames?: number;
        protoPointPersistentFrames?: number;
        // W7: Proto-neuron observation summaries (observer-side proxy, read-only)
        avgProtoNeuronCandidateCount?: number;
        avgProtoNeuronStableCandidateCount?: number;
        avgProtoNeuronConfidence?: number;
        maxProtoNeuronConfidence?: number;
        avgProtoNeuronExcitability?: number;
        avgProtoNeuronPropagation?: number;
        avgProtoNeuronTraceRetention?: number;
        avgProtoNeuronClosureCoupling?: number;
        avgProtoNeuronCoActivationScore?: number;
        protoNeuronCoActivationClusterCount?: number;
        protoNeuronRepeatedCoActivationCount?: number;
        protoNeuronStrongestCoActivationPair?: ProtoNeuronCoActivationPairSummary | null;
        protoNeuronLastCandidates?: ProtoNeuronCandidate[];
        // W1: Body Surface (Boundary Layer) summaries — derived / proxy, read-only
        avgBsBoundaryIntegrity?: number;
        avgBsSurfaceSensitivity?: number;
        avgBsPermeability?: number;
        avgBsContactReadiness?: number;
        avgBsOutputReadiness?: number;
        avgBsLocalIrritability?: number;
        avgBsRecoveryShielding?: number;
        maxBsLocalIrritability?: number;
        minBsPermeability?: number;
        // W2: Actuation Pulse summaries — derived / proxy, read-only
        actuationPulseGeneratedCount?: number;
        actuationPulseNullCount?: number;
        actuationPulseChannelCount?: Record<ActuationPulseChannel, number>;
        avgActuationIntensity?: number;
        avgActuationCoherence?: number;
        avgActuationRhythm?: number;
        avgActuationLocality?: number;
        avgActuationRecoveryLinked?: number;
        avgActuationBoundaryLinked?: number;
        avgActuationTraceLinked?: number;
        avgActuationOutputReadiness?: number;
        // S2: Dynamic Viability summaries (observer-side, read-only)
        avgDvFlowContinuity?: number;
        avgDvEnergyThroughput?: number;
        avgDvDissipationBalance?: number;
        avgDvResistanceBalance?: number;
        avgDvDelayCoherence?: number;
        avgDvBoundaryExchange?: number;
        avgDvUnderCouplingRisk?: number;
        avgDvOverCouplingRisk?: number;
        avgDvSaturationRisk?: number;
        avgDvExtinctionRisk?: number;
        avgDvViabilityConfidence?: number;
        avgDvReturnContinuity?: number;
        avgDvTraceContinuity?: number;
        avgDvMediumExchangeBalance?: number;
        avgDvClosureViability?: number;
        avgMpDelayAverageReturnDelay?: number;
        avgMpDelayVariance?: number;
        avgMpDelayStableDelayWindow?: number;
        avgMpDelayUnstableDelayScore?: number;
        avgMpEchoStrength?: number;
        avgMpEchoDecayRate?: number;
        avgMpEchoSaturationRisk?: number;
        avgMpResistanceWorldResistance?: number;
        avgMpResistanceReturnAttenuation?: number;
        avgMpResistanceTransmissionRatio?: number;
        avgMpProfileConfidence?: number;
        avgNfEchoDecayAdjustment?: number;
        avgNfReturnGainAdjustment?: number;
        avgNfPulseLeakageAdjustment?: number;
        avgNfBoundaryPermeabilityAdjustment?: number;
        avgNfSensoryAttenuationAdjustment?: number;
        avgNfTraceDecayAdjustment?: number;
        avgNfWorldResistanceAdjustment?: number;
        avgNfDelayWindowAdjustment?: number;
        avgNfMediumAbsorptionAdjustment?: number;
        avgNfAdjustmentStrength?: number;
        avgNfAdjustmentConfidence?: number;
        avgNfFeedbackEffectEstimate?: number;
        avgNfOvercorrectionRisk?: number;
        avgNfFeedbackDominanceRisk?: number;
        naturalFeedbackAppliedTargetCount?: number;
        naturalFeedbackLastAppliedTargets?: NaturalFeedbackTarget[];
        naturalFeedbackFlags?: NaturalFeedbackAblationFlags;
        // S5: Local Excitability Field summaries (observer-side, read-only)
        avgLefAverageExcitability?: number;
        avgLefMaxExcitability?: number;
        avgLefAverageThresholdProximity?: number;
        avgLefAverageTraceResidue?: number;
        avgLefAverageReturnInfluence?: number;
        avgLefAveragePropagationTendency?: number;
        avgLefHighExcitabilityRegionCount?: number;
        avgLefNearThresholdRegionCount?: number;
        avgLefRecoveringRegionCount?: number;
        avgLefFieldConfidence?: number;
        avgLefExcitabilityVariance?: number;
        avgLefRegionalGradientStrength?: number;
        maxLefHighExcitabilityRegionCount?: number;
        maxLefNearThresholdRegionCount?: number;
        // S6: Repeated Flow Path summaries (observer-side, read-only pre-semantic path observation)
        avgRfpPathCandidateCount?: number;
        avgRfpStablePathCandidateCount?: number;
        avgRfpAverageConfidence?: number;
        maxRfpMaxConfidence?: number;
        avgRfpAverageRecurrenceStrength?: number;
        avgRfpAveragePropagationConsistency?: number;
        avgRfpAverageTraceSupport?: number;
        avgRfpAverageClosureCoupling?: number;
        avgRfpObservationConfidence?: number;
        rfpStablePathFrames?: number;
        // S7: Proto-Network Candidate Observation summaries
        avgPncNetworkCandidateCount?: number;
        avgPncStableNetworkCandidateCount?: number;
        avgPncAverageConfidence?: number;
        maxPncMaxConfidence?: number;
        avgPncAverageCoActivation?: number;
        avgPncAveragePropagation?: number;
        avgPncAverageRecurrence?: number;
        avgPncAverageTraceCorrelation?: number;
        avgPncAverageReplayCoReturn?: number;
        avgPncAverageClosureCoupling?: number;
        avgPncObservationConfidence?: number;
        pncStableNetworkFrames?: number;
        // Phase 1: Ongoingness metrics
        saturationFrames: number;    // frames where maxActivity > 8.0 (soft-clamp onset threshold; values above are suppressed but not clamped)
        saturationRate: number;      // saturationFrames / totalFrames
        collapseRate: number;        // collapseFrames / totalFrames
        spontaneousIgnitionCount: number;  // times activity rises >0.05 from below quiet-floor
        quietBaselineFloor: number;  // mean activity during frames with no touch input
        ongoingnessScore: number;    // derived proxy: 0–1 score for sustained non-collapse activity
    };
    succeeded: boolean;
    failureReason?: string;
}

function clampFinite(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
    return clampFinite(value, 0, 1);
}

/**
 * Stub minimal global window for headless execution
 * AeternaNetwork.updateDynamics requires window.innerWidth/innerHeight
 */
function stubWindowForHeadless() {
    if (typeof window === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).window = {
            innerWidth: 1920,
            innerHeight: 1080,
        };
    }
}

/**
 * Setup state.disk for headless execution
 * dynamicCore.ts requires state.disk for frequency calculations
 */
async function setupStateForHeadless(disk: PhysicalDisk): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { state } = await import('../organism/state.js') as any;
    state.disk = disk;
}

function applyScenarioStateOverrides(network: AeternaNetwork, config: ScenarioConfig): void {
    if (config.initialHomeostaticState && network.homeostaticState) {
        Object.assign(network.homeostaticState, config.initialHomeostaticState);
    }
    if (config.initialLivingState && network.livingState) {
        Object.assign(network.livingState, config.initialLivingState);
    }
    if (config.initialEnergyState && network.energyFlowState) {
        Object.assign(network.energyFlowState, config.initialEnergyState);
    }
}

/**
 * Compute mean activity across network
 */
function computeMeanActivity(network: AeternaNetwork): number {
    let sum = 0;
    for (let i = 0; i < network.numNodes; i++) {
        sum += Math.abs(network.currentBuffer[i]);
    }
    return sum / network.numNodes;
}

/**
 * Compute max activity magnitude
 */
function computeMaxActivity(network: AeternaNetwork): number {
    let max = 0;
    for (let i = 0; i < network.numNodes; i++) {
        const val = Math.abs(network.currentBuffer[i]);
        if (val > max) max = val;
    }
    return max;
}

/**
 * Check for NaN in activity buffer
 */
function hasNaN(network: AeternaNetwork): boolean {
    for (let i = 0; i < network.numNodes; i++) {
        if (!Number.isFinite(network.currentBuffer[i])) return true;
    }
    return false;
}

/**
 * Compute variance of recent activity
 */
function computeVariance(recentMeans: number[]): number {
    if (recentMeans.length < 2) return 0;
    const mean = recentMeans.reduce((a, b) => a + b, 0) / recentMeans.length;
    const sqDiffs = recentMeans.map(x => (x - mean) ** 2);
    return sqDiffs.reduce((a, b) => a + b, 0) / recentMeans.length;
}

/**
 * Apply touch events from script
 */
function applyTouchScript(
    frame: number,
    touchScript: TouchEvent[],
    network: AeternaNetwork,
    activeTouches: Map<number, { x: number; y: number; pressure: number }>,
    heldTouches: Map<number, { endFrame: number }>
): void {
    // Release expired held touches
    for (const [touchId, held] of heldTouches.entries()) {
        if (frame >= held.endFrame) {
            activeTouches.delete(touchId);
            heldTouches.delete(touchId);
        }
    }

    // Apply new touches from script
    for (const touch of touchScript) {
        if (touch.frame === frame) {
            const touchId = frame;  // use frame as unique touch ID
            const pressure = touch.pressure ?? 1.0;
            activeTouches.set(touchId, {
                x: touch.x,
                y: touch.y,
                pressure,
            });
            if (touch.duration && touch.duration > 1) {
                heldTouches.set(touchId, { endFrame: frame + touch.duration });
            } else {
                // Single-frame touch, remove next frame
                setTimeout(() => activeTouches.delete(touchId), 0);
            }
        }
    }
}

/**
 * Build OrganismSnapshot from network state for BL-L1 packet generation
 */
function buildOrganismSnapshot(
    frame: number,
    network: AeternaNetwork,
    dyn: any // eslint-disable-line @typescript-eslint/no-explicit-any
): OrganismSnapshot {
    return {
        timestamp: frame,
        energy: dyn.energy ?? 1.0,
        overload: dyn.overload ?? 0,
        coherence: dyn.stability ?? 1.0,
        boundary: network.homeostaticState?.boundaryIntegrity ?? 1.0,
        modeState: dyn.modeState ?? 'wake',
        touchExpectationConfidence: network.touchExpectation?.touchExpectationConfidence ?? 0.5,
        recentPerturbationPressure: dyn.meanPredictionError ?? 0,
        meanPredictionError: dyn.meanPredictionError ?? 0,
        restorationBias: network.homeostaticState?.restorationBias ?? 0.5,
        coherenceMemory: network.livingState?.coherenceMemory ?? 0.5,
        recentTouchActivity: dyn.meanRawTouch ?? 0,
        currentActivity: dyn.arousal ?? 0,
        ignitionRatio: dyn.ignitionRatio ?? 0,
        recentTouchSurprise: dyn.touchTotalSurprise ?? 0,
    };
}

/**
 * Check and add replay candidates based on current state
 * Only salient events become candidates
 */
function checkAndAddReplayCandidates(
    frame: number,
    network: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    dyn: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    queue: ReplayQueue,
    traceState: TraceState,
    recoveryState: RecoveryState | null,
): void {
    const mismatchPressure = Math.max(dyn.touchTotalSurprise ?? 0, dyn.meanPredictionError ?? 0);
    if (mismatchPressure > 0.42) {
        queue.addCandidate(
            'mismatch',
            mismatchPressure,
            frame,
            [
                clampFinite(dyn.meanPredictionError ?? 0, 0, 1),
                clampFinite(dyn.touchTotalSurprise ?? 0, 0, 1),
                clampFinite(traceState.salienceResidue, 0, 1),
            ],
            traceState.traceStrength,
            traceState.recurrenceWeight,
        );
    }

    const recurrencePressure = Math.min(
        1,
        clampFinite((dyn.touchRepeatCount ?? 0) / 8, 0, 1) * 0.65 +
        clampFinite(dyn.meanTouchHabituation ?? 0, 0, 1) * 0.35,
    );
    if (recurrencePressure > 0.26 || traceState.recurrenceWeight > 0.38) {
        queue.addCandidate(
            'recurrence',
            Math.max(recurrencePressure, traceState.recurrenceWeight * 0.8),
            frame,
            [
                clampFinite(dyn.touchRepeatCount ?? 0, 0, 8) / 8,
                clampFinite(dyn.meanTouchHabituation ?? 0, 0, 1),
                clampFinite(traceState.recurrenceWeight, 0, 1),
            ],
            traceState.traceStrength,
            traceState.recurrenceWeight,
        );
    }

    const recoveryPressure = recoveryState?.recoveryPressure ?? 0;
    if (recoveryPressure > 0.46 && (traceState.recoveryLinkedResidue ?? 0) > 0.18) {
        queue.addCandidate(
            'recovery',
            Math.min(1, recoveryPressure * 0.7 + (traceState.recoveryLinkedResidue ?? 0) * 0.45),
            frame,
            [
                clampFinite(recoveryPressure, 0, 1),
                clampFinite(recoveryState?.stabilizationPull ?? 0, 0, 1),
                clampFinite(traceState.recoveryLinkedResidue ?? 0, 0, 1),
            ],
            traceState.traceStrength,
            traceState.recurrenceWeight,
        );
    }

    const boundaryStress = Math.max(
        0,
        1 - clampFinite(network.homeostaticState?.boundaryIntegrity ?? 1, 0, 1),
    );
    if (boundaryStress > 0.22 && (mismatchPressure > 0.28 || traceState.salienceResidue > 0.22)) {
        queue.addCandidate(
            'boundary',
            Math.min(1, boundaryStress * 0.65 + traceState.salienceResidue * 0.35),
            frame,
            [
                clampFinite(boundaryStress, 0, 1),
                clampFinite(traceState.salienceResidue, 0, 1),
                clampFinite(traceState.traceStrength, 0, 1),
            ],
            traceState.traceStrength,
            traceState.recurrenceWeight,
        );
    }

    const settlingResidue = traceState.settlingResidue ?? 0;
    if ((dyn.activeTouchCount ?? 0) === 0 && settlingResidue > 0.18 && traceState.traceStrength > 0.22) {
        queue.addCandidate(
            'settling',
            Math.min(1, settlingResidue * 0.7 + traceState.traceStrength * 0.3),
            frame,
            [
                clampFinite(settlingResidue, 0, 1),
                clampFinite(traceState.traceStrength, 0, 1),
                clampFinite(traceState.recoveryLinkedResidue ?? 0, 0, 1),
            ],
            traceState.traceStrength,
            traceState.recurrenceWeight,
        );
    }
}

/**
 * Build metrics snapshot from current state
 */
function buildMetricsSnapshot(
    frame: number,
    network: AeternaNetwork,
    dyn: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    recentMeans: number[],
    traceState?: TraceState | null,
    replayState?: ReplayState | null,
    queueSize?: number,
    weakConsolidationDelta = 0,
    replayContributionToStabilization = 0,
    recoveryState?: RecoveryState | null,
    recoveryTrajectory?: RecoveryTrajectoryLabel,
    collapseMode?: CollapseModeLabel,
    observationPatternState?: ObservationPatternState | null,
    protoPointObservationState?: ProtoPointObservationState | null,
    protoNeuronObservationState?: ProtoNeuronObservationState | null,
    bodySurfaceState?: BodySurfaceState | null,
    actuationPulse?: ActuationPulse | null,
    dynamicViabilityState?: DynamicViabilityState | null,
    mediumProfileState?: MediumProfileState | null,
    naturalFeedbackAdjustment?: NaturalFeedbackAdjustment | null,
    naturalFeedbackReport?: NaturalFeedbackApplicationReport | null,
    actuationPulseGeneratedCount = 0,
    actuationPulseNullCount = 0,
    localExcitabilityFieldState?: LocalExcitabilityFieldState | null,
    repeatedFlowPathObservationState?: RepeatedFlowPathObservationState | null,
    protoNetworkObservationState?: ProtoNetworkObservationState | null,
): MetricsSnapshot {
    const snapshot: MetricsSnapshot = {
        frame,
        meanActivity: computeMeanActivity(network),
        maxActivity: computeMaxActivity(network),
        variance: computeVariance(recentMeans),
        ignitionRatio: dyn.ignitionRatio ?? 0,
        phiApprox: dyn.phiApprox ?? 0,
        phaseCoherence: dyn.phaseCoherence ?? 0,
        meanPredictionError: dyn.meanPredictionError ?? 0,
        baselineLevel: dyn.baselineLevel ?? 0,
        residueLevel: dyn.residueLevel ?? 0,
        meanRawTouch: dyn.meanRawTouch ?? 0,
        meanTouchOnset: dyn.meanTouchOnset ?? 0,
        meanTouchOffset: dyn.meanTouchOffset ?? 0,
        meanTouchNovelty: dyn.meanTouchNovelty ?? 0,
        activeTouchCount: dyn.activeTouchCount ?? 0,
        modeState: dyn.modeState ?? 'unknown',
        actionState: dyn.actionState ?? 'unknown',
        energy: dyn.energy ?? 1.0,
        stability: dyn.stability ?? 1.0,
        overload: dyn.overload ?? 0,
        energyReserve: dyn.energyReserve ?? 1.0,
        hasNaN: hasNaN(network),
    };

    // Phase 2: Add living state metrics
    if (network.livingState) {
        snapshot.fatigue = network.livingState.fatigue;
        snapshot.coherenceMemory = network.livingState.coherenceMemory;
        snapshot.preferredErgodicity = network.livingState.preferredErgodicity;
        snapshot.longBaselineTone = network.livingState.longBaselineTone;
        snapshot.recentHistoryBias = network.livingState.recentHistoryBias;
        snapshot.residueBias = network.livingState.residueBias;
        snapshot.predictionSensitivity = network.livingState.predictionSensitivity;
        snapshot.touchNeedBaseline = network.livingState.touchNeedBaseline;
    }

    // Phase 3: Add touch expectation metrics
    if (network.touchExpectation) {
        snapshot.expectedTouchInterval = network.touchExpectation.expectedInterTouchInterval;
        snapshot.expectedTouchStrength = network.touchExpectation.expectedTouchStrength;
        snapshot.touchExpectationConfidence = network.touchExpectation.touchExpectationConfidence;
        snapshot.holdContinuationExpectation = network.touchExpectation.holdContinuationExpectation;
        snapshot.touchAbsenceError = network.touchExpectation.absenceError;
        snapshot.isTouchHolding = network.touchExpectation.isHolding ? 1 : 0;
        snapshot.touchHoldDuration = network.touchExpectation.holdDuration;

        const meanHab = network.touchExpectation.touchHabituationField.reduce((a: number, b: number) => a + b, 0) /
                        network.touchExpectation.touchHabituationField.length;
        snapshot.meanTouchHabituation = meanHab;
    }

    if (network.touchSurpriseMetrics) {
        snapshot.touchSpatialSurprise = network.touchSurpriseMetrics.spatialSurprise;
        snapshot.touchTemporalSurprise = network.touchSurpriseMetrics.temporalSurprise;
        snapshot.touchStrengthSurprise = network.touchSurpriseMetrics.strengthSurprise;
        snapshot.touchMissingSurprise = network.touchSurpriseMetrics.missingTouchSurprise;
        snapshot.touchReleaseSurprise = network.touchSurpriseMetrics.releaseSurprise;
        snapshot.touchTotalSurprise = network.touchSurpriseMetrics.totalSurprise;
    }

    if (network.touchBackactionState && network.touchBackactionEnabled !== false) {
        snapshot.touchBackactionGain = network.touchBackactionState.backactionGain;
        snapshot.touchBackactionSurpriseGain = network.touchBackactionState.surpriseGain;
        snapshot.touchBackactionBoundaryModulation = network.touchBackactionState.boundaryModulation;
        snapshot.touchBackactionOpennessModulation = network.touchBackactionState.opennessModulation;
        snapshot.touchBackactionCoherenceShift = network.touchBackactionState.coherenceShift;
        snapshot.touchBackactionAwarenessCoupling = network.touchBackactionState.awarenessCoupling;
        snapshot.touchBackactionOverloadAmplification = network.touchBackactionState.overloadAmplification;
        snapshot.touchBackactionFamiliarityDamping = network.touchBackactionState.familiarityDamping;
    }

    // Phase 4: Add homeostatic state metrics
    if (network.homeostaticState) {
        snapshot.stabilityIndex = network.homeostaticState.stabilityIndex;
        snapshot.boundaryIntegrity = network.homeostaticState.boundaryIntegrity;
        snapshot.selfPreservationBias = network.homeostaticState.selfPreservationBias;
        snapshot.irritabilityLevel = network.homeostaticState.irritabilityLevel;
        snapshot.restorationBias = network.homeostaticState.restorationBias;
        snapshot.collapseRisk = network.homeostaticState.collapseRisk;
        snapshot.homeostaticStress = network.homeostaticState.homeostaticStress;
        snapshot.preferredStabilityBand = network.homeostaticState.preferredStabilityBand;
        snapshot.consecutiveQuietFrames = network.homeostaticState.consecutiveQuietFrames;
    }

    // Beautiful Loop L1: Generate observer packets
    try {
        const organismSnapshot = buildOrganismSnapshot(frame, network, dyn);
        const interoPacket = runInteroceptionStage(organismSnapshot);
        // BL-L2: Pass previous packet for continuity calculation
        const selfWorldPacket = runSelfWorldModelStage(interoPacket, organismSnapshot, network.lastSelfWorldModelPacket ?? null);

        snapshot.bl_energySense = interoPacket.energySense;
        snapshot.bl_overloadSense = interoPacket.overloadSense;
        snapshot.bl_coherenceSense = interoPacket.coherenceSense;
        snapshot.bl_boundarySense = interoPacket.boundarySense;
        snapshot.bl_restorationSense = interoPacket.restorationSense;
        snapshot.bl_perturbationPressure = interoPacket.perturbationPressure;

        snapshot.bl_selfCoherence = selfWorldPacket.selfCoherence;
        snapshot.bl_selfContinuity = selfWorldPacket.selfContinuity;
        snapshot.bl_worldPressure = selfWorldPacket.worldPressure;
        snapshot.bl_relationEngagement = selfWorldPacket.relationEngagement;

        // A1: Derive and collect felt-state vector
        if (network.livingState && network.homeostaticState && network.energyFlowState) {
            const feltState = deriveFeltState(
                organismSnapshot,
                network.livingState,
                network.homeostaticState,
                network.energyFlowState,
                selfWorldPacket
            );

            snapshot.felt_depletion = feltState.depletion;
            snapshot.felt_overload = feltState.overload;
            snapshot.felt_coherence = feltState.coherence;
            snapshot.felt_boundaryIntegrity = feltState.boundaryIntegrity;
            snapshot.felt_restorationReadiness = feltState.restorationReadiness;
            snapshot.felt_perturbationLoad = feltState.perturbationLoad;
            snapshot.felt_openness = feltState.openness;

            const arousalAwareness = deriveArousalAwareness(
                organismSnapshot,
                feltState,
                network.livingState,
                selfWorldPacket
            );

            snapshot.arousalLevel = arousalAwareness.arousalLevel;
            snapshot.awarenessWindow = arousalAwareness.awarenessWindow;
            snapshot.salienceOpenness = arousalAwareness.salienceOpenness;
            snapshot.foregroundPressure = arousalAwareness.foregroundPressure;
            snapshot.restDepth = arousalAwareness.restDepth;
            snapshot.hyperreactivity = arousalAwareness.hyperreactivity;
            snapshot.settlingWindow = arousalAwareness.settlingWindow;

            // A4: Derive and collect need/motivation state if replay state available
            if (replayState) {
                const needMotivation = deriveNeedMotivation(
                    organismSnapshot,
                    feltState,
                    arousalAwareness,
                    replayState,
                    network.livingState,
                    network.energyFlowState,
                    network.homeostaticState,
                    selfWorldPacket
                );

                snapshot.energyNeed = needMotivation.energyNeed;
                snapshot.safetyNeed = needMotivation.safetyNeed;
                snapshot.restorationNeed = needMotivation.restorationNeed;
                snapshot.contactNeed = needMotivation.contactNeed;
                snapshot.noveltyMotivation = needMotivation.noveltyMotivation;
                snapshot.repetitionMotivation = needMotivation.repetitionMotivation;
                snapshot.explorationMotivation = needMotivation.explorationMotivation;
                snapshot.settlingMotivation = needMotivation.settlingMotivation;
                snapshot.withdrawMotivation = needMotivation.withdrawMotivation;

                // Q1-1: Derive and collect open-state snapshot
                const openStateSnapshot = deriveOpenStateSnapshot(
                    feltState,
                    arousalAwareness,
                    needMotivation
                );

                snapshot.openState_stabilityIndex = openStateSnapshot.stabilityIndex;
                snapshot.openState_mixtureEntropy = openStateSnapshot.mixtureEntropy;
                snapshot.openState_dominantPole = openStateSnapshot.dominantPole;

                // Phase 6 / Q2-1: Derive and collect pressure competition state
                const pressureCompetition = derivePressureCompetition(needMotivation);

                snapshot.pc_safetyPressure = pressureCompetition.safetyPressure;
                snapshot.pc_restorationPressure = pressureCompetition.restorationPressure;
                snapshot.pc_noveltyPressure = pressureCompetition.noveltyPressure;
                snapshot.pc_repetitionPressure = pressureCompetition.repetitionPressure;
                snapshot.pc_explorationPressure = pressureCompetition.explorationPressure;
                snapshot.pc_withdrawalPressure = pressureCompetition.withdrawalPressure;
                snapshot.pc_dominantPressure = pressureCompetition.dominantPressure;
                snapshot.pc_competitionEntropy = pressureCompetition.competitionEntropy;
                snapshot.pc_competitionStability = pressureCompetition.competitionStability;
                snapshot.pc_annealingTemperature = pressureCompetition.annealingTemperature;
                snapshot.pc_pressureEnergy = pressureCompetition.pressureEnergy;
            }
        }

        if (traceState) {
            snapshot.traceStrength = traceState.traceStrength;
            snapshot.recurrenceWeight = traceState.recurrenceWeight;
            snapshot.salienceResidue = traceState.salienceResidue;
            snapshot.recentPatternWeight = traceState.recentPatternWeight;
            snapshot.settlingResidue = traceState.settlingResidue;
            snapshot.recoveryLinkedResidue = traceState.recoveryLinkedResidue;
        }

        if (replayState) {
            snapshot.replayPressure = replayState.replayPressure;
            snapshot.replayReadiness = replayState.replayReadiness;
            snapshot.consolidationGain = replayState.consolidationGain;
            snapshot.activeReplayCount = replayState.activeReplayCount;
            snapshot.recentReplaySalience = replayState.recentReplaySalience;
            snapshot.restConsolidationDepth = replayState.restConsolidationDepth;
            snapshot.replaySuppression = replayState.replaySuppression;
            snapshot.weakConsolidationDelta = weakConsolidationDelta;
            snapshot.replayContributionToStabilization = replayContributionToStabilization;
            if (queueSize !== undefined) {
                snapshot.replayQueueSize = queueSize;
            }
        }
        if (recoveryState) {
            snapshot.recoveryPressure = recoveryState.recoveryPressure;
            snapshot.relaxationLevel = recoveryState.relaxationLevel;
            snapshot.stabilizationPull = recoveryState.stabilizationPull;
            snapshot.boundaryRepairPressure = recoveryState.boundaryRepairPressure;
            snapshot.selfPreservationDrive = recoveryState.selfPreservationDrive;
            snapshot.overloadDrain = recoveryState.overloadDrain;
            snapshot.recoveryTrajectory = recoveryTrajectory;
            snapshot.collapseMode = collapseMode;
        }

        // Phase 2: Derive perturbation event and mismatch if touch is active
        if ((dyn.activeTouchCount ?? 0) > 0 || (dyn.meanTouchNovelty ?? 0) > 0.01) {
            try {
                const familiarity = snapshot.meanTouchHabituation ?? 0;
                const perturbEvent = derivePerturbationEvent('touch', dyn.meanRawTouch ?? 0, {
                    overload: snapshot.overload ?? 0,
                    boundaryIntegrity: snapshot.boundaryIntegrity ?? 0.8,
                    openness: snapshot.felt_openness ?? 0.5,
                    familiarity,
                    repetitionCount: familiarity * 10,
                    baselineLevel: snapshot.baselineLevel ?? 0,
                });
                snapshot.p2_perturbationMagnitude = perturbEvent.magnitude;
                snapshot.p2_perturbationNovelty = perturbEvent.novelty;
                snapshot.p2_perturbationExpectedness = perturbEvent.expectedness;

                const mismatch = derivePredictionMismatch(perturbEvent, {
                    overload: snapshot.overload ?? 0,
                    boundaryIntegrity: snapshot.boundaryIntegrity ?? 0.8,
                    restorationBias: snapshot.restorationBias ?? 0.5,
                    coherenceMemory: snapshot.coherenceMemory ?? 0.5,
                    stability: snapshot.stability ?? 0.5,
                }, snapshot.meanPredictionError ?? 0);
                snapshot.p2_mismatchLevel = mismatch.mismatchLevel;
                snapshot.p2_surprisePressure = mismatch.surprisePressure;
                snapshot.p2_boundaryStress = mismatch.boundaryStress;
                snapshot.p2_recoveryPull = mismatch.recoveryPull;
            } catch (_e) {
                // observer role: skip silently
            }
        }
    } catch (e) {
        // If BL-L1 packet generation fails, skip silently (observer role only)
    }

    // Phase 5: Add observation pattern state (observer-side proxy, read-only)
    if (observationPatternState) {
        snapshot.obs_knotCount = observationPatternState.knotCount;
        snapshot.obs_pathCount = observationPatternState.pathCount;
        snapshot.obs_recurrenceLocusCount = observationPatternState.recurrenceLocusCount;
        snapshot.obs_basinCount = observationPatternState.basinCount;
        snapshot.obs_longLivedAnomalyCount = observationPatternState.longLivedAnomalyCount;
        snapshot.obs_protoPointCandidateCount = observationPatternState.protoPointCandidateCount;
        snapshot.obs_collapseProfileCount = observationPatternState.collapseProfileCount;
        snapshot.obs_recoveryProfileCount = observationPatternState.recoveryProfileCount;
        snapshot.obs_stableAttractorCandidateCount = observationPatternState.stableAttractorCandidateCount;
        snapshot.obs_observationConfidence = observationPatternState.observationConfidence;
    }

    // Phase 7: Add proto-point observation state (observer-side proxy, read-only)
    if (protoPointObservationState) {
        snapshot.pp_candidateCount = protoPointObservationState.candidateCount;
        snapshot.pp_stableCandidateCount = protoPointObservationState.stableCandidateCount;
        snapshot.pp_averageConfidence = protoPointObservationState.averageConfidence;
        snapshot.pp_maxConfidence = protoPointObservationState.maxConfidence;
        snapshot.pp_newCandidateCount = protoPointObservationState.newCandidateCount;
        snapshot.pp_decayedCandidateCount = protoPointObservationState.decayedCandidateCount;
    }

    // W7: Add proto-neuron observation state (observer-side proxy, read-only)
    if (protoNeuronObservationState) {
        snapshot.pn_candidateCount = protoNeuronObservationState.candidateCount;
        snapshot.pn_stableCandidateCount = protoNeuronObservationState.stableCandidateCount;
        snapshot.pn_averageConfidence = protoNeuronObservationState.averageConfidence;
        snapshot.pn_maxConfidence = protoNeuronObservationState.maxConfidence;
        snapshot.pn_averageExcitability = protoNeuronObservationState.averageExcitability;
        snapshot.pn_averagePropagation = protoNeuronObservationState.averagePropagation;
        snapshot.pn_averageTraceRetention = protoNeuronObservationState.averageTraceRetention;
        snapshot.pn_averageClosureCoupling = protoNeuronObservationState.averageClosureCoupling;
        snapshot.pn_averageCoActivationScore = protoNeuronObservationState.averageCoActivationScore;
        snapshot.pn_coActivationClusterCount = protoNeuronObservationState.coActivationClusterCount;
        snapshot.pn_repeatedCoActivationCount = protoNeuronObservationState.repeatedCoActivationCount;
    }

    // W1: Add Body Surface state (Boundary Layer — derived / proxy, read-only)
    if (bodySurfaceState) {
        snapshot.bs_boundaryIntegrity = bodySurfaceState.boundaryIntegrity;
        snapshot.bs_surfaceSensitivity = bodySurfaceState.surfaceSensitivity;
        snapshot.bs_permeability = bodySurfaceState.permeability;
        snapshot.bs_contactReadiness = bodySurfaceState.contactReadiness;
        snapshot.bs_outputReadiness = bodySurfaceState.outputReadiness;
        snapshot.bs_localIrritability = bodySurfaceState.localIrritability;
        snapshot.bs_recoveryShielding = bodySurfaceState.recoveryShielding;
        snapshot.bs_surfaceTension = bodySurfaceState.surfaceTension;
        snapshot.bs_surfaceFatigue = bodySurfaceState.surfaceFatigue;
        snapshot.bs_protectiveClosure = bodySurfaceState.protectiveClosure;
        snapshot.bs_externalContactLoad = bodySurfaceState.externalContactLoad;
    }

    snapshot.ap_generatedCount = actuationPulseGeneratedCount;
    snapshot.ap_nullCount = actuationPulseNullCount;
    snapshot.ap_outputReadiness = bodySurfaceState?.outputReadiness ?? actuationPulse?.outputReadiness ?? 0;
    if (actuationPulse) {
        snapshot.ap_channel = actuationPulse.channel;
        snapshot.ap_intensity = actuationPulse.intensity;
        snapshot.ap_coherence = actuationPulse.coherence;
        snapshot.ap_rhythm = actuationPulse.rhythm;
        snapshot.ap_locality = actuationPulse.locality;
        snapshot.ap_recoveryLinked = actuationPulse.recoveryLinked;
        snapshot.ap_boundaryLinked = actuationPulse.boundaryLinked;
        snapshot.ap_traceLinked = actuationPulse.traceLinked;
    }

    if (dynamicViabilityState) {
        snapshot.dv_flowContinuity = dynamicViabilityState.flowContinuity;
        snapshot.dv_energyThroughput = dynamicViabilityState.energyThroughput;
        snapshot.dv_dissipationBalance = dynamicViabilityState.dissipationBalance;
        snapshot.dv_resistanceBalance = dynamicViabilityState.resistanceBalance;
        snapshot.dv_delayCoherence = dynamicViabilityState.delayCoherence;
        snapshot.dv_boundaryExchange = dynamicViabilityState.boundaryExchange;
        snapshot.dv_underCouplingRisk = dynamicViabilityState.underCouplingRisk;
        snapshot.dv_overCouplingRisk = dynamicViabilityState.overCouplingRisk;
        snapshot.dv_saturationRisk = dynamicViabilityState.saturationRisk;
        snapshot.dv_extinctionRisk = dynamicViabilityState.extinctionRisk;
        snapshot.dv_viabilityConfidence = dynamicViabilityState.viabilityConfidence;
        snapshot.dv_returnContinuity = dynamicViabilityState.returnContinuity;
        snapshot.dv_traceContinuity = dynamicViabilityState.traceContinuity;
        snapshot.dv_mediumExchangeBalance = dynamicViabilityState.mediumExchangeBalance;
        snapshot.dv_closureViability = dynamicViabilityState.closureViability;
    }

    if (mediumProfileState) {
        snapshot.mp_delayAverageReturnDelay = mediumProfileState.delay.averageReturnDelay;
        snapshot.mp_delayMinReturnDelay = mediumProfileState.delay.minReturnDelay;
        snapshot.mp_delayMaxReturnDelay = mediumProfileState.delay.maxReturnDelay;
        snapshot.mp_delayVariance = mediumProfileState.delay.delayVariance;
        snapshot.mp_delayStableDelayWindow = mediumProfileState.delay.stableDelayWindow;
        snapshot.mp_delayUnstableDelayScore = mediumProfileState.delay.unstableDelayScore;
        snapshot.mp_delayDelayedEchoScore = mediumProfileState.delay.delayedEchoScore;
        snapshot.mp_echoStrength = mediumProfileState.echo.echoStrength;
        snapshot.mp_echoDecayRate = mediumProfileState.echo.echoDecayRate;
        snapshot.mp_echoPersistence = mediumProfileState.echo.echoPersistence;
        snapshot.mp_echoSaturationRisk = mediumProfileState.echo.echoSaturationRisk;
        snapshot.mp_echoVisualResidue = mediumProfileState.echo.visualEchoResidue;
        snapshot.mp_echoForceResidue = mediumProfileState.echo.forceEchoResidue;
        snapshot.mp_echoReturnCoupling = mediumProfileState.echo.returnEchoCoupling;
        snapshot.mp_resistanceWorldResistance = mediumProfileState.resistance.worldResistance;
        snapshot.mp_resistanceBoundaryResistance = mediumProfileState.resistance.boundaryResistance;
        snapshot.mp_resistanceReturnAttenuation = mediumProfileState.resistance.returnAttenuation;
        snapshot.mp_resistanceMediumAbsorption = mediumProfileState.resistance.mediumAbsorption;
        snapshot.mp_resistanceTransmissionRatio = mediumProfileState.resistance.transmissionRatio;
        snapshot.mp_resistanceBalance = mediumProfileState.resistance.resistanceBalance;
        snapshot.mp_resistanceVariance = mediumProfileState.resistance.resistanceVariance;
        snapshot.mp_profileConfidence = mediumProfileState.profileConfidence;
    }

    if (naturalFeedbackAdjustment) {
        snapshot.nf_echoDecayAdjustment = naturalFeedbackAdjustment.echoDecayAdjustment;
        snapshot.nf_returnGainAdjustment = naturalFeedbackAdjustment.returnGainAdjustment;
        snapshot.nf_pulseLeakageAdjustment = naturalFeedbackAdjustment.pulseLeakageAdjustment;
        snapshot.nf_boundaryPermeabilityAdjustment = naturalFeedbackAdjustment.boundaryPermeabilityAdjustment;
        snapshot.nf_sensoryAttenuationAdjustment = naturalFeedbackAdjustment.sensoryAttenuationAdjustment;
        snapshot.nf_traceDecayAdjustment = naturalFeedbackAdjustment.traceDecayAdjustment;
        snapshot.nf_worldResistanceAdjustment = naturalFeedbackAdjustment.worldResistanceAdjustment;
        snapshot.nf_delayWindowAdjustment = naturalFeedbackAdjustment.delayWindowAdjustment;
        snapshot.nf_mediumAbsorptionAdjustment = naturalFeedbackAdjustment.mediumAbsorptionAdjustment;
        snapshot.nf_adjustmentStrength = naturalFeedbackAdjustment.adjustmentStrength;
        snapshot.nf_adjustmentConfidence = naturalFeedbackAdjustment.adjustmentConfidence;
        snapshot.nf_feedbackEffectEstimate = naturalFeedbackAdjustment.feedbackEffectEstimate;
        snapshot.nf_overcorrectionRisk = naturalFeedbackAdjustment.overcorrectionRisk;
        snapshot.nf_feedbackDominanceRisk = naturalFeedbackAdjustment.feedbackDominanceRisk;
    }

    if (naturalFeedbackReport) {
        snapshot.nf_appliedTargetCount = naturalFeedbackReport.appliedTargetCount;
        snapshot.nf_appliedTargets = naturalFeedbackReport.appliedTargets;
        snapshot.nf_minimalNaturalFeedbackEnabled = naturalFeedbackReport.enabledFlags.minimalNaturalFeedbackEnabled;
        snapshot.nf_worldMediumEnabled = naturalFeedbackReport.enabledFlags.naturalFeedbackWorldMediumEnabled;
        snapshot.nf_sensoryReturnEnabled = naturalFeedbackReport.enabledFlags.naturalFeedbackSensoryReturnEnabled;
        snapshot.nf_actuationEnabled = naturalFeedbackReport.enabledFlags.naturalFeedbackActuationEnabled;
        snapshot.nf_bodySurfaceEnabled = naturalFeedbackReport.enabledFlags.naturalFeedbackBodySurfaceEnabled;
        snapshot.nf_traceEnabled = naturalFeedbackReport.enabledFlags.naturalFeedbackTraceEnabled;
    }

    // S5: Add Local Excitability Field (observer-side, pre-neural field profile, read-only)
    if (localExcitabilityFieldState) {
        snapshot.lef_regionCount = localExcitabilityFieldState.regionCount;
        snapshot.lef_averageExcitability = localExcitabilityFieldState.averageExcitability;
        snapshot.lef_maxExcitability = localExcitabilityFieldState.maxExcitability;
        snapshot.lef_averageThresholdProximity = localExcitabilityFieldState.averageThresholdProximity;
        snapshot.lef_averageTraceResidue = localExcitabilityFieldState.averageTraceResidue;
        snapshot.lef_averageReturnInfluence = localExcitabilityFieldState.averageReturnInfluence;
        snapshot.lef_averagePropagationTendency = localExcitabilityFieldState.averagePropagationTendency;
        snapshot.lef_highExcitabilityRegionCount = localExcitabilityFieldState.highExcitabilityRegionCount;
        snapshot.lef_nearThresholdRegionCount = localExcitabilityFieldState.nearThresholdRegionCount;
        snapshot.lef_recoveringRegionCount = localExcitabilityFieldState.recoveringRegionCount;
        snapshot.lef_fieldConfidence = localExcitabilityFieldState.fieldConfidence;
        snapshot.lef_excitabilityVariance = localExcitabilityFieldState.excitabilityVariance;
        snapshot.lef_regionalGradientStrength = localExcitabilityFieldState.regionalGradientStrength;
        snapshot.lef_localHotspotCount = localExcitabilityFieldState.localHotspotCount;
    }

    // S6: Add Repeated Flow Path observation state (observer-side, pre-semantic path observation, read-only)
    if (repeatedFlowPathObservationState) {
        snapshot.rfp_pathCandidateCount = repeatedFlowPathObservationState.pathCandidateCount;
        snapshot.rfp_stablePathCandidateCount = repeatedFlowPathObservationState.stablePathCandidateCount;
        snapshot.rfp_averageConfidence = repeatedFlowPathObservationState.averageConfidence;
        snapshot.rfp_maxConfidence = repeatedFlowPathObservationState.maxConfidence;
        snapshot.rfp_averageRecurrenceStrength = repeatedFlowPathObservationState.averageRecurrenceStrength;
        snapshot.rfp_averagePropagationConsistency = repeatedFlowPathObservationState.averagePropagationConsistency;
        snapshot.rfp_averageTraceSupport = repeatedFlowPathObservationState.averageTraceSupport;
        snapshot.rfp_averageClosureCoupling = repeatedFlowPathObservationState.averageClosureCoupling;
        snapshot.rfp_observationConfidence = repeatedFlowPathObservationState.observationConfidence;
    }

    // S7: Add Proto-Network Candidate observation state (observer-side, pre-semantic network-like observation, read-only)
    if (protoNetworkObservationState) {
        snapshot.pnc_networkCandidateCount = protoNetworkObservationState.networkCandidateCount;
        snapshot.pnc_stableNetworkCandidateCount = protoNetworkObservationState.stableNetworkCandidateCount;
        snapshot.pnc_averageConfidence = protoNetworkObservationState.averageConfidence;
        snapshot.pnc_maxConfidence = protoNetworkObservationState.maxConfidence;
        snapshot.pnc_averageCoActivation = protoNetworkObservationState.averageCoActivation;
        snapshot.pnc_averagePropagation = protoNetworkObservationState.averagePropagation;
        snapshot.pnc_averageRecurrence = protoNetworkObservationState.averageRecurrence;
        snapshot.pnc_averageTraceCorrelation = protoNetworkObservationState.averageTraceCorrelation;
        snapshot.pnc_averageReplayCoReturn = protoNetworkObservationState.averageReplayCoReturn;
        snapshot.pnc_averageClosureCoupling = protoNetworkObservationState.averageClosureCoupling;
        snapshot.pnc_observationConfidence = protoNetworkObservationState.observationConfidence;
    }

    return snapshot;
}

/**
 * Run a scenario with fixed configuration
 */
export async function runScenario(config: ScenarioConfig): Promise<ScenarioResult> {
    stubWindowForHeadless();

    const dt = config.dt ?? 1 / 60;
    const segments = config.segments ?? 72;
    const collectMetrics = config.collectMetrics ?? true;
    const metricsInterval = config.metricsInterval ?? 10;
    const touchScript = config.touchScript ?? [];
    const naturalFeedbackFlags = normalizeNaturalFeedbackFlags({
        // Keep S3 disabled by default here to avoid behavior breaks in the
        // large pre-existing scenario suite; targeted S3 runs enable it explicitly.
        minimalNaturalFeedbackEnabled: false,
        ...config.naturalFeedbackFlags,
    });

    // Initialize network and disk
    const network = new AeternaNetwork(segments);
    const disk = new PhysicalDisk();
    const touchMem = new TouchMemory(segments);
    applyScenarioStateOverrides(network, config);

    // Setup state.disk for dynamicCore
    await setupStateForHeadless(disk);

    // Initialize with small perturbation (as in main.ts)
    network.currentBuffer[0] = +8.0;
    network.currentBuffer[Math.floor(network.numNodes / 2)] = -8.0;

    const metrics: MetricsSnapshot[] = [];
    const recentMeans: number[] = [];
    const activityHistory: number[] = [];
    let lastModeState = network.modeState;
    let lastActionState = network.actionState;
    let modeTransitions = 0;
    let actionTransitions = 0;
    let collapseFrames = 0;
    let nanFrames = 0;

    const activeTouches = new Map<number, { x: number; y: number; pressure: number }>();
    const heldTouches = new Map<number, { endFrame: number }>();

    // Phase 1: Ongoingness tracking
    let saturationFrames = 0;
    let spontaneousIgnitionCount = 0;
    let quietBaselineSum = 0;
    let quietBaselineCount = 0;
    // Track whether we were below quiet-floor threshold last frame for ignition detection
    let prevBelowFloor = false;

    // A3: Initialize replay queue and tracking
    const replayQueue = new ReplayQueue(50, 0.998);
    let activeReplayCount = 0;
    let recentReplaySalience = 0.0;
    let lastReplayCategory: string | null = null;
    let totalReplayCount = 0;
    const recentPerturbationHistory: number[] = [];
    const recentMismatchHistory: number[] = [];
    const recentRecoveryHistory: number[] = [];
    const repeatedPatternHistory: number[] = [];
    const perturbationPeaks: number[] = [];
    const degradationPeaks: number[] = [];
    const recoveryTimes: number[] = [];
    const settlingTimes: number[] = [];
    let activePerturbationStart: number | null = null;
    let activeSettlingStart: number | null = null;
    let traceState: TraceState | null = null;
    let lastWeakConsolidationDelta = 0;
    let lastReplayContributionToStabilization = 0;

    // Phase 5: Observation pattern state (observer-side proxy, read-only)
    let lastObservationPatternState: ObservationPatternState | null = null;

    // Phase 7: Proto-point observation state (observer-side proxy, read-only)
    let lastProtoPointObservationState: ProtoPointObservationState | null = null;

    // W7: Proto-neuron observation state (observer-side proxy, read-only)
    let lastProtoNeuronObservationState: ProtoNeuronObservationState | null = null;

    // S5: Local Excitability Field (observer-side, pre-neural field profile, read-only)
    let lastLocalExcitabilityFieldState: LocalExcitabilityFieldState | null = null;

    // S6: Repeated Flow Path (observer-side, pre-semantic path observation, read-only)
    let lastRepeatedFlowPathObservationState: RepeatedFlowPathObservationState | null = null;
    let previousLocalExcitabilityFieldState: LocalExcitabilityFieldState | null = null;

    // S7: Proto-Network Candidate Observation (observer-side, read-only)
    let lastProtoNetworkObservationState: ProtoNetworkObservationState | null = null;

    // W3–W6: world-loop observer state (read-only)
    let worldMediumState: WorldMediumState = {
        ...initializeWorldMediumState(),
        ...(config.initialWorldMediumState ?? {}),
    };
    let lastSensoryReturns: SensoryReturnPacket[] = [];
    let lastReafferenceComparisonState: ReafferenceComparisonState | null = null;
    let lastBodyWorldClosureState: BodyWorldClosureState | null = null;
    let lastDynamicViabilityState: DynamicViabilityState | null = null;
    let lastMediumProfileState: MediumProfileState | null = null;
    let lastNaturalFeedbackAdjustment: NaturalFeedbackAdjustment = createNeutralNaturalFeedbackAdjustment(worldMediumState.timestamp);
    let lastNaturalFeedbackReport: NaturalFeedbackApplicationReport = {
        appliedTargets: [],
        appliedTargetCount: 0,
        enabledFlags: naturalFeedbackFlags,
    };
    const recentLocalPropagationHistory: number[] = [];
    let previousMeanActivity = 0;

    // W1: Body Surface state (Boundary Layer — derived / proxy, read-only)
    let lastBodySurfaceState: BodySurfaceState | null = null;
    let lastActuationPulse: ActuationPulse | null = null;
    let actuationPulseGeneratedCount = 0;
    let actuationPulseNullCount = 0;
    const actuationPulseChannelCount: Record<ActuationPulseChannel, number> = {
        visual: 0,
        simulatedForce: 0,
    };

    // Run simulation
    for (let frame = 0; frame < config.totalFrames; frame++) {
        // Update disk physics (simplified, no rotation visualization)
        disk.phi += disk.omega_p * dt;
        disk.theta += disk.omega_t * dt;
        const diskNodeIdx = Math.floor(
            ((disk.theta / (2 * Math.PI)) * segments + (disk.phi / (2 * Math.PI)) * segments * segments) %
            network.numNodes
        );

        // Apply touch script
        applyTouchScript(frame, touchScript, network, activeTouches, heldTouches);

        // Decay touch memory
        touchMem.decay();

        // Update network dynamics
        const dyn = network.updateDynamics(diskNodeIdx, activeTouches);

        // Update homeostatic state (Phase 4)
        if (network.homeostaticState) {
            const noveltyLevel = network.touchNovelty ?
                Math.max(...Array.from(network.touchNovelty)) : 0;

            network.homeostaticState = updateHomeostaticState(
                network.homeostaticState,
                network,
                {
                    arousal: network.currGenFiring ?? 0,
                    predictionError: network.predictionError ?
                        Array.from(network.predictionError).reduce((a, b) => a + Math.abs(b), 0) / network.numNodes : 0,
                    noveltyLevel,
                    rewriteLoad: network.globalRewriteLoad ?? 0,
                    clusterRatio: network.cachedMaxClusterSize ? network.cachedMaxClusterSize / network.numNodes : 0,
                    phaseCoherence: network.cachedPhaseCoherence ?? 0.5,
                    activeTouchCount: activeTouches.size,
                    meanRawTouch: network.rawTouch ?
                        Array.from(network.rawTouch).reduce((a, b) => a + b, 0) / network.numNodes : 0,
                    simTime: frame,
                }
            );
        }

        const meanAct = computeMeanActivity(network);
        const maxAct = computeMaxActivity(network);
        recentMeans.push(meanAct);
        if (recentMeans.length > 100) recentMeans.shift();
        activityHistory.push(meanAct);

        if (meanAct < 0.01) collapseFrames++;
        if (hasNaN(network)) nanFrames++;

        if (maxAct > 8.0) saturationFrames++;

        const perturbationPressure = dyn.meanPredictionError ?? 0;
        traceState = null;
        let replayState: ReplayState | null = null;
        let recoveryState: RecoveryState | null = null;
        let recoveryTrajectory: RecoveryTrajectoryLabel = 'shift';
        let collapseMode: CollapseModeLabel = 'stable';
        lastWeakConsolidationDelta = 0;
        lastReplayContributionToStabilization = 0;

        if (network.livingState && network.homeostaticState && network.energyFlowState) {
            try {
                const organismSnapshot = buildOrganismSnapshot(frame, network, dyn);
                const interoPacket = runInteroceptionStage(organismSnapshot);
                const selfWorldPacket = runSelfWorldModelStage(interoPacket, organismSnapshot, network.lastSelfWorldModelPacket ?? null);

                const feltState = deriveFeltState(
                    organismSnapshot,
                    network.livingState,
                    network.homeostaticState,
                    network.energyFlowState,
                    selfWorldPacket
                );

                const arousalAwareness = deriveArousalAwareness(
                    organismSnapshot,
                    feltState,
                    network.livingState,
                    selfWorldPacket
                );

                traceState = deriveTraceState({
                    timestamp: frame,
                    recentPerturbationHistory,
                    mismatchHistory: recentMismatchHistory,
                    recoveryHistory: recentRecoveryHistory,
                    repeatedPatternHistory,
                    externalInputLevel: dyn.meanRawTouch ?? 0,
                    arousalLevel: arousalAwareness.arousalLevel,
                    awarenessWindow: arousalAwareness.awarenessWindow,
                    restDepth: arousalAwareness.restDepth,
                    settlingWindow: arousalAwareness.settlingWindow,
                    restorationReadiness: feltState.restorationReadiness,
                    boundaryIntegrity: feltState.boundaryIntegrity,
                    collapseRisk: network.homeostaticState.collapseRisk ?? 0,
                });

                if (traceState && naturalFeedbackFlags.minimalNaturalFeedbackEnabled && naturalFeedbackFlags.naturalFeedbackTraceEnabled) {
                    traceState = applyMinimalNaturalFeedback({
                        world: worldMediumState,
                        returns: lastSensoryReturns,
                        pulse: lastActuationPulse,
                        bodySurface: lastBodySurfaceState,
                        trace: traceState,
                        adjustment: lastNaturalFeedbackAdjustment,
                        flags: naturalFeedbackFlags,
                    }).trace;
                }

                recoveryState = deriveRecoveryState({
                    timestamp: frame,
                    meanPredictionError: perturbationPressure,
                    perturbationLoad: dyn.meanPredictionError ?? 0,
                    boundaryIntegrity: network.homeostaticState.boundaryIntegrity,
                    restorationBias: network.homeostaticState.restorationBias,
                    stability: dyn.stability ?? network.homeostaticState.stabilityIndex,
                    overload: dyn.overload ?? network.homeostaticState.overloadLevel,
                    depletion: 1 - (network.energyFlowState.energyReserve ?? 1),
                    selfPreservationBias: network.homeostaticState.selfPreservationBias,
                    replaySuppression: traceState.replaySuppression,
                    touchOpennessDamping: 1 - (network.livingState.touchNeedBaseline ?? 0.5),
                    recentPerturbationHistory,
                });
                recoveryTrajectory = classifyRecoveryTrajectory(recoveryState, {
                    stability: dyn.stability ?? network.homeostaticState.stabilityIndex,
                    boundaryIntegrity: network.homeostaticState.boundaryIntegrity,
                });
                collapseMode = classifyCollapseMode(recoveryState, {
                    meanActivity: meanAct,
                    maxActivity: maxAct,
                    boundaryIntegrity: network.homeostaticState.boundaryIntegrity,
                });

                replayQueue.decay();
                checkAndAddReplayCandidates(frame, network, dyn, replayQueue, traceState, recoveryState);

                replayState = deriveReplayState(
                    organismSnapshot,
                    feltState,
                    arousalAwareness,
                    traceState,
                    replayQueue,
                    activeReplayCount,
                    recentReplaySalience,
                    lastReplayCategory,
                    recoveryState,
                );

                activeReplayCount = 0;
                recentReplaySalience = 0;

                const quietGate = (dyn.activeTouchCount ?? 0) === 0;
                const collapseGate = (recoveryState?.collapseRisk ?? 0) < 0.88;

                if (
                    quietGate &&
                    collapseGate &&
                    replayState.replayReadiness > 0.42 &&
                    replayState.replaySuppression < 0.58 &&
                    replayState.replayPressure > 0.36
                ) {
                    const candidates = replayQueue.getCandidatesForReplay(traceState.replayReadiness > 0.72 ? 2 : 1);

                    for (const candidate of candidates) {
                        activeReplayCount++;
                        recentReplaySalience += candidate.weight;
                        lastReplayCategory = candidate.category;
                        totalReplayCount++;

                        const consolidationStrength = replayState.consolidationGain * candidate.weight * 0.0025;
                        lastWeakConsolidationDelta += consolidationStrength;

                        if (network.touchExpectation) {
                            const familiarityNudge = consolidationStrength * (
                                candidate.category === 'mismatch' ? 0.4 :
                                candidate.category === 'recurrence' ? 0.6 : 0.2
                            );
                            network.touchExpectation.touchExpectationConfidence = clampFinite(
                                network.touchExpectation.touchExpectationConfidence + familiarityNudge,
                                0,
                                1,
                            );
                        }

                        if (network.homeostaticState) {
                            if (candidate.category === 'recovery' || candidate.category === 'settling') {
                                network.homeostaticState.restorationBias = clampFinite(
                                    network.homeostaticState.restorationBias + consolidationStrength * 1.3,
                                    0,
                                    1,
                                );
                                lastReplayContributionToStabilization += consolidationStrength * 1.4;
                            }

                            if (candidate.category === 'boundary') {
                                network.homeostaticState.selfPreservationBias = clampFinite(
                                    network.homeostaticState.selfPreservationBias + consolidationStrength,
                                    0,
                                    1,
                                );
                                lastReplayContributionToStabilization += consolidationStrength;
                            }
                        }

                        if (network.livingState) {
                            if (candidate.category === 'recurrence') {
                                network.livingState.residueBias = clampFinite(
                                    network.livingState.residueBias + consolidationStrength * 1.5,
                                    0,
                                    1.5,
                                );
                                network.livingState.recentHistoryBias = clampFinite(
                                    network.livingState.recentHistoryBias + consolidationStrength,
                                    0,
                                    1.5,
                                );
                            } else if (candidate.category === 'settling') {
                                network.livingState.longBaselineTone = clampFinite(
                                    network.livingState.longBaselineTone + consolidationStrength * 0.08,
                                    -0.5,
                                    0.5,
                                );
                                network.livingState.coherenceMemory = clampFinite(
                                    network.livingState.coherenceMemory + consolidationStrength * 0.5,
                                    0,
                                    1,
                                );
                            } else if (candidate.category === 'mismatch') {
                                network.livingState.predictionSensitivity = clampFinite(
                                    network.livingState.predictionSensitivity + consolidationStrength * 0.8,
                                    0,
                                    1.5,
                                );
                            }
                        }

                        replayQueue.reduceWeight(
                            candidate.id,
                            clampFinite(0.82 - (traceState.recurrenceWeight * 0.08), 0.62, 0.84),
                        );
                    }
                }

                if (activeReplayCount > 0) {
                    recentReplaySalience /= activeReplayCount;
                }

                recentPerturbationHistory.push(perturbationPressure);
                if (recentPerturbationHistory.length > 240) recentPerturbationHistory.shift();
                recentMismatchHistory.push(Math.max(dyn.touchTotalSurprise ?? 0, dyn.meanPredictionError ?? 0));
                if (recentMismatchHistory.length > 240) recentMismatchHistory.shift();
                recentRecoveryHistory.push(recoveryState.recoveryPressure);
                if (recentRecoveryHistory.length > 240) recentRecoveryHistory.shift();
                repeatedPatternHistory.push(clampFinite((dyn.touchRepeatCount ?? 0) / 8, 0, 1));
                if (repeatedPatternHistory.length > 240) repeatedPatternHistory.shift();
            } catch (e) {
                // Replay derivation failed, skip silently
            }
        }
        if (recoveryState) {
            if (perturbationPressure > 0.5 && activePerturbationStart === null) activePerturbationStart = frame;
            if (activePerturbationStart !== null && recoveryTrajectory === 'recover' && recoveryState.relaxationLevel > 0.55) {
                recoveryTimes.push(frame - activePerturbationStart);
                activePerturbationStart = null;
                activeSettlingStart = frame;
            }
            if (activeSettlingStart !== null && recoveryState.relaxationLevel > 0.62 && recoveryState.stabilizationPull > 0.58) {
                settlingTimes.push(frame - activeSettlingStart);
                activeSettlingStart = null;
            }

            if (perturbationPressure > 0.55) perturbationPeaks.push(perturbationPressure);
            if (recoveryTrajectory === 'degrade') degradationPeaks.push(recoveryState.collapseRisk);
        }

        // Count spontaneous ignitions: activity rises by >0.05 from below quiet-floor (0.05)
        const QUIET_FLOOR = 0.05;
        if (prevBelowFloor && meanAct >= QUIET_FLOOR) {
            spontaneousIgnitionCount++;
        }
        prevBelowFloor = meanAct < QUIET_FLOOR;

        // Accumulate quiet baseline floor when no touch is active
        if (activeTouches.size === 0) {
            quietBaselineSum += meanAct;
            quietBaselineCount++;
        }

        if (dyn.modeState !== lastModeState) {
            modeTransitions++;
            lastModeState = dyn.modeState;
        }
        if (dyn.actionState !== lastActionState) {
            actionTransitions++;
            lastActionState = dyn.actionState;
        }

        // Phase 5: Derive observation patterns (observer-side proxy, read-only, no core impact)
        try {
            lastObservationPatternState = deriveObservationPatterns({
                timestamp: frame,
                traceState,
                replayState,
                recoveryState,
                mismatchState: null,
                activityHistory,
                recentPerturbationHistory,
                meanActivity: meanAct,
                baselineActivity: quietBaselineCount > 0 ? quietBaselineSum / quietBaselineCount : meanAct,
            });
        } catch (_e) {
            // Observer derivation failed — skip silently, no core impact
        }

        // Phase 7: Derive proto-point candidates (observer-side proxy, read-only, no core impact)
        try {
            lastProtoPointObservationState = deriveProtoPointCandidates({
                timestamp: frame,
                traceState,
                replayState,
                recoveryState,
                observationPatternState: lastObservationPatternState,
                activityHistory,
                recentPerturbationHistory,
                meanActivity: meanAct,
                baselineActivity: quietBaselineCount > 0 ? quietBaselineSum / quietBaselineCount : meanAct,
                previousState: lastProtoPointObservationState,
            });
        } catch (_e) {
            // Observer derivation failed — skip silently, no core impact
        }

        // W1: Derive Body Surface state (Boundary Layer — derived / proxy, read-only, no core impact)
        try {
            // Derive mismatch for Body Surface (if touch is active)
            let bsMismatchState = null;
            if ((dyn.activeTouchCount ?? 0) > 0 || (dyn.meanTouchNovelty ?? 0) > 0.01) {
                try {
                    const familiarity = network.touchExpectation
                        ? network.touchExpectation.touchHabituationField.reduce((a: number, b: number) => a + b, 0) /
                          network.touchExpectation.touchHabituationField.length
                        : 0;
                    const perturbEvent = derivePerturbationEvent('touch', dyn.meanRawTouch ?? 0, {
                        overload: dyn.overload ?? 0,
                        boundaryIntegrity: network.homeostaticState?.boundaryIntegrity ?? 0.8,
                        openness: 0.5,
                        familiarity,
                        repetitionCount: familiarity * 10,
                        baselineLevel: dyn.baselineLevel ?? 0,
                    });
                    bsMismatchState = derivePredictionMismatch(perturbEvent, {
                        overload: dyn.overload ?? 0,
                        boundaryIntegrity: network.homeostaticState?.boundaryIntegrity ?? 0.8,
                        restorationBias: network.homeostaticState?.restorationBias ?? 0.5,
                        coherenceMemory: network.livingState?.coherenceMemory ?? 0.5,
                        stability: dyn.stability ?? 0.5,
                    }, dyn.meanPredictionError ?? 0);
                } catch (_e) {
                    // skip mismatch derivation silently
                }
            }

            // Derive pressure competition for Body Surface
            let bsPressureState = null;
            if (network.livingState && network.homeostaticState && network.energyFlowState) {
                try {
                    const bsOrganismSnapshot = buildOrganismSnapshot(frame, network, dyn);
                    const bsIntero = runInteroceptionStage(bsOrganismSnapshot);
                    const bsSelfWorld = runSelfWorldModelStage(bsIntero, bsOrganismSnapshot, network.lastSelfWorldModelPacket ?? null);
                    const bsFelt = deriveFeltState(bsOrganismSnapshot, network.livingState, network.homeostaticState, network.energyFlowState, bsSelfWorld);
                    const bsArousal = deriveArousalAwareness(bsOrganismSnapshot, bsFelt, network.livingState, bsSelfWorld);
                    const bsReplay = deriveReplayState(bsOrganismSnapshot, bsFelt, bsArousal, traceState ?? {
                        timestamp: frame, traceStrength: 0, recurrenceWeight: 0, salienceResidue: 0, replayReadiness: 0, replaySuppression: 0,
                    }, replayQueue, 0, 0, null, recoveryState);
                    const bsNeed = deriveNeedMotivation(bsOrganismSnapshot, bsFelt, bsArousal, bsReplay, network.livingState, network.energyFlowState, network.homeostaticState, bsSelfWorld);
                    bsPressureState = derivePressureCompetition(bsNeed);
                } catch (_e) {
                    // skip pressure derivation silently
                }
            }

            lastBodySurfaceState = deriveBodySurfaceState({
                timestamp: frame,
                recoveryState,
                mismatchState: bsMismatchState,
                pressureState: bsPressureState,
                traceState,
                meanActivity: meanAct,
                homeostaticBoundaryIntegrity: network.homeostaticState?.boundaryIntegrity,
                collapseRisk: network.homeostaticState?.collapseRisk,
                overload: dyn.overload ?? network.homeostaticState?.overloadLevel,
                recentPerturbationHistory,
            });
            lastBodySurfaceState = applyMinimalNaturalFeedback({
                world: worldMediumState,
                returns: lastSensoryReturns,
                pulse: lastActuationPulse,
                bodySurface: lastBodySurfaceState,
                trace: traceState,
                adjustment: lastNaturalFeedbackAdjustment,
                flags: naturalFeedbackFlags,
            }).bodySurface;

            const quietness = clamp01(
                (1 - clampFinite((dyn.meanRawTouch ?? 0) / 1.2, 0, 1)) * 0.5 +
                clampFinite((dyn.bl_restDepth ?? 0), 0, 1) * 0.25 +
                clampFinite((dyn.bl_settlingWindow ?? 0), 0, 1) * 0.25,
            );

            const localPropagationProxy = clamp01(
                clampFinite(Math.abs(meanAct - previousMeanActivity) * 2.5, 0, 1) * 0.40 +
                clampFinite((dyn.ignitionRatio ?? 0), 0, 1) * 0.20 +
                clampFinite((lastObservationPatternState?.pathCount ?? 0) / 2, 0, 1) * 0.25 +
                clampFinite(1 - (lastActuationPulse?.locality ?? 1), 0, 1) * 0.15,
            );
            recentLocalPropagationHistory.push(localPropagationProxy);
            if (recentLocalPropagationHistory.length > 40) recentLocalPropagationHistory.shift();

            const frameOngoingness = clamp01(
                (1 - clampFinite(collapseFrames / Math.max(frame + 1, 1) * 5, 0, 1)) * 0.45 +
                (1 - clampFinite(saturationFrames / Math.max(frame + 1, 1) * 12, 0, 1)) * 0.25 +
                clampFinite((quietBaselineCount > 0 ? quietBaselineSum / quietBaselineCount : meanAct) / 0.2, 0, 1) * 0.3,
            );

            lastActuationPulse = deriveActuationPulse({
                timestamp: frame,
                bodySurfaceState: lastBodySurfaceState,
                pressureState: bsPressureState,
                recoveryState,
                traceState,
                mismatchState: bsMismatchState,
                ongoingness: frameOngoingness,
                stability: dyn.stability ?? 0.5,
                boundaryIntegrity: network.homeostaticState?.boundaryIntegrity ?? 1,
                collapseRisk: recoveryState?.collapseRisk ?? network.homeostaticState?.collapseRisk,
                overload: dyn.overload ?? network.homeostaticState?.overloadLevel,
                quietness,
                meanActivity: meanAct,
            });
            lastActuationPulse = applyMinimalNaturalFeedback({
                world: worldMediumState,
                returns: lastSensoryReturns,
                pulse: lastActuationPulse,
                bodySurface: lastBodySurfaceState,
                trace: traceState,
                adjustment: lastNaturalFeedbackAdjustment,
                flags: naturalFeedbackFlags,
            }).pulse;

            if (lastActuationPulse) {
                actuationPulseGeneratedCount++;
                actuationPulseChannelCount[lastActuationPulse.channel]++;
            } else {
                actuationPulseNullCount++;
            }

            const worldMediumInput = applyMinimalNaturalFeedback({
                world: worldMediumState,
                returns: lastSensoryReturns,
                pulse: lastActuationPulse,
                bodySurface: lastBodySurfaceState,
                trace: traceState,
                adjustment: lastNaturalFeedbackAdjustment,
                flags: naturalFeedbackFlags,
            }).world;
            const previousWorldMediumState = worldMediumInput;
            worldMediumState = updateWorldMedium(worldMediumInput, lastActuationPulse, dt);
            lastSensoryReturns = applyMinimalNaturalFeedback({
                world: worldMediumState,
                returns: deriveSensoryReturn(worldMediumState, previousWorldMediumState, dt),
                pulse: lastActuationPulse,
                bodySurface: lastBodySurfaceState,
                trace: traceState,
                adjustment: lastNaturalFeedbackAdjustment,
                flags: naturalFeedbackFlags,
            }).returns;
            lastReafferenceComparisonState = deriveReafferenceComparison(lastActuationPulse, lastSensoryReturns, worldMediumState, dt);
            lastBodyWorldClosureState = deriveBodyWorldClosureState({
                timestamp: frame,
                actuationPulse: lastActuationPulse,
                sensoryReturns: lastSensoryReturns,
                worldMediumState,
                reafferenceComparisonState: lastReafferenceComparisonState,
                ongoingness: frameOngoingness,
                previousState: lastBodyWorldClosureState,
            });
            lastDynamicViabilityState = deriveDynamicViabilityState({
                closure: lastBodyWorldClosureState,
                world: worldMediumState,
                bodySurface: lastBodySurfaceState,
                pulse: lastActuationPulse,
                returns: lastSensoryReturns,
                reafference: lastReafferenceComparisonState,
                trace: traceState,
                previousViability: lastDynamicViabilityState,
                dt,
            });
            lastMediumProfileState = deriveMediumProfileState({
                closure: lastBodyWorldClosureState,
                reafference: lastReafferenceComparisonState,
                world: worldMediumState,
                bodySurface: lastBodySurfaceState,
                pulse: lastActuationPulse,
                returns: lastSensoryReturns,
                viability: lastDynamicViabilityState,
                previousProfile: lastMediumProfileState,
                dt,
            });
            lastNaturalFeedbackAdjustment = deriveMinimalNaturalFeedback({
                viability: lastDynamicViabilityState,
                closure: lastBodyWorldClosureState,
                world: worldMediumState,
                bodySurface: lastBodySurfaceState,
                trace: traceState,
                previousAdjustment: lastNaturalFeedbackAdjustment,
                dt,
            });
            lastNaturalFeedbackReport = applyMinimalNaturalFeedback({
                world: worldMediumState,
                returns: lastSensoryReturns,
                pulse: lastActuationPulse,
                bodySurface: lastBodySurfaceState,
                trace: traceState,
                adjustment: lastNaturalFeedbackAdjustment,
                flags: naturalFeedbackFlags,
            }).report;

            lastProtoNeuronObservationState = deriveProtoNeuronCandidates({
                timestamp: frame,
                traceState,
                replayState,
                recoveryState,
                observationPatternState: lastObservationPatternState,
                protoPointObservationState: lastProtoPointObservationState,
                bodyWorldClosureState: lastBodyWorldClosureState,
                reafferenceComparisonState: lastReafferenceComparisonState,
                pressureCompetitionState: bsPressureState,
                actuationPulse: lastActuationPulse,
                activityHistory,
                localPropagationHistory: recentLocalPropagationHistory,
                meanActivity: meanAct,
                baselineActivity: quietBaselineCount > 0 ? quietBaselineSum / quietBaselineCount : meanAct,
                ongoingness: frameOngoingness,
                previousState: lastProtoNeuronObservationState,
            });

            // S5: Derive Local Excitability Field (observer-side, read-only, no core impact)
            try {
                lastLocalExcitabilityFieldState = deriveLocalExcitabilityField({
                    trace: traceState,
                    returns: lastSensoryReturns,
                    closure: lastBodyWorldClosureState,
                    mediumProfile: lastMediumProfileState,
                    viability: lastDynamicViabilityState,
                    previousField: lastLocalExcitabilityFieldState,
                    dt,
                });
            } catch (_e) {
                // Observer derivation failed — skip silently, no core impact
            }

            // S6: Derive Repeated Flow Path Observation (observer-side, read-only, no core impact)
            try {
                const prevLef = previousLocalExcitabilityFieldState;
                lastRepeatedFlowPathObservationState = deriveRepeatedFlowPaths({
                    localField: lastLocalExcitabilityFieldState,
                    previousLocalField: prevLef,
                    trace: traceState,
                    mediumProfile: lastMediumProfileState,
                    closure: lastBodyWorldClosureState,
                    reafference: lastReafferenceComparisonState,
                    viability: lastDynamicViabilityState,
                    previousObservation: lastRepeatedFlowPathObservationState,
                    dt,
                });
                previousLocalExcitabilityFieldState = lastLocalExcitabilityFieldState;
            } catch (_e) {
                // Observer derivation failed — skip silently, no core impact
                previousLocalExcitabilityFieldState = lastLocalExcitabilityFieldState;
            }

            // S7: Derive Proto-Network Candidate Observation (observer-side, read-only, no core impact)
            try {
                lastProtoNetworkObservationState = deriveProtoNetworkCandidates({
                    localField: lastLocalExcitabilityFieldState,
                    repeatedFlowPaths: lastRepeatedFlowPathObservationState,
                    protoNeuronObservation: lastProtoNeuronObservationState,
                    trace: traceState,
                    mediumProfile: lastMediumProfileState,
                    closure: lastBodyWorldClosureState,
                    reafference: lastReafferenceComparisonState,
                    viability: lastDynamicViabilityState,
                    previousObservation: lastProtoNetworkObservationState,
                    dt,
                });
            } catch (_e) {
                // Observer derivation failed — skip silently, no core impact
            }
        } catch (_e) {
            // Body Surface derivation failed — skip silently, no core impact
            lastActuationPulse = null;
            lastDynamicViabilityState = null;
            lastMediumProfileState = null;
            lastNaturalFeedbackAdjustment = createNeutralNaturalFeedbackAdjustment(frame);
            lastNaturalFeedbackReport = {
                appliedTargets: [],
                appliedTargetCount: 0,
                enabledFlags: naturalFeedbackFlags,
            };
            lastProtoNeuronObservationState = null;
            actuationPulseNullCount++;
        }

        previousMeanActivity = meanAct;

        if (collectMetrics && frame % metricsInterval === 0) {
            metrics.push(buildMetricsSnapshot(
                frame,
                network,
                dyn,
                recentMeans,
                traceState,
                replayState,
                replayQueue.size(),
                lastWeakConsolidationDelta,
                lastReplayContributionToStabilization,
                recoveryState,
                recoveryTrajectory,
                collapseMode,
                lastObservationPatternState,
                lastProtoPointObservationState,
                lastProtoNeuronObservationState,
                lastBodySurfaceState,
                lastActuationPulse,
                lastDynamicViabilityState,
                lastMediumProfileState,
                lastNaturalFeedbackAdjustment,
                lastNaturalFeedbackReport,
                actuationPulseGeneratedCount,
                actuationPulseNullCount,
                lastLocalExcitabilityFieldState,
                lastRepeatedFlowPathObservationState,
                lastProtoNetworkObservationState,
            ));
        }
    }

    // Compute summary
    const finalMeanActivity = activityHistory[activityHistory.length - 1] ?? 0;
    const peakActivity = Math.max(...activityHistory);

    // Compute mean response amplitude for touch scenarios
    let meanResponseAmplitude = 0;
    if (touchScript.length > 0) {
        const responses: number[] = [];
        for (const touch of touchScript) {
            const preTouch = activityHistory.slice(
                Math.max(0, touch.frame - 50),
                touch.frame
            );
            const postTouch = activityHistory.slice(
                touch.frame,
                Math.min(activityHistory.length, touch.frame + 50)
            );
            if (preTouch.length > 0 && postTouch.length > 0) {
                const baseline = preTouch.reduce((a, b) => a + b, 0) / preTouch.length;
                const peak = Math.max(...postTouch);
                responses.push(peak - baseline);
            }
        }
        if (responses.length > 0) {
            meanResponseAmplitude = responses.reduce((a, b) => a + b, 0) / responses.length;
        }
    }

    // Phase 1: Compute ongoingness summary metrics
    const saturationRate = config.totalFrames > 0 ? saturationFrames / config.totalFrames : 0;
    const collapseRate = config.totalFrames > 0 ? collapseFrames / config.totalFrames : 0;
    const quietBaselineFloor = quietBaselineCount > 0 ? quietBaselineSum / quietBaselineCount : 0;
    // Ongoingness score: proxy combining no-collapse, no-saturation, and activity presence
    // 1.0 = never collapsed, never saturated, maintained baseline
    // Penalise for collapse rate and saturation rate; reward for quietBaselineFloor above 0.05
    const ongoingnessScore = Math.max(0, Math.min(1,
        (1 - Math.min(collapseRate * 5, 1)) * 0.5 +   // collapse penalty (weight 0.5)
        (1 - Math.min(saturationRate * 20, 1)) * 0.3 + // saturation penalty (weight 0.3)
        Math.min(quietBaselineFloor / 0.2, 1) * 0.2    // floor reward (weight 0.2)
    ));

    // Determine success
    let succeeded = true;
    let failureReason: string | undefined;

    if (nanFrames > 0) {
        succeeded = false;
        failureReason = `NaN detected in ${nanFrames} frames`;
    } else if (collapseFrames > config.totalFrames * 0.5) {
        succeeded = false;
        failureReason = `Activity collapsed in ${collapseFrames}/${config.totalFrames} frames`;
    } else if (peakActivity > 100.0) {
        succeeded = false;
        failureReason = `Activity exploded to ${peakActivity.toFixed(2)}`;
    }

    // Beautiful Loop L2: Compute packet summaries from metrics
    let avgEnergySense = 0;
    let avgOverloadSense = 0;
    let avgSelfCoherence = 0;
    let avgSelfContinuity = 0;
    let avgWorldPressure = 0;
    let avgRelationEngagement = 0;
    let maxPerturbationPressure = 0;
    let minPerturbationPressure = Infinity;
    let packetCount = 0;

    // A1: Felt-state summary accumulators
    let avgDepletion = 0;
    let avgOverload = 0;
    let avgCoherence = 0;
    let avgBoundaryIntegrity = 0;
    let avgRestorationReadiness = 0;
    let avgPerturbationLoad = 0;
    let avgOpenness = 0;
    let maxOverload = 0;
    let minCoherence = Infinity;
    let feltCount = 0;
    let avgArousalLevel = 0;
    let avgAwarenessWindow = 0;
    let avgSalienceOpenness = 0;
    let avgForegroundPressure = 0;
    let maxArousalLevel = 0;
    let minAwarenessWindow = Infinity;
    let arousalAwarenessCount = 0;

    // A3: Replay summary accumulators
    let avgTraceStrength = 0;
    let avgRecurrenceWeight = 0;
    let avgSalienceResidue = 0;
    let avgReplayPressure = 0;
    let avgReplayReadiness = 0;
    let avgConsolidationGain = 0;
    let maxActiveReplayCount = 0;
    let avgRecentReplaySalience = 0;
    let avgRecentPatternWeight = 0;
    let avgSettlingResidue = 0;
    let avgRecoveryLinkedResidue = 0;
    let avgWeakConsolidationDelta = 0;
    let avgReplayContributionToStabilization = 0;
    let avgQueueSize = 0;
    let replayCount = 0;

    // A4: Need / motivation summary accumulators
    let avgEnergyNeed = 0;
    let avgSafetyNeed = 0;
    let avgRestorationNeed = 0;
    let avgContactNeed = 0;
    let avgNoveltyMotivation = 0;
    let avgRepetitionMotivation = 0;
    let avgExplorationMotivation = 0;
    let avgSettlingMotivation = 0;
    let avgWithdrawMotivation = 0;
    let maxEnergyNeed = 0;
    let maxSafetyNeed = 0;
    let maxNoveltyMotivation = 0;
    let maxWithdrawMotivation = 0;
    let needMotivationCount = 0;

    // Q1-1: Open-State summary accumulators
    let avgStabilityIndex = 0;
    let avgMixtureEntropy = 0;
    const dominantPoleCount: Record<string, number> = {};
    let openStateCount = 0;
    // Q1-2: Touch backaction summary accumulators
    let avgBackactionGain = 0;
    let avgBackactionSurpriseGain = 0;
    let avgBackactionBoundaryModulation = 0;
    let avgBackactionOpennessModulation = 0;
    let avgBackactionCoherenceShift = 0;
    let avgBackactionFamiliarityDamping = 0;
    let maxBackactionOverloadAmplification = 0;
    let backactionCount = 0;
    let avgRecoveryPressure = 0;
    let avgRelaxationLevel = 0;
    let avgStabilizationPull = 0;
    let avgRecoveryCollapseRisk = 0;
    let avgBoundaryRepairPressure = 0;
    let avgSelfPreservationDrive = 0;
    let avgOverloadDrain = 0;
    let recoveryProfileCount = 0;
    let recoveryFrameCount = 0;
    let shiftFrameCount = 0;
    let degradeFrameCount = 0;
    let partialRepairFrameCount = 0;
    let softCollapseFrames = 0;
    let hardCollapseFrames = 0;
    let runawayFrames = 0;

    // Phase 2: Mismatch summary accumulators
    let avgMismatchLevel = 0;
    let avgSurprisePressure = 0;
    let avgBoundaryStress = 0;
    let avgRecoveryPull = 0;
    let maxMismatchLevel = 0;
    let mismatchCount = 0;

    // Phase 5: Observation pattern summary accumulators
    let avgKnotCount = 0;
    let avgPathCount = 0;
    let avgRecurrenceLocusCount = 0;
    let avgBasinCount = 0;
    let avgLongLivedAnomalyCount = 0;
    let avgProtoPointCandidateCount = 0;
    let maxProtoPointCandidateCount = 0;
    let avgObservationConfidence = 0;
    let protoPointEmergenceFrames = 0;
    let obsCount = 0;

    // Phase 6 / Q2-1: Pressure competition summary accumulators
    let avgSafetyPressure = 0;
    let avgRestorationPressure = 0;
    let avgNoveltyPressure = 0;
    let avgRepetitionPressure = 0;
    let avgExplorationPressure = 0;
    let avgWithdrawalPressure = 0;
    let avgCompetitionEntropy = 0;
    let avgCompetitionStability = 0;
    let avgAnnealingTemperature = 0;
    let avgPressureEnergy = 0;
    const dominantPressureCount: Record<string, number> = {};
    let pressureCompetitionCount = 0;

    // Phase 7: Proto-point observation summary accumulators
    let ppAvgCandidateCount = 0;
    let ppAvgStableCandidateCount = 0;
    let ppAvgAverageConfidence = 0;
    let ppMaxConfidence = 0;
    let ppLifetimeSum = 0;
    let ppLifetimeCount = 0;
    let ppRecurrenceSupportedFrames = 0;
    let ppReplaySupportedFrames = 0;
    let ppBasinOverlapFrames = 0;
    let ppPersistentFrames = 0;
    let ppCount = 0;

    // W7: Proto-neuron observation summary accumulators
    let pnAvgCandidateCount = 0;
    let pnAvgStableCandidateCount = 0;
    let pnAvgConfidence = 0;
    let pnMaxConfidence = 0;
    let pnAvgExcitability = 0;
    let pnAvgPropagation = 0;
    let pnAvgTraceRetention = 0;
    let pnAvgClosureCoupling = 0;
    let pnAvgCoActivationScore = 0;
    let pnClusterSum = 0;
    let pnRepeatedCoActivationCount = 0;
    let pnCount = 0;

    // W1: Body Surface summary accumulators
    let avgBsBoundaryIntegrity = 0;
    let avgBsSurfaceSensitivity = 0;
    let avgBsPermeability = 0;
    let avgBsContactReadiness = 0;
    let avgBsOutputReadiness = 0;
    let avgBsLocalIrritability = 0;
    let avgBsRecoveryShielding = 0;
    let maxBsLocalIrritability = 0;
    let minBsPermeability = Infinity;
    let bsCount = 0;
    let avgActuationIntensity = 0;
    let avgActuationCoherence = 0;
    let avgActuationRhythm = 0;
    let avgActuationLocality = 0;
    let avgActuationRecoveryLinked = 0;
    let avgActuationBoundaryLinked = 0;
    let avgActuationTraceLinked = 0;
    let avgActuationOutputReadiness = 0;
    let actuationSnapshotCount = 0;
    let avgDvFlowContinuity = 0;
    let avgDvEnergyThroughput = 0;
    let avgDvDissipationBalance = 0;
    let avgDvResistanceBalance = 0;
    let avgDvDelayCoherence = 0;
    let avgDvBoundaryExchange = 0;
    let avgDvUnderCouplingRisk = 0;
    let avgDvOverCouplingRisk = 0;
    let avgDvSaturationRisk = 0;
    let avgDvExtinctionRisk = 0;
    let avgDvViabilityConfidence = 0;
    let avgDvReturnContinuity = 0;
    let avgDvTraceContinuity = 0;
    let avgDvMediumExchangeBalance = 0;
    let avgDvClosureViability = 0;
    let dvCount = 0;
    let avgMpDelayAverageReturnDelay = 0;
    let avgMpDelayVariance = 0;
    let avgMpDelayStableDelayWindow = 0;
    let avgMpDelayUnstableDelayScore = 0;
    let avgMpEchoStrength = 0;
    let avgMpEchoDecayRate = 0;
    let avgMpEchoSaturationRisk = 0;
    let avgMpResistanceWorldResistance = 0;
    let avgMpResistanceReturnAttenuation = 0;
    let avgMpResistanceTransmissionRatio = 0;
    let avgMpProfileConfidence = 0;
    let mediumProfileCount = 0;
    let avgNfEchoDecayAdjustment = 0;
    let avgNfReturnGainAdjustment = 0;
    let avgNfPulseLeakageAdjustment = 0;
    let avgNfBoundaryPermeabilityAdjustment = 0;
    let avgNfSensoryAttenuationAdjustment = 0;
    let avgNfTraceDecayAdjustment = 0;
    let avgNfWorldResistanceAdjustment = 0;
    let avgNfDelayWindowAdjustment = 0;
    let avgNfMediumAbsorptionAdjustment = 0;
    let avgNfAdjustmentStrength = 0;
    let avgNfAdjustmentConfidence = 0;
    let avgNfFeedbackEffectEstimate = 0;
    let avgNfOvercorrectionRisk = 0;
    let avgNfFeedbackDominanceRisk = 0;
    let naturalFeedbackAppliedTargetCount = 0;
    let naturalFeedbackCount = 0;

    // S5: Local Excitability Field summary accumulators
    let avgLefAverageExcitability = 0;
    let avgLefMaxExcitability = 0;
    let avgLefAverageThresholdProximity = 0;
    let avgLefAverageTraceResidue = 0;
    let avgLefAverageReturnInfluence = 0;
    let avgLefAveragePropagationTendency = 0;
    let avgLefHighExcitabilityRegionCount = 0;
    let avgLefNearThresholdRegionCount = 0;
    let avgLefRecoveringRegionCount = 0;
    let avgLefFieldConfidence = 0;
    let avgLefExcitabilityVariance = 0;
    let avgLefRegionalGradientStrength = 0;
    let maxLefHighExcitabilityRegionCount = 0;
    let maxLefNearThresholdRegionCount = 0;
    let lefCount = 0;

    // S6: Repeated Flow Path summary accumulators
    let avgRfpPathCandidateCount = 0;
    let avgRfpStablePathCandidateCount = 0;
    let avgRfpAverageConfidence = 0;
    let maxRfpMaxConfidence = 0;
    let avgRfpAverageRecurrenceStrength = 0;
    let avgRfpAveragePropagationConsistency = 0;
    let avgRfpAverageTraceSupport = 0;
    let avgRfpAverageClosureCoupling = 0;
    let avgRfpObservationConfidence = 0;
    let rfpStablePathFrames = 0;
    let rfpCount = 0;

    // S7: Proto-Network Candidate Observation summary accumulators
    let avgPncNetworkCandidateCount = 0;
    let avgPncStableNetworkCandidateCount = 0;
    let avgPncAverageConfidence = 0;
    let maxPncMaxConfidence = 0;
    let avgPncAverageCoActivation = 0;
    let avgPncAveragePropagation = 0;
    let avgPncAverageRecurrence = 0;
    let avgPncAverageTraceCorrelation = 0;
    let avgPncAverageReplayCoReturn = 0;
    let avgPncAverageClosureCoupling = 0;
    let avgPncObservationConfidence = 0;
    let pncStableNetworkFrames = 0;
    let pncCount = 0;

    for (const m of metrics) {
        if (m.bl_energySense !== undefined) {
            avgEnergySense += m.bl_energySense;
            avgOverloadSense += m.bl_overloadSense ?? 0;
            avgSelfCoherence += m.bl_selfCoherence ?? 0;
            avgSelfContinuity += m.bl_selfContinuity ?? 0;
            avgWorldPressure += m.bl_worldPressure ?? 0;
            avgRelationEngagement += m.bl_relationEngagement ?? 0;
            if (m.bl_perturbationPressure !== undefined) {
                maxPerturbationPressure = Math.max(maxPerturbationPressure, m.bl_perturbationPressure);
                minPerturbationPressure = Math.min(minPerturbationPressure, m.bl_perturbationPressure);
            }
            packetCount++;
        }

        // A1: Accumulate felt-state metrics
        if (m.felt_depletion !== undefined) {
            avgDepletion += m.felt_depletion;
            avgOverload += m.felt_overload ?? 0;
            avgCoherence += m.felt_coherence ?? 0;
            avgBoundaryIntegrity += m.felt_boundaryIntegrity ?? 0;
            avgRestorationReadiness += m.felt_restorationReadiness ?? 0;
            avgPerturbationLoad += m.felt_perturbationLoad ?? 0;
            avgOpenness += m.felt_openness ?? 0;
            if (m.felt_overload !== undefined) {
                maxOverload = Math.max(maxOverload, m.felt_overload);
            }
            if (m.felt_coherence !== undefined) {
                minCoherence = Math.min(minCoherence, m.felt_coherence);
            }
            feltCount++;
        }

        if (m.arousalLevel !== undefined) {
            avgArousalLevel += m.arousalLevel;
            avgAwarenessWindow += m.awarenessWindow ?? 0;
            avgSalienceOpenness += m.salienceOpenness ?? 0;
            avgForegroundPressure += m.foregroundPressure ?? 0;
            maxArousalLevel = Math.max(maxArousalLevel, m.arousalLevel);
            if (m.awarenessWindow !== undefined) {
                minAwarenessWindow = Math.min(minAwarenessWindow, m.awarenessWindow);
            }
            arousalAwarenessCount++;
        }

        // A3: Accumulate replay metrics
        if (m.replayPressure !== undefined) {
            avgTraceStrength += m.traceStrength ?? 0;
            avgRecurrenceWeight += m.recurrenceWeight ?? 0;
            avgSalienceResidue += m.salienceResidue ?? 0;
            avgReplayPressure += m.replayPressure;
            avgReplayReadiness += m.replayReadiness ?? 0;
            avgConsolidationGain += m.consolidationGain ?? 0;
            avgRecentReplaySalience += m.recentReplaySalience ?? 0;
            avgRecentPatternWeight += m.recentPatternWeight ?? 0;
            avgSettlingResidue += m.settlingResidue ?? 0;
            avgRecoveryLinkedResidue += m.recoveryLinkedResidue ?? 0;
            avgWeakConsolidationDelta += m.weakConsolidationDelta ?? 0;
            avgReplayContributionToStabilization += m.replayContributionToStabilization ?? 0;
            avgQueueSize += m.replayQueueSize ?? 0;
            if (m.activeReplayCount !== undefined) {
                maxActiveReplayCount = Math.max(maxActiveReplayCount, m.activeReplayCount);
            }
            replayCount++;
        }

        // A4: Accumulate need/motivation metrics
        if (m.energyNeed !== undefined) {
            avgEnergyNeed += m.energyNeed;
            avgSafetyNeed += m.safetyNeed ?? 0;
            avgRestorationNeed += m.restorationNeed ?? 0;
            avgContactNeed += m.contactNeed ?? 0;
            avgNoveltyMotivation += m.noveltyMotivation ?? 0;
            avgRepetitionMotivation += m.repetitionMotivation ?? 0;
            avgExplorationMotivation += m.explorationMotivation ?? 0;
            avgSettlingMotivation += m.settlingMotivation ?? 0;
            avgWithdrawMotivation += m.withdrawMotivation ?? 0;
            if (m.energyNeed !== undefined) {
                maxEnergyNeed = Math.max(maxEnergyNeed, m.energyNeed);
            }
            if (m.safetyNeed !== undefined) {
                maxSafetyNeed = Math.max(maxSafetyNeed, m.safetyNeed);
            }
            if (m.noveltyMotivation !== undefined) {
                maxNoveltyMotivation = Math.max(maxNoveltyMotivation, m.noveltyMotivation);
            }
            if (m.withdrawMotivation !== undefined) {
                maxWithdrawMotivation = Math.max(maxWithdrawMotivation, m.withdrawMotivation);
            }
            needMotivationCount++;
        }

        // Q1-1: Accumulate open-state metrics
        if (m.openState_stabilityIndex !== undefined) {
            avgStabilityIndex += m.openState_stabilityIndex;
            avgMixtureEntropy += m.openState_mixtureEntropy ?? 0;
            const pole = m.openState_dominantPole ?? 'unknown';
            dominantPoleCount[pole] = (dominantPoleCount[pole] ?? 0) + 1;
            openStateCount++;
        }

        if (m.touchBackactionGain !== undefined) {
            avgBackactionGain += m.touchBackactionGain ?? 0;
            avgBackactionSurpriseGain += m.touchBackactionSurpriseGain ?? 0;
            avgBackactionBoundaryModulation += m.touchBackactionBoundaryModulation ?? 0;
            avgBackactionOpennessModulation += m.touchBackactionOpennessModulation ?? 0;
            avgBackactionCoherenceShift += m.touchBackactionCoherenceShift ?? 0;
            avgBackactionFamiliarityDamping += m.touchBackactionFamiliarityDamping ?? 0;
            if (m.touchBackactionOverloadAmplification !== undefined) {
                maxBackactionOverloadAmplification = Math.max(
                    maxBackactionOverloadAmplification,
                    m.touchBackactionOverloadAmplification
                );
            }
            backactionCount++;
        }

        if (m.recoveryPressure !== undefined) {
            avgRecoveryPressure += m.recoveryPressure ?? 0;
            avgRelaxationLevel += m.relaxationLevel ?? 0;
            avgStabilizationPull += m.stabilizationPull ?? 0;
            avgRecoveryCollapseRisk += m.collapseRisk ?? 0;
            avgBoundaryRepairPressure += m.boundaryRepairPressure ?? 0;
            avgSelfPreservationDrive += m.selfPreservationDrive ?? 0;
            avgOverloadDrain += m.overloadDrain ?? 0;
            if (m.recoveryTrajectory === 'recover') recoveryFrameCount++;
            if (m.recoveryTrajectory === 'shift') shiftFrameCount++;
            if (m.recoveryTrajectory === 'degrade') degradeFrameCount++;
            if (m.recoveryTrajectory === 'partial_repair') partialRepairFrameCount++;
            if (m.collapseMode === 'soft_collapse') softCollapseFrames++;
            if (m.collapseMode === 'hard_collapse') hardCollapseFrames++;
            if (m.collapseMode === 'runaway') runawayFrames++;
            recoveryProfileCount++;
        }
        if (m.p2_mismatchLevel !== undefined) {
            avgMismatchLevel += m.p2_mismatchLevel;
            avgSurprisePressure += m.p2_surprisePressure ?? 0;
            avgBoundaryStress += m.p2_boundaryStress ?? 0;
            avgRecoveryPull += m.p2_recoveryPull ?? 0;
            maxMismatchLevel = Math.max(maxMismatchLevel, m.p2_mismatchLevel);
            mismatchCount++;
        }

        // Phase 5: Accumulate observation pattern metrics
        if (m.obs_knotCount !== undefined) {
            avgKnotCount += m.obs_knotCount;
            avgPathCount += m.obs_pathCount ?? 0;
            avgRecurrenceLocusCount += m.obs_recurrenceLocusCount ?? 0;
            avgBasinCount += m.obs_basinCount ?? 0;
            avgLongLivedAnomalyCount += m.obs_longLivedAnomalyCount ?? 0;
            avgProtoPointCandidateCount += m.obs_protoPointCandidateCount ?? 0;
            avgObservationConfidence += m.obs_observationConfidence ?? 0;
            if ((m.obs_protoPointCandidateCount ?? 0) > 0) protoPointEmergenceFrames++;
            if ((m.obs_protoPointCandidateCount ?? 0) > maxProtoPointCandidateCount) {
                maxProtoPointCandidateCount = m.obs_protoPointCandidateCount ?? 0;
            }
            obsCount++;
        }

        // Phase 6 / Q2-1: Accumulate pressure competition metrics
        if (m.pc_competitionEntropy !== undefined) {
            avgSafetyPressure += m.pc_safetyPressure ?? 0;
            avgRestorationPressure += m.pc_restorationPressure ?? 0;
            avgNoveltyPressure += m.pc_noveltyPressure ?? 0;
            avgRepetitionPressure += m.pc_repetitionPressure ?? 0;
            avgExplorationPressure += m.pc_explorationPressure ?? 0;
            avgWithdrawalPressure += m.pc_withdrawalPressure ?? 0;
            avgCompetitionEntropy += m.pc_competitionEntropy;
            avgCompetitionStability += m.pc_competitionStability ?? 0;
            avgAnnealingTemperature += m.pc_annealingTemperature ?? 0;
            avgPressureEnergy += m.pc_pressureEnergy ?? 0;
            const dp = m.pc_dominantPressure ?? 'null';
            dominantPressureCount[dp] = (dominantPressureCount[dp] ?? 0) + 1;
            pressureCompetitionCount++;
        }

        // Phase 7: Accumulate proto-point observation metrics
        if (m.pp_candidateCount !== undefined) {
            ppAvgCandidateCount += m.pp_candidateCount;
            ppAvgStableCandidateCount += m.pp_stableCandidateCount ?? 0;
            ppAvgAverageConfidence += m.pp_averageConfidence ?? 0;
            if ((m.pp_maxConfidence ?? 0) > ppMaxConfidence) {
                ppMaxConfidence = m.pp_maxConfidence ?? 0;
            }
            if ((m.pp_candidateCount ?? 0) > 0) {
                // Rough lifetime proxy: use persistence × candidateCount (not exact)
                ppLifetimeSum += 1;
                ppLifetimeCount++;
            }
            if ((m.pp_candidateCount ?? 0) > 0 && (m.recurrenceWeight ?? 0) > 0.25) {
                ppRecurrenceSupportedFrames++;
            }
            if ((m.pp_candidateCount ?? 0) > 0 && (m.replayReadiness ?? 0) > 0.25) {
                ppReplaySupportedFrames++;
            }
            if ((m.pp_candidateCount ?? 0) > 0 && (m.obs_basinCount ?? 0) > 0) {
                ppBasinOverlapFrames++;
            }
            if ((m.pp_stableCandidateCount ?? 0) > 0) {
                ppPersistentFrames++;
            }
            ppCount++;
        }

        // W7: Accumulate proto-neuron observation metrics
        if (m.pn_candidateCount !== undefined) {
            pnAvgCandidateCount += m.pn_candidateCount;
            pnAvgStableCandidateCount += m.pn_stableCandidateCount ?? 0;
            pnAvgConfidence += m.pn_averageConfidence ?? 0;
            pnMaxConfidence = Math.max(pnMaxConfidence, m.pn_maxConfidence ?? 0);
            pnAvgExcitability += m.pn_averageExcitability ?? 0;
            pnAvgPropagation += m.pn_averagePropagation ?? 0;
            pnAvgTraceRetention += m.pn_averageTraceRetention ?? 0;
            pnAvgClosureCoupling += m.pn_averageClosureCoupling ?? 0;
            pnAvgCoActivationScore += m.pn_averageCoActivationScore ?? 0;
            pnClusterSum += m.pn_coActivationClusterCount ?? 0;
            pnRepeatedCoActivationCount += m.pn_repeatedCoActivationCount ?? 0;
            pnCount++;
        }

        // W1: Accumulate Body Surface metrics
        if (m.bs_boundaryIntegrity !== undefined) {
            avgBsBoundaryIntegrity += m.bs_boundaryIntegrity;
            avgBsSurfaceSensitivity += m.bs_surfaceSensitivity ?? 0;
            avgBsPermeability += m.bs_permeability ?? 0;
            avgBsContactReadiness += m.bs_contactReadiness ?? 0;
            avgBsOutputReadiness += m.bs_outputReadiness ?? 0;
            avgBsLocalIrritability += m.bs_localIrritability ?? 0;
            avgBsRecoveryShielding += m.bs_recoveryShielding ?? 0;
            if ((m.bs_localIrritability ?? 0) > maxBsLocalIrritability) {
                maxBsLocalIrritability = m.bs_localIrritability ?? 0;
            }
            if (m.bs_permeability !== undefined) {
                minBsPermeability = Math.min(minBsPermeability, m.bs_permeability);
            }
            bsCount++;
        }

        if (m.ap_outputReadiness !== undefined) {
            avgActuationOutputReadiness += m.ap_outputReadiness;
            if (m.ap_channel) {
                avgActuationIntensity += m.ap_intensity ?? 0;
                avgActuationCoherence += m.ap_coherence ?? 0;
                avgActuationRhythm += m.ap_rhythm ?? 0;
                avgActuationLocality += m.ap_locality ?? 0;
                avgActuationRecoveryLinked += m.ap_recoveryLinked ?? 0;
                avgActuationBoundaryLinked += m.ap_boundaryLinked ?? 0;
                avgActuationTraceLinked += m.ap_traceLinked ?? 0;
                actuationSnapshotCount++;
            }
        }

        if (m.dv_flowContinuity !== undefined) {
            avgDvFlowContinuity += m.dv_flowContinuity;
            avgDvEnergyThroughput += m.dv_energyThroughput ?? 0;
            avgDvDissipationBalance += m.dv_dissipationBalance ?? 0;
            avgDvResistanceBalance += m.dv_resistanceBalance ?? 0;
            avgDvDelayCoherence += m.dv_delayCoherence ?? 0;
            avgDvBoundaryExchange += m.dv_boundaryExchange ?? 0;
            avgDvUnderCouplingRisk += m.dv_underCouplingRisk ?? 0;
            avgDvOverCouplingRisk += m.dv_overCouplingRisk ?? 0;
            avgDvSaturationRisk += m.dv_saturationRisk ?? 0;
            avgDvExtinctionRisk += m.dv_extinctionRisk ?? 0;
            avgDvViabilityConfidence += m.dv_viabilityConfidence ?? 0;
            avgDvReturnContinuity += m.dv_returnContinuity ?? 0;
            avgDvTraceContinuity += m.dv_traceContinuity ?? 0;
            avgDvMediumExchangeBalance += m.dv_mediumExchangeBalance ?? 0;
            avgDvClosureViability += m.dv_closureViability ?? 0;
            dvCount++;
        }

        if (m.mp_delayAverageReturnDelay !== undefined) {
            avgMpDelayAverageReturnDelay += m.mp_delayAverageReturnDelay;
            avgMpDelayVariance += m.mp_delayVariance ?? 0;
            avgMpDelayStableDelayWindow += m.mp_delayStableDelayWindow ?? 0;
            avgMpDelayUnstableDelayScore += m.mp_delayUnstableDelayScore ?? 0;
            avgMpEchoStrength += m.mp_echoStrength ?? 0;
            avgMpEchoDecayRate += m.mp_echoDecayRate ?? 0;
            avgMpEchoSaturationRisk += m.mp_echoSaturationRisk ?? 0;
            avgMpResistanceWorldResistance += m.mp_resistanceWorldResistance ?? 0;
            avgMpResistanceReturnAttenuation += m.mp_resistanceReturnAttenuation ?? 0;
            avgMpResistanceTransmissionRatio += m.mp_resistanceTransmissionRatio ?? 0;
            avgMpProfileConfidence += m.mp_profileConfidence ?? 0;
            mediumProfileCount++;
        }

        if (m.nf_adjustmentStrength !== undefined) {
            avgNfEchoDecayAdjustment += m.nf_echoDecayAdjustment ?? 0;
            avgNfReturnGainAdjustment += m.nf_returnGainAdjustment ?? 0;
            avgNfPulseLeakageAdjustment += m.nf_pulseLeakageAdjustment ?? 0;
            avgNfBoundaryPermeabilityAdjustment += m.nf_boundaryPermeabilityAdjustment ?? 0;
            avgNfSensoryAttenuationAdjustment += m.nf_sensoryAttenuationAdjustment ?? 0;
            avgNfTraceDecayAdjustment += m.nf_traceDecayAdjustment ?? 0;
            avgNfWorldResistanceAdjustment += m.nf_worldResistanceAdjustment ?? 0;
            avgNfDelayWindowAdjustment += m.nf_delayWindowAdjustment ?? 0;
            avgNfMediumAbsorptionAdjustment += m.nf_mediumAbsorptionAdjustment ?? 0;
            avgNfAdjustmentStrength += m.nf_adjustmentStrength ?? 0;
            avgNfAdjustmentConfidence += m.nf_adjustmentConfidence ?? 0;
            avgNfFeedbackEffectEstimate += m.nf_feedbackEffectEstimate ?? 0;
            avgNfOvercorrectionRisk += m.nf_overcorrectionRisk ?? 0;
            avgNfFeedbackDominanceRisk += m.nf_feedbackDominanceRisk ?? 0;
            naturalFeedbackAppliedTargetCount += m.nf_appliedTargetCount ?? 0;
            naturalFeedbackCount++;
        }

        // S5: Accumulate Local Excitability Field metrics
        if (m.lef_averageExcitability !== undefined) {
            avgLefAverageExcitability += m.lef_averageExcitability;
            avgLefMaxExcitability += m.lef_maxExcitability ?? 0;
            avgLefAverageThresholdProximity += m.lef_averageThresholdProximity ?? 0;
            avgLefAverageTraceResidue += m.lef_averageTraceResidue ?? 0;
            avgLefAverageReturnInfluence += m.lef_averageReturnInfluence ?? 0;
            avgLefAveragePropagationTendency += m.lef_averagePropagationTendency ?? 0;
            avgLefHighExcitabilityRegionCount += m.lef_highExcitabilityRegionCount ?? 0;
            avgLefNearThresholdRegionCount += m.lef_nearThresholdRegionCount ?? 0;
            avgLefRecoveringRegionCount += m.lef_recoveringRegionCount ?? 0;
            avgLefFieldConfidence += m.lef_fieldConfidence ?? 0;
            avgLefExcitabilityVariance += m.lef_excitabilityVariance ?? 0;
            avgLefRegionalGradientStrength += m.lef_regionalGradientStrength ?? 0;
            maxLefHighExcitabilityRegionCount = Math.max(maxLefHighExcitabilityRegionCount, m.lef_highExcitabilityRegionCount ?? 0);
            maxLefNearThresholdRegionCount = Math.max(maxLefNearThresholdRegionCount, m.lef_nearThresholdRegionCount ?? 0);
            lefCount++;
        }

        // S6: Accumulate Repeated Flow Path metrics
        if (m.rfp_observationConfidence !== undefined) {
            avgRfpPathCandidateCount += m.rfp_pathCandidateCount ?? 0;
            avgRfpStablePathCandidateCount += m.rfp_stablePathCandidateCount ?? 0;
            avgRfpAverageConfidence += m.rfp_averageConfidence ?? 0;
            maxRfpMaxConfidence = Math.max(maxRfpMaxConfidence, m.rfp_maxConfidence ?? 0);
            avgRfpAverageRecurrenceStrength += m.rfp_averageRecurrenceStrength ?? 0;
            avgRfpAveragePropagationConsistency += m.rfp_averagePropagationConsistency ?? 0;
            avgRfpAverageTraceSupport += m.rfp_averageTraceSupport ?? 0;
            avgRfpAverageClosureCoupling += m.rfp_averageClosureCoupling ?? 0;
            avgRfpObservationConfidence += m.rfp_observationConfidence;
            if ((m.rfp_stablePathCandidateCount ?? 0) > 0) rfpStablePathFrames++;
            rfpCount++;
        }

        // S7: Accumulate Proto-Network Candidate metrics
        if (m.pnc_networkCandidateCount !== undefined) {
            avgPncNetworkCandidateCount += m.pnc_networkCandidateCount;
            avgPncStableNetworkCandidateCount += m.pnc_stableNetworkCandidateCount ?? 0;
            avgPncAverageConfidence += m.pnc_averageConfidence ?? 0;
            maxPncMaxConfidence = Math.max(maxPncMaxConfidence, m.pnc_maxConfidence ?? 0);
            avgPncAverageCoActivation += m.pnc_averageCoActivation ?? 0;
            avgPncAveragePropagation += m.pnc_averagePropagation ?? 0;
            avgPncAverageRecurrence += m.pnc_averageRecurrence ?? 0;
            avgPncAverageTraceCorrelation += m.pnc_averageTraceCorrelation ?? 0;
            avgPncAverageReplayCoReturn += m.pnc_averageReplayCoReturn ?? 0;
            avgPncAverageClosureCoupling += m.pnc_averageClosureCoupling ?? 0;
            avgPncObservationConfidence += m.pnc_observationConfidence ?? 0;
            if ((m.pnc_stableNetworkCandidateCount ?? 0) > 0) pncStableNetworkFrames++;
            pncCount++;
        }
    }

    if (packetCount > 0) {
        avgEnergySense /= packetCount;
        avgOverloadSense /= packetCount;
        avgSelfCoherence /= packetCount;
        avgSelfContinuity /= packetCount;
        avgWorldPressure /= packetCount;
        avgRelationEngagement /= packetCount;
    }

    // A1: Compute felt-state averages
    if (feltCount > 0) {
        avgDepletion /= feltCount;
        avgOverload /= feltCount;
        avgCoherence /= feltCount;
        avgBoundaryIntegrity /= feltCount;
        avgRestorationReadiness /= feltCount;
        avgPerturbationLoad /= feltCount;
        avgOpenness /= feltCount;
    }

    if (arousalAwarenessCount > 0) {
        avgArousalLevel /= arousalAwarenessCount;
        avgAwarenessWindow /= arousalAwarenessCount;
        avgSalienceOpenness /= arousalAwarenessCount;
        avgForegroundPressure /= arousalAwarenessCount;
    }

    // A3: Compute replay averages
    if (replayCount > 0) {
        avgTraceStrength /= replayCount;
        avgRecurrenceWeight /= replayCount;
        avgSalienceResidue /= replayCount;
        avgReplayPressure /= replayCount;
        avgReplayReadiness /= replayCount;
        avgConsolidationGain /= replayCount;
        avgRecentReplaySalience /= replayCount;
        avgRecentPatternWeight /= replayCount;
        avgSettlingResidue /= replayCount;
        avgRecoveryLinkedResidue /= replayCount;
        avgWeakConsolidationDelta /= replayCount;
        avgReplayContributionToStabilization /= replayCount;
        avgQueueSize /= replayCount;
    }

    // A4: Compute need/motivation averages
    if (needMotivationCount > 0) {
        avgEnergyNeed /= needMotivationCount;
        avgSafetyNeed /= needMotivationCount;
        avgRestorationNeed /= needMotivationCount;
        avgContactNeed /= needMotivationCount;
        avgNoveltyMotivation /= needMotivationCount;
        avgRepetitionMotivation /= needMotivationCount;
        avgExplorationMotivation /= needMotivationCount;
        avgSettlingMotivation /= needMotivationCount;
        avgWithdrawMotivation /= needMotivationCount;
    }

    // Q1-1: Compute open-state averages
    if (openStateCount > 0) {
        avgStabilityIndex /= openStateCount;
        avgMixtureEntropy /= openStateCount;
    }

    // Q1-2: Compute backaction averages
    if (backactionCount > 0) {
        avgBackactionGain /= backactionCount;
        avgBackactionSurpriseGain /= backactionCount;
        avgBackactionBoundaryModulation /= backactionCount;
        avgBackactionOpennessModulation /= backactionCount;
        avgBackactionCoherenceShift /= backactionCount;
        avgBackactionFamiliarityDamping /= backactionCount;
    }
    if (recoveryProfileCount > 0) {
        avgRecoveryPressure /= recoveryProfileCount;
        avgRelaxationLevel /= recoveryProfileCount;
        avgStabilizationPull /= recoveryProfileCount;
        avgRecoveryCollapseRisk /= recoveryProfileCount;
        avgBoundaryRepairPressure /= recoveryProfileCount;
        avgSelfPreservationDrive /= recoveryProfileCount;
        avgOverloadDrain /= recoveryProfileCount;
    }

    const avgRecoveryTime = recoveryTimes.length > 0
        ? recoveryTimes.reduce((sum, value) => sum + value, 0) / recoveryTimes.length
        : undefined;
    const avgSettlingTime = settlingTimes.length > 0
        ? settlingTimes.reduce((sum, value) => sum + value, 0) / settlingTimes.length
        : undefined;
    const repeatedOverloadDegradationSlope = (() => {
        if (perturbationPeaks.length < 2 || degradationPeaks.length < 2) return undefined;
        const n = Math.min(perturbationPeaks.length, degradationPeaks.length, 8);
        const xs = perturbationPeaks.slice(-n);
        const ys = degradationPeaks.slice(-n);
        const xMean = xs.reduce((sum, value) => sum + value, 0) / n;
        const yMean = ys.reduce((sum, value) => sum + value, 0) / n;
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < n; i++) {
            const dx = xs[i] - xMean;
            numerator += dx * (ys[i] - yMean);
            denominator += dx * dx;
        }
        if (denominator < 1e-6) return undefined;
        return numerator / denominator;
    })();

    // Phase 2: Compute mismatch averages
    if (mismatchCount > 0) {
        avgMismatchLevel /= mismatchCount;
        avgSurprisePressure /= mismatchCount;
        avgBoundaryStress /= mismatchCount;
        avgRecoveryPull /= mismatchCount;
    }

    // Phase 5: Compute observation pattern averages
    if (obsCount > 0) {
        avgKnotCount /= obsCount;
        avgPathCount /= obsCount;
        avgRecurrenceLocusCount /= obsCount;
        avgBasinCount /= obsCount;
        avgLongLivedAnomalyCount /= obsCount;
        avgProtoPointCandidateCount /= obsCount;
        avgObservationConfidence /= obsCount;
    }
    // repeatedEmergenceCount: how many distinct frames had proto-point emergence (already tracked above)
    const repeatedEmergenceCount = protoPointEmergenceFrames;

    // Phase 6 / Q2-1: Compute pressure competition averages
    if (pressureCompetitionCount > 0) {
        avgSafetyPressure /= pressureCompetitionCount;
        avgRestorationPressure /= pressureCompetitionCount;
        avgNoveltyPressure /= pressureCompetitionCount;
        avgRepetitionPressure /= pressureCompetitionCount;
        avgExplorationPressure /= pressureCompetitionCount;
        avgWithdrawalPressure /= pressureCompetitionCount;
        avgCompetitionEntropy /= pressureCompetitionCount;
        avgCompetitionStability /= pressureCompetitionCount;
        avgAnnealingTemperature /= pressureCompetitionCount;
        avgPressureEnergy /= pressureCompetitionCount;
    }

    // Phase 7: Compute proto-point observation averages
    if (ppCount > 0) {
        ppAvgCandidateCount /= ppCount;
        ppAvgStableCandidateCount /= ppCount;
        ppAvgAverageConfidence /= ppCount;
    }

    // W7: Compute proto-neuron observation averages
    if (pnCount > 0) {
        pnAvgCandidateCount /= pnCount;
        pnAvgStableCandidateCount /= pnCount;
        pnAvgConfidence /= pnCount;
        pnAvgExcitability /= pnCount;
        pnAvgPropagation /= pnCount;
        pnAvgTraceRetention /= pnCount;
        pnAvgClosureCoupling /= pnCount;
        pnAvgCoActivationScore /= pnCount;
    }

    // W1: Compute Body Surface averages
    if (bsCount > 0) {
        avgBsBoundaryIntegrity /= bsCount;
        avgBsSurfaceSensitivity /= bsCount;
        avgBsPermeability /= bsCount;
        avgBsContactReadiness /= bsCount;
        avgBsOutputReadiness /= bsCount;
        avgBsLocalIrritability /= bsCount;
        avgBsRecoveryShielding /= bsCount;
    }

    const actuationOutputSnapshotCount = metrics.filter(m => m.ap_outputReadiness !== undefined).length;
    if (actuationOutputSnapshotCount > 0) {
        avgActuationOutputReadiness /= actuationOutputSnapshotCount;
    }
    if (actuationSnapshotCount > 0) {
        avgActuationIntensity /= actuationSnapshotCount;
        avgActuationCoherence /= actuationSnapshotCount;
        avgActuationRhythm /= actuationSnapshotCount;
        avgActuationLocality /= actuationSnapshotCount;
        avgActuationRecoveryLinked /= actuationSnapshotCount;
        avgActuationBoundaryLinked /= actuationSnapshotCount;
        avgActuationTraceLinked /= actuationSnapshotCount;
    }

    if (dvCount > 0) {
        avgDvFlowContinuity /= dvCount;
        avgDvEnergyThroughput /= dvCount;
        avgDvDissipationBalance /= dvCount;
        avgDvResistanceBalance /= dvCount;
        avgDvDelayCoherence /= dvCount;
        avgDvBoundaryExchange /= dvCount;
        avgDvUnderCouplingRisk /= dvCount;
        avgDvOverCouplingRisk /= dvCount;
        avgDvSaturationRisk /= dvCount;
        avgDvExtinctionRisk /= dvCount;
        avgDvViabilityConfidence /= dvCount;
        avgDvReturnContinuity /= dvCount;
        avgDvTraceContinuity /= dvCount;
        avgDvMediumExchangeBalance /= dvCount;
        avgDvClosureViability /= dvCount;
    }

    if (mediumProfileCount > 0) {
        avgMpDelayAverageReturnDelay /= mediumProfileCount;
        avgMpDelayVariance /= mediumProfileCount;
        avgMpDelayStableDelayWindow /= mediumProfileCount;
        avgMpDelayUnstableDelayScore /= mediumProfileCount;
        avgMpEchoStrength /= mediumProfileCount;
        avgMpEchoDecayRate /= mediumProfileCount;
        avgMpEchoSaturationRisk /= mediumProfileCount;
        avgMpResistanceWorldResistance /= mediumProfileCount;
        avgMpResistanceReturnAttenuation /= mediumProfileCount;
        avgMpResistanceTransmissionRatio /= mediumProfileCount;
        avgMpProfileConfidence /= mediumProfileCount;
    }

    if (naturalFeedbackCount > 0) {
        avgNfEchoDecayAdjustment /= naturalFeedbackCount;
        avgNfReturnGainAdjustment /= naturalFeedbackCount;
        avgNfPulseLeakageAdjustment /= naturalFeedbackCount;
        avgNfBoundaryPermeabilityAdjustment /= naturalFeedbackCount;
        avgNfSensoryAttenuationAdjustment /= naturalFeedbackCount;
        avgNfTraceDecayAdjustment /= naturalFeedbackCount;
        avgNfWorldResistanceAdjustment /= naturalFeedbackCount;
        avgNfDelayWindowAdjustment /= naturalFeedbackCount;
        avgNfMediumAbsorptionAdjustment /= naturalFeedbackCount;
        avgNfAdjustmentStrength /= naturalFeedbackCount;
        avgNfAdjustmentConfidence /= naturalFeedbackCount;
        avgNfFeedbackEffectEstimate /= naturalFeedbackCount;
        avgNfOvercorrectionRisk /= naturalFeedbackCount;
        avgNfFeedbackDominanceRisk /= naturalFeedbackCount;
    }

    // S5: Compute Local Excitability Field averages
    if (lefCount > 0) {
        avgLefAverageExcitability /= lefCount;
        avgLefMaxExcitability /= lefCount;
        avgLefAverageThresholdProximity /= lefCount;
        avgLefAverageTraceResidue /= lefCount;
        avgLefAverageReturnInfluence /= lefCount;
        avgLefAveragePropagationTendency /= lefCount;
        avgLefHighExcitabilityRegionCount /= lefCount;
        avgLefNearThresholdRegionCount /= lefCount;
        avgLefRecoveringRegionCount /= lefCount;
        avgLefFieldConfidence /= lefCount;
        avgLefExcitabilityVariance /= lefCount;
        avgLefRegionalGradientStrength /= lefCount;
    }

    // S6: Compute Repeated Flow Path averages
    if (rfpCount > 0) {
        avgRfpPathCandidateCount /= rfpCount;
        avgRfpStablePathCandidateCount /= rfpCount;
        avgRfpAverageConfidence /= rfpCount;
        avgRfpAverageRecurrenceStrength /= rfpCount;
        avgRfpAveragePropagationConsistency /= rfpCount;
        avgRfpAverageTraceSupport /= rfpCount;
        avgRfpAverageClosureCoupling /= rfpCount;
        avgRfpObservationConfidence /= rfpCount;
    }

    // S7: Compute Proto-Network Candidate averages
    if (pncCount > 0) {
        avgPncNetworkCandidateCount /= pncCount;
        avgPncStableNetworkCandidateCount /= pncCount;
        avgPncAverageConfidence /= pncCount;
        avgPncAverageCoActivation /= pncCount;
        avgPncAveragePropagation /= pncCount;
        avgPncAverageRecurrence /= pncCount;
        avgPncAverageTraceCorrelation /= pncCount;
        avgPncAverageReplayCoReturn /= pncCount;
        avgPncAverageClosureCoupling /= pncCount;
        avgPncObservationConfidence /= pncCount;
    }

    const avgQueueFillRatio = avgQueueSize / 50.0; // maxCandidates = 50

    return {
        config,
        metrics,
        summary: {
            totalFrames: config.totalFrames,
            finalMeanActivity,
            collapseFrames,
            nanFrames,
            meanResponseAmplitude,
            peakActivity,
            modeTransitions,
            actionTransitions,
            avgEnergySense: packetCount > 0 ? avgEnergySense : undefined,
            avgOverloadSense: packetCount > 0 ? avgOverloadSense : undefined,
            avgSelfCoherence: packetCount > 0 ? avgSelfCoherence : undefined,
            avgSelfContinuity: packetCount > 0 ? avgSelfContinuity : undefined,
            avgWorldPressure: packetCount > 0 ? avgWorldPressure : undefined,
            avgRelationEngagement: packetCount > 0 ? avgRelationEngagement : undefined,
            maxPerturbationPressure: packetCount > 0 ? maxPerturbationPressure : undefined,
            minPerturbationPressure: packetCount > 0 && minPerturbationPressure !== Infinity ? minPerturbationPressure : undefined,
            // A1: Felt-state summaries
            avgDepletion: feltCount > 0 ? avgDepletion : undefined,
            avgOverload: feltCount > 0 ? avgOverload : undefined,
            avgCoherence: feltCount > 0 ? avgCoherence : undefined,
            avgBoundaryIntegrity: feltCount > 0 ? avgBoundaryIntegrity : undefined,
            avgRestorationReadiness: feltCount > 0 ? avgRestorationReadiness : undefined,
            avgPerturbationLoad: feltCount > 0 ? avgPerturbationLoad : undefined,
            avgOpenness: feltCount > 0 ? avgOpenness : undefined,
            maxOverload: feltCount > 0 ? maxOverload : undefined,
            minCoherence: feltCount > 0 && minCoherence !== Infinity ? minCoherence : undefined,
            avgArousalLevel: arousalAwarenessCount > 0 ? avgArousalLevel : undefined,
            avgAwarenessWindow: arousalAwarenessCount > 0 ? avgAwarenessWindow : undefined,
            avgSalienceOpenness: arousalAwarenessCount > 0 ? avgSalienceOpenness : undefined,
            avgForegroundPressure: arousalAwarenessCount > 0 ? avgForegroundPressure : undefined,
            maxArousalLevel: arousalAwarenessCount > 0 ? maxArousalLevel : undefined,
            minAwarenessWindow: arousalAwarenessCount > 0 && minAwarenessWindow !== Infinity ? minAwarenessWindow : undefined,
            // A3: Replay / consolidation summaries
            totalReplayCount,
            avgTraceStrength: replayCount > 0 ? avgTraceStrength : undefined,
            avgRecurrenceWeight: replayCount > 0 ? avgRecurrenceWeight : undefined,
            avgSalienceResidue: replayCount > 0 ? avgSalienceResidue : undefined,
            avgReplayPressure: replayCount > 0 ? avgReplayPressure : undefined,
            avgReplayReadiness: replayCount > 0 ? avgReplayReadiness : undefined,
            avgConsolidationGain: replayCount > 0 ? avgConsolidationGain : undefined,
            maxActiveReplayCount: replayCount > 0 ? maxActiveReplayCount : undefined,
            avgRecentReplaySalience: replayCount > 0 ? avgRecentReplaySalience : undefined,
            avgRecentPatternWeight: replayCount > 0 ? avgRecentPatternWeight : undefined,
            avgSettlingResidue: replayCount > 0 ? avgSettlingResidue : undefined,
            avgRecoveryLinkedResidue: replayCount > 0 ? avgRecoveryLinkedResidue : undefined,
            avgWeakConsolidationDelta: replayCount > 0 ? avgWeakConsolidationDelta : undefined,
            avgReplayContributionToStabilization: replayCount > 0 ? avgReplayContributionToStabilization : undefined,
            avgQueueFillRatio: replayCount > 0 ? avgQueueFillRatio : undefined,
            // A4: Need / motivation summaries
            avgEnergyNeed: needMotivationCount > 0 ? avgEnergyNeed : undefined,
            avgSafetyNeed: needMotivationCount > 0 ? avgSafetyNeed : undefined,
            avgRestorationNeed: needMotivationCount > 0 ? avgRestorationNeed : undefined,
            avgContactNeed: needMotivationCount > 0 ? avgContactNeed : undefined,
            avgNoveltyMotivation: needMotivationCount > 0 ? avgNoveltyMotivation : undefined,
            avgRepetitionMotivation: needMotivationCount > 0 ? avgRepetitionMotivation : undefined,
            avgExplorationMotivation: needMotivationCount > 0 ? avgExplorationMotivation : undefined,
            avgSettlingMotivation: needMotivationCount > 0 ? avgSettlingMotivation : undefined,
            avgWithdrawMotivation: needMotivationCount > 0 ? avgWithdrawMotivation : undefined,
            maxEnergyNeed: needMotivationCount > 0 ? maxEnergyNeed : undefined,
            maxSafetyNeed: needMotivationCount > 0 ? maxSafetyNeed : undefined,
            maxNoveltyMotivation: needMotivationCount > 0 ? maxNoveltyMotivation : undefined,
            maxWithdrawMotivation: needMotivationCount > 0 ? maxWithdrawMotivation : undefined,
            // Q1-1: Open-State summaries
            avgStabilityIndex: openStateCount > 0 ? avgStabilityIndex : undefined,
            avgMixtureEntropy: openStateCount > 0 ? avgMixtureEntropy : undefined,
            dominantPoleDistribution: openStateCount > 0 ? dominantPoleCount : undefined,
            avgBackactionGain: backactionCount > 0 ? avgBackactionGain : undefined,
            avgBackactionSurpriseGain: backactionCount > 0 ? avgBackactionSurpriseGain : undefined,
            avgBackactionBoundaryModulation: backactionCount > 0 ? avgBackactionBoundaryModulation : undefined,
            avgBackactionOpennessModulation: backactionCount > 0 ? avgBackactionOpennessModulation : undefined,
            avgBackactionCoherenceShift: backactionCount > 0 ? avgBackactionCoherenceShift : undefined,
            avgBackactionFamiliarityDamping: backactionCount > 0 ? avgBackactionFamiliarityDamping : undefined,
            maxBackactionOverloadAmplification: backactionCount > 0 ? maxBackactionOverloadAmplification : undefined,
            avgRecoveryPressure: recoveryProfileCount > 0 ? avgRecoveryPressure : undefined,
            avgRelaxationLevel: recoveryProfileCount > 0 ? avgRelaxationLevel : undefined,
            avgStabilizationPull: recoveryProfileCount > 0 ? avgStabilizationPull : undefined,
            avgRecoveryCollapseRisk: recoveryProfileCount > 0 ? avgRecoveryCollapseRisk : undefined,
            avgBoundaryRepairPressure: recoveryProfileCount > 0 ? avgBoundaryRepairPressure : undefined,
            avgSelfPreservationDrive: recoveryProfileCount > 0 ? avgSelfPreservationDrive : undefined,
            avgOverloadDrain: recoveryProfileCount > 0 ? avgOverloadDrain : undefined,
            recoveryFrameCount: recoveryProfileCount > 0 ? recoveryFrameCount : undefined,
            shiftFrameCount: recoveryProfileCount > 0 ? shiftFrameCount : undefined,
            degradeFrameCount: recoveryProfileCount > 0 ? degradeFrameCount : undefined,
            partialRepairFrameCount: recoveryProfileCount > 0 ? partialRepairFrameCount : undefined,
            softCollapseFrames: recoveryProfileCount > 0 ? softCollapseFrames : undefined,
            hardCollapseFrames: recoveryProfileCount > 0 ? hardCollapseFrames : undefined,
            runawayFrames: recoveryProfileCount > 0 ? runawayFrames : undefined,
            avgRecoveryTime,
            avgSettlingTime,
            repeatedOverloadDegradationSlope,
            // Phase 1: Ongoingness metrics
            saturationFrames,
            saturationRate,
            collapseRate,
            spontaneousIgnitionCount,
            quietBaselineFloor,
            ongoingnessScore,
            // Phase 2: Perturbation mismatch summaries
            avgMismatchLevel: mismatchCount > 0 ? avgMismatchLevel : undefined,
            avgSurprisePressure: mismatchCount > 0 ? avgSurprisePressure : undefined,
            avgBoundaryStress: mismatchCount > 0 ? avgBoundaryStress : undefined,
            avgRecoveryPull: mismatchCount > 0 ? avgRecoveryPull : undefined,
            maxMismatchLevel: mismatchCount > 0 ? maxMismatchLevel : undefined,
            // Phase 5: Observation pattern summaries (observer-side proxy, read-only)
            avgKnotCount: obsCount > 0 ? avgKnotCount : undefined,
            avgPathCount: obsCount > 0 ? avgPathCount : undefined,
            avgRecurrenceLocusCount: obsCount > 0 ? avgRecurrenceLocusCount : undefined,
            avgBasinCount: obsCount > 0 ? avgBasinCount : undefined,
            avgLongLivedAnomalyCount: obsCount > 0 ? avgLongLivedAnomalyCount : undefined,
            avgProtoPointCandidateCount: obsCount > 0 ? avgProtoPointCandidateCount : undefined,
            maxProtoPointCandidateCount: obsCount > 0 ? maxProtoPointCandidateCount : undefined,
            avgObservationConfidence: obsCount > 0 ? avgObservationConfidence : undefined,
            protoPointEmergenceFrames: obsCount > 0 ? protoPointEmergenceFrames : undefined,
            repeatedEmergenceCount: obsCount > 0 ? repeatedEmergenceCount : undefined,
            // Phase 6 / Q2-1: Pressure competition summaries
            avgSafetyPressure: pressureCompetitionCount > 0 ? avgSafetyPressure : undefined,
            avgRestorationPressure: pressureCompetitionCount > 0 ? avgRestorationPressure : undefined,
            avgNoveltyPressure: pressureCompetitionCount > 0 ? avgNoveltyPressure : undefined,
            avgRepetitionPressure: pressureCompetitionCount > 0 ? avgRepetitionPressure : undefined,
            avgExplorationPressure: pressureCompetitionCount > 0 ? avgExplorationPressure : undefined,
            avgWithdrawalPressure: pressureCompetitionCount > 0 ? avgWithdrawalPressure : undefined,
            avgCompetitionEntropy: pressureCompetitionCount > 0 ? avgCompetitionEntropy : undefined,
            avgCompetitionStability: pressureCompetitionCount > 0 ? avgCompetitionStability : undefined,
            avgAnnealingTemperature: pressureCompetitionCount > 0 ? avgAnnealingTemperature : undefined,
            avgPressureEnergy: pressureCompetitionCount > 0 ? avgPressureEnergy : undefined,
            dominantPressureDistribution: pressureCompetitionCount > 0 ? dominantPressureCount : undefined,
            // Phase 7: Proto-point observation summaries (observer-side proxy, read-only)
            avgProtoPointCandidateCount2: ppCount > 0 ? ppAvgCandidateCount : undefined,
            avgProtoPointStableCandidateCount: ppCount > 0 ? ppAvgStableCandidateCount : undefined,
            avgProtoPointAverageConfidence: ppCount > 0 ? ppAvgAverageConfidence : undefined,
            maxProtoPointConfidence: ppCount > 0 ? ppMaxConfidence : undefined,
            avgProtoPointLifetime: ppLifetimeCount > 0 ? ppLifetimeSum / ppLifetimeCount : undefined,
            recurrenceSupportedCandidateFrames: ppCount > 0 ? ppRecurrenceSupportedFrames : undefined,
            replaySupportedCandidateFrames: ppCount > 0 ? ppReplaySupportedFrames : undefined,
            basinOverlapCandidateFrames: ppCount > 0 ? ppBasinOverlapFrames : undefined,
            protoPointPersistentFrames: ppCount > 0 ? ppPersistentFrames : undefined,
            avgProtoNeuronCandidateCount: pnCount > 0 ? pnAvgCandidateCount : undefined,
            avgProtoNeuronStableCandidateCount: pnCount > 0 ? pnAvgStableCandidateCount : undefined,
            avgProtoNeuronConfidence: pnCount > 0 ? pnAvgConfidence : undefined,
            maxProtoNeuronConfidence: pnCount > 0 ? pnMaxConfidence : undefined,
            avgProtoNeuronExcitability: pnCount > 0 ? pnAvgExcitability : undefined,
            avgProtoNeuronPropagation: pnCount > 0 ? pnAvgPropagation : undefined,
            avgProtoNeuronTraceRetention: pnCount > 0 ? pnAvgTraceRetention : undefined,
            avgProtoNeuronClosureCoupling: pnCount > 0 ? pnAvgClosureCoupling : undefined,
            avgProtoNeuronCoActivationScore: pnCount > 0 ? pnAvgCoActivationScore : undefined,
            protoNeuronCoActivationClusterCount: pnCount > 0 ? pnClusterSum : undefined,
            protoNeuronRepeatedCoActivationCount: pnCount > 0 ? pnRepeatedCoActivationCount : undefined,
            protoNeuronStrongestCoActivationPair: lastProtoNeuronObservationState?.strongestCoActivationPair ?? null,
            protoNeuronLastCandidates: lastProtoNeuronObservationState?.candidates ?? [],
            // W1: Body Surface (Boundary Layer) summaries — derived / proxy, read-only
            avgBsBoundaryIntegrity: bsCount > 0 ? avgBsBoundaryIntegrity : undefined,
            avgBsSurfaceSensitivity: bsCount > 0 ? avgBsSurfaceSensitivity : undefined,
            avgBsPermeability: bsCount > 0 ? avgBsPermeability : undefined,
            avgBsContactReadiness: bsCount > 0 ? avgBsContactReadiness : undefined,
            avgBsOutputReadiness: bsCount > 0 ? avgBsOutputReadiness : undefined,
            avgBsLocalIrritability: bsCount > 0 ? avgBsLocalIrritability : undefined,
            avgBsRecoveryShielding: bsCount > 0 ? avgBsRecoveryShielding : undefined,
            maxBsLocalIrritability: bsCount > 0 ? maxBsLocalIrritability : undefined,
            minBsPermeability: bsCount > 0 && minBsPermeability !== Infinity ? minBsPermeability : undefined,
            actuationPulseGeneratedCount,
            actuationPulseNullCount,
            actuationPulseChannelCount,
            avgActuationIntensity: actuationSnapshotCount > 0 ? avgActuationIntensity : undefined,
            avgActuationCoherence: actuationSnapshotCount > 0 ? avgActuationCoherence : undefined,
            avgActuationRhythm: actuationSnapshotCount > 0 ? avgActuationRhythm : undefined,
            avgActuationLocality: actuationSnapshotCount > 0 ? avgActuationLocality : undefined,
            avgActuationRecoveryLinked: actuationSnapshotCount > 0 ? avgActuationRecoveryLinked : undefined,
            avgActuationBoundaryLinked: actuationSnapshotCount > 0 ? avgActuationBoundaryLinked : undefined,
            avgActuationTraceLinked: actuationSnapshotCount > 0 ? avgActuationTraceLinked : undefined,
            avgActuationOutputReadiness: actuationOutputSnapshotCount > 0 ? avgActuationOutputReadiness : undefined,
            avgDvFlowContinuity: dvCount > 0 ? avgDvFlowContinuity : undefined,
            avgDvEnergyThroughput: dvCount > 0 ? avgDvEnergyThroughput : undefined,
            avgDvDissipationBalance: dvCount > 0 ? avgDvDissipationBalance : undefined,
            avgDvResistanceBalance: dvCount > 0 ? avgDvResistanceBalance : undefined,
            avgDvDelayCoherence: dvCount > 0 ? avgDvDelayCoherence : undefined,
            avgDvBoundaryExchange: dvCount > 0 ? avgDvBoundaryExchange : undefined,
            avgDvUnderCouplingRisk: dvCount > 0 ? avgDvUnderCouplingRisk : undefined,
            avgDvOverCouplingRisk: dvCount > 0 ? avgDvOverCouplingRisk : undefined,
            avgDvSaturationRisk: dvCount > 0 ? avgDvSaturationRisk : undefined,
            avgDvExtinctionRisk: dvCount > 0 ? avgDvExtinctionRisk : undefined,
            avgDvViabilityConfidence: dvCount > 0 ? avgDvViabilityConfidence : undefined,
            avgDvReturnContinuity: dvCount > 0 ? avgDvReturnContinuity : undefined,
            avgDvTraceContinuity: dvCount > 0 ? avgDvTraceContinuity : undefined,
            avgDvMediumExchangeBalance: dvCount > 0 ? avgDvMediumExchangeBalance : undefined,
            avgDvClosureViability: dvCount > 0 ? avgDvClosureViability : undefined,
            avgMpDelayAverageReturnDelay: mediumProfileCount > 0 ? avgMpDelayAverageReturnDelay : undefined,
            avgMpDelayVariance: mediumProfileCount > 0 ? avgMpDelayVariance : undefined,
            avgMpDelayStableDelayWindow: mediumProfileCount > 0 ? avgMpDelayStableDelayWindow : undefined,
            avgMpDelayUnstableDelayScore: mediumProfileCount > 0 ? avgMpDelayUnstableDelayScore : undefined,
            avgMpEchoStrength: mediumProfileCount > 0 ? avgMpEchoStrength : undefined,
            avgMpEchoDecayRate: mediumProfileCount > 0 ? avgMpEchoDecayRate : undefined,
            avgMpEchoSaturationRisk: mediumProfileCount > 0 ? avgMpEchoSaturationRisk : undefined,
            avgMpResistanceWorldResistance: mediumProfileCount > 0 ? avgMpResistanceWorldResistance : undefined,
            avgMpResistanceReturnAttenuation: mediumProfileCount > 0 ? avgMpResistanceReturnAttenuation : undefined,
            avgMpResistanceTransmissionRatio: mediumProfileCount > 0 ? avgMpResistanceTransmissionRatio : undefined,
            avgMpProfileConfidence: mediumProfileCount > 0 ? avgMpProfileConfidence : undefined,
            avgNfEchoDecayAdjustment: naturalFeedbackCount > 0 ? avgNfEchoDecayAdjustment : undefined,
            avgNfReturnGainAdjustment: naturalFeedbackCount > 0 ? avgNfReturnGainAdjustment : undefined,
            avgNfPulseLeakageAdjustment: naturalFeedbackCount > 0 ? avgNfPulseLeakageAdjustment : undefined,
            avgNfBoundaryPermeabilityAdjustment: naturalFeedbackCount > 0 ? avgNfBoundaryPermeabilityAdjustment : undefined,
            avgNfSensoryAttenuationAdjustment: naturalFeedbackCount > 0 ? avgNfSensoryAttenuationAdjustment : undefined,
            avgNfTraceDecayAdjustment: naturalFeedbackCount > 0 ? avgNfTraceDecayAdjustment : undefined,
            avgNfWorldResistanceAdjustment: naturalFeedbackCount > 0 ? avgNfWorldResistanceAdjustment : undefined,
            avgNfDelayWindowAdjustment: naturalFeedbackCount > 0 ? avgNfDelayWindowAdjustment : undefined,
            avgNfMediumAbsorptionAdjustment: naturalFeedbackCount > 0 ? avgNfMediumAbsorptionAdjustment : undefined,
            avgNfAdjustmentStrength: naturalFeedbackCount > 0 ? avgNfAdjustmentStrength : undefined,
            avgNfAdjustmentConfidence: naturalFeedbackCount > 0 ? avgNfAdjustmentConfidence : undefined,
            avgNfFeedbackEffectEstimate: naturalFeedbackCount > 0 ? avgNfFeedbackEffectEstimate : undefined,
            avgNfOvercorrectionRisk: naturalFeedbackCount > 0 ? avgNfOvercorrectionRisk : undefined,
            avgNfFeedbackDominanceRisk: naturalFeedbackCount > 0 ? avgNfFeedbackDominanceRisk : undefined,
            naturalFeedbackAppliedTargetCount: naturalFeedbackCount > 0 ? naturalFeedbackAppliedTargetCount : undefined,
            naturalFeedbackLastAppliedTargets: lastNaturalFeedbackReport.appliedTargets,
            naturalFeedbackFlags,
            // S5: Local Excitability Field summaries (observer-side, read-only)
            avgLefAverageExcitability: lefCount > 0 ? avgLefAverageExcitability : undefined,
            avgLefMaxExcitability: lefCount > 0 ? avgLefMaxExcitability : undefined,
            avgLefAverageThresholdProximity: lefCount > 0 ? avgLefAverageThresholdProximity : undefined,
            avgLefAverageTraceResidue: lefCount > 0 ? avgLefAverageTraceResidue : undefined,
            avgLefAverageReturnInfluence: lefCount > 0 ? avgLefAverageReturnInfluence : undefined,
            avgLefAveragePropagationTendency: lefCount > 0 ? avgLefAveragePropagationTendency : undefined,
            avgLefHighExcitabilityRegionCount: lefCount > 0 ? avgLefHighExcitabilityRegionCount : undefined,
            avgLefNearThresholdRegionCount: lefCount > 0 ? avgLefNearThresholdRegionCount : undefined,
            avgLefRecoveringRegionCount: lefCount > 0 ? avgLefRecoveringRegionCount : undefined,
            avgLefFieldConfidence: lefCount > 0 ? avgLefFieldConfidence : undefined,
            avgLefExcitabilityVariance: lefCount > 0 ? avgLefExcitabilityVariance : undefined,
            avgLefRegionalGradientStrength: lefCount > 0 ? avgLefRegionalGradientStrength : undefined,
            maxLefHighExcitabilityRegionCount: lefCount > 0 ? maxLefHighExcitabilityRegionCount : undefined,
            maxLefNearThresholdRegionCount: lefCount > 0 ? maxLefNearThresholdRegionCount : undefined,
            // S6: Repeated Flow Path summaries (observer-side, read-only pre-semantic path observation)
            avgRfpPathCandidateCount: rfpCount > 0 ? avgRfpPathCandidateCount : undefined,
            avgRfpStablePathCandidateCount: rfpCount > 0 ? avgRfpStablePathCandidateCount : undefined,
            avgRfpAverageConfidence: rfpCount > 0 ? avgRfpAverageConfidence : undefined,
            maxRfpMaxConfidence: rfpCount > 0 ? maxRfpMaxConfidence : undefined,
            avgRfpAverageRecurrenceStrength: rfpCount > 0 ? avgRfpAverageRecurrenceStrength : undefined,
            avgRfpAveragePropagationConsistency: rfpCount > 0 ? avgRfpAveragePropagationConsistency : undefined,
            avgRfpAverageTraceSupport: rfpCount > 0 ? avgRfpAverageTraceSupport : undefined,
            avgRfpAverageClosureCoupling: rfpCount > 0 ? avgRfpAverageClosureCoupling : undefined,
            avgRfpObservationConfidence: rfpCount > 0 ? avgRfpObservationConfidence : undefined,
            rfpStablePathFrames: rfpCount > 0 ? rfpStablePathFrames : undefined,
            // S7: Proto-Network Candidate Observation summaries
            avgPncNetworkCandidateCount: pncCount > 0 ? avgPncNetworkCandidateCount : undefined,
            avgPncStableNetworkCandidateCount: pncCount > 0 ? avgPncStableNetworkCandidateCount : undefined,
            avgPncAverageConfidence: pncCount > 0 ? avgPncAverageConfidence : undefined,
            maxPncMaxConfidence: pncCount > 0 ? maxPncMaxConfidence : undefined,
            avgPncAverageCoActivation: pncCount > 0 ? avgPncAverageCoActivation : undefined,
            avgPncAveragePropagation: pncCount > 0 ? avgPncAveragePropagation : undefined,
            avgPncAverageRecurrence: pncCount > 0 ? avgPncAverageRecurrence : undefined,
            avgPncAverageTraceCorrelation: pncCount > 0 ? avgPncAverageTraceCorrelation : undefined,
            avgPncAverageReplayCoReturn: pncCount > 0 ? avgPncAverageReplayCoReturn : undefined,
            avgPncAverageClosureCoupling: pncCount > 0 ? avgPncAverageClosureCoupling : undefined,
            avgPncObservationConfidence: pncCount > 0 ? avgPncObservationConfidence : undefined,
            pncStableNetworkFrames: pncCount > 0 ? pncStableNetworkFrames : undefined,
        },
        succeeded,
        failureReason,
    };
}

/**
 * Export scenario result to JSON
 */
export function exportScenarioJSON(result: ScenarioResult): string {
    return JSON.stringify(result, null, 2);
}
