import type { SoundPerceptPacket } from '../types/packets.js';

const FFT_SIZE = 256;
const SOUND_ACTIVE_LEVEL_THRESHOLD = 0.035;
const SOUND_ACTIVE_BAND_THRESHOLD = 0.045;
const LOW_BAND_HZ = 250;
const MID_BAND_HZ = 2000;

type BandProfile = [number, number, number];
type SoundSignature = [number, number, number, number];

interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export interface SoundFeatureFrame {
  level: number;
  bandLow: number;
  bandMid: number;
  bandHigh: number;
}

export interface SoundObservationState {
  previousLevel: number;
  previousProfile: BandProfile;
  previousCentroid: number;
  quietFrames: number;
  anchorSignature: SoundSignature | null;
  recentActiveSignature: SoundSignature | null;
  packet: SoundPerceptPacket;
}

export interface SoundSensoryController extends SoundObservationState {
  status: 'idle' | 'pending' | 'ready' | 'blocked';
  requested: boolean;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  source: MediaStreamAudioSourceNode | null;
  stream: MediaStream | null;
  timeBuffer: Uint8Array | null;
  frequencyBuffer: Uint8Array | null;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function createSilentPacket(): SoundPerceptPacket {
  return {
    level: 0,
    delta: 0,
    bandLow: 0,
    bandMid: 0,
    bandHigh: 0,
    novelty: 0,
    persistence: 0,
    recurrence: 0,
    directionality: 0,
    active: false,
  };
}

export function createInitialSoundObservationState(): SoundObservationState {
  return {
    previousLevel: 0,
    previousProfile: [0, 0, 0],
    previousCentroid: 0,
    quietFrames: 0,
    anchorSignature: null,
    recentActiveSignature: null,
    packet: createSilentPacket(),
  };
}

export function createSoundSensoryController(): SoundSensoryController {
  return {
    ...createInitialSoundObservationState(),
    status: 'idle',
    requested: false,
    audioContext: null,
    analyser: null,
    source: null,
    stream: null,
    timeBuffer: null,
    frequencyBuffer: null,
  };
}

function averageAbsoluteDifference(left: number[], right: number[]) {
  let sum = 0;
  const length = Math.min(left.length, right.length);
  if (length === 0) return 0;
  for (let i = 0; i < length; i++) {
    sum += Math.abs(left[i] - right[i]);
  }
  return sum / length;
}

function blendSignature(previous: SoundSignature | null, next: SoundSignature): SoundSignature {
  if (!previous) return next;
  return [
    previous[0] * 0.72 + next[0] * 0.28,
    previous[1] * 0.72 + next[1] * 0.28,
    previous[2] * 0.72 + next[2] * 0.28,
    previous[3] * 0.72 + next[3] * 0.28,
  ];
}

export function updateSoundObservationState(
  state: SoundObservationState,
  features: SoundFeatureFrame,
): SoundObservationState {
  const level = clamp01(features.level);
  const bandLow = clamp01(features.bandLow);
  const bandMid = clamp01(features.bandMid);
  const bandHigh = clamp01(features.bandHigh);
  const bandTotal = bandLow + bandMid + bandHigh;
  const profile: BandProfile = bandTotal > 0.000001
    ? [bandLow / bandTotal, bandMid / bandTotal, bandHigh / bandTotal]
    : [0, 0, 0];
  const centroid = bandTotal > 0.000001
    ? clamp01(profile[1] * 0.5 + profile[2])
    : 0;
  const delta = level - state.previousLevel;
  const deltaMagnitude = Math.abs(delta);
  const bandShift = averageAbsoluteDifference(profile, state.previousProfile);
  const active = level >= SOUND_ACTIVE_LEVEL_THRESHOLD
    || Math.max(bandLow, bandMid, bandHigh) >= SOUND_ACTIVE_BAND_THRESHOLD;
  const justActivated = active && !state.packet.active;
  const justDeactivated = !active && state.packet.active;
  const signature: SoundSignature = [level, profile[0], profile[1], profile[2]];
  const similarity = state.anchorSignature
    ? clamp01(1 - averageAbsoluteDifference(signature, state.anchorSignature))
    : 0;
  const recurrenceInstant = justActivated && similarity > 0.72
    ? clamp01((similarity - 0.72) / 0.28)
    : 0;
  const noveltyInstant = clamp01(
    Math.max(delta, 0) * 3.2
      + bandShift * 1.9
      + (justActivated ? level * 0.9 : 0),
  );
  const persistenceTarget = active
    ? clamp01(level * 0.75 + bandTotal * 0.15 + Math.max(0, 0.14 - deltaMagnitude))
    : 0;
  const directionalityInstant = clamp01(Math.abs(centroid - state.previousCentroid) * 2.2);
  const quietFrames = active ? 0 : state.quietFrames + 1;
  const recentActiveSignature = active
    ? blendSignature(state.recentActiveSignature, signature)
    : state.recentActiveSignature;
  const anchorSignature = justDeactivated
    ? recentActiveSignature
    : active
      ? state.anchorSignature
      : state.anchorSignature;
  return {
    previousLevel: level,
    previousProfile: profile,
    previousCentroid: centroid,
    quietFrames,
    anchorSignature,
    recentActiveSignature,
    packet: {
      level,
      delta,
      bandLow,
      bandMid,
      bandHigh,
      novelty: active
        ? clamp01(state.packet.novelty * 0.68 + noveltyInstant * 0.32)
        : clamp01(state.packet.novelty * 0.82),
      persistence: active
        ? clamp01(state.packet.persistence * 0.88 + persistenceTarget * 0.12)
        : clamp01(state.packet.persistence * 0.84),
      recurrence: clamp01(state.packet.recurrence * 0.86 + recurrenceInstant * 0.14),
      directionality: clamp01(state.packet.directionality * 0.8 + directionalityInstant * 0.2),
      active,
    },
  };
}

function getAudioContextConstructor() {
  if (typeof window === 'undefined') return null;
  const browserWindow = window as WindowWithWebkitAudioContext;
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext ?? null;
}

function requestSoundInput(controller: SoundSensoryController) {
  if (controller.requested || typeof navigator === 'undefined') return;
  if (!navigator.mediaDevices?.getUserMedia) {
    controller.status = 'blocked';
    controller.requested = true;
    return;
  }
  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) {
    controller.status = 'blocked';
    controller.requested = true;
    return;
  }

