import {
  MODE_AROUSAL_NORM,
  MODE_PREDICTION_NORM,
  ORGANISM_HISTORY_LIMIT,
  ORGANISM_UPDATE_SMOOTHING,
} from '../core/aeternaTuning.ts';

export function recordOrganismSnapshot(network: any) {
  network.organismStateHistory.unshift({
    time: network.simTime,
    energy: network.energy,
    stability: network.stability,
    overload: network.overload,
    restDrive: network.restDrive,
    orientingDrive: network.orientingDrive,
  });
  if (network.organismStateHistory.length > ORGANISM_HISTORY_LIMIT) network.organismStateHistory.pop();
}

export function getOrganismDebugSummary(network: any) {
  return {
    energy: network.energy,
    stability: network.stability,
    overload: network.overload,
    restDrive: network.restDrive,
    orientingDrive: network.orientingDrive,
    comfortBias: network.comfortBias,
  };
}

export function updateOrganismState(network: any, {
  activeTouchCount = 0,
  meanRawTouch = 0,
  meanTouchOnset = 0,
  meanTouchNovelty = 0,
  meanTouchTrace = 0,
  arousal = 0,
  meanPredictionError = 0,
  residueLevel = 0,
  rewritePressureMean = 0,
  globalRewriteLoad = 0,
} = {}) {
  const activeTouch = activeTouchCount > 0 ? 1 : 0;
  const noveltyLevel = network.clamp01(meanTouchNovelty * 8 + network.touchPatternScores.tap * 0.16 + network.touchPatternScores.stroke * 0.1, 0);
  const gentleContact = network.clamp01(activeTouch * 0.1 + meanRawTouch * 0.35 + network.touchPatternScores.hold * 0.32 + meanTouchTrace * 0.08 - network.touchPatternScores.tap * 0.06, 0);
  const repeatIntensity = network.clamp01(network.touchPatternScores.repeat * 0.8 + network.touchPatternScores.tap * 0.25, 0);
  const arousalNorm = network.clamp01(arousal * MODE_AROUSAL_NORM, 0);
  const predictionNorm = network.clamp01(meanPredictionError * MODE_PREDICTION_NORM, 0);
  const quietness = network.clamp01((1 - activeTouch) * 0.35 + (1 - network.clamp01(meanRawTouch * 5, 0)) * 0.2 + (1 - arousalNorm) * 0.25 + (1 - noveltyLevel) * 0.2, 0);

  const overloadRise = predictionNorm * 0.16 + noveltyLevel * 0.14 + repeatIntensity * 0.08 + globalRewriteLoad * 0.05 + rewritePressureMean * 0.6;
  const overloadRelease = 0.025 + quietness * 0.035 + network.stability * 0.02 + (network.actionState === 'settle' ? network.actionPulseLevel * 0.08 : 0);
  network.overload = network.clamp01(network.overload * 0.95 + overloadRise - overloadRelease, network.overload);

  const energyTarget = network.clamp01(0.42 + quietness * 0.22 + network.stability * 0.12 + gentleContact * 0.06 - arousalNorm * 0.14 - network.overload * 0.24 - globalRewriteLoad * 0.08 - network.actionPulseLevel * 0.05, network.energy);
  const stabilityTarget = network.clamp01(0.38 + quietness * 0.18 + gentleContact * 0.18 + residueLevel * 0.06 - network.overload * 0.26 - predictionNorm * 0.12 - repeatIntensity * 0.08, network.stability);
  const restTarget = network.clamp01(0.12 + (1 - network.energy) * 0.42 + network.overload * 0.34 + (1 - network.stability) * 0.12 - activeTouch * 0.06, network.restDrive);
  const orientTarget = network.clamp01(0.08 + noveltyLevel * 0.34 + activeTouch * 0.18 + network.touchPatternScores.stroke * 0.12 + meanTouchOnset * 0.7 - quietness * 0.18 - network.overload * 0.12, network.orientingDrive);

  network.energy = network.clamp01(network.energy * (1 - ORGANISM_UPDATE_SMOOTHING) + energyTarget * ORGANISM_UPDATE_SMOOTHING, network.energy);
  network.stability = network.clamp01(network.stability * (1 - ORGANISM_UPDATE_SMOOTHING) + stabilityTarget * ORGANISM_UPDATE_SMOOTHING, network.stability);
  network.restDrive = network.clamp01(network.restDrive * (1 - ORGANISM_UPDATE_SMOOTHING) + restTarget * ORGANISM_UPDATE_SMOOTHING, network.restDrive);
  network.orientingDrive = network.clamp01(network.orientingDrive * (1 - ORGANISM_UPDATE_SMOOTHING) + orientTarget * ORGANISM_UPDATE_SMOOTHING, network.orientingDrive);
  network.comfortBias = network.clamp01(network.comfortBias * 0.92 + (quietness * 0.45 + network.stability * 0.35 + gentleContact * 0.2 - network.overload * 0.25) * 0.08, network.comfortBias);

  if (network.simTime % 30 === 0) recordOrganismSnapshot(network);
  return getOrganismDebugSummary(network);
}
