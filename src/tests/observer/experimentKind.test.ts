import { describe, expect, it } from 'vitest';
import { PRESET_EXPERIMENT_REGISTRY } from '../../scenario/presetExperimentRegistry.ts';
import {
  EXPERIMENT_KINDS,
  createNoEmergenceResult,
  normalizeObservationResult,
  requireExperimentKind,
} from '../../observer/experimentKind.ts';

describe('experimentKind phase0 helpers', () => {
  it('supports all required experiment kinds', () => {
    expect(EXPERIMENT_KINDS).toEqual(['observation', 'intervention', 'scout', 'null_check']);
  });

  it('normalizes null observation to no_emergence record', () => {
    expect(normalizeObservationResult(null, 'not observed')).toEqual({
      status: 'no_emergence',
      reason: 'not observed',
    });
  });

  it('preserves concrete observation payloads', () => {
    const payload = { value: 0.42, stable: true };
    expect(normalizeObservationResult(payload, 'fallback')).toEqual(payload);
  });

  it('creates no-emergence records with non-empty fallback', () => {
    expect(createNoEmergenceResult('   ')).toEqual({
      status: 'no_emergence',
      reason: 'No emergence observed under the current conditions.',
    });
  });

  it('requires experimentKind in every preset experiment', () => {
    for (const experiment of PRESET_EXPERIMENT_REGISTRY) {
      expect(() => requireExperimentKind(experiment)).not.toThrow();
    }
  });
});
