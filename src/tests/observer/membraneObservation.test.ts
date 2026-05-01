import { describe, expect, it } from 'vitest';

import { createMembraneState, updateMembraneState } from '../../boundary/membrane.ts';
import { defaultMembraneConfig } from '../../config/membraneConfig.ts';
import { deriveMembraneObservation } from '../../observer/deriveMembraneObservation.ts';

describe('deriveMembraneObservation', () => {
  it('derives overlap, recovery balance, and integrity from membrane state', () => {
    const initial = createMembraneState({ segments: 4, timestamp: 0 });
    const updated = updateMembraneState({
      previous: updateMembraneState({
        previous: initial,
        actuationPulse: {
          timestamp: 1,
          channel: 'visual',
          intensity: 0.8,
          coherence: 0.8,
          rhythm: 0.3,
          locality: 0.9,
          recoveryLinked: 0.3,
          boundaryLinked: 0.7,
          traceLinked: 0.2,
          outputReadiness: 0.7,
        },
        config: defaultMembraneConfig,
        timestamp: 1,
        dt: 1,
      }),
      sensoryReturns: [{
        timestamp: 2,
        channel: 'simulatedLight',
        intensity: 0.75,
        novelty: 0.2,
        locality: 0.85,
        rhythm: 0.2,
        worldOriginStrength: 0.8,
        returnDelayHint: 0.4,
        mediumStabilityHint: 0.7,
      }],
      config: defaultMembraneConfig,
      timestamp: 2,
      dt: 1,
    });

    const observation = deriveMembraneObservation(updated);
    expect(observation.actuationReturnOverlap).toBeGreaterThan(0);
    expect(observation.averageTwoSidedness).toBeGreaterThan(0);
    expect(observation.membraneIntegrity).toBeGreaterThanOrEqual(0);
    expect(observation.membraneIntegrity).toBeLessThanOrEqual(1);
    expect(observation.observationConfidence).toBeGreaterThan(0);
  });

  it('handles missing membrane state safely', () => {
    const observation = deriveMembraneObservation(null);
    expect(observation.averageDeformation).toBe(0);
    expect(observation.membraneIntegrity).toBe(1);
    expect(observation.nanOrInfinityCount).toBe(0);
  });
});
