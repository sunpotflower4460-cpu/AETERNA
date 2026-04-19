import { state } from './state.js';
import { SCHUMANN_RES, GAMMA_SYNC } from '../constants/aeternaConstants.js';
import { updateDiskPhysics } from './updateDiskPhysics.js';
import { updateHeartbeat } from './updateHeartbeat.js';
import { deriveEngineState, maybeBridgeSignal, maybeUpdateUi, updateTensionState } from './runtimeLoop.ts';

export function actionLoop(now) {
    requestAnimationFrame(actionLoop);
    const diskNodeIdx = updateDiskPhysics(1 / 60);
    updateHeartbeat();

    state.network.triggerNoise(state.tensionLoad, state.network.sigmaDisplay);
    state.touchMem.decay();
    const dyn = state.network.updateDynamics(diskNodeIdx, state.activeTouches);

    state.particleSystem.geometry.attributes.position.needsUpdate = true;
    state.particleSystem.geometry.attributes.color.needsUpdate = true;
    state.particleSystem.rotation.y += 0.001 + ((state.disk.omega_t - SCHUMANN_RES) / (GAMMA_SYNC - SCHUMANN_RES) * 0.002);
    state.particleSystem.rotation.z += 0.0005;

    // Update camera controls if available, otherwise fall back to mouse-based movement
    if (state.cameraControls) {
        state.cameraControls.update();
    } else if (state.activeTouches.size < 2 && typeof state.mouseX !== 'undefined') {
        state.camera.position.x += (state.mouseX * 5 - state.camera.position.x) * 0.05;
        state.camera.position.y += (-state.mouseY * 5 + 4 - state.camera.position.y) * 0.05;
        state.camera.lookAt(state.scene.position);
    }

    updateTensionState(dyn);
    const engineState = deriveEngineState(dyn);
    maybeUpdateUi(now, dyn, engineState);
    maybeBridgeSignal(now, dyn, engineState);
    state.renderer.render(state.scene, state.camera);
}

export const animateLoop = actionLoop;
