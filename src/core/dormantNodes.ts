/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveRandomFloat, resolveRandomSigned } from './hardwareRandom.ts';

const DORMANT_NODE_RATIO = 0.05;
const DORMANT_WAKE_PRESSURE_DECAY = 0.986;
const DORMANT_WAKE_PRESSURE_GAIN = 0.052;
const DORMANT_WAKE_TRIGGER_PRESSURE = 0.58;
const DORMANT_WAKE_TRIGGER_SIGNAL = 0.72;
const DORMANT_WAKE_MIN_ACTIVITY = 0.2;
const DORMANT_WAKE_MIN_ERROR = 0.1;
const DORMANT_WAKE_COOLDOWN_MIN = 22;
const DORMANT_WAKE_COOLDOWN_RANGE = 18;
const DORMANT_PRESSURE_WEIGHT_ACTIVITY = 0.34;
const DORMANT_PRESSURE_WEIGHT_ERROR = 0.31;
const DORMANT_PRESSURE_WEIGHT_HOTSPOT = 0.2;
const DORMANT_PRESSURE_WEIGHT_LOCAL_BUFFER = 0.08;
const DORMANT_WAKE_SIGNAL_ACTIVITY = 0.18;
const DORMANT_WAKE_SIGNAL_ERROR = 0.12;
const DORMANT_WAKE_SIGNAL_HOTSPOT = 0.08;
const DORMANT_WAKE_SIGNAL_RANDOM = 0.03;
const DORMANT_AWAKE_SELF_INFLUENCE = 0.032;
const DORMANT_AWAKE_INFLUENCE_MAX = 0.045;
const DORMANT_AWAKE_NEIGHBOR_INFLUENCE = 0.18;
const DORMANT_RESLEEP_PRESSURE = 0.2;
const DORMANT_RESLEEP_ACTIVITY = 0.15;
const DORMANT_RESLEEP_ERROR = 0.09;
const DORMANT_EVENT_LIMIT = 8;

