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
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';

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
    };
}

/**
 * Build metrics snapshot from current state
 */
function buildMetricsSnapshot(
    frame: number,
    network: AeternaNetwork,
    dyn: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    recentMeans: number[]
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
            metrics.push(buildMetricsSnapshot(frame, network, dyn, recentMeans));
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
