import { state } from './state.js';
import { injectMassiveError } from '../perception/pointerHandlers.js';
import { updateMetricsUI } from '../ui/updateMetricsUI.js';
import { buildTorusStatePacket, bridgeTorusToSignal } from '../bridge/bridge';
import { TENSION_90S_FRAMES, TENSION_LAMBDA } from '../constants/aeternaConstants.js';

const UI_FPS = 15;
const GUIDE_FPS = 10;
const BRIDGE_INTERVAL_MS = 100;

export function updateTensionState(dyn: any) {
  const meanError = dyn.meanPredictionError || 0;
  state.tensionLoad = state.tensionLoad * Math.exp(-TENSION_LAMBDA) + meanError * 0.05;
  state.tensionDuration++;
  if (state.tensionDuration > TENSION_90S_FRAMES && state.tensionLoad > 0.3) {
    injectMassiveError();
    state.tensionDuration = 0;
    state.tensionLoad *= 0.15;
  }
}

export function deriveEngineState(dyn: any) {
  const dPhi = dyn.phiApprox - state.lastPhiApprox;
  state.lastPhiApprox = dyn.phiApprox;
  const clusterTrend = dyn.ignitionRatio - state.lastClusterTrend;
  state.lastClusterTrend = dyn.ignitionRatio;
  if (dPhi > 0.0002 && clusterTrend > -0.01) return 'WHITE';
  if (dPhi < -0.0002 && clusterTrend < 0.01) return 'BLACK';
  return 'NEUTRAL';
}

export function maybeUpdateUi(now: number, dyn: any, engineState: string) {
  if (now - state.lastUIRenderTime > 1000 / UI_FPS) {
    updateMetricsUI(dyn, engineState);
    state.realityVisualLayer.update(dyn);
    state.lastUIRenderTime = now;
  }
  if (now - state.lastGuideTime > 1000 / GUIDE_FPS) {
    state.guidePanel.update(dyn, engineState);
    state.lastGuideTime = now;
  }
}

export function maybeBridgeSignal(now: number, dyn: any, engineState: string) {
  if (now - state.lastBridgeTime <= BRIDGE_INTERVAL_MS) return;
  const packet = buildTorusStatePacket({ now, dyn, engineState, tension: state.tensionLoad, activeTouches: state.activeTouches });
  const bridgeResult = bridgeTorusToSignal(packet);
  if (state.guidePanel) state.guidePanel.updateFromBridge(bridgeResult, packet);
  state.lastBridgeTime = now;
}
