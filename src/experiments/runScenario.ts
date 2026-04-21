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
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { ReplayState } from '../types/replayState.ts';

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
    queueSize?: number
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

    // A3: Initialize replay queue and tracking
    const replayQueue = new ReplayQueue(50, 0.998);
    let activeReplayCount = 0;
    let recentReplaySalience = 0.0;
    let lastReplayCategory: string | null = null;
    let totalReplayCount = 0;

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
        recentMeans.push(meanAct);
        if (recentMeans.length > 100) recentMeans.shift();
        activityHistory.push(meanAct);

        if (meanAct < 0.01) collapseFrames++;
        if (hasNaN(network)) nanFrames++;

        if (dyn.modeState !== lastModeState) {
            modeTransitions++;
            lastModeState = dyn.modeState;
        }
        if (dyn.actionState !== lastActionState) {
            actionTransitions++;
            lastActionState = dyn.actionState;
        }

        if (collectMetrics && frame % metricsInterval === 0) {
            metrics.push(buildMetricsSnapshot(frame, network, dyn, recentMeans, replayState, replayQueue.size()));
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
