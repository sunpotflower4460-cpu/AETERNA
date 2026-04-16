import { state } from './state.js';
import { SCHUMANN_RES, GAMMA_SYNC, TENSION_LAMBDA, TENSION_90S_FRAMES } from '../constants/aeternaConstants.js';
import { updateDiskPhysics } from './updateDiskPhysics.js';
import { updateHeartbeat } from './updateHeartbeat.js';
import { updateMetricsUI } from '../ui/updateMetricsUI.js';
import { injectMassiveError } from '../perception/pointerHandlers.js';
import { buildTorusStatePacket, bridgeTorusToSignal } from '../bridge/bridge.js';

const UI_FPS = 15, GUIDE_FPS = 10, BRIDGE_INTERVAL_MS = 100;

export function actionLoop(now) {
    requestAnimationFrame(actionLoop);
    const diskNodeIdx = updateDiskPhysics(1/60); updateHeartbeat();
    
    state.network.triggerNoise(state.tensionLoad, state.network.sigmaDisplay); state.touchMem.decay();
    const dyn = state.network.updateDynamics(diskNodeIdx, state.activeTouches);
    
    state.particleSystem.geometry.attributes.position.needsUpdate = true; state.particleSystem.geometry.attributes.color.needsUpdate = true;
    state.particleSystem.rotation.y += 0.001 + ((state.disk.omega_t-SCHUMANN_RES)/(GAMMA_SYNC-SCHUMANN_RES)*0.002); state.particleSystem.rotation.z += 0.0005;
    if (state.activeTouches.size < 2 && typeof state.mouseX !== 'undefined') { state.camera.position.x += (state.mouseX * 5 - state.camera.position.x) * 0.05; state.camera.position.y += (-state.mouseY * 5 + 4 - state.camera.position.y) * 0.05; }
    state.camera.lookAt(state.scene.position);
    
    // Phase G: Tension logic (Updated to use meanPredictionError)
    const meanError = dyn.meanPredictionError || 0;
    state.tensionLoad = state.tensionLoad * Math.exp(-TENSION_LAMBDA) + meanError * 0.05; state.tensionDuration++;
    if (state.tensionDuration > TENSION_90S_FRAMES && state.tensionLoad > 0.3) { injectMassiveError(); state.tensionDuration = 0; state.tensionLoad *= 0.15; }

    // Phase H: Refined Engine State
    const dPhi = dyn.phiApprox - state.lastPhiApprox; state.lastPhiApprox = dyn.phiApprox;
    const clusterTrend = dyn.ignitionRatio - state.lastClusterTrend; state.lastClusterTrend = dyn.ignitionRatio;
    let engineState = 'NEUTRAL';
    if (dPhi > 0.0002 && clusterTrend > -0.01) engineState = 'WHITE';
    else if (dPhi < -0.0002 && clusterTrend < 0.01) engineState = 'BLACK';

    if (now - state.lastUIRenderTime > 1000/UI_FPS) { updateMetricsUI(dyn, engineState); state.realityVisualLayer.update(dyn); state.lastUIRenderTime = now; }
    if (now - state.lastGuideTime > 1000/GUIDE_FPS) { state.guidePanel.update(dyn, engineState); state.lastGuideTime = now; }
    if (now - state.lastBridgeTime > BRIDGE_INTERVAL_MS) {
        const packet = buildTorusStatePacket({ now, dyn, engineState, tension: state.tensionLoad, activeTouches: state.activeTouches });
        const bridgeResult = bridgeTorusToSignal(packet);
        if (state.guidePanel) state.guidePanel.updateFromBridge(bridgeResult, packet);
        state.lastBridgeTime = now;
    }
    state.renderer.render(state.scene, state.camera);
}

export const animateLoop = actionLoop;