  controller.requested = true;
  controller.status = 'pending';
  const audioContext = new AudioContextConstructor();
  controller.audioContext = audioContext;

  void navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: false,
      echoCancellation: false,
      noiseSuppression: false,
    },
  }).then((stream) => {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.6;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    controller.stream = stream;
    controller.source = source;
    controller.analyser = analyser;
    controller.timeBuffer = new Uint8Array(analyser.fftSize);
    controller.frequencyBuffer = new Uint8Array(analyser.frequencyBinCount);
    controller.status = 'ready';
  }).catch(() => {
    controller.status = 'blocked';
  });
}

function readSoundFeatureFrame(controller: SoundSensoryController): SoundFeatureFrame {
  const { analyser, frequencyBuffer, timeBuffer, audioContext } = controller;
  if (!analyser || !frequencyBuffer || !timeBuffer || !audioContext) {
    return { level: 0, bandLow: 0, bandMid: 0, bandHigh: 0 };
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch(() => undefined);
  }

  analyser.getByteTimeDomainData(timeBuffer);
  analyser.getByteFrequencyData(frequencyBuffer);

  let rmsSum = 0;
  for (let i = 0; i < timeBuffer.length; i++) {
    const centered = (timeBuffer[i] - 128) / 128;
    rmsSum += centered * centered;
  }
  const level = clamp01(Math.sqrt(rmsSum / timeBuffer.length) * 4);

  const binWidth = (audioContext.sampleRate / 2) / frequencyBuffer.length;
  let lowSum = 0;
  let midSum = 0;
  let highSum = 0;
  let lowCount = 0;
  let midCount = 0;
  let highCount = 0;

  for (let i = 0; i < frequencyBuffer.length; i++) {
    const value = frequencyBuffer[i] / 255;
    const frequency = i * binWidth;
    if (frequency < LOW_BAND_HZ) {
      lowSum += value;
      lowCount += 1;
    } else if (frequency < MID_BAND_HZ) {
      midSum += value;
      midCount += 1;
    } else {
      highSum += value;
      highCount += 1;
    }
  }

  return {
    level,
    bandLow: lowCount > 0 ? clamp01(lowSum / lowCount) : 0,
    bandMid: midCount > 0 ? clamp01(midSum / midCount) : 0,
    bandHigh: highCount > 0 ? clamp01(highSum / highCount) : 0,
  };
}

export function updateSoundSensory(controller: SoundSensoryController): SoundSensoryController {
  requestSoundInput(controller);
  const nextState = updateSoundObservationState(controller, readSoundFeatureFrame(controller));
  Object.assign(controller, nextState);
  return controller;
}
