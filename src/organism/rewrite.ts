/* eslint-disable @typescript-eslint/no-explicit-any */
import { state } from './state.js';
import { normalizeDirectionalWeights } from '../core/networkWeights.ts';
import {
  REWRITE_CHANNEL_LIMIT,
  REWRITE_COOLDOWN_FRAMES,
  REWRITE_DIRECTION_COUNTER_DAMP,
  REWRITE_DIRECTION_MIN_STRENGTH,
  REWRITE_DIRECTION_NEIGHBOR_FALLOFF,
  REWRITE_DIRECTION_VERTICAL_COUNTER_DAMP,
  REWRITE_DIRECTION_VERTICAL_STRENGTH,
  REWRITE_DIRECTIONALITY_WEIGHT_FACTOR,
  REWRITE_GLOBAL_LOAD_FACTOR,
  REWRITE_LOAD_DAMPING_FACTOR,
  REWRITE_LOAD_DECAY,
  REWRITE_MAX_EVENTS,
  REWRITE_MAX_GLOBAL_LOAD,
  REWRITE_NOVELTY_PREDICTION_FACTOR,
  REWRITE_PATTERN_BASE,
  REWRITE_PATTERN_SCALE,
  REWRITE_PATTERN_SOURCES,
  REWRITE_PERSISTENCE_RESIDUE_FACTOR,
  REWRITE_PLASTICITY_DECAY,
  REWRITE_PLASTICITY_GAIN,
  REWRITE_PLASTICITY_LIMIT,
  REWRITE_POST_PLASTICITY_FACTOR,
  REWRITE_POST_PRESSURE_FACTOR,
  REWRITE_PRESSURE_DECAY,
  REWRITE_PRESSURE_GAIN,
  REWRITE_PRESSURE_LIMIT,
  REWRITE_PRIOR_DECAY,
  REWRITE_PRIOR_LIMIT,
  REWRITE_RECURRENCE_PROJECTION_DAMPING,
  REWRITE_RECURRENCE_TRACE_FACTOR,
  REWRITE_SEED_BASE,
  REWRITE_SEED_GATE,
  REWRITE_SEED_SCALE,
  REWRITE_TENSION_BASE,
  REWRITE_TENSION_GATE,
  REWRITE_TENSION_SCALE,
  REWRITE_TOUCH_GATE,
  REWRITE_TRIGGER_PLASTICITY,
  REWRITE_TRIGGER_PRESSURE,
  REWRITE_TRIGGER_SCORE,
  REWRITE_TYPES,
} from '../core/aeternaTuning.ts';

export function decayStructuredPriorRewrite(network: any) {
  network.globalRewriteLoad = network.clampFinite(network.globalRewriteLoad * REWRITE_LOAD_DECAY, 0, 1, 0);
  for (let i = 0; i < network.numNodes; i++) {
    network.priorBias[i] = network.clampFinite(network.priorBias[i] * REWRITE_PRIOR_DECAY, 0, REWRITE_PRIOR_LIMIT, 0);
    network.rewritePressure[i] = network.clampFinite(network.rewritePressure[i] * REWRITE_PRESSURE_DECAY, 0, REWRITE_PRESSURE_LIMIT, 0);
    network.plasticityTrace[i] = network.clampFinite(network.plasticityTrace[i] * REWRITE_PLASTICITY_DECAY, 0, REWRITE_PLASTICITY_LIMIT, 0);
    if (network.recentRewriteMask[i] > 0) network.recentRewriteMask[i] -= 1;
  }
  for (const type of REWRITE_TYPES) {
    const channel = network.priorChannels[type]; // state maintenance; keep in Phase C
    for (let i = 0; i < network.numNodes; i++) channel[i] = network.clampFinite(channel[i] * REWRITE_PRIOR_DECAY, 0, REWRITE_CHANNEL_LIMIT, 0);
  }
}

