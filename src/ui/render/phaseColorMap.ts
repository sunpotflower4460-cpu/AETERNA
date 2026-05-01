/**
 * phaseColorMap.ts
 *
 * N2: Complex Scalar Field
 *
 * Maps actual complex-field phase to hue and amplitude to brightness/opacity.
 * No semantic or emotional meaning is assigned to any phase color.
 */

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hue = ((h % 1) + 1) % 1;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue * 6) % 2) - 1));
  const m = v - c;

  if (hue < 1 / 6) return { r: c + m, g: x + m, b: m };
  if (hue < 2 / 6) return { r: x + m, g: c + m, b: m };
  if (hue < 3 / 6) return { r: m, g: c + m, b: x + m };
  if (hue < 4 / 6) return { r: m, g: x + m, b: c + m };
  if (hue < 5 / 6) return { r: x + m, g: m, b: c + m };
  return { r: c + m, g: m, b: x + m };
}

export function mapPhaseToColor(params: {
  phase: number;
  amplitude: number;
  maxAmplitude?: number;
}): { r: number; g: number; b: number; opacity: number } {
  const {
    phase,
    amplitude,
    maxAmplitude = 1,
  } = params;
  const normalizedAmplitude = clamp01(
    maxAmplitude > 0 ? amplitude / maxAmplitude : amplitude,
  );
  const hue = (phase + Math.PI) / (Math.PI * 2);
  const brightness = 0.15 + normalizedAmplitude * 0.85;
  const saturation = 0.35 + normalizedAmplitude * 0.65;
  const rgb = hsvToRgb(hue, saturation, brightness);

  return {
    ...rgb,
    opacity: 0.1 + normalizedAmplitude * 0.9,
  };
}

export function getVortexMarkerColor(charge: number): { r: number; g: number; b: number } {
  if (charge >= 1) {
    return { r: 0.88, g: 0.98, b: 1 };
  }

  return { r: 0.72, g: 0.55, b: 0.96 };
}
