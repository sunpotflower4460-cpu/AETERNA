/**
 * Touch Expectation Module
 *
 * Phase 3: Transform touch from reactive input to time-based perceptual stream
 * with expectation, surprise, habituation, and hold/release temporality.
 *
 * Core principle: Touch is not just a signal to react to, but a temporal stream
 * that the organism learns to anticipate, habituates to, and is surprised by.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Touch expectation state
 * Represents the organism's learned anticipation of touch patterns
 */
export interface TouchExpectationState {
  // Expected touch field: where organism expects to be touched next
  expectedTouchField: Float32Array;

  // Expected inter-touch interval: time between touches
  expectedInterTouchInterval: number;

  // Expected touch strength: anticipated pressure/intensity
  expectedTouchStrength: number;

  // Touch expectation confidence: how certain the expectation is
  touchExpectationConfidence: number;

  // Touch surprise field: mismatch between expected and actual
  touchSurpriseField: Float32Array;

  // Touch habituation field: reduced response from repetition
  touchHabituationField: Float32Array;

  // Hold continuation expectation: expected persistence during hold
  holdContinuationExpectation: number;

  // Release/absence error: residue after expected touch doesn't come or release
  absenceError: number;

  // Last touch time for interval tracking
  lastTouchTime: number;

  // Last touch location (center index)
  lastTouchLocation: number;

  // Last touch strength
  lastTouchStrength: number;

  // Currently in hold state
  isHolding: boolean;

  // Hold start time
  holdStartTime: number;

  // Hold duration frames
  holdDuration: number;
}

/**
 * Initialize touch expectation state
 */
export function createTouchExpectationState(numNodes: number): TouchExpectationState {
  return {
    expectedTouchField: new Float32Array(numNodes),
    expectedInterTouchInterval: 100.0,  // default ~1.67s @ 60fps
    expectedTouchStrength: 0.5,
    touchExpectationConfidence: 0.0,
    touchSurpriseField: new Float32Array(numNodes),
    touchHabituationField: new Float32Array(numNodes),
    holdContinuationExpectation: 0.0,
    absenceError: 0.0,
    lastTouchTime: -Infinity,
    lastTouchLocation: -1,
    lastTouchStrength: 0.0,
    isHolding: false,
    holdStartTime: -Infinity,
    holdDuration: 0,
  };
}

/**
 * Update touch expectation based on actual touch events
 * Uses EMA (Exponential Moving Average) for smooth adaptation
 */