function dormantPlacementHash(index: number) {
  return (Math.imul(index ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0;
}

function getDormantNeighbors(network: any, index: number) {
  const i = Math.floor(index / network.segments);
  const j = index % network.segments;
  return [
    ((i - 1 + network.segments) % network.segments) * network.segments + j,
    ((i + 1) % network.segments) * network.segments + j,
    i * network.segments + ((j - 1 + network.segments) % network.segments),
    i * network.segments + ((j + 1) % network.segments),
  ];
}

function getHubProximity(network: any, index: number) {
  const i = Math.floor(index / network.segments);
  const j = index % network.segments;
  let proximity = 0;
  for (let k = 0; k < network.octahedronHubs.length; k++) {
    const hub = network.octahedronHubs[k];
    const di = Math.min(Math.abs(i - hub.i), network.segments - Math.abs(i - hub.i));
    const dj = Math.min(Math.abs(j - hub.j), network.segments - Math.abs(j - hub.j));
    const distance = di + dj;
    proximity = Math.max(proximity, network.clampFinite(1 - distance / 6, 0, 1, 0));
  }
  return proximity;
}

function getLocalSignals(network: any, index: number) {
  const neighbors = getDormantNeighbors(network, index);
  let activitySum = Math.abs(network.currentBuffer[index]);
  let errorSum = Math.abs(network.currentBuffer[index] - network.localPrediction[index]);
  for (let k = 0; k < neighbors.length; k++) {
    const neighbor = neighbors[k];
    activitySum += Math.abs(network.currentBuffer[neighbor]);
    errorSum += Math.abs(network.currentBuffer[neighbor] - network.localPrediction[neighbor]);
  }
  const norm = neighbors.length + 1;
  const localActivity = network.clampFinite(activitySum / norm / 1.6, 0, 1.5, 0);
  const localError = network.clampFinite(errorSum / norm / 1.4, 0, 1.5, 0);
  const hotspot = network.clampFinite(
    network.activityResidue[index] * 0.85 + network.spikeTrace[index] * 0.7 + getHubProximity(network, index) * 0.5,
    0,
    1.5,
    0,
  ) / 1.5;
  return { localActivity, localError, hotspot, neighbors };
}

function pushDormantWakeEvent(network: any, index: number, wakeSignal: number) {
  const event = {
    timestamp: network.simTime,
    node: index,
    region: {
      i: Math.floor(index / network.segments),
      j: index % network.segments,
    },
    wakePressure: Number(network.dormantWakePressure[index].toFixed(4)),
    wakeSignal: Number(wakeSignal.toFixed(4)),
  };
  network.recentDormantWakeEvents.unshift(event);
  if (network.recentDormantWakeEvents.length > DORMANT_EVENT_LIMIT) network.recentDormantWakeEvents.pop();
}

export function initializeDormantNodes(network: any) {
  network.dormantTraitMask.fill(0);
  network.isDormantNode.fill(0);
  network.dormantWakePressure.fill(0);
  network.dormantWakeCooldown.fill(0);
  network.recentDormantWakeEvents = [];
  network.totalDormantWakeCount = 0;
  network.activeDormantNodeCount = 0;

  const eligibleNodes: number[] = [];
  for (let i = 0; i < network.numNodes; i++) {
    if (network.isEyeNode[i] === 1 || network.isHubNode(i)) continue;
    eligibleNodes.push(i);
  }

  eligibleNodes.sort((a, b) => {
    const aHash = dormantPlacementHash(a);
    const bHash = dormantPlacementHash(b);
    if (aHash === bHash) return 0;
    return aHash < bHash ? -1 : 1;
  });
  const targetCount = Math.min(eligibleNodes.length, Math.max(1, Math.floor(network.numNodes * DORMANT_NODE_RATIO)));
  for (let n = 0; n < targetCount; n++) {
    const idx = eligibleNodes[Math.floor(((n + 0.5) * eligibleNodes.length) / targetCount)];
    network.dormantTraitMask[idx] = 1;
    network.isDormantNode[idx] = 1;
  }
  network.totalDormantNodeCount = targetCount;
}

export function updateDormantNodes(network: any) {
  let activeDormantNodeCount = 0;

  for (let i = 0; i < network.numNodes; i++) {
    if (network.dormantTraitMask[i] !== 1) continue;
    const { localActivity, localError, hotspot, neighbors } = getLocalSignals(network, i);

    if (network.isDormantNode[i] === 1) {
      const pressureInput = localActivity * DORMANT_PRESSURE_WEIGHT_ACTIVITY
        + localError * DORMANT_PRESSURE_WEIGHT_ERROR
        + hotspot * DORMANT_PRESSURE_WEIGHT_HOTSPOT
        + network.clampFinite(Math.abs(network.currentBuffer[i]) / 1.2, 0, 1, 0) * DORMANT_PRESSURE_WEIGHT_LOCAL_BUFFER;
      network.dormantWakePressure[i] = network.clampFinite(
        network.dormantWakePressure[i] * DORMANT_WAKE_PRESSURE_DECAY + pressureInput * DORMANT_WAKE_PRESSURE_GAIN,
        0,
        1.5,
        0,
      );
      if (network.dormantWakeCooldown[i] > 0) {
        network.dormantWakeCooldown[i] = network.clampFinite(network.dormantWakeCooldown[i] - 1, 0, 240, 0);
      }

      const wakeSignal = network.dormantWakePressure[i]
        + localActivity * DORMANT_WAKE_SIGNAL_ACTIVITY
        + localError * DORMANT_WAKE_SIGNAL_ERROR
        + hotspot * DORMANT_WAKE_SIGNAL_HOTSPOT
        + resolveRandomSigned(network) * DORMANT_WAKE_SIGNAL_RANDOM;

      if (
        network.dormantWakeCooldown[i] <= 0
        && network.dormantWakePressure[i] > DORMANT_WAKE_TRIGGER_PRESSURE
        && localActivity > DORMANT_WAKE_MIN_ACTIVITY
        && localError > DORMANT_WAKE_MIN_ERROR
        && wakeSignal > DORMANT_WAKE_TRIGGER_SIGNAL
      ) {
        network.isDormantNode[i] = 0;
        network.dormantWakeCooldown[i] = DORMANT_WAKE_COOLDOWN_MIN + Math.floor(resolveRandomFloat(network) * DORMANT_WAKE_COOLDOWN_RANGE);
        network.totalDormantWakeCount += 1;
        pushDormantWakeEvent(network, i, wakeSignal);
      }
      continue;
    }

    activeDormantNodeCount++;
    const wakeInfluence = network.clampFinite(network.dormantWakePressure[i] * DORMANT_AWAKE_SELF_INFLUENCE, 0, DORMANT_AWAKE_INFLUENCE_MAX, 0);
    if (wakeInfluence > 0) {
      const signedInfluence = wakeInfluence * (network.nodeSign[i] >= 0 ? 1 : -0.6);
      network.currentBuffer[i] += signedInfluence;
      for (let k = 0; k < neighbors.length; k++) {
        network.currentBuffer[neighbors[k]] += signedInfluence * DORMANT_AWAKE_NEIGHBOR_INFLUENCE;
      }
    }

    network.dormantWakePressure[i] = network.clampFinite(network.dormantWakePressure[i] * 0.94 - 0.006, 0, 1.5, 0);
    if (network.dormantWakeCooldown[i] > 0) {
      network.dormantWakeCooldown[i] = network.clampFinite(network.dormantWakeCooldown[i] - 1, 0, 240, 0);
    }

    const shouldSleep = (
      network.dormantWakeCooldown[i] <= 0 && network.dormantWakePressure[i] < 0.24
    ) || (
      network.dormantWakePressure[i] < DORMANT_RESLEEP_PRESSURE
      && localActivity < DORMANT_RESLEEP_ACTIVITY
      && localError < DORMANT_RESLEEP_ERROR
    );

    if (shouldSleep) {
      network.isDormantNode[i] = 1;
      network.dormantWakeCooldown[i] = 42;
      network.dormantWakePressure[i] = network.clampFinite(network.dormantWakePressure[i] * 0.45, 0, 1.5, 0);
    }
  }

  network.activeDormantNodeCount = activeDormantNodeCount;
}

export function buildDormantDebugSummary(network: any) {
  let wakePressureSum = 0;
  let wakePressureMax = 0;
  let dormantNodeCount = 0;

  for (let i = 0; i < network.numNodes; i++) {
    if (network.dormantTraitMask[i] !== 1) continue;
    dormantNodeCount++;
    wakePressureSum += network.dormantWakePressure[i];
    if (network.dormantWakePressure[i] > wakePressureMax) wakePressureMax = network.dormantWakePressure[i];
  }

  return {
    dormantNodeCount,
    dormantWakeCount: network.totalDormantWakeCount ?? 0,
    activeDormantNodeCount: network.activeDormantNodeCount ?? 0,
    recentDormantWakeEvents: [...(network.recentDormantWakeEvents ?? [])],
    hardwareRandomNoiseActivePath: network.hardwareRandomNoiseSource === 'crypto',
    hardwareRandomNoiseSource: network.hardwareRandomNoiseSource ?? 'fallback',
    noiseMagnitude: network.lastNoiseMagnitude ?? 0,
    wakePressureMean: dormantNodeCount > 0 ? wakePressureSum / dormantNodeCount : 0,
    wakePressureMax,
  };
}
