/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapTouchToSurfaceIndex(network: any, xNorm: number, yNorm: number) {
  const S = network.segments;
  const i = Math.floor(xNorm * S) % S;
  const j = Math.floor(yNorm * S) % S;
  return i * S + j;
}

export function addGaussianTouch(network: any, centerIdx: number, pressure: number) {
  const S = network.segments;
  const ci = Math.floor(centerIdx / S);
  const cj = centerIdx % S;
  const sigma = 2.5;
  const radius = 5;
  const inv2s2 = 1.0 / (2.0 * sigma * sigma);
  for (let di = -radius; di <= radius; di++) {
    for (let dj = -radius; dj <= radius; dj++) {
      const ni = (ci + di + S) % S;
      const nj = (cj + dj + S) % S;
      const idx = ni * S + nj;
      const w = pressure * Math.exp(-(di * di + dj * dj) * inv2s2);
      network.rawTouch[idx] += w;
    }
  }
}

export function updateRawTouchField(network: any, activeTouches: Map<any, any>) {
  network.rawTouch.fill(0);
  const wW = window.innerWidth || 1;
  const wH = window.innerHeight || 1;
  for (const [, touch] of activeTouches) {
    const xNorm = touch.x / wW;
    const yNorm = touch.y / wH;
    const centerIdx = mapTouchToSurfaceIndex(network, xNorm, yNorm);
    addGaussianTouch(network, centerIdx, touch.pressure ?? 1.0);
  }
}

export function updateTouchPerception(network: any) {
  const TRACE_DECAY = 0.96;
  const TRACE_INTAKE = 0.04;

  const backactionEnabled = network.touchBackactionEnabled !== false;
  const backaction = backactionEnabled ? network.touchBackactionState : null;
  const backactionGain = backaction?.backactionGain ?? 1.0;
  const surpriseGain = backaction?.surpriseGain ?? 1.0;
  const boundaryMod = backaction?.boundaryModulation ?? 1.0;
  const opennessMod = backaction?.opennessModulation ?? 1.0;
  const coherenceShift = backaction?.coherenceShift ?? 0.0;
  const awarenessCoupling = backaction?.awarenessCoupling ?? 0.0;
  const overloadAmplification = backaction?.overloadAmplification ?? 0.0;
  const familiarityDamping = backaction?.familiarityDamping ?? 0.0;

  // Phase 3: Apply touch expectation influence to touch sensitivity
  let touchSensitivityModifier = 1.0;
  if (network.touchExpectation && network.touchSurpriseMetrics) {
    // Import touch expectation influence function inline to avoid circular dependency
    const meanHabituation = network.touchExpectation.touchHabituationField.reduce((a: number, b: number) => a + b, 0) /
                            network.touchExpectation.touchHabituationField.length;
    touchSensitivityModifier = 1.0 - meanHabituation * 0.15;
    const familiarityTilt = backactionEnabled ? familiarityDamping * 0.1 : 0.0;
    touchSensitivityModifier = Math.max(0.5, Math.min(1.0, touchSensitivityModifier - familiarityTilt));
  }

  const backactionTouchGain = backactionEnabled
    ? network.clampFinite(
        backactionGain *
          (1.0 + (boundaryMod - 1.0) * 0.25) *
          (1.0 + (opennessMod - 1.0) * 0.25) *
          (1.0 + awarenessCoupling * 0.12),
        0.7,
        1.5,
        1.0,
      )
    : 1.0;

  const touchSensitivity = (network.currentModeDynamics?.touchSensitivity ?? 1.0) * network.clampFinite(
    1.0 + (network.orientingDrive - 0.18) * 0.12 + (network.stability - 0.58) * 0.04 - Math.max(network.overload - 0.08, 0) * 0.22,
    0.72,
    1.14,
    1.0,
  ) * touchSensitivityModifier * backactionTouchGain;

  const noveltyGainBase = network.clampFinite(
    1.0 + (network.orientingDrive - 0.18) * 0.08 - Math.max(network.overload - 0.08, 0) * 0.24,
    0.7,
    1.08,
    1.0,
  );
  const surpriseFactor = backactionEnabled
    ? network.clampFinite(
        1.0 + (surpriseGain - 1.0) * 0.35 + overloadAmplification * 0.15,
        0.7,
        1.5,
        1.0,
      )
    : 1.0;
  const noveltyGain = noveltyGainBase * surpriseFactor;
  for (let i = 0; i < network.numNodes; i++) {
    const err = network.rawTouch[i] - network.localPrediction[i];
    // direct behavioral dependency (updateTouchPerception); target for weakening in Phase C
    const noveltyBias = network.priorChannels.novelty[i];
    const recurrenceBias = network.priorChannels.recurrence[i];
    const persistenceBias = network.priorChannels.persistence[i];
    const baseTraceDecay = network.clampFinite(
      TRACE_DECAY + recurrenceBias * 0.02 + persistenceBias * 0.015 - noveltyBias * 0.015,
      0.9,
      0.995,
      TRACE_DECAY,
    );
    const traceDecay = backactionEnabled
      ? network.clampFinite(
          baseTraceDecay * (1.0 - coherenceShift * 0.5),
          0.88,
          0.995,
          baseTraceDecay,
        )
      : baseTraceDecay;
    const traceIntake = network.clampFinite(
      TRACE_INTAKE + noveltyBias * 0.012 + persistenceBias * 0.008,
      0.02,
      0.08,
      TRACE_INTAKE,
    );
    network.touchOnset[i] = err > 0 ? err * touchSensitivity : 0;
    network.touchOffset[i] = err < 0 ? -err : 0;
    network.touchNovelty[i] = Math.abs(err) * (0.7 + touchSensitivity * 0.3) * noveltyGain;
    network.touchTrace[i] = network.touchTrace[i] * traceDecay + network.touchNovelty[i] * traceIntake;
    network.touchTrace[i] = network.clampFinite(network.touchTrace[i], 0, 4.0, 0);
  }
}

