import type { TimePerceptPacket } from '../types/packets.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function circadianLevel(phase: number): number {
  return clamp01((Math.sin(2 * Math.PI * phase - Math.PI / 2) + 1) * 0.5);
}

export interface TimeObservationState {
  previousPhase: number;
  packet: TimePerceptPacket;
}

export interface TimeSensoryController extends TimeObservationState {
  // time requires no hardware; always available
}

function createBasePacket(): TimePerceptPacket {
  return {
    phase: 0,
    level: 0,
    novelty: 0,
    persistence: 0.5,
    recurrence: 0,
    directionality: 0,
    active: true,
  };
}

export function createInitialTimeObservationState(): TimeObservationState {
  const nowMs = typeof Date !== 'undefined' ? Date.now() : 0;
  const phase = clamp01((nowMs % DAY_MS) / DAY_MS);
  return {
    previousPhase: phase,
    packet: createBasePacket(),
  };
}

export function createTimeSensoryController(): TimeSensoryController {
  return createInitialTimeObservationState();
}

export function updateTimeObservationState(
  state: TimeObservationState,
  nowMs: number,
): TimeObservationState {
  const phase = clamp01((nowMs % DAY_MS) / DAY_MS);
  const level = circadianLevel(phase);

  // Phase delta per frame is tiny; scale up to detect midnight crossing
  const rawDelta = phase - state.previousPhase;
  // Handle midnight wrap: if rawDelta is strongly negative, a day rolled over
  // (phase jumped from ~1.0 back to ~0.0), so add 1 to recover the true forward step.
  const phaseDelta = rawDelta < -0.5 ? rawDelta + 1 : rawDelta;
  const noveltyInstant = clamp01(Math.abs(phaseDelta) * 500.0);

  // Time always persists; target a stable high value
  const persistenceTarget = 0.85;

  // Recurrence: spike briefly near midnight (phase ≈ 0/1) to mark daily cycle completion
  const recurrenceInstant = phase < 0.005 || phase > 0.995 ? 0.5 : 0;

  // Directionality: time always moves forward; stable positive value
  const directionalityTarget = 0.6;

  return {
    previousPhase: phase,
    packet: {
      phase,
      level,
      novelty: clamp01(state.packet.novelty * 0.9 + noveltyInstant * 0.1),
      persistence: clamp01(state.packet.persistence * 0.92 + persistenceTarget * 0.08),
      recurrence: clamp01(state.packet.recurrence * 0.95 + recurrenceInstant * 0.05),
      directionality: clamp01(state.packet.directionality * 0.9 + directionalityTarget * 0.1),
      active: true,
    },
  };
}

export function updateTimeSensory(controller: TimeSensoryController): TimeSensoryController {
  const nextState = updateTimeObservationState(controller, Date.now());
  Object.assign(controller, nextState);
  return controller;
}
