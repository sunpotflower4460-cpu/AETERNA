/* eslint-disable @typescript-eslint/no-explicit-any */
import { ACTION_PULSE_LIMIT, ACTION_PULSE_SMOOTHING } from '../core/aeternaTuning.ts';
import { applyDirectionalRewrite } from './rewrite.ts';

export function getActionDebugSummary(network: any) {
  return {
    actionState: network.actionState,
    actionPulseLevel: network.actionPulseLevel,
    actionDirection: network.actionDirection,
    lastActionChangeTime: network.lastActionChangeTime,
    lastActionChangeFrames: Math.max(network.simTime - network.lastActionChangeTime, 0),
  };
}

export function updateActionState(network: any, {
  activeTouchCount = 0,
  meanRawTouch = 0,
  meanTouchNovelty = 0,
  meanTouchTrace = 0,
  patternScores = network.touchPatternScores,
  lastTouchDirection = network.getTouchDirectionArray(),
  touchDirectionStrength = network.touchDirectionVector?.strength ?? 0,
  energy = network.energy,
  overload = network.overload,
  restDrive = network.restDrive,
  orientingDrive = network.orientingDrive,
} = {}) {
  const activeTouch = activeTouchCount > 0 ? 1 : 0;
  const quietness = network.clamp01((1 - activeTouch) * 0.45 + (1 - network.clamp01(meanRawTouch * 5, 0)) * 0.25 + (1 - network.clamp01(meanTouchNovelty * 8, 0)) * 0.3, 0);
  const noveltyPressure = network.clamp01(meanTouchNovelty * 8 + patternScores.tap * 0.18 + patternScores.stroke * 0.1, 0);
  const withdrawing = overload > 0.56 || (overload > 0.42 && energy < 0.34 && activeTouch);
  const orienting = !withdrawing
    && orientingDrive > restDrive * 0.72
    && noveltyPressure > 0.16
    && overload < 0.64
    && energy > 0.16;
  const settling = !withdrawing
    && !orienting
    && quietness > 0.58
    && (restDrive > 0.42 || network.stability < 0.56 || meanTouchTrace > 0.02 || overload > 0.2);

  let nextState = 'idle';
  if (withdrawing) nextState = 'withdraw';
  else if (orienting) nextState = 'orient';
  else if (settling) nextState = 'settle';

  let targetPulse = 0;
  if (nextState === 'orient') {
    targetPulse = 0.03 + orientingDrive * 0.09 + noveltyPressure * 0.06 + touchDirectionStrength * 0.04;
  } else if (nextState === 'withdraw') {
    targetPulse = 0.04 + overload * 0.14 + (1 - energy) * 0.06;
  } else if (nextState === 'settle') {
    targetPulse = 0.025 + restDrive * 0.08 + (1 - network.stability) * 0.06 + meanTouchTrace * 0.08;
  }
  targetPulse = network.clampFinite(targetPulse * network.getActionEnergyGate(), 0, ACTION_PULSE_LIMIT, 0);

  if (nextState !== network.actionState) network.lastActionChangeTime = network.simTime;
  network.actionState = nextState;
  network.actionPulseLevel = network.clampFinite(
    network.actionPulseLevel * (1 - ACTION_PULSE_SMOOTHING) + targetPulse * ACTION_PULSE_SMOOTHING,
    0,
    ACTION_PULSE_LIMIT,
    0,
  );

  if (network.actionState === 'orient' && lastTouchDirection && touchDirectionStrength > 0.001) {
    network.actionDirection = [lastTouchDirection[0], lastTouchDirection[1]];
  } else if (network.actionState === 'withdraw' && lastTouchDirection && touchDirectionStrength > 0.001) {
    network.actionDirection = [-lastTouchDirection[0], -lastTouchDirection[1]];
  } else {
    network.actionDirection = null;
  }
  return getActionDebugSummary(network);
}

export function applyActionToDynamics(network: any, {
  lastTouchCentroid = network.lastTouchCentroid,
  lastTouchDirection = network.getTouchDirectionArray(),
  touchDirectionStrength = network.touchDirectionVector?.strength ?? 0,
} = {}) {
  const pulse = network.clampFinite(network.actionPulseLevel * network.getActionEnergyGate(), 0, ACTION_PULSE_LIMIT, 0);
  if (pulse <= 0.0001) return;
  if (network.actionState === 'orient') {
    if (lastTouchCentroid) {
      const centerIdx = network.mapTouchToSurfaceIndex(lastTouchCentroid[0], lastTouchCentroid[1]);
      const S = network.segments;
      const ci = Math.floor(centerIdx / S);
      const cj = centerIdx % S;
      for (let di = -2; di <= 2; di++) {
        for (let dj = -2; dj <= 2; dj++) {
          const idx = ((ci + di + S) % S) * S + ((cj + dj + S) % S);
          const dist = Math.abs(di) + Math.abs(dj);
          const falloff = dist === 0 ? 1.0 : dist === 1 ? 0.55 : 0.25;
          network.touchProjection[idx] = network.clampFinite(network.touchProjection[idx] + pulse * 0.06 * falloff, -4.0, 4.0, 0);
          network.currentBuffer[idx] = network.clampFinite(network.currentBuffer[idx] + pulse * 0.012 * falloff, -8.0, 8.0, 0);
        }
      }
      if (lastTouchDirection && touchDirectionStrength > 0.001) {
        network.touchDirectionVector = { dx: lastTouchDirection[0], dy: lastTouchDirection[1], strength: touchDirectionStrength };
        applyDirectionalRewrite(network, centerIdx, pulse * 0.05);
      }
    }
  } else if (network.actionState === 'withdraw') {
    const projectionDamp = 1.0 - pulse * 0.16;
    const residueDamp = 1.0 - pulse * 0.06;
    const contraction = pulse * 0.018;
    for (let i = 0; i < network.numNodes; i++) {
      network.touchProjection[i] *= projectionDamp;
      network.activityResidue[i] *= residueDamp;
      network.currentBuffer[i] = network.clampFinite(network.currentBuffer[i] * (1.0 - contraction) + network.baselineActivity[i] * contraction, -8.0, 8.0, 0);
    }
    network.overload = network.clamp01(network.overload - pulse * 0.02, network.overload);
  } else if (network.actionState === 'settle') {
    const projectionDamp = 1.0 - pulse * 0.05;
    const traceDamp = 1.0 - pulse * 0.04;
    const residueDamp = 1.0 - pulse * 0.07;
    for (let i = 0; i < network.numNodes; i++) {
      network.touchProjection[i] *= projectionDamp;
      network.touchTrace[i] *= traceDamp;
      network.activityResidue[i] *= residueDamp;
    }
    network.stability = network.clamp01(network.stability + pulse * 0.02, network.stability);
    network.overload = network.clamp01(network.overload - pulse * 0.03, network.overload);
  }
}