export function updateTouchExpectation(
  network: any,
  expectationState: TouchExpectationState,
  activeTouches: Map<any, any>,
  simTime: number
): void {
  const numNodes = network.numNodes;
  const EXPECTATION_LEARNING_RATE = 0.02;  // slow learning
  const CONFIDENCE_INCREASE = 0.01;
  const CONFIDENCE_DECAY = 0.998;
  const FIELD_DECAY = 0.995;

  // Compute current touch presence and centroid
  const touchPresent = activeTouches.size > 0;
  let touchCentroidIdx = -1;
  let touchStrength = 0.0;

  if (touchPresent) {
    // Find touch centroid from rawTouch field
    let maxTouch = 0;
    let totalTouch = 0;
    for (let i = 0; i < numNodes; i++) {
      const touch = network.rawTouch[i];
      totalTouch += touch;
      if (touch > maxTouch) {
        maxTouch = touch;
        touchCentroidIdx = i;
      }
    }
    touchStrength = maxTouch;
  }

  // Update hold state
  const wasHolding = expectationState.isHolding;
  expectationState.isHolding = touchPresent;

  if (touchPresent && !wasHolding) {
    // Touch onset
    expectationState.holdStartTime = simTime;
    expectationState.holdDuration = 0;
  } else if (touchPresent && wasHolding) {
    // Continuing hold
    expectationState.holdDuration++;
  } else if (!touchPresent && wasHolding) {
    // Release
    // Hold continuation expectation is violated
    // This will generate absence error later
  }

  // Update expectation if touch is present
  if (touchPresent && touchCentroidIdx >= 0) {
    const timeSinceLastTouch = simTime - expectationState.lastTouchTime;

    // Update inter-touch interval expectation (EMA)
    if (expectationState.lastTouchTime > -Infinity && timeSinceLastTouch < 1000) {
      expectationState.expectedInterTouchInterval =
        expectationState.expectedInterTouchInterval * (1 - EXPECTATION_LEARNING_RATE) +
        timeSinceLastTouch * EXPECTATION_LEARNING_RATE;
    }

    // Update touch strength expectation (EMA)
    expectationState.expectedTouchStrength =
      expectationState.expectedTouchStrength * (1 - EXPECTATION_LEARNING_RATE) +
      touchStrength * EXPECTATION_LEARNING_RATE;

    // Update spatial expectation field (local Gaussian around touch location)
    const sigma = 3.0;
    const segments = Math.sqrt(numNodes);
    const ci = Math.floor(touchCentroidIdx / segments);
    const cj = touchCentroidIdx % segments;

    for (let i = 0; i < numNodes; i++) {
      const ni = Math.floor(i / segments);
      const nj = i % segments;
      const di = Math.min(Math.abs(ni - ci), segments - Math.abs(ni - ci));
      const dj = Math.min(Math.abs(nj - cj), segments - Math.abs(nj - cj));
      const dist2 = di * di + dj * dj;
      const weight = Math.exp(-dist2 / (2 * sigma * sigma));

      expectationState.expectedTouchField[i] =
        expectationState.expectedTouchField[i] * (1 - EXPECTATION_LEARNING_RATE) +
        weight * EXPECTATION_LEARNING_RATE;
    }

    // Increase confidence
    expectationState.touchExpectationConfidence = Math.min(
      1.0,
      expectationState.touchExpectationConfidence + CONFIDENCE_INCREASE
    );

    // Update last touch tracking
    expectationState.lastTouchTime = simTime;
    expectationState.lastTouchLocation = touchCentroidIdx;
    expectationState.lastTouchStrength = touchStrength;
  } else {
    // No touch present - decay confidence
    expectationState.touchExpectationConfidence *= CONFIDENCE_DECAY;

    // Decay expected field
    for (let i = 0; i < numNodes; i++) {
      expectationState.expectedTouchField[i] *= FIELD_DECAY;
    }
  }

  // Update hold continuation expectation
  if (expectationState.isHolding) {
    // During hold, build expectation that it will continue
    const HOLD_CONTINUATION_INCREASE = 0.05;
    expectationState.holdContinuationExpectation = Math.min(
      1.0,
      expectationState.holdContinuationExpectation + HOLD_CONTINUATION_INCREASE
    );
  } else {
    // Not holding - decay expectation
    expectationState.holdContinuationExpectation *= 0.95;
  }

  // Clamp all values
  expectationState.expectedInterTouchInterval = Math.max(1.0, Math.min(1000.0, expectationState.expectedInterTouchInterval));
  expectationState.expectedTouchStrength = Math.max(0.0, Math.min(2.0, expectationState.expectedTouchStrength));
  expectationState.touchExpectationConfidence = Math.max(0.0, Math.min(1.0, expectationState.touchExpectationConfidence));
}

/**
 * Compute touch surprise based on expectation violation
 * Returns several types of surprise
 */
