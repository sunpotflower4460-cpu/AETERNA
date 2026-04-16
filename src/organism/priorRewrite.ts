/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PredictionPacket, RewritePacket } from '../types/packets.js';
import {
  applyDirectionalRewrite,
  applyStructuredPriorRewrite,
  buildRewriteDebugSummary,
  decayStructuredPriorRewrite,
  findRewriteCandidate,
  getRewriteLocalTouch,
  getRewriteSeedBiases,
  logRewriteEvent,
  updateStructuredPriorRewrite,
} from './rewrite.ts';

export {
  applyDirectionalRewrite,
  applyStructuredPriorRewrite,
  buildRewriteDebugSummary,
  decayStructuredPriorRewrite,
  findRewriteCandidate,
  getRewriteLocalTouch,
  getRewriteSeedBiases,
  logRewriteEvent,
  updateStructuredPriorRewrite,
};

export function runPriorRewriteStage(network: any, _predictionPacket: PredictionPacket): RewritePacket {
  void _predictionPacket;
  const rewriteDebug = updateStructuredPriorRewrite(network);
  let recentRewriteSum = 0;
  for (let i = 0; i < network.numNodes; i++) recentRewriteSum += network.recentRewriteMask[i];
  network.cachedRecentRewriteMean = recentRewriteSum / network.numNodes;
  return {
    rewritePressureMean: rewriteDebug.pressureMean,
    rewritePressureMax: rewriteDebug.pressureMax,
    globalRewriteLoad: rewriteDebug.globalLoad,
    dominantRewriteTendency: rewriteDebug.tendency === 'none' ? null : rewriteDebug.tendency,
    priorBiasMean: rewriteDebug.priorBiasMean,
    priorBiasSummary: rewriteDebug.priorBiasSummary,
    lastRewriteEvent: rewriteDebug.lastEvent,
  };
}
