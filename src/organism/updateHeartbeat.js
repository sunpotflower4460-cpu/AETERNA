import { state } from './state.js';
import { HEART_CLOCK_HZ, PULSE_STRENGTH } from '../constants/aeternaConstants.js';
import { updateLivingState, getLivingStateInfluence } from './livingState.ts';

export function updateHeartbeat() {
    const nowMs = performance.now();

    // Update living state on every heartbeat tick
    // This ensures slow variables drift even when nothing external happens
    if (state.network && state.network.livingState) {
        const network = state.network;

        // Compute recent perturbation intensity from recent touch/activity
        const recentPerturbationIntensity =
            (network.touchOnset ? Math.max(...Array.from(network.touchOnset)) : 0) * 0.6 +
            (network.touchNovelty ? Math.max(...Array.from(network.touchNovelty)) : 0) * 0.4;

        updateLivingState(network.livingState, network, {
            arousal: network.currGenFiring ?? 0,
            coherence: network.cachedPhaseCoherence ?? 0.5,
            residueLevel: network.activityResidue ?
                Array.from(network.activityResidue).reduce((a, b) => a + b, 0) / network.numNodes : 0,
            predictionError: network.predictionError ?
                Array.from(network.predictionError).reduce((a, b) => a + Math.abs(b), 0) / network.numNodes : 0,
            activeTouchCount: 0,  // updated separately during dynamics
            recentPerturbationIntensity,
            stability: network.stability ?? 0.5,
            overload: network.overload ?? 0,
        });
    }

    if (nowMs - state.lastHeartbeatTime > 1000 / HEART_CLOCK_HZ) {
        state.lastHeartbeatTime = nowMs;
        state.network.heartbeatActive = true;

        // Apply living state influence to pulse strength
        const influence = getLivingStateInfluence(state.network.livingState);
        const adjustedPulseStrength = PULSE_STRENGTH * influence.baselineGainModifier;

        for (let i = 0; i < state.network.numNodes; i++) {
            state.network.currentBuffer[i] +=
                (state.network.nodeLayer[i] === 1)
                    ? adjustedPulseStrength * 0.8
                    : adjustedPulseStrength * 0.15;
        }
    } else {
        state.network.heartbeatActive = false;
    }
}
