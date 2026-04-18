/**
 * energyFlow.test.ts
 *
 * Phase F: Energy Flow Verification Tests
 *
 * Verifies that energy flow behaves as a dissipative structure:
 * - Energy inflow from sound/light/motion
 * - Energy outflow from maintenance/activity/rewrite costs
 * - Gradual low-activity state under low energy
 * - Structure preservation during low energy
 * - Recovery when environment returns
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialEnergyFlowState,
  updateEnergyFlowState,
  calculateEnergyInflow,
  calculateMaintenanceCost,
  calculateActivityCost,
  calculateRewriteCost,
  calculateLowEnergyPressure,
  calculateRecoveryDrive,
  getEnergyBaselineGainModulation,
  getEnergyRewriteGainModulation,
  getEnergyActivityGainModulation,
} from '../organism/energyFlow';

describe('Phase F: Energy Flow', () => {
  describe('Initial state', () => {
    it('should initialize with appropriate energy reserve', () => {
      const state = createInitialEnergyFlowState();
      expect(state.energyReserve).toBeGreaterThan(0);
      expect(state.energyReserve).toBeLessThanOrEqual(1.5);
      expect(state.structuralIntegrity).toBe(1.0);
      expect(state.lowEnergyPressure).toBe(0);
      expect(state.wasDormantByEnergy).toBe(false);
    });
  });

  describe('Energy inflow', () => {
    it('should calculate inflow from sound novelty and level', () => {
      const inflow = calculateEnergyInflow({
        soundNovelty: 0.8,
        soundLevel: 0.6,
        soundActive: true,
      });
      expect(inflow).toBeGreaterThan(0);
      expect(inflow).toBeLessThanOrEqual(1);
    });

    it('should calculate inflow from light novelty and level', () => {
      const inflow = calculateEnergyInflow({
        lightNovelty: 0.7,
        lightLevel: 0.5,
        lightActive: true,
      });
      expect(inflow).toBeGreaterThan(0);
      expect(inflow).toBeLessThanOrEqual(1);
    });

    it('should calculate inflow from motion novelty and level', () => {
      const inflow = calculateEnergyInflow({
        motionNovelty: 0.9,
        motionLevel: 0.7,
        motionActive: true,
      });
      expect(inflow).toBeGreaterThan(0);
      expect(inflow).toBeLessThanOrEqual(1);
    });

    it('should prioritize novelty over level', () => {
      const highNovelty = calculateEnergyInflow({
        soundNovelty: 0.8,
        soundLevel: 0.2,
        soundActive: true,
      });
      const highLevel = calculateEnergyInflow({
        soundNovelty: 0.2,
        soundLevel: 0.8,
        soundActive: true,
      });
      expect(highNovelty).toBeGreaterThan(highLevel);
    });

    it('should have baseline inflow even without external stimuli', () => {
      const inflow = calculateEnergyInflow({});
      expect(inflow).toBeGreaterThan(0);
    });

    it('should not contribute when modality is inactive', () => {
      const activeInflow = calculateEnergyInflow({
        soundNovelty: 0.8,
        soundLevel: 0.6,
        soundActive: true,
      });
      const inactiveInflow = calculateEnergyInflow({
        soundNovelty: 0.8,
        soundLevel: 0.6,
        soundActive: false,
      });
      expect(activeInflow).toBeGreaterThan(inactiveInflow);
    });
  });

  describe('Energy costs', () => {
    it('should calculate maintenance cost based on node count', () => {
      const cost = calculateMaintenanceCost({ numNodes: 72 });
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1);
    });

    it('should calculate activity cost based on arousal', () => {
      const highArousal = calculateActivityCost({ arousal: 0.8 });
      const lowArousal = calculateActivityCost({ arousal: 0.2 });
      expect(highArousal).toBeGreaterThan(lowArousal);
    });

    it('should calculate rewrite cost based on pressure and load', () => {
      const highRewrite = calculateRewriteCost({
        rewritePressureMean: 0.7,
        globalRewriteLoad: 0.6,
      });
      const lowRewrite = calculateRewriteCost({
        rewritePressureMean: 0.1,
        globalRewriteLoad: 0.1,
      });
      expect(highRewrite).toBeGreaterThan(lowRewrite);
    });
  });

  describe('Case 1: Energy reserve decreases in quiet environment', () => {
    it('should gradually decrease energy reserve without input', () => {
      let state = createInitialEnergyFlowState();
      const initialReserve = state.energyReserve;

      // Simulate 100 frames with no external input
      for (let i = 0; i < 100; i++) {
        state = updateEnergyFlowState(state, {
          soundActive: false,
          lightActive: false,
          motionActive: false,
          arousal: 0.1,
          sigma: 1.0,
        });
      }

      expect(state.energyReserve).toBeLessThan(initialReserve);
      expect(state.energyReserve).toBeGreaterThan(0);
    });
  });

  describe('Case 2: Activity decreases under low energy', () => {
    it('should increase low energy pressure as reserve drops', () => {
      let state = createInitialEnergyFlowState();
      state.energyReserve = 0.2; // Low energy

      const pressure = calculateLowEnergyPressure(state.energyReserve);
      expect(pressure).toBeGreaterThan(0);
    });

    it('should reduce baseline gain modulation under low energy', () => {
      const highEnergyMod = getEnergyBaselineGainModulation(0, 0);
      const lowEnergyMod = getEnergyBaselineGainModulation(0.8, 0);

      expect(lowEnergyMod).toBeLessThan(highEnergyMod);
      expect(lowEnergyMod).toBeGreaterThan(0.6); // Never zero
    });

    it('should reduce rewrite gain modulation significantly under low energy', () => {
      const highEnergyMod = getEnergyRewriteGainModulation(0, 0);
      const lowEnergyMod = getEnergyRewriteGainModulation(0.8, 0);

      expect(lowEnergyMod).toBeLessThan(highEnergyMod);
      expect(lowEnergyMod).toBeGreaterThan(0.4); // Reduced but not zero
    });

    it('should reduce activity gain modulation under low energy', () => {
      const highEnergyMod = getEnergyActivityGainModulation(0, 0);
      const lowEnergyMod = getEnergyActivityGainModulation(0.8, 0);

      expect(lowEnergyMod).toBeLessThan(highEnergyMod);
      expect(lowEnergyMod).toBeGreaterThan(0.5); // Reduced but not zero
    });
  });

  describe('Case 3: Structure is preserved during low energy', () => {
    it('should maintain structural integrity above threshold', () => {
      let state = createInitialEnergyFlowState();

      // Deplete energy
      for (let i = 0; i < 200; i++) {
        state = updateEnergyFlowState(state, {
          soundActive: false,
          lightActive: false,
          motionActive: false,
          arousal: 0.05,
        });
      }

      expect(state.structuralIntegrity).toBeGreaterThanOrEqual(0.5);
      expect(state.structuralIntegrity).toBeLessThanOrEqual(1.0);
    });

    it('should slowly degrade integrity only under sustained critical energy', () => {
      let state = createInitialEnergyFlowState();
      state.energyReserve = 0.1; // Critical energy
      const initialIntegrity = state.structuralIntegrity;

      // Simulate sustained critical energy
      for (let i = 0; i < 1000; i++) {
        state = updateEnergyFlowState(state, {
          soundActive: false,
          lightActive: false,
          motionActive: false,
          arousal: 0.02,
        });
      }

      // Integrity should degrade very slowly
      expect(state.structuralIntegrity).toBeLessThan(initialIntegrity);
      expect(state.structuralIntegrity).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Case 4: Energy inflow increases when input returns', () => {
    it('should increase inflow when sound returns', () => {
      let state = createInitialEnergyFlowState();

      // No input
      state = updateEnergyFlowState(state, {
        soundActive: false,
      });
      const lowInflow = state.energyInflow;

      // Sound returns
      state = updateEnergyFlowState(state, {
        soundNovelty: 0.7,
        soundLevel: 0.5,
        soundActive: true,
      });
      const highInflow = state.energyInflow;

      expect(highInflow).toBeGreaterThan(lowInflow);
    });
  });

  describe('Case 5: Activity gradually returns with energy inflow', () => {
    it('should increase recovery drive when inflow returns', () => {
      let state = createInitialEnergyFlowState();
      state.energyReserve = 0.25; // Low energy

      // No inflow
      state = updateEnergyFlowState(state, {
        soundActive: false,
        lightActive: false,
        motionActive: false,
      });
      const previousInflow = state.energyInflow;

      // Inflow returns
      state = updateEnergyFlowState(state, {
        soundNovelty: 0.8,
        soundLevel: 0.6,
        soundActive: true,
      });

      const recoveryDrive = calculateRecoveryDrive(
        state.energyReserve,
        state.energyInflow,
        previousInflow,
      );

      expect(recoveryDrive).toBeGreaterThan(0);
    });

    it('should gradually recover reserve when inflow exceeds outflow', () => {
      let state = createInitialEnergyFlowState();
      state.energyReserve = 0.2; // Low starting point

      // High inflow, low activity
      for (let i = 0; i < 100; i++) {
        state = updateEnergyFlowState(state, {
          soundNovelty: 0.8,
          soundLevel: 0.6,
          soundActive: true,
          arousal: 0.1,
          sigma: 1.0,
        });
      }

      expect(state.energyReserve).toBeGreaterThan(0.2);
    });
  });

  describe('Case 6: Mode integration', () => {
    it('should track dormancy state', () => {
      let state = createInitialEnergyFlowState();

      // Deplete energy to dormant threshold
      for (let i = 0; i < 300; i++) {
        state = updateEnergyFlowState(state, {
          soundActive: false,
          lightActive: false,
          motionActive: false,
          arousal: 0.02,
        });
      }

      // Check if entered dormancy
      if (state.lowEnergyPressure > 0.7) {
        expect(state.wasDormantByEnergy).toBe(true);
      }
    });
  });

  describe('Case 7: Existing functionality not broken', () => {
    it('should not produce NaN or Infinity values', () => {
      let state = createInitialEnergyFlowState();

      for (let i = 0; i < 100; i++) {
        state = updateEnergyFlowState(state, {
          soundNovelty: Math.random(),
          soundLevel: Math.random(),
          soundActive: Math.random() > 0.5,
          lightNovelty: Math.random(),
          lightLevel: Math.random(),
          lightActive: Math.random() > 0.5,
          motionNovelty: Math.random(),
          motionLevel: Math.random(),
          motionActive: Math.random() > 0.5,
          arousal: Math.random(),
          sigma: 0.9 + Math.random() * 0.2,
          simTime: i,
        });

        expect(Number.isFinite(state.energyReserve)).toBe(true);
        expect(Number.isFinite(state.energyInflow)).toBe(true);
        expect(Number.isFinite(state.energyOutflow)).toBe(true);
        expect(Number.isFinite(state.lowEnergyPressure)).toBe(true);
        expect(Number.isFinite(state.structuralIntegrity)).toBe(true);
      }
    });

    it('should clamp energy reserve within valid range', () => {
      let state = createInitialEnergyFlowState();

      // Run many iterations with extreme values
      for (let i = 0; i < 500; i++) {
        state = updateEnergyFlowState(state, {
          soundNovelty: 1.0,
          soundLevel: 1.0,
          soundActive: true,
          lightNovelty: 1.0,
          lightLevel: 1.0,
          lightActive: true,
          motionNovelty: 1.0,
          motionLevel: 1.0,
          motionActive: true,
          arousal: 1.0,
          sigma: 2.0,
          rewritePressureMean: 1.0,
          globalRewriteLoad: 1.0,
        });

        expect(state.energyReserve).toBeGreaterThanOrEqual(0);
        expect(state.energyReserve).toBeLessThanOrEqual(1.5);
      }
    });
  });
});
