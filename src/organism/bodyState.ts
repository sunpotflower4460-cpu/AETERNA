/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BaselineResiduePacket,
  DynamicsPacket,
  OrganismPacket,
  PredictionPacket,
  RewritePacket,
  TouchPerceptPacket,
} from '../types/packets.js';
import { getOrganismDebugSummary, recordOrganismSnapshot, updateOrganismState } from './survivalState.ts';

export { getOrganismDebugSummary, recordOrganismSnapshot, updateOrganismState };

export function runBodyStateStage(
  network: any,
  {
    touchPacket,
    dynamicsPacket,
    baselinePacket,
    predictionPacket,
    rewritePacket,
  }: {
    touchPacket: TouchPerceptPacket;
    dynamicsPacket: DynamicsPacket;
    baselinePacket: BaselineResiduePacket;
    predictionPacket: PredictionPacket;
    rewritePacket: RewritePacket;
  },
): OrganismPacket {
  const organismDebug = updateOrganismState(network, {
    activeTouchCount: touchPacket.activeTouchCount,
    meanRawTouch: touchPacket.rawTouchMean,
    meanTouchOnset: touchPacket.onsetMean,
    meanTouchNovelty: touchPacket.noveltyMean,
    meanTouchTrace: touchPacket.meanTouchTrace,
    patternScores: touchPacket.patternScores,
    arousal: dynamicsPacket.arousal,
    meanPredictionError: predictionPacket.meanPredictionError,
    residueLevel: baselinePacket.residueLevel,
    rewritePressureMean: rewritePacket.rewritePressureMean,
    globalRewriteLoad: rewritePacket.globalRewriteLoad,
  });
  return {
    energy: organismDebug.energy,
    stability: organismDebug.stability,
    overload: organismDebug.overload,
    restDrive: organismDebug.restDrive,
    orientingDrive: organismDebug.orientingDrive,
    comfortBias: organismDebug.comfortBias,
  };
}
