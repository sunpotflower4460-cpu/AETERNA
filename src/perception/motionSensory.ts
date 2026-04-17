import type { MotionPerceptPacket } from '../types/packets.js';

const MOTION_ACTIVE_THRESHOLD = 0.15;
// Raw acceleration from DeviceMotionEvent.accelerationIncludingGravity is in m/s².
// 20 m/s² covers typical vigorous device motion including gravitational component.
const ACCEL_NORMALIZE = 20.0;
// Raw rotation rate from DeviceMotionEvent.rotationRate is in degrees/second.
// 360 deg/s represents a full rotation per second, a reasonable upper bound.
const GYRO_NORMALIZE = 360.0;

export interface MotionFeatureFrame {
  accelerationMagnitude: number;
  gyroDelta: number;
}

export interface MotionObservationState {
  previousMagnitude: number;
  quietFrames: number;
  anchorMagnitude: number | null;
  packet: MotionPerceptPacket;
}

export interface MotionSensoryController extends MotionObservationState {
  status: 'idle' | 'ready' | 'blocked';
  requested: boolean;
  lastAccelX: number;
  lastAccelY: number;
  lastAccelZ: number;
  lastRotAlpha: number;
  lastRotBeta: number;
  lastRotGamma: number;
  prevRotAlpha: number;
  prevRotBeta: number;
  prevRotGamma: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function createStillPacket(): MotionPerceptPacket {
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

export function createInitialMotionObservationState(): MotionObservationState {
  return {
    previousMagnitude: 0,
    quietFrames: 0,
    anchorMagnitude: null,
    packet: createStillPacket(),
  };
}

export function createMotionSensoryController(): MotionSensoryController {
  return {
    ...createInitialMotionObservationState(),
    status: 'idle',
    requested: false,
    lastAccelX: 0,
    lastAccelY: 0,
    lastAccelZ: 0,
    lastRotAlpha: 0,
    lastRotBeta: 0,
    lastRotGamma: 0,
    prevRotAlpha: 0,
    prevRotBeta: 0,
    prevRotGamma: 0,
  };
}

export function updateMotionObservationState(
  state: MotionObservationState,
  features: MotionFeatureFrame,
): MotionObservationState {
  const level = clamp01(features.accelerationMagnitude);
  const gyroDelta = clamp01(features.gyroDelta);
  const delta = level - state.previousMagnitude;
  const deltaMagnitude = Math.abs(delta);
  const active = level >= MOTION_ACTIVE_THRESHOLD || gyroDelta >= MOTION_ACTIVE_THRESHOLD;
  const justActivated = active && !state.packet.active;
  const justDeactivated = !active && state.packet.active;

  const anchorMagnitude = justDeactivated ? state.previousMagnitude : state.anchorMagnitude;
  const similarity = anchorMagnitude !== null
    ? clamp01(1 - Math.abs(level - anchorMagnitude) * 2)
    : 0;
  const recurrenceInstant = justActivated && similarity > 0.72
    ? clamp01((similarity - 0.72) / 0.28)
    : 0;

  const noveltyInstant = clamp01(
    deltaMagnitude * 3.5
    + gyroDelta * 1.5
    + (justActivated ? level * 0.7 : 0),
  );

  const persistenceTarget = active
    ? clamp01(level * 0.7 + gyroDelta * 0.2 + Math.max(0, 0.1 - deltaMagnitude))
    : 0;

  const directionalityInstant = clamp01(Math.abs(delta) * 3.0 + gyroDelta * 1.0);
  const quietFrames = active ? 0 : state.quietFrames + 1;

  return {
    previousMagnitude: level,
    quietFrames,
    anchorMagnitude,
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

function requestMotionInput(controller: MotionSensoryController): void {
  if (controller.requested || typeof window === 'undefined') return;
  controller.requested = true;

  if (!('DeviceMotionEvent' in window)) {
    controller.status = 'blocked';
    return;
  }

  controller.status = 'ready';

  window.addEventListener('devicemotion', (event: DeviceMotionEvent) => {
    const accel = event.accelerationIncludingGravity;
    if (accel) {
      controller.lastAccelX = accel.x ?? 0;
      controller.lastAccelY = accel.y ?? 0;
      controller.lastAccelZ = accel.z ?? 0;
    }
    const rot = event.rotationRate;
    if (rot) {
      controller.prevRotAlpha = controller.lastRotAlpha;
      controller.prevRotBeta = controller.lastRotBeta;
      controller.prevRotGamma = controller.lastRotGamma;
      controller.lastRotAlpha = rot.alpha ?? 0;
      controller.lastRotBeta = rot.beta ?? 0;
      controller.lastRotGamma = rot.gamma ?? 0;
    }
  });
}

function readMotionFeatureFrame(controller: MotionSensoryController): MotionFeatureFrame {
  const ax = controller.lastAccelX;
  const ay = controller.lastAccelY;
  const az = controller.lastAccelZ;
  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  const accelerationMagnitude = clamp01(magnitude / ACCEL_NORMALIZE);

  const dAlpha = controller.lastRotAlpha - controller.prevRotAlpha;
  const dBeta = controller.lastRotBeta - controller.prevRotBeta;
  const dGamma = controller.lastRotGamma - controller.prevRotGamma;
  const gyroMagnitude = Math.sqrt(dAlpha * dAlpha + dBeta * dBeta + dGamma * dGamma);
  const gyroDelta = clamp01(gyroMagnitude / GYRO_NORMALIZE);

  return { accelerationMagnitude, gyroDelta };
}

export function updateMotionSensory(controller: MotionSensoryController): MotionSensoryController {
  requestMotionInput(controller);
  const nextState = updateMotionObservationState(controller, readMotionFeatureFrame(controller));
  Object.assign(controller, nextState);
  return controller;
}
