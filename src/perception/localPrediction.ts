/* eslint-disable @typescript-eslint/no-explicit-any */
export function updateLocalPrediction(network: any) {
  const S = network.segments;
  const baseAlpha = 0.05;
  const organismAlphaGain = network.clampFinite(
    1.0 - Math.max(network.stability - 0.58, 0) * 0.08 - Math.max(network.overload - 0.08, 0) * 0.05,
    0.88,
    1.0,
    1.0,
  );
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const idx = i * S + j;
      const up = ((i - 1 + S) % S) * S + j;
      const down = ((i + 1) % S) * S + j;
      const left = i * S + ((j - 1 + S) % S);
      const right = i * S + ((j + 1) % S);
      const weightSum = network.w_up[idx] + network.w_down[idx] + network.w_left[idx] + network.w_right[idx];
      const neighborAvg = (
        network.currentBuffer[up] * network.w_up[idx]
        + network.currentBuffer[down] * network.w_down[idx]
        + network.currentBuffer[left] * network.w_left[idx]
        + network.currentBuffer[right] * network.w_right[idx]
      ) / Math.max(weightSum, 1e-6);
      const noveltyBias = network.priorChannels.novelty[idx]; // direct behavioral dependency; target for weakening in Phase C
      const adaptiveAlpha = network.clampFinite(
        (baseAlpha + noveltyBias * 0.03 + network.priorBias[idx] * 0.015) * organismAlphaGain,
        0.03,
        0.12,
        baseAlpha,
      );
      const oneMinusAlpha = 1.0 - adaptiveAlpha;
      network.localPrediction[idx] = network.localPrediction[idx] * oneMinusAlpha + neighborAvg * adaptiveAlpha;
      network.localPrediction[idx] = network.clampFinite(network.localPrediction[idx], -8.0, 8.0, 0);
    }
  }
}
