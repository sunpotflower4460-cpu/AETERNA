/* eslint-disable @typescript-eslint/no-explicit-any */
// N6: PHI_INV and SCHUMANN_RES are only imported for the legacy code path.
// In neutral mode (default), these constants are NOT used as causal ingredients.
// See docs/external-constants-removal.md
import { PHI_INV, SCHUMANN_RES, GAMMA_SYNC } from '../constants/aeternaConstants.js';
import { state } from '../organism/state.js';
import { getHardwareRandomFloat, hasHardwareRandomSource } from './hardwareRandom.ts';
import { getLivingStateInfluence } from '../organism/livingState.ts';
import { defaultCoreDynamicsConstantsConfig } from '../config/coreDynamicsConstantsConfig.ts';
import type { CoreDynamicsConstantsConfig } from '../config/coreDynamicsConstantsConfig.ts';
import {
  ensureSinkField,
  decayWithSink,
  decayAllFourWeightsWithSink,
} from './dynamicCoreNamedDestinations.ts';
import { applyLegacyBaselineOscillator } from './legacyBaselineOscillator.ts';
import { deriveEmergentBaselineFromSubstrate } from './emergentBaselineFromSubstrate.ts';

export function triggerNoise(network: any, tension: number, sigmaDisp: number) {
  const thermalRate = state.disk.omega_t > 30 ? 0.02 : 0.05;
  const eventRate = tension * 0.2 + Math.abs(sigmaDisp - 1.0) * 0.1;
  const finalRate = network.clampFinite(thermalRate + eventRate, 0, 1, 0);
  network.hardwareRandomNoiseSource = hasHardwareRandomSource() ? 'crypto' : 'fallback';
  // v4.3-b: source-side budget tracking for noise injection into currentBuffer.
  // v4.3-c: when `network.substrateBackedNoiseInjection` is enabled and a
  // `network.localConservationSubstrate` is attached, noise injection is
  // bounded per-cell by substrate.storageField availability. Injection cannot
  // exceed energy actually on hand. When the flag is off (default), behavior
  // matches v4.3-b exactly: hardware random noise injects unconditionally.
  const noiseInjectionConsumed = ensureSinkField(network, 'noiseInjectionConsumedField', network.numNodes);
  const noiseInjectionUngranted = ensureSinkField(network, 'noiseInjectionUngrantedField', network.numNodes);
  const substrateBacked: boolean = !!network.substrateBackedNoiseInjection;
  const substrateState = substrateBacked ? network.localConservationSubstrate : null;
  const substrateStorageField: Float64Array | null =
    substrateState && substrateState.storageField instanceof Float64Array
      ? substrateState.storageField
      : null;

  let injectedMagnitude = 0;
  let injectedEvents = 0;
  let ungrantedMagnitude = 0;
  for (let i = 0; i < 3; i++) {
    if (getHardwareRandomFloat() < finalRate) {
      const index = Math.floor(getHardwareRandomFloat() * network.numNodes);
      const wanted = 1.0 + getHardwareRandomFloat();
      let granted = wanted;
      if (substrateBacked && substrateStorageField) {
        const available = substrateStorageField[index];
        const safeAvail = Number.isFinite(available) ? Math.max(0, available) : 0;
        granted = Math.min(wanted, safeAvail);
        if (granted > 0) {
          substrateStorageField[index] = safeAvail - granted;
        }
        const miss = wanted - granted;
        if (miss > 0) {
          noiseInjectionUngranted[index] += miss;
          ungrantedMagnitude += miss;
        }
      }
      if (granted > 0) {
        network.currentBuffer[index] += granted;
        noiseInjectionConsumed[index] += granted;
        injectedMagnitude += granted;
        injectedEvents++;
      }
    }
  }
  network.lastNoiseMagnitude = injectedMagnitude;
  network.lastNoiseEventCount = injectedEvents;
  network.lastNoiseUngrantedMagnitude = ungrantedMagnitude;
}

/**
 * updateBaseline
 *
 * v4.4 dispatcher.
 *
 * When `network.emergentBaselineFromSubstrate === true`, baselineActivity is
 * READ from network.localConservationSubstrate.storageField — a pure
 * observation-only path with no time-driven oscillator.
 *
 * Otherwise the legacy time-driven oscillator path runs. The legacy
 * implementation has been moved to legacyBaselineOscillator.ts so that this
 * source file no longer contains the forbidden time-function and amplitude
 * literals that the energy-realness principles document calls out as
 * "life-like baseline oscillator". The legacy numeric trajectory is
 * preserved exactly when the legacy path is invoked.
 */
