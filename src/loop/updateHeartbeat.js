import { state } from '../state.js';
import { HEART_CLOCK_HZ, PULSE_STRENGTH } from '../constants/aeternaConstants.js';

export function updateHeartbeat() {
    const nowMs = performance.now(); if (nowMs - state.lastHeartbeatTime > 1000 / HEART_CLOCK_HZ) {
        state.lastHeartbeatTime = nowMs; state.network.heartbeatActive = true;
        for (let i = 0; i < state.network.numNodes; i++) state.network.currentBuffer[i] += (state.network.nodeLayer[i] === 1) ? PULSE_STRENGTH * 0.8 : PULSE_STRENGTH * 0.15;
    } else { state.network.heartbeatActive = false; }
}