export function getRewriteSeedBiases(network: any) {
  const biases: Record<string, number> = {};
  for (const type of REWRITE_TYPES) {
    const patternKey = REWRITE_PATTERN_SOURCES[type];
    biases[type] = network.clampFinite(network.touchPatternScores[patternKey], 0, 1, 0);
  }
  let tendency = 'none';
  let maxBias = 0;
  for (const type of REWRITE_TYPES) {
    if (biases[type] > maxBias) {
      maxBias = biases[type];
      tendency = type;
    }
  }
  network.rewriteProtoMeaningBiases = biases;
  network.currentRewriteTendency = maxBias >= 0.05 ? tendency : 'none';
  return { ...biases, tendency: network.currentRewriteTendency };
}

export function getRewriteLocalTouch(network: any, type: string, index: number) {
  if (type === 'novelty') return network.touchOnset[index] + network.touchNovelty[index] * 0.5;
  if (type === 'recurrence') return network.touchTrace[index] + network.rawTouch[index] * 0.25;
  if (type === 'persistence') return network.touchOffset[index] + network.touchTrace[index] * 0.6 + network.activityResidue[index] * 0.2;
  return Math.abs(network.touchProjection[index]) + network.touchNovelty[index] * 0.4 + network.rawTouch[index] * 0.3;
}

export function findRewriteCandidate(network: any, type: string, seedBias: number, tension: number) {
  const patternKey = REWRITE_PATTERN_SOURCES[type as keyof typeof REWRITE_PATTERN_SOURCES];
  const patternScore = network.clampFinite(network.touchPatternScores[patternKey] ?? 0, 0, 1, 0);
  if (patternScore < REWRITE_TOUCH_GATE || seedBias < REWRITE_SEED_GATE || tension < REWRITE_TENSION_GATE) return null;
  if (type === 'directionality' && network.touchDirectionVector.strength < REWRITE_DIRECTION_MIN_STRENGTH) return null;

  let best = null;
  const patternFactor = REWRITE_PATTERN_BASE + patternScore * REWRITE_PATTERN_SCALE;
  const seedFactor = REWRITE_SEED_BASE + seedBias * REWRITE_SEED_SCALE;
  const tensionFactor = REWRITE_TENSION_BASE + Math.min(tension, 1.0) * REWRITE_TENSION_SCALE;
  const rewriteHomeostasisGain = network.clampFinite(
    1.0 + (network.stability - 0.58) * 0.08 - Math.max(network.overload - 0.08, 0) * 0.32 - Math.max(0.62 - network.energy, 0) * 0.1,
    0.55,
    1.06,
    1.0,
  );

  for (let i = 0; i < network.numNodes; i++) {
    const localTouchNorm = Math.min(Math.abs(getRewriteLocalTouch(network, type, i)), 1.5) / 1.5;
    if (localTouchNorm < 0.04) continue;
    const localErrorNorm = Math.min(Math.abs(network.predictionError[i]), 1.5) / 1.5;
    if (localErrorNorm < 0.06) continue;
    const composite = localErrorNorm * localTouchNorm * patternFactor * seedFactor * tensionFactor * (network.currentModeDynamics?.rewriteGain ?? 1.0) * rewriteHomeostasisGain;
    if (!Number.isFinite(composite) || composite <= 0) continue;

    network.rewritePressure[i] = network.clampFinite(
      network.rewritePressure[i] + composite * REWRITE_PRESSURE_GAIN * (1.0 - network.globalRewriteLoad * REWRITE_LOAD_DAMPING_FACTOR),
      0,
      REWRITE_PRESSURE_LIMIT,
      0,
    );
    if (composite > 0.07) network.plasticityTrace[i] = network.clampFinite(network.plasticityTrace[i] + composite * REWRITE_PLASTICITY_GAIN, 0, REWRITE_PLASTICITY_LIMIT, 0);
    if (network.recentRewriteMask[i] > 0) continue;
    if (composite < REWRITE_TRIGGER_SCORE || network.rewritePressure[i] < REWRITE_TRIGGER_PRESSURE || network.plasticityTrace[i] < REWRITE_TRIGGER_PLASTICITY) continue;

    if (!best || composite > best.score) {
      best = {
        node: i,
        rewriteType: type,
        score: composite,
        patternScore,
        seedBias,
        tension,
        localTouch: getRewriteLocalTouch(network, type, i),
        localError: Math.abs(network.predictionError[i]),
      };
    }
  }
  return best;
}

