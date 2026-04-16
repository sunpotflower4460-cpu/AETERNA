/* eslint-disable @typescript-eslint/no-explicit-any */
import { REWRITE_WEIGHT_MAX, REWRITE_WEIGHT_MIN } from './aeternaTuning.ts';

export function normalizeDirectionalWeights(network: any, index: number) {
  network.w_up[index] = network.clampFinite(network.w_up[index], REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
  network.w_down[index] = network.clampFinite(network.w_down[index], REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
  network.w_left[index] = network.clampFinite(network.w_left[index], REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
  network.w_right[index] = network.clampFinite(network.w_right[index], REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
  const sum = network.w_up[index] + network.w_down[index] + network.w_left[index] + network.w_right[index];
  if (!Number.isFinite(sum) || sum <= 0) {
    network.w_up[index] = 1.0;
    network.w_down[index] = 1.0;
    network.w_left[index] = 1.0;
    network.w_right[index] = 1.0;
    return;
  }
  const factor = 4.0 / sum;
  network.w_up[index] = network.clampFinite(network.w_up[index] * factor, REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
  network.w_down[index] = network.clampFinite(network.w_down[index] * factor, REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
  network.w_left[index] = network.clampFinite(network.w_left[index] * factor, REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
  network.w_right[index] = network.clampFinite(network.w_right[index] * factor, REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
}

export function injectSTDPExternal(network: any, fromNode: number, toNode: number, deltaT: number) {
  const A_PLUS = 0.08;
  const TAU = 30.0;
  const dw = A_PLUS * Math.exp(-deltaT / TAU);
  const S = network.segments;
  const fi = Math.floor(fromNode / S);
  const fj = fromNode % S;
  const ti = Math.floor(toNode / S);
  const tj = toNode % S;
  let di = ti - fi;
  if (di < -S / 2) di += S;
  else if (di > S / 2) di -= S;
  let dj = tj - fj;
  if (dj < -S / 2) dj += S;
  else if (dj > S / 2) dj -= S;
  if (Math.abs(di) >= Math.abs(dj)) {
    if (di > 0) network.w_down[fromNode] = Math.min(network.w_down[fromNode] + dw, 4.0);
    else network.w_up[fromNode] = Math.min(network.w_up[fromNode] + dw, 4.0);
  } else if (dj > 0) {
    network.w_right[fromNode] = Math.min(network.w_right[fromNode] + dw, 4.0);
  } else {
    network.w_left[fromNode] = Math.min(network.w_left[fromNode] + dw, 4.0);
  }
}
