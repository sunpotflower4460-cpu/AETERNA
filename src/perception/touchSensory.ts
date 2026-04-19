/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TouchInputPacket, TouchPerceptPacket } from '../types/packets.js';
import { TOUCH_PROJ_BASE_GAIN } from '../core/aeternaTuning.ts';
import { applyDreamReplay } from '../mode/modeController.ts';
import { applyTouchPatternStage } from './touchPattern.ts';
import {
  addGaussianTouch,
  mapTouchToSurfaceIndex,
  projectTouchToNetwork,
  updateRawTouchField,
  updateTouchPerception,
} from './touchPerception.ts';
import { updateTouchExpectation, computeTouchSurprise, updateTouchHabituation } from './touchExpectation.ts';

export { addGaussianTouch, mapTouchToSurfaceIndex, updateRawTouchField, updateTouchPerception, projectTouchToNetwork };

export function captureTouchSensoryInput(network: any, activeTouches: Map<any, any>): TouchInputPacket {
  updateRawTouchField(network, activeTouches);

  // Phase 3: Update touch expectation AFTER rawTouch is set but BEFORE perception processing
  if (network.touchExpectation) {
    updateTouchExpectation(network, network.touchExpectation, activeTouches, network.simTime);
    network.touchSurpriseMetrics = computeTouchSurprise(network, network.touchExpectation, activeTouches, network.simTime);
    updateTouchHabituation(network, network.touchExpectation, activeTouches);
  }

  return {
    activeTouchCount: activeTouches.size,
    lastTouchCentroid: network.lastTouchCentroid,
    touchDuration: network.touchDurationFrames,
    touchVelocity: network.touchVelocityEstimate,
    touchRepeatCount: network.touchRepeatCount,
    lastTouchDirection: network.getTouchDirectionArray(),
    touchDirectionStrength: network.touchDirectionVector?.strength ?? 0,
  };
}

export function finalizeTouchSensoryStage(
  network: any,
  touchInputPacket: TouchInputPacket,
  touchPatternPacket: Pick<TouchPerceptPacket, 'dominantPattern' | 'patternScores' | 'lastTouchCentroid' | 'touchDuration' | 'touchVelocity' | 'touchRepeatCount' | 'lastTouchDirection'>,
): TouchPerceptPacket {
  updateTouchPerception(network);
  projectTouchToNetwork(network);
  applyTouchPatternStage(network);

  let rawTouchSum = 0;
  let onsetSum = 0;
  let offsetSum = 0;
  let noveltySum = 0;
  let traceSum = 0;
  for (let i = 0; i < network.numNodes; i++) {
    rawTouchSum += network.rawTouch[i];
    onsetSum += network.touchOnset[i];
    offsetSum += network.touchOffset[i];
    noveltySum += network.touchNovelty[i];
    traceSum += network.touchTrace[i];
  }

  const rawTouchMean = rawTouchSum / network.numNodes;
  const onsetMean = onsetSum / network.numNodes;
  const offsetMean = offsetSum / network.numNodes;
  const noveltyMean = noveltySum / network.numNodes;
  const meanTouchTrace = traceSum / network.numNodes;
  const replayExternalLevel = network.clampFinite(
    (touchInputPacket.activeTouchCount > 0 ? 0.45 : 0)
      + rawTouchMean * 0.9
      + onsetMean * 0.7
      + noveltyMean * 0.45,
    0,
    1,
    0,
  );
  applyDreamReplay(network, replayExternalLevel);

  const touchProjGain = network.currentModeDynamics?.touchProjectionGain ?? 1.0;
  for (let i = 0; i < network.numNodes; i++) {
    network.currentBuffer[i] += network.touchProjection[i] * (TOUCH_PROJ_BASE_GAIN * touchProjGain);
  }

  return {
    ...touchInputPacket,
    ...touchPatternPacket,
    rawTouchMean,
    onsetMean,
    offsetMean,
    noveltyMean,
    meanTouchTrace,
    replayExternalLevel,
  };
}