export function applyDirectionalRewrite(
  network: any,
  centerIndex: number,
  delta: number,
  direction = network.touchDirectionVector,
) {
  const S = network.segments;
  const ci = Math.floor(centerIndex / S);
  const cj = centerIndex % S;
  const { dx, dy } = direction;
  const horizontalDominant = Math.abs(dx) > Math.abs(dy);
  const verticalDominant = Math.abs(dy) > Math.abs(dx);
  const balancedAxes = !horizontalDominant && !verticalDominant;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const idx = ((ci + di + S) % S) * S + ((cj + dj + S) % S);
      const falloff = di === 0 && dj === 0 ? 1.0 : REWRITE_DIRECTION_NEIGHBOR_FALLOFF;
      if (horizontalDominant || balancedAxes) {
        if (dx >= 0) {
          network.w_right[idx] += delta * falloff;
          network.w_left[idx] -= delta * falloff * REWRITE_DIRECTION_COUNTER_DAMP;
        } else {
          network.w_left[idx] += delta * falloff;
          network.w_right[idx] -= delta * falloff * REWRITE_DIRECTION_COUNTER_DAMP;
        }
      }
      if ((verticalDominant || balancedAxes) && Math.abs(dy) > 0.001) {
        if (dy >= 0) {
          network.w_down[idx] += delta * falloff * REWRITE_DIRECTION_VERTICAL_STRENGTH;
          network.w_up[idx] -= delta * falloff * REWRITE_DIRECTION_VERTICAL_COUNTER_DAMP;
        } else {
          network.w_up[idx] += delta * falloff * REWRITE_DIRECTION_VERTICAL_STRENGTH;
          network.w_down[idx] -= delta * falloff * REWRITE_DIRECTION_VERTICAL_COUNTER_DAMP;
        }
      }
      normalizeDirectionalWeights(network, idx);
    }
  }
}

export function logRewriteEvent(network: any, candidate: any, delta: number) {
  const event = {
    id: ++network.lastRewriteEventId,
    timestamp: network.simTime,
    node: candidate.node,
    region: {
      i: Math.floor(candidate.node / network.segments),
      j: candidate.node % network.segments,
    },
    rewriteType: candidate.rewriteType,
    triggerSummary: `err=${candidate.localError.toFixed(3)} touch=${candidate.localTouch.toFixed(3)} seed=${candidate.seedBias.toFixed(2)} tension=${candidate.tension.toFixed(2)}`,
    deltaMagnitude: Number(delta.toFixed(4)),
  };
  network.lastRewriteEvent = event;
  network.rewriteEvents.unshift(event);
  if (network.rewriteEvents.length > REWRITE_MAX_EVENTS) network.rewriteEvents.pop();
}