export function computeTouchSurprise(
  network: any,
  expectationState: TouchExpectationState,
  activeTouches: Map<any, any>,
  simTime: number
): {
  spatialSurprise: number;
  temporalSurprise: number;
  strengthSurprise: number;
  missingTouchSurprise: number;
  releaseSurprise: number;
  totalSurprise: number;
} {
  const numNodes = network.numNodes;
  const touchPresent = activeTouches.size > 0;

  let spatialSurprise = 0.0;
  let temporalSurprise = 0.0;
  let strengthSurprise = 0.0;
  let missingTouchSurprise = 0.0;
  let releaseSurprise = 0.0;

  // Compute spatial surprise field
  for (let i = 0; i < numNodes; i++) {
    const expected = expectationState.expectedTouchField[i];
    const actual = network.rawTouch[i];
    const diff = Math.abs(actual - expected);
    expectationState.touchSurpriseField[i] = diff;
    spatialSurprise += diff;
  }
  spatialSurprise /= numNodes;

  if (touchPresent) {
    // Touch is present - check temporal and strength surprise
    const timeSinceLastTouch = simTime - expectationState.lastTouchTime;

    // Temporal surprise: how much does interval differ from expected?
    if (expectationState.lastTouchTime > -Infinity && expectationState.touchExpectationConfidence > 0.1) {
      const expectedInterval = expectationState.expectedInterTouchInterval;
      const actualInterval = timeSinceLastTouch;
      temporalSurprise = Math.abs(actualInterval - expectedInterval) / Math.max(expectedInterval, 1.0);
      temporalSurprise = Math.min(1.0, temporalSurprise);
    }

    // Strength surprise: how much does pressure differ from expected?
    let maxTouch = 0;
    for (let i = 0; i < numNodes; i++) {
      maxTouch = Math.max(maxTouch, network.rawTouch[i]);
    }
    if (expectationState.touchExpectationConfidence > 0.1) {
      strengthSurprise = Math.abs(maxTouch - expectationState.expectedTouchStrength);
      strengthSurprise = Math.min(1.0, strengthSurprise);
    }
  } else {
    // No touch present - check for missing touch
    const timeSinceLastTouch = simTime - expectationState.lastTouchTime;

    // Missing touch surprise: expected touch didn't arrive
    if (expectationState.lastTouchTime > -Infinity && expectationState.touchExpectationConfidence > 0.3) {
      const expectedInterval = expectationState.expectedInterTouchInterval;
      const actualInterval = timeSinceLastTouch;

      // If we're past expected time and confidence is high, generate missing surprise
      if (actualInterval > expectedInterval * 1.2) {
        missingTouchSurprise = Math.min(
          1.0,
          (actualInterval - expectedInterval) / expectedInterval * expectationState.touchExpectationConfidence
        );
      }
    }

    // Release surprise: hold was expected to continue but was released
    if (expectationState.holdContinuationExpectation > 0.3) {
      releaseSurprise = expectationState.holdContinuationExpectation;
    }
  }

  // Update absence error for missing touch or unexpected release
  expectationState.absenceError = Math.max(missingTouchSurprise, releaseSurprise);

  const totalSurprise = spatialSurprise + temporalSurprise * 0.5 + strengthSurprise * 0.3 +
                        missingTouchSurprise * 0.8 + releaseSurprise * 0.6;

  return {
    spatialSurprise,
    temporalSurprise,
    strengthSurprise,
    missingTouchSurprise,
    releaseSurprise,
    totalSurprise,
  };
}

/**
 * Update touch habituation
 * Reduces response to repeated touches at same location with similar pattern
 */
export function updateTouchHabituation(
  network: any,
  expectationState: TouchExpectationState,
  activeTouches: Map<any, any>
): void {
  const numNodes = network.numNodes;
  const HABITUATION_INCREASE = 0.008;  // slow habituation
  const HABITUATION_DECAY = 0.996;  // slow recovery
  const NOVELTY_RESET_THRESHOLD = 0.5;  // strong surprise resets habituation

  const touchPresent = activeTouches.size > 0;

  if (touchPresent) {
    // Increase habituation where touch is present and expected
    for (let i = 0; i < numNodes; i++) {
      const touchLevel = network.rawTouch[i];
      const expectedLevel = expectationState.expectedTouchField[i];
      const surpriseLevel = expectationState.touchSurpriseField[i];

      if (touchLevel > 0.1 && expectedLevel > 0.1 && surpriseLevel < NOVELTY_RESET_THRESHOLD) {
        // Touch is expected - increase habituation
        expectationState.touchHabituationField[i] = Math.min(
          1.0,
          expectationState.touchHabituationField[i] + HABITUATION_INCREASE
        );
      } else if (touchLevel > 0.1 && surpriseLevel > NOVELTY_RESET_THRESHOLD) {
        // Touch is surprising - partially reset habituation
        expectationState.touchHabituationField[i] *= 0.7;
      }
    }
  } else {
    // No touch - decay habituation everywhere
    for (let i = 0; i < numNodes; i++) {
      expectationState.touchHabituationField[i] *= HABITUATION_DECAY;
    }
  }

  // Clamp
  for (let i = 0; i < numNodes; i++) {
    expectationState.touchHabituationField[i] = Math.max(
      0.0,
      Math.min(1.0, expectationState.touchHabituationField[i])
    );
  }
}

