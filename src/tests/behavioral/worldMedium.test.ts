/**
 * World Medium Behavioral Tests
 *
 * W3: Unit tests for World Medium functionality
 */

import { describe, it, expect } from 'vitest';
import { initializeWorldMediumState } from '../../world/initializeWorldMediumState.ts';
import { updateWorldMedium } from '../../world/updateWorldMedium.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';

describe('World Medium State', () => {
  describe('initializeWorldMediumState', () => {
    it('should create valid initial state', () => {
      const state = initializeWorldMediumState();

      // timestamp is simulated time in ms (0 at t=0), not Date.now() - see
      // initializeWorldMediumState.ts and docs/vessel/vessel-roadmap.md K1.
      expect(state.timestamp).toBe(0);
      expect(state.ambientLight).toBeGreaterThanOrEqual(0);
      expect(state.ambientLight).toBeLessThanOrEqual(1);
      expect(state.ambientNoise).toBeGreaterThanOrEqual(0);
      expect(state.ambientNoise).toBeLessThanOrEqual(1);
      expect(state.surfaceResistance).toBeGreaterThanOrEqual(0);
      expect(state.surfaceResistance).toBeLessThanOrEqual(1);
      expect(state.mediumStability).toBeGreaterThanOrEqual(0);
      expect(state.mediumStability).toBeLessThanOrEqual(1);
    });

    it('should have no initial pulse impact', () => {
      const state = initializeWorldMediumState();
      expect(state.lastPulseImpact).toBe(0);
    });

    it('should have moderate baseline values', () => {
      const state = initializeWorldMediumState();
      expect(state.ambientLight).toBeCloseTo(0.5, 1);
      expect(state.mediumStability).toBeGreaterThan(0.5);
    });

    it('should have no NaN or Infinity values', () => {
      const state = initializeWorldMediumState();
      Object.values(state).forEach((value) => {
        if (typeof value === 'number') {
          expect(Number.isFinite(value)).toBe(true);
        }
      });
    });
  });

  describe('updateWorldMedium', () => {
    it('should update timestamp', () => {
      const state = initializeWorldMediumState();
      const oldTimestamp = state.timestamp;
      const updated = updateWorldMedium(state, null, 1 / 60);
      expect(updated.timestamp).toBeGreaterThanOrEqual(oldTimestamp);
    });

    it('should maintain finite values without pulse', () => {
      let state = initializeWorldMediumState();
      const dt = 1 / 60;

      for (let i = 0; i < 100; i++) {
        state = updateWorldMedium(state, null, dt);

        Object.values(state).forEach((value) => {
          if (typeof value === 'number') {
            expect(Number.isFinite(value)).toBe(true);
          }
        });
      }
    });

    it('should allow natural drift without pulse', () => {
      const state = initializeWorldMediumState();
      const dt = 1 / 60;

      const states = [state];
      for (let i = 0; i < 60; i++) {
        states.push(updateWorldMedium(states[states.length - 1], null, dt));
      }

      // Check that at least some values changed
      const initialLight = states[0].ambientLight;
      const finalLight = states[states.length - 1].ambientLight;

      // Due to decay and drift, values should change
      const somethingChanged =
        Math.abs(finalLight - initialLight) > 0.001 ||
        Math.abs(states[states.length - 1].motionDrift - states[0].motionDrift) > 0.001;

      expect(somethingChanged).toBe(true);
    });

    it('should decay lastPulseImpact without pulse', () => {
      let state = initializeWorldMediumState();
      state.lastPulseImpact = 0.8;

      const dt = 1 / 60;
      for (let i = 0; i < 60; i++) {
        state = updateWorldMedium(state, null, dt);
      }

      expect(state.lastPulseImpact).toBeLessThan(0.8);
    });

    it('should decay echoLevel without pulse', () => {
      let state = initializeWorldMediumState();
      state.echoLevel = 0.7;

      const dt = 1 / 60;
      for (let i = 0; i < 60; i++) {
        state = updateWorldMedium(state, null, dt);
      }

      expect(state.echoLevel).toBeLessThan(0.7);
    });

    describe('with visual pulse', () => {
      it('should increase ambientLight', () => {
        const state = initializeWorldMediumState();
        const initialLight = state.ambientLight;

        const visualPulse: ActuationPulse = {
          timestamp: Date.now(),
          channel: 'visual',
          intensity: 0.6,
          coherence: 0.7,
          rhythm: 0.5,
          locality: 0.3,
          recoveryLinked: 0.2,
          boundaryLinked: 0.3,
          traceLinked: 0.4,
          outputReadiness: 0.5,
        };

        const updated = updateWorldMedium(state, visualPulse, 1 / 60);
        expect(updated.ambientLight).toBeGreaterThan(initialLight);
      });

      it('should increase visualResidue', () => {
        const state = initializeWorldMediumState();
        const initialResidue = state.visualResidue ?? 0;

        const visualPulse: ActuationPulse = {
          timestamp: Date.now(),
          channel: 'visual',
          intensity: 0.7,
          coherence: 0.6,
          rhythm: 0.5,
          locality: 0.4,
          recoveryLinked: 0.2,
          boundaryLinked: 0.3,
          traceLinked: 0.4,
          outputReadiness: 0.5,
        };

        const updated = updateWorldMedium(state, visualPulse, 1 / 60);
        expect(updated.visualResidue).toBeGreaterThan(initialResidue);
      });

      it('should increase echoLevel', () => {
        const state = initializeWorldMediumState();
        const initialEcho = state.echoLevel;

        const visualPulse: ActuationPulse = {
          timestamp: Date.now(),
          channel: 'visual',
          intensity: 0.6,
          coherence: 0.7,
          rhythm: 0.5,
          locality: 0.3,
          recoveryLinked: 0.2,
          boundaryLinked: 0.3,
          traceLinked: 0.4,
          outputReadiness: 0.5,
        };

        const updated = updateWorldMedium(state, visualPulse, 1 / 60);
        expect(updated.echoLevel).toBeGreaterThan(initialEcho);
      });
    });

    describe('with simulatedForce pulse', () => {
      it('should increase surfaceResistance', () => {
        const state = initializeWorldMediumState();
        const initialResistance = state.surfaceResistance;

        const forcePulse: ActuationPulse = {
          timestamp: Date.now(),
          channel: 'simulatedForce',
          intensity: 0.65,
          coherence: 0.6,
          rhythm: 0.4,
          locality: 0.5,
          recoveryLinked: 0.3,
          boundaryLinked: 0.6,
          traceLinked: 0.2,
          outputReadiness: 0.45,
        };

        const updated = updateWorldMedium(state, forcePulse, 1 / 60);
        expect(updated.surfaceResistance).toBeGreaterThan(initialResistance);
      });

      it('should increase motionDrift', () => {
        const state = initializeWorldMediumState();
        const initialDrift = state.motionDrift;

        const forcePulse: ActuationPulse = {
          timestamp: Date.now(),
          channel: 'simulatedForce',
          intensity: 0.7,
          coherence: 0.6,
          rhythm: 0.4,
          locality: 0.5,
          recoveryLinked: 0.3,
          boundaryLinked: 0.6,
          traceLinked: 0.2,
          outputReadiness: 0.45,
        };

        const updated = updateWorldMedium(state, forcePulse, 1 / 60);
        expect(updated.motionDrift).toBeGreaterThan(initialDrift);
      });

      it('should increase fieldTemperature', () => {
        const state = initializeWorldMediumState();
        const initialTemp = state.fieldTemperature;

        const forcePulse: ActuationPulse = {
          timestamp: Date.now(),
          channel: 'simulatedForce',
          intensity: 0.65,
          coherence: 0.6,
          rhythm: 0.4,
          locality: 0.5,
          recoveryLinked: 0.3,
          boundaryLinked: 0.6,
          traceLinked: 0.2,
          outputReadiness: 0.45,
        };

        const updated = updateWorldMedium(state, forcePulse, 1 / 60);
        expect(updated.fieldTemperature).toBeGreaterThan(initialTemp);
      });

      it('should increase forceResidue', () => {
        const state = initializeWorldMediumState();
        const initialResidue = state.forceResidue ?? 0;

        const forcePulse: ActuationPulse = {
          timestamp: Date.now(),
          channel: 'simulatedForce',
          intensity: 0.7,
          coherence: 0.6,
          rhythm: 0.4,
          locality: 0.5,
          recoveryLinked: 0.3,
          boundaryLinked: 0.6,
          traceLinked: 0.2,
          outputReadiness: 0.45,
        };

        const updated = updateWorldMedium(state, forcePulse, 1 / 60);
        expect(updated.forceResidue).toBeGreaterThan(initialResidue);
      });
    });

    it('should update lastPulseImpact when pulse is applied', () => {
      const state = initializeWorldMediumState();
      const initialImpact = state.lastPulseImpact;

      const pulse: ActuationPulse = {
        timestamp: Date.now(),
        channel: 'visual',
        intensity: 0.6,
        coherence: 0.7,
        rhythm: 0.5,
        locality: 0.3,
        recoveryLinked: 0.2,
        boundaryLinked: 0.3,
        traceLinked: 0.4,
        outputReadiness: 0.5,
      };

      const updated = updateWorldMedium(state, pulse, 1 / 60);
      expect(updated.lastPulseImpact).toBeGreaterThan(initialImpact);
    });

    it('should keep all values in [0, 1] range even with extreme pulses', () => {
      let state = initializeWorldMediumState();

      const extremePulse: ActuationPulse = {
        timestamp: Date.now(),
        channel: 'visual',
        intensity: 1.0,
        coherence: 1.0,
        rhythm: 1.0,
        locality: 1.0,
        recoveryLinked: 1.0,
        boundaryLinked: 1.0,
        traceLinked: 1.0,
        outputReadiness: 1.0,
      };

      // Apply extreme pulse multiple times
      for (let i = 0; i < 10; i++) {
        state = updateWorldMedium(state, extremePulse, 1 / 60);
      }

      // All values should remain in valid range
      expect(state.ambientLight).toBeGreaterThanOrEqual(0);
      expect(state.ambientLight).toBeLessThanOrEqual(1);
      expect(state.echoLevel).toBeGreaterThanOrEqual(0);
      expect(state.echoLevel).toBeLessThanOrEqual(1);
      expect(state.mediumStability).toBeGreaterThanOrEqual(0);
      expect(state.mediumStability).toBeLessThanOrEqual(1);
    });

    it('should not produce NaN or Infinity with repeated updates', () => {
      let state = initializeWorldMediumState();
      const dt = 1 / 60;

      for (let i = 0; i < 1000; i++) {
        const pulse =
          i % 10 === 0
            ? ({
                timestamp: Date.now(),
                channel: i % 20 === 0 ? 'visual' : 'simulatedForce',
                intensity: Math.random(),
                coherence: Math.random(),
                rhythm: Math.random(),
                locality: Math.random(),
                recoveryLinked: 0.3,
                boundaryLinked: 0.4,
                traceLinked: 0.3,
                outputReadiness: Math.random(),
              } as ActuationPulse)
            : null;

        state = updateWorldMedium(state, pulse, dt);

        Object.values(state).forEach((value) => {
          if (typeof value === 'number') {
            expect(Number.isFinite(value)).toBe(true);
          }
        });
      }
    });
  });
});
