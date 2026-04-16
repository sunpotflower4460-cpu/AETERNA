/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ActionPacket, OrganismPacket, TouchPerceptPacket } from '../types/packets.js';
import { applyActionToDynamics, getActionDebugSummary, updateActionState } from './actionState.ts';

export { applyActionToDynamics, getActionDebugSummary, updateActionState };

export function runActionDecisionStage(
  network: any,
  {
    touchPacket,
    organismPacket: _organismPacket,
  }: {
    touchPacket: TouchPerceptPacket;
    organismPacket: OrganismPacket;
  },
): ActionPacket {
  const actionDebug = updateActionState(network, {
    activeTouchCount: touchPacket.activeTouchCount,
    meanRawTouch: touchPacket.rawTouchMean,
    meanTouchNovelty: touchPacket.noveltyMean,
    meanTouchTrace: touchPacket.meanTouchTrace,
  });
  applyActionToDynamics(network);
  return {
    actionState: actionDebug.actionState,
    actionPulseLevel: actionDebug.actionPulseLevel,
    actionDirection: actionDebug.actionDirection,
    lastActionChangeTime: actionDebug.lastActionChangeTime,
    lastActionChangeFrames: actionDebug.lastActionChangeFrames,
  };
}