/**
 * Get debug summary of touch expectation state
 */
export function getTouchExpectationDebug(expectationState: TouchExpectationState): Record<string, number> {
  const meanExpectedTouch = expectationState.expectedTouchField.reduce((a, b) => a + b, 0) / expectationState.expectedTouchField.length;
  const meanSurprise = expectationState.touchSurpriseField.reduce((a, b) => a + b, 0) / expectationState.touchSurpriseField.length;
  const meanHabituation = expectationState.touchHabituationField.reduce((a, b) => a + b, 0) / expectationState.touchHabituationField.length;

  return {
    meanExpectedTouch,
    expectedInterval: expectationState.expectedInterTouchInterval,
    expectedStrength: expectationState.expectedTouchStrength,
    expectationConfidence: expectationState.touchExpectationConfidence,
    meanSurprise,
    meanHabituation,
    holdContinuationExpectation: expectationState.holdContinuationExpectation,
    absenceError: expectationState.absenceError,
    isHolding: expectationState.isHolding ? 1 : 0,
    holdDuration: expectationState.holdDuration,
  };
}

/**
 * Apply touch expectation influence to organism core
 * This is where touch expectation weakly affects sensitivity and dynamics
 */
export function getTouchExpectationInfluence(
  expectationState: TouchExpectationState,
  surpriseMetrics: {
    spatialSurprise: number;
    temporalSurprise: number;
    strengthSurprise: number;
    missingTouchSurprise: number;
    releaseSurprise: number;
    totalSurprise: number;
  }
): {
  predictionSensitivityModifier: number;
  touchResponseSensitivityModifier: number;
  baselinePerturbationGain: number;
  recentHistoryBiasInfluence: number;
  modeDriftInfluence: number;
} {
  // High surprise slightly increases prediction sensitivity
  const predictionSensitivityModifier = 1.0 + surpriseMetrics.totalSurprise * 0.08;

  // High habituation reduces touch response sensitivity
  const meanHabituation = expectationState.touchHabituationField.reduce((a, b) => a + b, 0) /
                          expectationState.touchHabituationField.length;
  const touchResponseSensitivityModifier = 1.0 - meanHabituation * 0.15;

  // Missing touch or release surprise affects baseline perturbation
  const baselinePerturbationGain = 1.0 + (surpriseMetrics.missingTouchSurprise + surpriseMetrics.releaseSurprise) * 0.1;

  // Expectation violations influence recent history bias
  const recentHistoryBiasInfluence = surpriseMetrics.totalSurprise * 0.05;

  // Absence error (missing touch) can trigger mode drift
  const modeDriftInfluence = expectationState.absenceError * 0.03;

  return {
    predictionSensitivityModifier: Math.max(0.8, Math.min(1.3, predictionSensitivityModifier)),
    touchResponseSensitivityModifier: Math.max(0.5, Math.min(1.0, touchResponseSensitivityModifier)),
    baselinePerturbationGain: Math.max(0.9, Math.min(1.2, baselinePerturbationGain)),
    recentHistoryBiasInfluence: Math.max(0.0, Math.min(0.2, recentHistoryBiasInfluence)),
    modeDriftInfluence: Math.max(0.0, Math.min(0.1, modeDriftInfluence)),
  };
}