export function updateBaseline(network: any) {
  if (network.emergentBaselineFromSubstrate === true) {
    const scaleOption = network.emergentBaselineSubstrateScale;
    deriveEmergentBaselineFromSubstrate(network, {
      substrateScale: typeof scaleOption === 'number' ? scaleOption : 1.0,
    });
    return;
  }
  applyLegacyBaselineOscillator(network);
}

export function updateResidue(network: any) {
  const RESIDUE_DECAY = 0.97;
  const RESIDUE_INTAKE = 0.02;
  const modeResidueOffset = network.currentModeDynamics?.residueDecayOffset ?? 0;

  // Phase 2: Apply living state influence to residue
  const livingInfluence = network.livingState ? getLivingStateInfluence(network.livingState) : { residueGainModifier: 1.0 };

  // v4.3-b: name the destination of residue decay loss and the clamp-loss bucket.
  // The numeric trajectory of activityResidue is unchanged; we additionally
  // record where the energy that "left" each cell went.
  const residueDecaySink = ensureSinkField(network, 'residueDecayField', network.numNodes);
  const residueClampLossSink = ensureSinkField(network, 'residueClampLossField', network.numNodes);

  for (let i = 0; i < network.numNodes; i++) {
    const persistenceBias = network.priorChannels.persistence[i]; // direct behavioral dependency; target for weakening in Phase C
    const decay = network.clampFinite(RESIDUE_DECAY + persistenceBias * 0.01, 0.97, 0.995, RESIDUE_DECAY);
    const intake = network.clampFinite(RESIDUE_INTAKE + persistenceBias * 0.004, RESIDUE_INTAKE, 0.03, RESIDUE_INTAKE);
    const modeDecayTarget = decay + modeResidueOffset;
    const modeDecay = network.clampFinite(modeDecayTarget, 0.94, 0.995, modeDecayTarget);

    // Apply living state residue bias to intake
    const adjustedIntake = intake * livingInfluence.residueGainModifier;

    const beforeResidue = network.activityResidue[i];
    const decayDelta = beforeResidue * (1 - modeDecay);
    const intakeDelta = network.spikeTrace[i] * adjustedIntake;
    // Keep the exact original float expression to preserve the numeric trajectory.
    const preClamp = beforeResidue * modeDecay + intakeDelta;
    const clamped = network.clampFinite(preClamp, 0, 1.25, 0);
    network.activityResidue[i] = clamped;

    residueDecaySink[i] += decayDelta;
    const clampLoss = preClamp - clamped;
    if (clampLoss !== 0) {
      residueClampLossSink[i] += clampLoss;
    }
  }
}

