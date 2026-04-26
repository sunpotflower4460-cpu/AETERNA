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
import type { RecoveryState, RecoveryTrajectoryLabel, CollapseModeLabel } from '../types/recoveryState.ts';
import { derivePerturbationEvent } from '../perception/derivePerturbationEvent.ts';
import { derivePredictionMismatch } from '../prediction/derivePredictionMismatch.ts';

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
    replayPressure?: number;
    replayReadiness?: number;
    consolidationGain?: number;
    activeReplayCount?: number;
    recentReplaySalience?: number;
    restConsolidationDepth?: number;
    replaySuppression?: number;
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
        totalReplayCount?: number;
        avgReplayPressure?: number;
        avgReplayReadiness?: number;
        avgConsolidationGain?: number;
        maxActiveReplayCount?: number;
        avgRecentReplaySalience?: number;
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
    queue: ReplayQueue
): void {
    // Touch surprise candidate
    if (dyn.touchTotalSurprise && dyn.touchTotalSurprise > 0.5) {
        queue.addCandidate('touch', dyn.touchTotalSurprise, frame);
    }

    // General surprise candidate
    if (dyn.meanPredictionError && dyn.meanPredictionError > 0.6) {
        queue.addCandidate('surprise', dyn.meanPredictionError, frame);
    }

    // Restoration candidate (overload recovery)
    if (network.homeostaticState) {
        const restorationBias = network.homeostaticState.restorationBias;
        const overload = dyn.overload ?? 0;
        if (restorationBias > 0.6 && overload < 0.3) {
            queue.addCandidate('restoration', restorationBias, frame);
        }
    }

    // Repetition candidate (repeated touch pattern)
    if (dyn.touchRepeatCount && dyn.touchRepeatCount > 5 && dyn.meanTouchHabituation && dyn.meanTouchHabituation > 0.4) {
        const repetitionSalience = Math.min(1.0, dyn.touchRepeatCount / 10);
        queue.addCandidate('repetition', repetitionSalience, frame);
    }

    // Absence candidate (missing expected touch)
    if (network.touchExpectation && network.touchExpectation.absenceError > 0.4) {
        queue.addCandidate('absence', network.touchExpectation.absenceError, frame);
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
    replayState?: ReplayState | null,
    queueSize?: number,
    recoveryState?: RecoveryState | null,
    recoveryTrajectory?: RecoveryTrajectoryLabel,
    collapseMode?: CollapseModeLabel,
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
            }
        }

        // A3: Add replay state metrics if available
        if (replayState) {
            snapshot.replayPressure = replayState.replayPressure;
            snapshot.replayReadiness = replayState.replayReadiness;
            snapshot.consolidationGain = replayState.consolidationGain;
            snapshot.activeReplayCount = replayState.activeReplayCount;
            snapshot.recentReplaySalience = replayState.recentReplaySalience;
            snapshot.restConsolidationDepth = replayState.restConsolidationDepth;
            snapshot.replaySuppression = replayState.replaySuppression;
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
    const perturbationPeaks: number[] = [];
    const degradationPeaks: number[] = [];
    const recoveryTimes: number[] = [];
    const settlingTimes: number[] = [];
    let activePerturbationStart: number | null = null;
    let activeSettlingStart: number | null = null;

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

        // A3: Process replay and consolidation
        // Decay queue and check for salient candidates
        replayQueue.decay();
        checkAndAddReplayCandidates(frame, network, dyn, replayQueue);

        // Derive replay state (requires felt state and arousal/awareness)
        let replayState: ReplayState | null = null;
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

                replayState = deriveReplayState(
                    organismSnapshot,
                    feltState,
                    arousalAwareness,
                    replayQueue,
                    activeReplayCount,
                    recentReplaySalience,
                    lastReplayCategory
                );

                // Perform minimal replay if conditions are met
                activeReplayCount = 0;
                recentReplaySalience = 0;

                if (replayState.replayReadiness > 0.5 && replayState.replaySuppression < 0.3 && replayState.replayPressure > 0.4) {
                    const candidates = replayQueue.getCandidatesForReplay(2);

                    for (const candidate of candidates) {
                        // Minimal replay: weak trace reactivation
                        // This is intentionally subtle and does not dominate dynamics
                        activeReplayCount++;
                        recentReplaySalience += candidate.weight;
                        lastReplayCategory = candidate.category;
                        totalReplayCount++;

                        // Apply very weak consolidation influence
                        if (replayState.consolidationGain > 0.05 && network.livingState) {
                            const consolidationStrength = replayState.consolidationGain * candidate.weight * 0.01;

                            // Weak influences on slow state
                            if (candidate.category === 'touch' || candidate.category === 'repetition') {
                                // Slightly stabilize touch expectation confidence
                                if (network.touchExpectation) {
                                    network.touchExpectation.touchExpectationConfidence *= (1.0 + consolidationStrength * 0.5);
                                    network.touchExpectation.touchExpectationConfidence = Math.min(1.0, network.touchExpectation.touchExpectationConfidence);
                                }
                            }

                            if (candidate.category === 'restoration') {
                                // Slightly strengthen restoration bias
                                if (network.homeostaticState) {
                                    network.homeostaticState.restorationBias += consolidationStrength * 0.02;
                                    network.homeostaticState.restorationBias = Math.min(1.0, network.homeostaticState.restorationBias);
                                }
                            }

                            // Very weak influence on longBaselineTone
                            network.livingState.longBaselineTone += consolidationStrength * 0.005 * (Math.random() - 0.5);
                            network.livingState.longBaselineTone = Math.max(-0.5, Math.min(0.5, network.livingState.longBaselineTone));
                        }

                        // Reduce candidate weight after replay
                        replayQueue.reduceWeight(candidate.id, 0.7);
                    }
                }

                // Normalize replay salience
                if (activeReplayCount > 0) {
                    recentReplaySalience /= activeReplayCount;
                }
            } catch (e) {
                // Replay derivation failed, skip silently
            }
        }

        // Collect metrics
        const meanAct = computeMeanActivity(network);
        const maxAct = computeMaxActivity(network);
        recentMeans.push(meanAct);
        if (recentMeans.length > 100) recentMeans.shift();
        activityHistory.push(meanAct);

        if (meanAct < 0.01) collapseFrames++;
        if (hasNaN(network)) nanFrames++;

        // Phase 1: Ongoingness tracking
        if (maxAct > 8.0) saturationFrames++;

        const perturbationPressure = dyn.meanPredictionError ?? 0;
        recentPerturbationHistory.push(perturbationPressure);
        if (recentPerturbationHistory.length > 240) recentPerturbationHistory.shift();

        let recoveryState: RecoveryState | null = null;
        let recoveryTrajectory: RecoveryTrajectoryLabel = 'shift';
        let collapseMode: CollapseModeLabel = 'stable';
        if (network.homeostaticState && network.livingState && network.energyFlowState) {
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
                replaySuppression: replayState?.replaySuppression ?? 0,
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

        if (collectMetrics && frame % metricsInterval === 0) {
            metrics.push(buildMetricsSnapshot(
                frame,
                network,
                dyn,
                recentMeans,
                replayState,
                replayQueue.size(),
                recoveryState,
                recoveryTrajectory,
                collapseMode,
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
    let avgReplayPressure = 0;
    let avgReplayReadiness = 0;
    let avgConsolidationGain = 0;
    let maxActiveReplayCount = 0;
    let avgRecentReplaySalience = 0;
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
            avgReplayPressure += m.replayPressure;
            avgReplayReadiness += m.replayReadiness ?? 0;
            avgConsolidationGain += m.consolidationGain ?? 0;
            avgRecentReplaySalience += m.recentReplaySalience ?? 0;
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
        avgReplayPressure /= replayCount;
        avgReplayReadiness /= replayCount;
        avgConsolidationGain /= replayCount;
        avgRecentReplaySalience /= replayCount;
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
            avgReplayPressure: replayCount > 0 ? avgReplayPressure : undefined,
            avgReplayReadiness: replayCount > 0 ? avgReplayReadiness : undefined,
            avgConsolidationGain: replayCount > 0 ? avgConsolidationGain : undefined,
            maxActiveReplayCount: replayCount > 0 ? maxActiveReplayCount : undefined,
            avgRecentReplaySalience: replayCount > 0 ? avgRecentReplaySalience : undefined,
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
