/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BaselineResiduePacket,
  DynamicsPacket,
  ModePacket,
  PredictionPacket,
  RewritePacket,
  TouchPerceptPacket,
} from '../types/packets.js';
import {
  applyDreamReplay,
  getModeDebugSummary,
  noteModeTransition,
  updateModeState,
} from '../organism/modeState.ts';

export { applyDreamReplay, getModeDebugSummary, noteModeTransition, updateModeState };

export function runModeControllerStage(
  network: any,
  {
    touchPacket,
    dynamicsPacket,
    baselinePacket,
    predictionPacket,
    rewritePacket,
    tension = 0,
  }: {
    touchPacket: TouchPerceptPacket;
    dynamicsPacket: DynamicsPacket;
    baselinePacket: BaselineResiduePacket;
    predictionPacket: PredictionPacket;
    rewritePacket: RewritePacket;
    tension?: number;
  },
): ModePacket {
  const modeDebug = updateModeState(network, {
    activeTouchCount: touchPacket.activeTouchCount,
    meanRawTouch: touchPacket.rawTouchMean,
    meanTouchOnset: touchPacket.onsetMean,
    meanTouchNovelty: touchPacket.noveltyMean,
    arousal: dynamicsPacket.arousal,
    meanPredictionError: predictionPacket.meanPredictionError,
    sigmaDisplay: dynamicsPacket.sigma,
    tension: network.clampFinite(tension, 0, 1.5, 0),
    residueLevel: baselinePacket.residueLevel,
    traceLevel: touchPacket.meanTouchTrace,
    priorBiasMean: rewritePacket.priorBiasMean,
    rewritePressureMean: rewritePacket.rewritePressureMean,
    recentRewriteMean: network.cachedRecentRewriteMean ?? 0,
  });
  return modeDebug;
}
