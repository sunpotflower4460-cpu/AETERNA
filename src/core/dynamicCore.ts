/* eslint-disable @typescript-eslint/no-explicit-any */
import { PHI_INV, SCHUMANN_RES, GAMMA_SYNC } from '../constants/aeternaConstants.js';
import { state } from '../organism/state.js';
import { getHardwareRandomFloat, hasHardwareRandomSource } from './hardwareRandom.ts';

export function triggerNoise(network: any, tension: number, sigmaDisp: number) {
  const thermalRate = state.disk.omega_t > 30 ? 0.02 : 0.05;
  const eventRate = tension * 0.2 + Math.abs(sigmaDisp - 1.0) * 0.1;
  const finalRate = Math.min(Math.max(thermalRate + eventRate, 0), 1);
  network.hardwareRandomNoiseSource = hasHardwareRandomSource() ? 'crypto' : 'fallback';
  let injectedMagnitude = 0;
  let injectedEvents = 0;
  for (let i = 0; i < 3; i++) {
    if (getHardwareRandomFloat() < finalRate) {
      const index = Math.floor(getHardwareRandomFloat() * network.numNodes);
      const magnitude = 1.0 + getHardwareRandomFloat();
      network.currentBuffer[index] += magnitude;
      injectedMagnitude += magnitude;
      injectedEvents++;
    }
  }
  network.lastNoiseMagnitude = injectedMagnitude;
  network.lastNoiseEventCount = injectedEvents;
}

export function updateBaseline(network: any) {
  const BASELINE_AMP = 0.003;
  const TIME_DRIFT = 0.0008;
  const t = network.simTime * TIME_DRIFT;
  const gain = network.currentModeDynamics?.baselineGain ?? 1.0;
  const phaseOffset = network.modePhase * Math.PI * 2;
  for (let i = 0; i < network.numNodes; i++) {
    network.baselineActivity[i] = BASELINE_AMP * gain * Math.sin(network.nodePhase[i] + t + phaseOffset);
  }
}

export function updateResidue(network: any) {
  const RESIDUE_DECAY = 0.97;
  const RESIDUE_INTAKE = 0.02;
  const modeResidueOffset = network.currentModeDynamics?.residueDecayOffset ?? 0;
  for (let i = 0; i < network.numNodes; i++) {
    const persistenceBias = network.priorChannels.persistence[i]; // direct behavioral dependency; target for weakening in Phase C
    const decay = network.clampFinite(RESIDUE_DECAY + persistenceBias * 0.01, 0.97, 0.995, RESIDUE_DECAY);
    const intake = network.clampFinite(RESIDUE_INTAKE + persistenceBias * 0.004, RESIDUE_INTAKE, 0.03, RESIDUE_INTAKE);
    const modeDecayTarget = decay + modeResidueOffset;
    const modeDecay = network.clampFinite(modeDecayTarget, 0.94, 0.995, modeDecayTarget);
    network.activityResidue[i] = network.activityResidue[i] * modeDecay + network.spikeTrace[i] * intake;
    network.activityResidue[i] = network.clampFinite(network.activityResidue[i], 0, 1.25, 0);
  }
}

export function updateBaselineAndResidue(network: any) {
  const BASELINE_GAIN = 0.4;
  const RESIDUE_GAIN = 0.005;
  updateBaseline(network);
  updateResidue(network);
  let baselineSum = 0;
  let residueSum = 0;
  for (let i = 0; i < network.numNodes; i++) {
    network.currentBuffer[i] += network.baselineActivity[i] * BASELINE_GAIN + network.activityResidue[i] * RESIDUE_GAIN;
    baselineSum += Math.abs(network.baselineActivity[i]);
    residueSum += network.activityResidue[i];
  }
  return {
    baselineLevel: baselineSum / network.numNodes,
    residueLevel: residueSum / network.numNodes,
  };
}

export function injectPredictionError(network: any, index: number) {
  const targetVal = 10.0;
  const error = targetVal - network.currentBuffer[index];
  network.currentBuffer[index] += error * 0.8;
  const i = Math.floor(index / network.segments);
  const j = index % network.segments;
  const up = ((i - 1 + network.segments) % network.segments) * network.segments + j;
  const down = ((i + 1) % network.segments) * network.segments + j;
  const left = i * network.segments + ((j - 1 + network.segments) % network.segments);
  const right = i * network.segments + ((j + 1) % network.segments);
  network.currentBuffer[up] += error * 0.4;
  network.currentBuffer[down] += error * 0.4;
  network.currentBuffer[left] += error * 0.4;
  network.currentBuffer[right] += error * 0.4;
  network.injectedNodes.push(index);
}

