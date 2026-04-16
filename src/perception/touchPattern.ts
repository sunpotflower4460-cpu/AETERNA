/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TOUCH_HOLD_MIN_FRAMES,
  TOUCH_LOW_VELOCITY,
  TOUCH_REPEAT_GAP_THRESHOLD,
  TOUCH_REPEAT_MIN_COUNT,
  TOUCH_STROKE_MIN_DIST,
  TOUCH_TAP_MAX_FRAMES,
} from '../core/aeternaTuning.ts';
import type { PatternScores, TouchInputPacket, TouchPatternName } from '../types/packets.js';
import {
  applyTouchPatternModulation,
  computeTouchCentroid,
  updateTouchSequenceFeatures,
} from './touchPatterns.ts';

const DECAY = 0.85;
const INTAKE = 0.15;

export interface TouchPatternInput {
  touchDuration: number;
  touchVelocity: number;
  touchMoveDistance: number;
  touchRepeatCount: number;
  touchGapFrames: number;
}

export function computeTouchPatternRawScores({
  touchDuration,
  touchVelocity,
  touchMoveDistance,
  touchRepeatCount,
  touchGapFrames,
}: TouchPatternInput): PatternScores {
  return {
    tap: touchDuration > 0 && touchDuration < TOUCH_TAP_MAX_FRAMES && touchVelocity < TOUCH_LOW_VELOCITY ? 1 : 0,
    hold: touchDuration > TOUCH_HOLD_MIN_FRAMES && touchVelocity < TOUCH_LOW_VELOCITY ? 1 : 0,
    repeat: touchRepeatCount >= TOUCH_REPEAT_MIN_COUNT && touchGapFrames < TOUCH_REPEAT_GAP_THRESHOLD ? 1 : 0,
    stroke: touchDuration > 0 && touchMoveDistance > TOUCH_STROKE_MIN_DIST ? 1 : 0,
  };
}

export function integrateTouchPatternScores(previous: PatternScores, rawScores: PatternScores): PatternScores {
  return {
    tap: previous.tap * DECAY + rawScores.tap * INTAKE,
    hold: previous.hold * DECAY + rawScores.hold * INTAKE,
    repeat: previous.repeat * DECAY + rawScores.repeat * INTAKE,
    stroke: previous.stroke * DECAY + rawScores.stroke * INTAKE,
  };
}

export function getDominantPatternFromScores(scores: PatternScores): TouchPatternName | null {
  const maxScore = Math.max(scores.tap, scores.hold, scores.repeat, scores.stroke);
  if (maxScore < 0.05) return null;
  if (maxScore === scores.tap) return 'tap';
  if (maxScore === scores.hold) return 'hold';
  if (maxScore === scores.repeat) return 'repeat';
  return 'stroke';
}

export function runTouchPatternStage(network: any, activeTouches: Map<any, any>): TouchInputPacket & {
  dominantPattern: TouchPatternName | null;
  patternScores: PatternScores;
} {
  updateTouchSequenceFeatures(network, activeTouches);
  const patternScores = integrateTouchPatternScores(
    network.touchPatternScores,
    computeTouchPatternRawScores({
      touchDuration: network.touchDurationFrames,
      touchVelocity: network.touchVelocityEstimate,
      touchMoveDistance: network.touchMoveDistance,
      touchRepeatCount: network.touchRepeatCount,
      touchGapFrames: network.touchGapFrames,
    }),
  );
  network.touchPatternScores = patternScores;
  return {
    activeTouchCount: activeTouches.size,
    dominantPattern: getDominantPatternFromScores(patternScores),
    patternScores: { ...patternScores },
    lastTouchCentroid: network.lastTouchCentroid,
    touchDuration: network.touchDurationFrames,
    touchVelocity: network.touchVelocityEstimate,
    touchRepeatCount: network.touchRepeatCount,
    lastTouchDirection: network.getTouchDirectionArray(),
    touchDirectionStrength: network.touchDirectionVector?.strength ?? 0,
  };
}

export function refreshTouchCentroid(network: any, activeTouches: Map<any, any>) {
  return computeTouchCentroid(network, activeTouches);
}

export function applyTouchPatternStage(network: any) {
  applyTouchPatternModulation(network);
}