export function projectTouchToNetwork(network: any) {
  const PROJ_DECAY = 0.90;
  const ONSET_COEFFICIENT = 0.12;
  const OFFSET_COEFFICIENT = 0.06;
  let projectionGain = (network.currentModeDynamics?.touchProjectionGain ?? 1.0) * network.clampFinite(
    1.0 + (network.energy - 0.62) * 0.22 - Math.max(network.overload - 0.08, 0) * 0.24,
    0.55,
    1.04,
    1.0,
  );
  if (network.actionState === 'orient') projectionGain *= 1.0 + network.actionPulseLevel * 0.35;
  else if (network.actionState === 'withdraw') projectionGain *= 1.0 - network.actionPulseLevel * 0.45;
  else if (network.actionState === 'settle') projectionGain *= 1.0 - network.actionPulseLevel * 0.12;
  for (let i = 0; i < network.numNodes; i++) {
    // direct behavioral dependency (projectTouchToNetwork, all 4 channels); target for weakening in Phase C
    const noveltyBias = network.priorChannels.novelty[i];
    const recurrenceBias = network.priorChannels.recurrence[i];
    const persistenceBias = network.priorChannels.persistence[i];
    const directionBias = network.priorChannels.directionality[i];
    const projDecay = network.clampFinite(PROJ_DECAY + recurrenceBias * 0.02, 0.88, 0.96, PROJ_DECAY);
    const onsetCoefficient = network.clampFinite(ONSET_COEFFICIENT + noveltyBias * 0.03 + directionBias * 0.015, ONSET_COEFFICIENT, 0.18, ONSET_COEFFICIENT);
    const offsetCoefficient = network.clampFinite(OFFSET_COEFFICIENT + persistenceBias * 0.025, OFFSET_COEFFICIENT, 0.12, OFFSET_COEFFICIENT);
    const repeatDamp = network.clampFinite(1.0 - recurrenceBias * 0.08, 0.85, 1.0, 1.0);
    network.touchProjection[i] = network.touchProjection[i] * projDecay + network.touchOnset[i] * onsetCoefficient * repeatDamp * projectionGain - network.touchOffset[i] * offsetCoefficient;
    network.touchProjection[i] = network.clampFinite(network.touchProjection[i], -4.0, 4.0, 0);
  }
}
