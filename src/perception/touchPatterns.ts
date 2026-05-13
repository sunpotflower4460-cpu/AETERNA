/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TOUCH_HOLD_MIN_FRAMES,
  TOUCH_LOW_VELOCITY,
  TOUCH_REPEAT_GAP_THRESHOLD,
  TOUCH_REPEAT_MIN_COUNT,
  TOUCH_REPEAT_RESET_FRAMES,
  TOUCH_STROKE_MIN_DIST,
  TOUCH_TAP_MAX_FRAMES,
} from '../core/aeternaTuning.ts';
import {
  decayScalarWithSink,
  decayWithSink,
  emaWithSink,
  ensureSinkField,
} from '../core/dynamicCoreNamedDestinations.ts';

export function computeTouchCentroid(network: any, activeTouches: Map<any, any>) {
  if (activeTouches.size === 0) return null;
  const wW = window.innerWidth || 1;
  const wH = window.innerHeight || 1;
  let sx = 0;
  let sy = 0;
  for (const [, touch] of activeTouches) {
    sx += touch.x / wW;
    sy += touch.y / wH;
  }
  return [sx / activeTouches.size, sy / activeTouches.size];
}

export function updateTouchSequenceFeatures(network: any, activeTouches: Map<any, any>) {
  if (activeTouches.size > 0) {
    const centroid = computeTouchCentroid(network, activeTouches);
    if (network.touchDurationFrames === 0) {
      if (network.touchGapFrames > 0 && network.touchGapFrames < TOUCH_REPEAT_GAP_THRESHOLD) network.touchRepeatCount += 1;
      else if (network.touchGapFrames >= TOUCH_REPEAT_RESET_FRAMES) network.touchRepeatCount = 0;
    }
    network.touchDurationFrames += 1;
    network.touchGapFrames = 0;
    if (network.lastTouchCentroid) {
      const dx = centroid[0] - network.lastTouchCentroid[0];
      const dy = centroid[1] - network.lastTouchCentroid[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      network.touchMoveDistance += dist;
      network.touchVelocityEstimate = emaWithSink(
        network.touchVelocityEstimate,
        0.8,
        dist,
        network,
        'touchVelocityEstimateEMADecayAccumulator',
        'touchVelocityEstimateEMAIntakeAccumulator',
      );
      network.touchDirectionVector = { dx, dy, strength: Math.min(dist / TOUCH_STROKE_MIN_DIST, 1.0) };
    } else {
      network.touchDirectionVector = { dx: 0, dy: 0, strength: 0 };
    }
    network.lastTouchCentroid = centroid;
  } else {
    network.touchGapFrames += 1;
    network.touchDurationFrames = 0;
    network.touchMoveDistance = decayScalarWithSink(network.touchMoveDistance, 0.95, network, 'touchMoveDistanceDecayAccumulator');
    network.touchVelocityEstimate = decayScalarWithSink(network.touchVelocityEstimate, 0.9, network, 'touchVelocityEstimateDecayAccumulator');
    network.lastTouchCentroid = null;
    network.touchDirectionVector = { dx: 0, dy: 0, strength: 0 };
  }
}

export function updateTouchPatternScores(network: any) {
  const dur = network.touchDurationFrames;
  const vel = network.touchVelocityEstimate;
  const move = network.touchMoveDistance;
  const rpt = network.touchRepeatCount;
  const gap = network.touchGapFrames;
  const tapRaw = dur > 0 && dur < TOUCH_TAP_MAX_FRAMES && vel < TOUCH_LOW_VELOCITY ? 1 : 0;
  const holdRaw = dur > TOUCH_HOLD_MIN_FRAMES && vel < TOUCH_LOW_VELOCITY ? 1 : 0;
  const repeatRaw = rpt >= TOUCH_REPEAT_MIN_COUNT && gap < TOUCH_REPEAT_GAP_THRESHOLD ? 1 : 0;
  const strokeRaw = dur > 0 && move > TOUCH_STROKE_MIN_DIST ? 1 : 0;
  const DECAY = 0.85;
  const INTAKE = 0.15;
  network.touchPatternScores.tap = network.touchPatternScores.tap * DECAY + tapRaw * INTAKE;
  network.touchPatternScores.hold = network.touchPatternScores.hold * DECAY + holdRaw * INTAKE;
  network.touchPatternScores.repeat = network.touchPatternScores.repeat * DECAY + repeatRaw * INTAKE;
  network.touchPatternScores.stroke = network.touchPatternScores.stroke * DECAY + strokeRaw * INTAKE;
}

export function getDominantTouchPattern(network: any) {
  const s = network.touchPatternScores;
  const maxScore = Math.max(s.tap, s.hold, s.repeat, s.stroke);
  if (maxScore < 0.05) return null;
  if (maxScore === s.tap) return 'tap';
  if (maxScore === s.hold) return 'hold';
  if (maxScore === s.repeat) return 'repeat';
  return 'stroke';
}

export function applyTouchPatternModulation(network: any) {
  const tapS = network.touchPatternScores.tap;
  const holdS = network.touchPatternScores.hold;
  const repeatS = network.touchPatternScores.repeat;
  const strokeS = network.touchPatternScores.stroke;
  if (tapS < 0.02 && holdS < 0.02 && repeatS < 0.02 && strokeS < 0.02) return;
  const tapTraceFadeSink = tapS > 0.02
    ? ensureSinkField(network, 'touchTraceTapFadeField', network.numNodes)
    : null;
  const holdProjectionFadeSink = holdS > 0.02
    ? ensureSinkField(network, 'touchProjectionHoldFadeField', network.numNodes)
    : null;
  const repeatProjectionFadeSink = repeatS > 0.02
    ? ensureSinkField(network, 'touchProjectionRepeatFadeField', network.numNodes)
    : null;
  const holdFade = holdS > 0.02 ? Math.min(network.touchDurationFrames / 40.0, 1.0) : 0;
  for (let i = 0; i < network.numNodes; i++) {
    if (tapS > 0.02 && tapTraceFadeSink) {
      network.touchProjection[i] += network.touchOnset[i] * tapS * 0.06;
      decayWithSink(network.touchTrace, i, 1.0 - tapS * 0.04, tapTraceFadeSink);
    }
    if (holdS > 0.02 && holdProjectionFadeSink) {
      decayWithSink(network.touchProjection, i, 1.0 - holdS * holdFade * 0.10, holdProjectionFadeSink);
      network.touchTrace[i] += network.touchNovelty[i] * holdS * 0.015;
    }
    if (repeatS > 0.02 && repeatProjectionFadeSink) {
      decayWithSink(network.touchProjection, i, 1.0 - repeatS * 0.06, repeatProjectionFadeSink);
    }
    if (strokeS > 0.02) network.touchTrace[i] += network.touchNovelty[i] * strokeS * 0.02;
  }
  if (strokeS > 0.05 && network.lastTouchCentroid) {
    network.strokePath.push({ normX: network.lastTouchCentroid[0], normY: network.lastTouchCentroid[1] });
    if (network.strokePath.length > 40) network.strokePath.shift();
  } else if (strokeS < 0.02 && network.strokePath.length > 0) {
    network.strokePath.shift();
  }
}
