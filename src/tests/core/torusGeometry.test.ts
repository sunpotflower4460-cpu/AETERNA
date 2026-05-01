import { describe, expect, it } from 'vitest';
// @ts-expect-error — AeternaNetwork is plain JS without type declarations
import { AeternaNetwork } from '../../core/AeternaNetwork.js';
import {
  createFlatTorusMetricGeometry,
  createTorusGeometry,
} from '../../core/torusGeometry.js';

describe('torusGeometry', () => {
  it('creates one geometry cell per torus grid cell', () => {
    const geometry = createTorusGeometry({
      segments: 8,
      majorRadius: 2,
      minorRadius: 0.7,
    });

    expect(geometry.cells).toHaveLength(64);
    expect(geometry.minAreaElement).toBeGreaterThan(0);
  });

  it('computes finite area and curvature values with signed inner/outer curvature', () => {
    const geometry = createTorusGeometry({
      segments: 8,
      majorRadius: 2,
      minorRadius: 0.7,
    });
    const outerCell = geometry.cells.find((cell) => cell.j === 0);
    const innerCell = geometry.cells.find((cell) => cell.j === 4);

    expect(outerCell?.areaElement).toBeGreaterThan(0);
    expect(Number.isFinite(outerCell?.gaussianCurvature ?? NaN)).toBe(true);
    expect(Number.isFinite(innerCell?.meanCurvature ?? NaN)).toBe(true);
    expect(outerCell?.gaussianCurvature ?? 0).toBeGreaterThan(0);
    expect(innerCell?.gaussianCurvature ?? 0).toBeLessThan(0);
  });

  it('normalizes normal and tangent vectors', () => {
    const geometry = createTorusGeometry({
      segments: 8,
      majorRadius: 2,
      minorRadius: 0.7,
    });
    const cell = geometry.cells[7];
    const magnitudes = [
      Math.hypot(...cell.normal),
      Math.hypot(...cell.majorTangent),
      Math.hypot(...cell.minorTangent),
    ];

    magnitudes.forEach((magnitude) => {
      expect(magnitude).toBeCloseTo(1, 5);
    });
  });

  it('falls back to a safe major radius when majorRadius is not greater than minorRadius', () => {
    const geometry = createTorusGeometry({
      segments: 8,
      majorRadius: 0.5,
      minorRadius: 0.7,
    });

    expect(geometry.config.majorRadius).toBeGreaterThan(geometry.config.minorRadius);
    expect(geometry.validationWarnings?.[0]).toContain('majorRadius');
  });

  it('supports a flat metric view for ablation without changing topology', () => {
    const curvedGeometry = createTorusGeometry({
      segments: 8,
      majorRadius: 2,
      minorRadius: 0.7,
    });
    const flatGeometry = createFlatTorusMetricGeometry(curvedGeometry);

    expect(flatGeometry.cells).toHaveLength(curvedGeometry.cells.length);
    expect(flatGeometry.cells.every((cell) => cell.areaElement === 1)).toBe(true);
    expect(flatGeometry.cells.every((cell) => cell.gaussianCurvature === 0)).toBe(true);
    expect(flatGeometry.cells.every((cell) => cell.meanCurvature === 0)).toBe(true);
  });

  it('keeps AeternaNetwork in flat mode by default and exposes curved geometry on demand', () => {
    const network = new AeternaNetwork(8);

    expect(network.torusMetricConfig.metricMode).toBe('flat');
    expect(network.torusGeometry.cells.every((cell) => cell.gaussianCurvature === 0)).toBe(true);

    network.setTorusMetricMode('curved');

    expect(network.torusMetricConfig.metricMode).toBe('curved');
    expect(network.torusGeometry.cells.some((cell) => cell.gaussianCurvature > 0)).toBe(true);
    expect(network.torusGeometry.cells.some((cell) => cell.gaussianCurvature < 0)).toBe(true);
  });
});