export function applyStructuredPriorRewrite(network: any, candidate: any) {
  const idx = candidate.node;
  const delta = network.clampFinite((0.004 + candidate.score * 0.012) * (network.currentModeDynamics?.rewriteGain ?? 1.0), 0.004, 0.018, 0.004);
  const channel = network.priorChannels[candidate.rewriteType]; // state maintenance; keep in Phase C
  channel[idx] = network.clampFinite(channel[idx] + delta, 0, REWRITE_CHANNEL_LIMIT, 0);
  network.priorBias[idx] = network.clampFinite(network.priorBias[idx] + delta * 0.7, 0, REWRITE_PRIOR_LIMIT, 0); // co-written with priorChannels; reroute target in Phase C

  if (candidate.rewriteType === 'novelty') {
    network.localPrediction[idx] = network.clampFinite(network.localPrediction[idx] + network.touchOnset[idx] * delta * REWRITE_NOVELTY_PREDICTION_FACTOR, -8.0, 8.0, 0);
  } else if (candidate.rewriteType === 'recurrence') {
    network.touchTrace[idx] = network.clampFinite(network.touchTrace[idx] + network.touchNovelty[idx] * delta * REWRITE_RECURRENCE_TRACE_FACTOR, 0, 4.0, 0);
    network.touchProjection[idx] = network.clampFinite(network.touchProjection[idx] * (1.0 - delta * REWRITE_RECURRENCE_PROJECTION_DAMPING), -4.0, 4.0, 0);
  } else if (candidate.rewriteType === 'persistence') {
    network.activityResidue[idx] = network.clampFinite(network.activityResidue[idx] + (network.touchOffset[idx] + network.touchTrace[idx]) * delta * REWRITE_PERSISTENCE_RESIDUE_FACTOR, 0, 1.25, 0);
  } else if (candidate.rewriteType === 'directionality') {
    applyDirectionalRewrite(network, idx, delta * REWRITE_DIRECTIONALITY_WEIGHT_FACTOR);
  }

  network.rewritePressure[idx] = network.clampFinite(network.rewritePressure[idx] * REWRITE_POST_PRESSURE_FACTOR, 0, REWRITE_PRESSURE_LIMIT, 0);
  network.plasticityTrace[idx] = network.clampFinite(network.plasticityTrace[idx] * REWRITE_POST_PLASTICITY_FACTOR, 0, REWRITE_PLASTICITY_LIMIT, 0);
  network.recentRewriteMask[idx] = REWRITE_COOLDOWN_FRAMES;
  network.globalRewriteLoad = network.clampFinite(network.globalRewriteLoad + delta * REWRITE_GLOBAL_LOAD_FACTOR, 0, 1, 0);
  logRewriteEvent(network, candidate, delta);
}

export function buildRewriteDebugSummary(network: any, seedBiases: any) {
  let pressureSum = 0;
  let pressureMax = 0;
  let priorSum = 0;
  const channelSummary = { novelty: 0, recurrence: 0, persistence: 0, directionality: 0 };
  for (let i = 0; i < network.numNodes; i++) {
    pressureSum += network.rewritePressure[i];
    priorSum += network.priorBias[i];
    if (network.rewritePressure[i] > pressureMax) pressureMax = network.rewritePressure[i];
    for (const type of REWRITE_TYPES) channelSummary[type] += network.priorChannels[type][i]; // observation-only usage; keep in Phase C
  }
  const norm = Math.max(network.numNodes, 1);
  return {
    tendency: seedBiases.tendency,
    pressureMean: pressureSum / norm,
    pressureMax,
    priorBiasMean: priorSum / norm,
    globalLoad: network.globalRewriteLoad,
    priorBiasSummary: {
      novelty: channelSummary.novelty / norm,
      recurrence: channelSummary.recurrence / norm,
      persistence: channelSummary.persistence / norm,
      directionality: channelSummary.directionality / norm,
    },
    lastEvent: network.lastRewriteEvent,
  };
}

export function updateStructuredPriorRewrite(network: any) {
  decayStructuredPriorRewrite(network);
  const seedBiases = getRewriteSeedBiases(network);
  const tension = network.clampFinite(state.tensionLoad, 0, 1.5, 0);
  if (network.globalRewriteLoad < REWRITE_MAX_GLOBAL_LOAD) {
    const candidates = [];
    for (const type of REWRITE_TYPES) {
      const candidate = findRewriteCandidate(network, type, seedBiases[type], tension);
      if (candidate) candidates.push(candidate);
    }
    candidates.sort((a, b) => b.score - a.score);
    const chosen = candidates[0] ?? null;
    if (chosen) applyStructuredPriorRewrite(network, chosen);
  }
  return buildRewriteDebugSummary(network, seedBiases);
}