export function updateBaselineAndResidue(network: any) {
  const BASELINE_GAIN = 0.4;
  const RESIDUE_GAIN = 0.005;
  updateBaseline(network);
  updateResidue(network);
  // v4.3-b: track the magnitude flowing from baselineActivity and activityResidue
  // into currentBuffer per cell. baselineActivity is an external-generator-shaped
  // source (handled fully in v4.4); activityResidue is an internal trace whose
  // contribution is sampled (not depleted), so this is bookkeeping only.
  const baselineInjectionConsumed = ensureSinkField(network, 'baselineInjectionConsumedField', network.numNodes);
  const residueInjectionConsumed = ensureSinkField(network, 'residueInjectionConsumedField', network.numNodes);
  let baselineSum = 0;
  let residueSum = 0;
  for (let i = 0; i < network.numNodes; i++) {
    const baselineContribution = network.baselineActivity[i] * BASELINE_GAIN;
    const residueContribution = network.activityResidue[i] * RESIDUE_GAIN;
    network.currentBuffer[i] += baselineContribution + residueContribution;
    baselineInjectionConsumed[i] += baselineContribution;
    residueInjectionConsumed[i] += residueContribution;
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
  // v4.3-b: source-side accounting for prediction-error injection. Numeric
  // trajectory of currentBuffer is unchanged; we additionally record the
  // signed magnitudes drawn from the external prediction-error generator.
  const predictionErrorInjectionConsumed = ensureSinkField(
    network,
    'predictionErrorInjectionConsumedField',
    network.numNodes,
  );
  const centerDelta = error * 0.8;
  network.currentBuffer[index] += centerDelta;
  predictionErrorInjectionConsumed[index] += centerDelta;
  const i = Math.floor(index / network.segments);
  const j = index % network.segments;
  const up = ((i - 1 + network.segments) % network.segments) * network.segments + j;
  const down = ((i + 1) % network.segments) * network.segments + j;
  const left = i * network.segments + ((j - 1 + network.segments) % network.segments);
  const right = i * network.segments + ((j + 1) % network.segments);
  const neighborDelta = error * 0.4;
  network.currentBuffer[up] += neighborDelta;
  network.currentBuffer[down] += neighborDelta;
  network.currentBuffer[left] += neighborDelta;
  network.currentBuffer[right] += neighborDelta;
  predictionErrorInjectionConsumed[up] += neighborDelta;
  predictionErrorInjectionConsumed[down] += neighborDelta;
  predictionErrorInjectionConsumed[left] += neighborDelta;
  predictionErrorInjectionConsumed[right] += neighborDelta;
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

/**
 * Resolve the CoreDynamicsConstantsConfig to use for this update cycle.
 * Reads from network.coreDynamicsConstantsConfig if present; otherwise uses the
 * module-level default (neutral mode).
 */
function resolveCoreDynamicsConfig(network: any): CoreDynamicsConstantsConfig {
  return network.coreDynamicsConstantsConfig ?? defaultCoreDynamicsConstantsConfig;
}

export function updateDynamicsCore(network: any) {
  const cfg = resolveCoreDynamicsConfig(network);

  let freqRatio: number;
  let waveSpeed: number;
  let damping: number;

  if (cfg.externalConstantsMode === 'legacy' && cfg.allowLegacyExternalConstants) {
    // Legacy comparison mode: restores pre-N6 behaviour using external constants.
    // For before/after comparison only. Do NOT use as the production default.
    freqRatio = (state.disk.omega_t - SCHUMANN_RES) / (GAMMA_SYNC - SCHUMANN_RES);
    waveSpeed = 0.1 + 0.15 * freqRatio;
    damping = 0.985 - (1.0 - PHI_INV) * 0.02 * (1.0 - freqRatio);
  } else {
    // Neutral mode (default): core dynamics use only explicit config parameters.
    // No external constant names (PHI_INV, SCHUMANN_RES) are used as causal factors.
    const rangeSpan = Math.max(cfg.freqRangeMax - cfg.freqRangeMin, 1e-6);
    freqRatio = Math.max(0, Math.min(1, (state.disk.omega_t - cfg.freqRangeMin) / rangeSpan));
    waveSpeed = cfg.waveSpeedBase + cfg.waveSpeedFreqScale * freqRatio;
    damping = cfg.dampingBase - cfg.dampingLoss * (1.0 - freqRatio);
  }

  // Phase E2: Apply top-down threshold modulation
  const thresholdDelta = network.topDownModulation?.thresholdDelta ?? 0;
  const baseThreshold = 0.8;
  const modulatedThreshold = baseThreshold + thresholdDelta;
  const clampedThreshold = Math.max(0.6, Math.min(1.0, modulatedThreshold));

  // v4.3-b / v4.3-c: name the destinations for spikeTrace decay and weight decay.
  // The actual `*= k` operations are now hidden inside decayWithSink /
  // decayAllFourWeightsWithSink helpers. The helpers perform `field[i] =
  // field[i] * k` (bit-exact IEEE 754 preservation of the prior trajectory)
  // and route the implied `before * (1 - k)` loss into the named sink.
  const spikeDecaySink = ensureSinkField(network, 'spikeDecayField', network.numNodes);
  const weightDecaySink = ensureSinkField(network, 'weightDecayField', network.numNodes);
  const SPIKE_TRACE_DECAY_K = network.SPIKE_TRACE_DECAY_K ?? 0.9;
  const WEIGHT_DECAY_K = network.WEIGHT_DECAY_K ?? 0.99995;

  let newlyFiredCount = 0;
  for (let i = 0; i < network.numNodes; i++) {
    const dormantThreshold = network.dormantTraitMask?.[i] === 1 && network.isDormantNode?.[i] === 1 ? 1.05 : clampedThreshold;
    if (network.currentBuffer[i] > dormantThreshold && network.prevBuffer[i] <= dormantThreshold) {
      network.spikeTrace[i] = 1.0;
      network.lastSpikeTime[i] = network.simTime;
      newlyFiredCount++;
    } else {
      decayWithSink(network.spikeTrace, i, SPIKE_TRACE_DECAY_K, spikeDecaySink);
    }
  }

  for (let i = 0; i < network.numNodes; i++) {
    decayAllFourWeightsWithSink(
      network.w_up,
      network.w_down,
      network.w_left,
      network.w_right,
      i,
      WEIGHT_DECAY_K,
      weightDecaySink,
    );
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
