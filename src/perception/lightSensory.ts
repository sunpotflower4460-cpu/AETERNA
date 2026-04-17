import type { LightPerceptPacket } from '../types/packets.js';

const SAMPLE_WIDTH = 32;
const SAMPLE_HEIGHT = 32;
const LIGHT_ACTIVE_THRESHOLD = 0.05;

export interface LightFeatureFrame {
  level: number;
}

export interface LightObservationState {
  previousLevel: number;
  quietFrames: number;
  anchorLevel: number | null;
  packet: LightPerceptPacket;
}

export interface LightSensoryController extends LightObservationState {
  status: 'idle' | 'pending' | 'ready' | 'blocked';
  requested: boolean;
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  stream: MediaStream | null;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function createDarkPacket(): LightPerceptPacket {
  return {
    level: 0,
    delta: 0,
    novelty: 0,
    persistence: 0,
    recurrence: 0,
    directionality: 0,
    active: false,
  };
}

export function createInitialLightObservationState(): LightObservationState {
  return {
    previousLevel: 0,
    quietFrames: 0,
    anchorLevel: null,
    packet: createDarkPacket(),
  };
}

export function createLightSensoryController(): LightSensoryController {
  return {
    ...createInitialLightObservationState(),
    status: 'idle',
    requested: false,
    video: null,
    canvas: null,
    ctx: null,
    stream: null,
  };
}

export function updateLightObservationState(
  state: LightObservationState,
  features: LightFeatureFrame,
): LightObservationState {
  const level = clamp01(features.level);
  const delta = level - state.previousLevel;
  const deltaMagnitude = Math.abs(delta);
  const active = level >= LIGHT_ACTIVE_THRESHOLD;
  const justActivated = active && !state.packet.active;
  const justDeactivated = !active && state.packet.active;

  const anchorLevel = justDeactivated ? state.previousLevel : state.anchorLevel;
  const similarity = anchorLevel !== null
    ? clamp01(1 - Math.abs(level - anchorLevel) * 2)
    : 0;
  const recurrenceInstant = justActivated && similarity > 0.72
    ? clamp01((similarity - 0.72) / 0.28)
    : 0;

  const noveltyInstant = clamp01(
    deltaMagnitude * 4.0
    + (justActivated ? level * 0.8 : 0),
  );

  const persistenceTarget = active
    ? clamp01(level * 0.8 + Math.max(0, 0.1 - deltaMagnitude))
    : 0;

  const directionalityInstant = clamp01(Math.abs(delta) * 3.0);
  const quietFrames = active ? 0 : state.quietFrames + 1;

  return {
    previousLevel: level,
    quietFrames,
    anchorLevel,
    packet: {
      level,
      delta,
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

function requestLightInput(controller: LightSensoryController): void {
  if (controller.requested || typeof navigator === 'undefined') return;
  if (!navigator.mediaDevices?.getUserMedia) {
    controller.status = 'blocked';
    controller.requested = true;
    return;
  }
  if (typeof document === 'undefined') {
    controller.status = 'blocked';
    controller.requested = true;
    return;
  }

  controller.requested = true;
  controller.status = 'pending';

  const video = document.createElement('video');
  video.playsInline = true;
  video.muted = true;
  video.style.display = 'none';
  document.body.appendChild(video);

  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    controller.status = 'blocked';
    return;
  }

  controller.video = video;
  controller.canvas = canvas;
  controller.ctx = ctx;

  void navigator.mediaDevices
    .getUserMedia({ video: { facingMode: 'environment' } })
    .then((stream) => {
      controller.stream = stream;
      video.srcObject = stream;
      void video.play().catch(() => undefined);
      controller.status = 'ready';
    })
    .catch(() => {
      controller.status = 'blocked';
    });
}

function readLightFeatureFrame(controller: LightSensoryController): LightFeatureFrame {
  const { video, ctx } = controller;
  if (!video || !ctx || video.readyState < 2) {
    return { level: 0 };
  }

  ctx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const imageData = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const data = imageData.data;
  let sum = 0;
  const pixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
  for (let i = 0; i < data.length; i += 4) {
    // Rec. 601 luma coefficients: Y' = 0.299R + 0.587G + 0.114B
    sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
  }
  return { level: clamp01(sum / pixelCount) };
}

export function updateLightSensory(controller: LightSensoryController): LightSensoryController {
  requestLightInput(controller);
  const nextState = updateLightObservationState(controller, readLightFeatureFrame(controller));
  Object.assign(controller, nextState);
  return controller;
}
