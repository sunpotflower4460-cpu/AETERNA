import { describe, expect, it } from 'vitest';
import {
  createFlatTorusMetricGeometry,
  createTorusGeometry,
} from '../../core/torusGeometry.js';
import { deriveTorusCurvatureObservation } from '../../observer/deriveTorusCurvatureObservation.js';

describe('deriveTorusCurvatureObservation', () => {
  it('summarizes curved torus asymmetry and signed curvature regions', () => {
    const geometry = createTorusGeometry({
      segments: 8,
      majorRadius: 2,
      minorRadius: 0.7,
    });
    const observation = deriveTorusCurvatureObservation({
      geometry,
      timestamp: 12,
    });

    expect(observation.timestamp).toBe(12);
    expect(observation.positiveCurvatureRegionCount).toBeGreaterThan(0);
    expect(observation.negativeCurvatureRegionCount).toBeGreaterThan(0);
    expect(observation.outerRimRegionCount).toBeGreaterThan(0);
    expect(observation.innerRimRegionCount).toBeGreaterThan(0);
    expect(observation.curvatureAsymmetry).toBeGreaterThan(0);
    expect(observation.geometryConfidence).toBe(1);
  });

  it('collapses to zero curvature in flat metric mode while retaining confidence', () => {
    const curvedGeometry = createTorusGeometry({
      segments: 8,
      majorRadius: 2,
      minorRadius: 0.7,
    });
    const observation = deriveTorusCurvatureObservation({
      geometry: createFlatTorusMetricGeometry(curvedGeometry),
      timestamp: 24,
    });

    expect(observation.minGaussianCurvature).toBe(0);
    expect(observation.maxGaussianCurvature).toBe(0);
    expect(observation.averageMeanCurvature).toBe(0);
    expect(observation.positiveCurvatureRegionCount).toBe(0);
    expect(observation.negativeCurvatureRegionCount).toBe(0);
    expect(observation.curvatureAsymmetry).toBe(0);
    expect(observation.geometryConfidence).toBe(1);
  });
});
