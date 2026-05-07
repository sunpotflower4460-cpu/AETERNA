import { state } from './state.js';
import { HEART_CLOCK_HZ, PULSE_STRENGTH } from '../constants/aeternaConstants.js';
import { updateLivingState, getLivingStateInfluence } from './livingState.ts';
import { updateHomeostaticState, getHomeostaticInfluence } from './survivalState.ts';
import { extractReentryFromBeautifulLoop, buildLivingStateReentryInput } from '../integration/applyReentry.ts';

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

        // BL-L3: Pass current modulation if available.
        // Phase D: also forward the four reentry deltas (curiosity, internal
        // utterance, binding coherence, hierarchical error). Reentry deltas
        // default to 0 when the governor's gate is closed, so this expansion
        // does not change the heartbeat's behavior in the default state.
        const blModulation = network.currentModulation
            ? buildLivingStateReentryInput(
                extractReentryFromBeautifulLoop(network.currentModulation),
                {
                    touchOpennessDelta: network.currentModulation.touchOpennessDelta,
                    noveltyBiasDelta: network.currentModulation.noveltyBiasDelta,
                },
            )
            : null;

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
            blModulation,
        });
    }

    // Phase 4: Update homeostatic state on every heartbeat tick
    if (state.network && state.network.homeostaticState) {
        const network = state.network;

        // Compute novelty level from touch
        const noveltyLevel = network.touchNovelty ?
            Math.max(...Array.from(network.touchNovelty)) : 0;

        // BL-L3: Pass current modulation if available
        const blModulation = network.currentModulation ? {
            restorationBiasDelta: network.currentModulation.restorationBiasDelta,
            withdrawBiasDelta: network.currentModulation.withdrawBiasDelta,
        } : null;

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
                activeTouchCount: 0,  // will be updated during dynamics
                meanRawTouch: network.rawTouch ?
                    Array.from(network.rawTouch).reduce((a, b) => a + b, 0) / network.numNodes : 0,
                simTime: network.simTime ?? 0,
                blModulation,
            }
        );
    }

    if (nowMs - state.lastHeartbeatTime > 1000 / HEART_CLOCK_HZ) {
        state.lastHeartbeatTime = nowMs;
        state.network.heartbeatActive = true;

        // Apply living state influence to pulse strength
        const influence = getLivingStateInfluence(state.network.livingState);

        // Phase 4: Also apply homeostatic influence
        let homeoInfluence = null;
        if (state.network.homeostaticState) {
            homeoInfluence = getHomeostaticInfluence(state.network.homeostaticState);
        }

        // Combine influences (both reduce baseline under low energy/high stress)
        const combinedBaselineModifier = influence.baselineGainModifier *
            (homeoInfluence ? homeoInfluence.baselineGainModifier : 1.0);
        const adjustedPulseStrength = PULSE_STRENGTH * combinedBaselineModifier;

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
