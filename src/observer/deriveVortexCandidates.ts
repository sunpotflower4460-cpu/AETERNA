import {
  derivePhaseGradientField,
  unwrapPhaseDifference,
} from '../core/complexField.ts';
import type {
  VortexCandidate,
  VortexObservationState,
} from '../types/vortexCandidate.ts';

const TWO_PI = Math.PI * 2;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function deriveVortexCandidates(params: {
  timestamp: number;
  phase: Float32Array;
  amplitude: Float32Array;
  segments: number;
  phaseGradient?: Float32Array;
}): VortexObservationState {
  const {
    timestamp,
    phase,
    amplitude,
    segments,
    phaseGradient = derivePhaseGradientField({ phase, segments }).phaseGradient,
  } = params;
  const cellCount = segments * segments;
  const vorticity = new Float32Array(cellCount);
  const topologicalCharge = new Int8Array(cellCount);
  const vortexCandidateMask = new Uint8Array(cellCount);
  const candidates: VortexCandidate[] = [];

  let positiveChargeCount = 0;
  let negativeChargeCount = 0;
  let totalTopologicalCharge = 0;
  let totalConfidence = 0;
  let maxConfidence = 0;
  let totalGradient = 0;
  let totalVorticity = 0;
  let phaseUnwrapWarningCount = 0;
  let amplitudeMean = 0;

  for (let index = 0; index < cellCount; index++) {
    amplitudeMean += Number.isFinite(amplitude[index]) ? amplitude[index] : 0;
    totalGradient += Number.isFinite(phaseGradient[index]) ? phaseGradient[index] : 0;
  }
  amplitudeMean /= Math.max(1, cellCount);

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const index = i * segments + j;
      const right = i * segments + ((j + 1) % segments);
      const down = ((i + 1) % segments) * segments + j;
      const diagonal = ((i + 1) % segments) * segments + ((j + 1) % segments);

      const p00 = phase[index];
      const p10 = phase[right];
      const p11 = phase[diagonal];
      const p01 = phase[down];

      const d0 = unwrapPhaseDifference(p10 - p00);
      const d1 = unwrapPhaseDifference(p11 - p10);
      const d2 = unwrapPhaseDifference(p01 - p11);
      const d3 = unwrapPhaseDifference(p00 - p01);

      if (Math.abs(d0) > Math.PI * 0.9) phaseUnwrapWarningCount++;
      if (Math.abs(d1) > Math.PI * 0.9) phaseUnwrapWarningCount++;
      if (Math.abs(d2) > Math.PI * 0.9) phaseUnwrapWarningCount++;
      if (Math.abs(d3) > Math.PI * 0.9) phaseUnwrapWarningCount++;

      const winding = d0 + d1 + d2 + d3;
      const charge = Math.round(winding / TWO_PI);
      const windingStrength = clamp01(Math.abs(winding) / TWO_PI);
      const windingResidual = Math.abs(winding - charge * TWO_PI);
      const windingConfidence = charge === 0
        ? 0
        : clamp01(1 - (windingResidual / Math.PI));
      const amplitudeMinimum = Math.min(
        amplitude[index] ?? 0,
        amplitude[right] ?? 0,
        amplitude[down] ?? 0,
        amplitude[diagonal] ?? 0,
      );
      const amplitudeConfidence = clamp01(
        1 - (amplitudeMinimum / Math.max(amplitudeMean, 1e-6)),
      );
      const localGradient = (
        (phaseGradient[index] ?? 0)
        + (phaseGradient[right] ?? 0)
        + (phaseGradient[down] ?? 0)
        + (phaseGradient[diagonal] ?? 0)
      ) / 4;
      const gradientConfidence = clamp01(localGradient / Math.PI);
      const confidence = clamp01(
        windingConfidence * 0.55
        + amplitudeConfidence * 0.3
        + gradientConfidence * 0.15,
      );

      vorticity[index] = Number.isFinite(winding) ? winding / TWO_PI : 0;
      totalVorticity += Math.abs(vorticity[index]);
      topologicalCharge[index] = Number.isFinite(charge) ? charge : 0;

      if (Math.abs(charge) >= 1 && windingStrength >= 0.8 && confidence >= 0.45) {
        vortexCandidateMask[index] = 1;
        totalTopologicalCharge += charge;
        totalConfidence += confidence;
        maxConfidence = Math.max(maxConfidence, confidence);

        if (charge > 0) positiveChargeCount += charge;
        if (charge < 0) negativeChargeCount += Math.abs(charge);

        candidates.push({
          id: `vortex-${i}-${j}-${timestamp}`,
          timestamp,
          regionId: `u${i}-v${j}`,
          i,
          j,
          amplitudeMinimum,
          phaseWinding: winding,
          topologicalCharge: charge,
          confidence,
          lifetimeTicks: 1,
        });
      }
    }
  }

  candidates.sort((left, right) => right.confidence - left.confidence);

  return {
    timestamp,
    candidateCount: candidates.length,
    positiveChargeCount,
    negativeChargeCount,
    totalTopologicalCharge,
    averageConfidence: candidates.length > 0 ? totalConfidence / candidates.length : 0,
    maxConfidence,
    averagePhaseGradient: totalGradient / Math.max(1, cellCount),
    averageVorticity: totalVorticity / Math.max(1, cellCount),
    phaseUnwrapWarningCount,
    candidates,
    observationConfidence: clamp01(
      (candidates.length > 0 ? Math.min(1, candidates.length / 8) * 0.4 : 0)
      + (candidates.length > 0 ? (totalConfidence / candidates.length) * 0.4 : 0)
      + (1 - clamp01(phaseUnwrapWarningCount / Math.max(1, cellCount * 2))) * 0.2,
    ),
    vorticity,
    topologicalCharge,
    vortexCandidateMask,
  };
}
