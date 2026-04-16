import { state } from '../state.js';

export function updateDiskPhysics(dt) {
    state.disk.update(dt); const idx = state.disk.getInjectionIdx(state.network.segments);
    if (idx >= 0 && state.disk.torusFormed) state.network.currentBuffer[idx] += Math.min(state.disk.omega_t * state.disk.omega_p * 0.01, 2.0);
    return idx;
}
