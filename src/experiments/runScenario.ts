/**
 * Headless/minimal-visual scenario runner for reproducible experiments
 *
 * This runner executes AETERNA organism updates in a controlled environment
 * without relying on browser rendering or user interaction.
 */

import { AeternaNetwork } from '../core/AeternaNetwork.js';
import { PhysicalDisk } from '../core/PhysicalDisk.js';
import { TouchMemory } from '../perception/TouchMemory.js';

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
    const { state } = await import('../organism/state.js');
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
 * Build metrics snapshot from current state
 */
function buildMetricsSnapshot(
    frame: number,
    network: AeternaNetwork,
    dyn: any,
    recentMeans: number[]
): MetricsSnapshot {
    return {
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