export function autoPredictAndError(network: any) {
  if (network.simTime % 60 !== 0) return;
  let maxError = 0;
  let maxErrorNode = -1;
  for (let i = 0; i < network.numNodes; i++) {
    const error = Math.abs(network.currentBuffer[i] - network.prevBuffer[i]) * 2.0;
    network.predictionHistory[i] = network.predictionHistory[i] * 0.95 + error * 0.05;
    if (error > maxError) {
      maxError = error;
      maxErrorNode = i;
    }
    const hubBoostThreshold = network.isHubNode(i) ? network.AUTO_ERROR_THRESHOLD * 0.75 : network.AUTO_ERROR_THRESHOLD;
    if ((network.isEyeNode[i] === 1 || network.isHubNode(i)) && network.predictionHistory[i] > hubBoostThreshold) {
      injectPredictionError(network, i);
    }
  }
  if (maxErrorNode >= 0 && maxError > 2.0) injectPredictionError(network, maxErrorNode);
}

export function updatePredictionError(network: any) {
  for (let i = 0; i < network.numNodes; i++) network.predictionError[i] = network.currentBuffer[i] - network.localPrediction[i];
}

export function updateDynamicsCore(network: any) {
  const freqRatio = (state.disk.omega_t - SCHUMANN_RES) / (GAMMA_SYNC - SCHUMANN_RES);
  const waveSpeed = 0.1 + 0.15 * freqRatio;
  const damping = 0.985 - (1.0 - PHI_INV) * 0.02 * (1.0 - freqRatio);

  let newlyFiredCount = 0;
  for (let i = 0; i < network.numNodes; i++) {
    const dormantThreshold = network.dormantTraitMask?.[i] === 1 && network.isDormantNode?.[i] === 1 ? 1.05 : 0.8;
    if (network.currentBuffer[i] > dormantThreshold && network.prevBuffer[i] <= dormantThreshold) {
      network.spikeTrace[i] = 1.0;
      network.lastSpikeTime[i] = network.simTime;
      newlyFiredCount++;
    } else {
      network.spikeTrace[i] *= 0.9;
    }
  }

  for (let i = 0; i < network.numNodes; i++) {
    network.w_up[i] *= 0.99995;
    network.w_down[i] *= 0.99995;
    network.w_left[i] *= 0.99995;
    network.w_right[i] *= 0.99995;
    const sum = network.w_up[i] + network.w_down[i] + network.w_left[i] + network.w_right[i];
    if (sum > 0.001) {
      const f = 4.0 / sum;
      const a = 0.01;
      network.w_up[i] += (network.w_up[i] * f - network.w_up[i]) * a;
      network.w_down[i] += (network.w_down[i] * f - network.w_down[i]) * a;
      network.w_left[i] += (network.w_left[i] * f - network.w_left[i]) * a;
      network.w_right[i] += (network.w_right[i] * f - network.w_right[i]) * a;
    }
  }

  network.prevGenFiring = network.currGenFiring;
  network.currGenFiring = newlyFiredCount;
  network.branchingRatioRaw = network.prevGenFiring > 0 ? network.currGenFiring / network.prevGenFiring : 1.0;
  network.sigmaDisplay = network.sigmaDisplay * 0.9 + network.branchingRatioRaw * 0.1;

  const arousal = network.currGenFiring / network.numNodes;
  network.firingRateError = network.TARGET_FIRING_RATE - arousal;
  const homeoDamping = damping + network.firingRateError * 0.002;

  for (let i = 0; i < network.segments; i++) {
    for (let j = 0; j < network.segments; j++) {
      const idx = i * network.segments + j;
      const up = ((i - 1 + network.segments) % network.segments) * network.segments + j;
      const down = ((i + 1) % network.segments) * network.segments + j;
      const left = i * network.segments + ((j - 1 + network.segments) % network.segments);
      const right = i * network.segments + ((j + 1) % network.segments);
      const laplacian = (network.w_down[up] * network.currentBuffer[up] * network.nodeSign[up])
        + (network.w_up[down] * network.currentBuffer[down] * network.nodeSign[down])
        + (network.w_right[left] * network.currentBuffer[left] * network.nodeSign[left])
        + (network.w_left[right] * network.currentBuffer[right] * network.nodeSign[right])
        - ((network.w_up[idx] + network.w_down[idx] + network.w_left[idx] + network.w_right[idx]) * network.currentBuffer[idx]);

      let nextVal = 2 * network.currentBuffer[idx] - network.prevBuffer[idx] + waveSpeed * laplacian;
      nextVal *= homeoDamping;
      if (network.dormantTraitMask?.[idx] === 1) {
        if (network.isDormantNode?.[idx] === 1) {
          const dormantSuppression = 0.78 + Math.min(network.dormantWakePressure?.[idx] ?? 0, 1.0) * 0.08;
          nextVal *= dormantSuppression;
        } else {
          const wakeLift = Math.min(network.dormantWakePressure?.[idx] ?? 0, 1.0) * 0.05;
          nextVal += wakeLift * (network.nodeSign[idx] >= 0 ? 1 : -0.6);
        }
      }
      if (nextVal > 8.0) nextVal = 8.0 + (nextVal - 8.0) * 0.01;
      if (nextVal < -8.0) nextVal = -8.0 + (nextVal + 8.0) * 0.01;
      network.nextBuffer[idx] = nextVal;
    }
  }

  const temp = network.prevBuffer;
  network.prevBuffer = network.currentBuffer;
  network.currentBuffer = network.nextBuffer;
  network.nextBuffer = temp;
  return { arousal, freqRatio };
}
