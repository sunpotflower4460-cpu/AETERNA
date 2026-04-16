import { state } from './state.js';
import {
  MODE_DRIVE_SMOOTHING,
  MODE_DREAM_REPLAY_GATE,
  MODE_DREAM_REPLAY_LIMIT,
  MODE_DREAM_REPLAY_NODE_LIMIT,
  MODE_DREAM_THRESHOLD,
  MODE_DYNAMICS,
  MODE_EXTERNAL_QUIET_GATE,
  MODE_HYSTERESIS,
  MODE_TRACE_HISTORY_LIMIT,
  MODE_QUIET_TIME_FRAMES,
  MODE_AROUSAL_NORM,
  MODE_PREDICTION_NORM,
  MODE_SIGMA_DRIFT_NORM,
  MODE_RESIDUE_NORM,
  MODE_TRACE_NORM,
  MODE_PRIOR_NORM,
  MODE_REWRITE_PRESSURE_NORM,
  MODE_RECENT_REWRITE_NORM,
  MODE_SLEEP_THRESHOLD,
  MODE_TRANSITION_COOLDOWN,
  MODE_WAKE_THRESHOLD,
  REWRITE_COOLDOWN_FRAMES,
  REWRITE_PRIOR_LIMIT,
} from '../core/aeternaTuning.ts';

export function getModeDebugSummary(network: any) {
  return {
    modeState: network.modeState,
    modePhase: network.modePhase,
    wakeDrive: network.wakeDrive,
    sleepPressure: network.sleepPressure,
    dreamPressure: network.dreamPressure,
    modeConfidence: network.modeConfidence,
    lastModeChangeTime: network.lastModeChangeTime,
    lastModeChangeFrames: Math.max(network.simTime - network.lastModeChangeTime, 0),
    dreamReplayActive: network.dreamReplayActive,
    dreamReplayStrength: network.dreamReplayStrength,
  };
}

export function noteModeTransition(network: any, nextMode: string) {
  network.modeState = nextMode;
  network.lastModeChangeTime = network.simTime;
  network.modeTrace.unshift({ mode: nextMode, time: network.simTime });
  if (network.modeTrace.length > MODE_TRACE_HISTORY_LIMIT) network.modeTrace.pop();
}

export function updateModeState(network: any, {
  activeTouchCount = 0,
  meanRawTouch = 0,
  meanTouchOnset = 0,
  meanTouchNovelty = 0,
  arousal = 0,
  meanPredictionError = 0,
  sigmaDisplay = 1,
  tension = 0,
  residueLevel = 0,
  traceLevel = 0,
  priorBiasMean = 0,
  rewritePressureMean = 0,
  recentRewriteMean = 0,
} = {}) {
  const touchPresence = activeTouchCount > 0 ? 1 : 0;
  const externalLevel = network.clampFinite(touchPresence * 0.45 + meanRawTouch * 0.9 + meanTouchOnset * 0.7 + meanTouchNovelty * 0.45, 0, 1, 0);
  if (externalLevel < MODE_EXTERNAL_QUIET_GATE) network.externalQuietFrames += 1;
  else network.externalQuietFrames = 0;

  const quietTime = network.clampFinite(network.externalQuietFrames / MODE_QUIET_TIME_FRAMES, 0, 1, 0);
  const arousalNorm = network.clampFinite(arousal * MODE_AROUSAL_NORM, 0, 1, 0);
  const predictionNorm = network.clampFinite(meanPredictionError * MODE_PREDICTION_NORM, 0, 1, 0);
  const sigmaDrift = network.clampFinite(Math.abs(sigmaDisplay - 1.0) * MODE_SIGMA_DRIFT_NORM, 0, 1, 0);
  const tensionNorm = network.clampFinite(tension, 0, 1, 0);
  const residueNorm = network.clampFinite(residueLevel * MODE_RESIDUE_NORM, 0, 1, 0);
  const traceNorm = network.clampFinite(traceLevel * MODE_TRACE_NORM, 0, 1, 0);
  const priorNorm = network.clampFinite(priorBiasMean * MODE_PRIOR_NORM, 0, 1, 0);
  const rewriteNorm = network.clampFinite(rewritePressureMean * MODE_REWRITE_PRESSURE_NORM + recentRewriteMean * MODE_RECENT_REWRITE_NORM, 0, 1, 0);
  const quietness = network.clampFinite((1.0 - externalLevel) * 0.5 + (1.0 - arousalNorm) * 0.3 + (1.0 - tensionNorm) * 0.2, 0, 1, 0);
  const ember = network.clampFinite(residueNorm * 0.34 + traceNorm * 0.24 + priorNorm * 0.22 + rewriteNorm * 0.2, 0, 1, 0);
  const organismEnergy = network.clamp01(network.energy, 0);
  const organismStability = network.clamp01(network.stability, 0);
  const organismOverload = network.clamp01(network.overload, 0);
  const organismRest = network.clamp01(network.restDrive, 0);
  const organismOrient = network.clamp01(network.orientingDrive, 0);

  const wakeTarget = network.clampFinite(
    0.12 + externalLevel * 0.42 + arousalNorm * 0.16 + predictionNorm * 0.12 + tensionNorm * 0.1 + sigmaDrift * 0.08 + organismOrient * 0.12 - organismRest * 0.05 - organismOverload * 0.04,
    0,
    1,
    0,
  );
  const sleepTarget = network.clampFinite(
    0.08 + quietTime * 0.42 + quietness * 0.26 + (1.0 - ember) * 0.12 - externalLevel * 0.18 + organismRest * 0.16 + organismOverload * 0.1 + (1.0 - organismEnergy) * 0.08,
    0,
    1,
    0,
  );
  const dreamTarget = network.clampFinite(
    0.06 + quietTime * 0.24 + quietness * 0.12 + ember * 0.44 + rewriteNorm * 0.08 - externalLevel * 0.22 + organismStability * 0.06 + residueNorm * 0.04 - organismOverload * 0.02,
    0,
    1,
    0,
  );

  network.wakeDrive = network.clampFinite(network.wakeDrive * (1 - MODE_DRIVE_SMOOTHING) + wakeTarget * MODE_DRIVE_SMOOTHING, 0, 1, 0);
  network.sleepPressure = network.clampFinite(network.sleepPressure * (1 - MODE_DRIVE_SMOOTHING) + sleepTarget * MODE_DRIVE_SMOOTHING, 0, 1, 0);
  network.dreamPressure = network.clampFinite(network.dreamPressure * (1 - MODE_DRIVE_SMOOTHING) + dreamTarget * MODE_DRIVE_SMOOTHING, 0, 1, 0);

  const scores = { wake: network.wakeDrive, sleep: network.sleepPressure, dream: network.dreamPressure };
  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topMode, topScore] = ordered[0];
  const [, secondScore] = ordered[1];
  network.modeConfidence = network.clampFinite(topScore - secondScore, 0, 1, 0);

  const cooldownElapsed = network.simTime - network.lastModeChangeTime;
  const currentScore = scores[network.modeState] ?? 0;
  const thresholdMet = (topMode === 'wake' && topScore >= MODE_WAKE_THRESHOLD)
    || (topMode === 'sleep' && topScore >= MODE_SLEEP_THRESHOLD)
    || (topMode === 'dream' && topScore >= MODE_DREAM_THRESHOLD);

  if (topMode !== network.modeState && cooldownElapsed >= MODE_TRANSITION_COOLDOWN && thresholdMet && topScore > currentScore + MODE_HYSTERESIS) {
    noteModeTransition(network, topMode);
  }

  network.modePhase = (network.modePhase + 0.004 + topScore * 0.01) % 1;
  network.currentModeDynamics = MODE_DYNAMICS[network.modeState] ?? MODE_DYNAMICS.wake;
  return getModeDebugSummary(network);
}

