/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BaselineResiduePacket } from '../types/packets.js';
import { updateBaseline, updateResidue } from '../core/torusDynamics.ts';
import { runBaselineResidueStage } from '../core/torusDynamics.ts';

export { updateBaseline, updateResidue };

export function runBaselineActivityStage(network: any): BaselineResiduePacket {
  return runBaselineResidueStage(network);
}