export function applyDreamReplay(network: any, externalLevel: number) {
  network.dreamReplayActive = false;
  network.dreamReplayStrength = 0;
  if (network.modeState !== 'dream') return;
  if (network.dreamPressure < MODE_DREAM_THRESHOLD - 0.05) return;
  if (externalLevel > MODE_EXTERNAL_QUIET_GATE) return;
  const replayCandidates = [];
  for (let i = 0; i < network.numNodes; i++) {
    const residueSeed = network.clampFinite(network.activityResidue[i] / 1.25, 0, 1, 0);
    const traceSeed = network.clampFinite(network.touchTrace[i] / 4.0, 0, 1, 0);
    const priorSeed = network.clampFinite(network.priorBias[i] / REWRITE_PRIOR_LIMIT, 0, 1, 0);
    const rewriteSeed = network.clampFinite(network.recentRewriteMask[i] / REWRITE_COOLDOWN_FRAMES, 0, 1, 0);
    const score = residueSeed * 0.34 + traceSeed * 0.28 + priorSeed * 0.22 + rewriteSeed * 0.16;
    if (score >= MODE_DREAM_REPLAY_GATE) replayCandidates.push({ index: i, score });
  }
  replayCandidates.sort((a, b) => b.score - a.score);
  const replayGain = network.currentModeDynamics?.replayGain ?? 1.0;
  const chosen = replayCandidates.slice(0, MODE_DREAM_REPLAY_NODE_LIMIT);
  for (const candidate of chosen) {
    const replay = network.clampFinite(candidate.score * network.dreamPressure * replayGain * 0.03, 0, MODE_DREAM_REPLAY_LIMIT, 0);
    if (replay <= 0) continue;
    const idx = candidate.index;
    network.activityResidue[idx] = network.clampFinite(network.activityResidue[idx] + replay * 0.7, 0, 1.25, 0);
    network.touchProjection[idx] = network.clampFinite(network.touchProjection[idx] + replay * 0.5, -4.0, 4.0, 0);
    network.localPrediction[idx] = network.clampFinite(network.localPrediction[idx] + network.priorBias[idx] * replay * 0.08, -8.0, 8.0, 0);
    network.dreamReplayStrength += replay;
  }
  network.dreamReplayActive = network.dreamReplayStrength > 0;
  network.dreamReplayStrength = network.clampFinite(network.dreamReplayStrength, 0, MODE_DREAM_REPLAY_LIMIT * MODE_DREAM_REPLAY_NODE_LIMIT, 0);
}
