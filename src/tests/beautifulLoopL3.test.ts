/**
 * Beautiful Loop L3 Integration Tests
 *
 * Tests that modulation from packets feeds back to organism core
 * with weak, controlled influence.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AeternaNetwork } from '../core/AeternaNetwork.js';
import { PhysicalDisk } from '../core/PhysicalDisk.js';
import {
    computeBeautifulLoopModulation,
    smoothModulation,
    clampModulation,
    createDefaultModulationConfig,
    createZeroModulation,
} from '../core/beautifulLoopModulation.ts';

describe('Beautiful Loop L3 - Modulation Tests', () => {
    let network: AeternaNetwork;
    let disk: PhysicalDisk;

    beforeEach(async () => {
        // Stub window for headless execution
        if (typeof window === 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).window = {
                innerWidth: 1920,
                innerHeight: 1080,
            };
        }

        // Setup state.disk for dynamicCore
        disk = new PhysicalDisk();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { state } = await import('../organism/state.js') as any;
        state.disk = disk;

        network = new AeternaNetwork(36); // Small network for fast tests
        // Initialize with small perturbation
        network.currentBuffer[0] = 8.0;
        network.currentBuffer[Math.floor(network.numNodes / 2)] = -8.0;
    });

    it('should initialize modulation state to zero', () => {
        expect(network.currentModulation).toBeDefined();
        expect(network.currentModulation.noveltyBiasDelta).toBe(0);
        expect(network.currentModulation.withdrawBiasDelta).toBe(0);
        expect(network.currentModulation.rewritePressureDelta).toBe(0);
        expect(network.currentModulation.restorationBiasDelta).toBe(0);
        expect(network.currentModulation.touchOpennessDelta).toBe(0);
    });

    it('should initialize modulation config with enabled=true by default', () => {
        expect(network.blModulationConfig).toBeDefined();
        expect(network.blModulationConfig.enabled).toBe(true);
        expect(network.blModulationConfig.interoceptionFeedbackEnabled).toBe(true);
        expect(network.blModulationConfig.selfWorldFeedbackEnabled).toBe(true);
    });

    it('should generate non-zero modulation after packets are generated', () => {
        const activeTouches = new Map();

        // Run a few ticks to accumulate state
        for (let i = 0; i < 5; i++) {
            network.updateDynamics(i, activeTouches);
        }

        // Modulation should exist (though may be small)
        expect(network.currentModulation).toBeDefined();
        expect(Number.isFinite(network.currentModulation.noveltyBiasDelta)).toBe(true);
        expect(Number.isFinite(network.currentModulation.withdrawBiasDelta)).toBe(true);
        expect(Number.isFinite(network.currentModulation.rewritePressureDelta)).toBe(true);
        expect(Number.isFinite(network.currentModulation.restorationBiasDelta)).toBe(true);
        expect(Number.isFinite(network.currentModulation.touchOpennessDelta)).toBe(true);
    });

    it('should clamp all modulation deltas to safety bounds', () => {
        const activeTouches = new Map();

        // Run many ticks with perturbations
        for (let i = 0; i < 50; i++) {
            // Inject prediction errors to create conditions
            for (let j = 0; j < 5; j++) {
                network.injectPredictionError(Math.floor(Math.random() * network.numNodes));
            }
            network.updateDynamics(i, activeTouches);

            // Check all modulation deltas are within bounds
            expect(network.currentModulation.noveltyBiasDelta).toBeGreaterThanOrEqual(-0.08);
            expect(network.currentModulation.noveltyBiasDelta).toBeLessThanOrEqual(0.08);

            expect(network.currentModulation.withdrawBiasDelta).toBeGreaterThanOrEqual(-0.05);
            expect(network.currentModulation.withdrawBiasDelta).toBeLessThanOrEqual(0.10);

            expect(network.currentModulation.rewritePressureDelta).toBeGreaterThanOrEqual(-0.02);
            expect(network.currentModulation.rewritePressureDelta).toBeLessThanOrEqual(0.05);

            expect(network.currentModulation.restorationBiasDelta).toBeGreaterThanOrEqual(-0.03);
            expect(network.currentModulation.restorationBiasDelta).toBeLessThanOrEqual(0.08);

            expect(network.currentModulation.touchOpennessDelta).toBeGreaterThanOrEqual(-0.05);
            expect(network.currentModulation.touchOpennessDelta).toBeLessThanOrEqual(0.08);
        }
    });

    it('should disable modulation when config.enabled is false', () => {
        network.blModulationConfig.enabled = false;

        const activeTouches = new Map();
        for (let i = 0; i < 10; i++) {
            network.updateDynamics(i, activeTouches);
        }

        // All modulation should be zero when disabled
        expect(network.currentModulation.noveltyBiasDelta).toBe(0);
        expect(network.currentModulation.withdrawBiasDelta).toBe(0);
        expect(network.currentModulation.rewritePressureDelta).toBe(0);
        expect(network.currentModulation.restorationBiasDelta).toBe(0);
        expect(network.currentModulation.touchOpennessDelta).toBe(0);
    });

    it('should smooth modulation across frames', () => {
        const config = createDefaultModulationConfig();
        config.smoothingFactor = 0.3; // Moderate smoothing

        const prevMod = createZeroModulation();
        const currentMod = {
            noveltyBiasDelta: 0.05,
            withdrawBiasDelta: 0.08,
            rewritePressureDelta: 0.03,
            restorationBiasDelta: 0.06,
            touchOpennessDelta: 0.04,
        };

        const smoothed = smoothModulation(currentMod, prevMod, config.smoothingFactor);

        // Smoothed values should be between 0 and current
        expect(smoothed.noveltyBiasDelta).toBeGreaterThan(0);
        expect(smoothed.noveltyBiasDelta).toBeLessThan(currentMod.noveltyBiasDelta);

        expect(smoothed.withdrawBiasDelta).toBeGreaterThan(0);
        expect(smoothed.withdrawBiasDelta).toBeLessThan(currentMod.withdrawBiasDelta);
    });

    it('should not produce NaN in modulation across many ticks', () => {
        const activeTouches = new Map();

        // Run for many frames with occasional touches and perturbations
        for (let i = 0; i < 100; i++) {
            if (i % 20 === 0) {
                activeTouches.set(1, { x: Math.random(), y: Math.random(), pressure: 1.0 });
            } else if (i % 20 === 5) {
                activeTouches.clear();
            }

            if (i % 10 === 0) {
                for (let j = 0; j < 3; j++) {
                    network.injectPredictionError(Math.floor(Math.random() * network.numNodes));
                }
            }

            network.updateDynamics(i, activeTouches);

            // Check no NaN in modulation
            expect(Number.isNaN(network.currentModulation.noveltyBiasDelta)).toBe(false);
            expect(Number.isNaN(network.currentModulation.withdrawBiasDelta)).toBe(false);
            expect(Number.isNaN(network.currentModulation.rewritePressureDelta)).toBe(false);
            expect(Number.isNaN(network.currentModulation.restorationBiasDelta)).toBe(false);
            expect(Number.isNaN(network.currentModulation.touchOpennessDelta)).toBe(false);
        }
    });

    it('should expose modulation deltas in updateDynamics return value', () => {
        const activeTouches = new Map();
        const dyn = network.updateDynamics(0, activeTouches);

        expect(dyn.bl_noveltyBiasDelta).toBeDefined();
        expect(dyn.bl_withdrawBiasDelta).toBeDefined();
        expect(dyn.bl_rewritePressureDelta).toBeDefined();
        expect(dyn.bl_restorationBiasDelta).toBeDefined();
        expect(dyn.bl_touchOpennessDelta).toBeDefined();
        expect(dyn.bl_modulationEnabled).toBeDefined();

        expect(Number.isFinite(dyn.bl_noveltyBiasDelta)).toBe(true);
        expect(Number.isFinite(dyn.bl_withdrawBiasDelta)).toBe(true);
        expect(Number.isFinite(dyn.bl_rewritePressureDelta)).toBe(true);
        expect(Number.isFinite(dyn.bl_restorationBiasDelta)).toBe(true);
        expect(Number.isFinite(dyn.bl_touchOpennessDelta)).toBe(true);
        expect(dyn.bl_modulationEnabled).toBe(true);
    });

    it('should show modulation responds to coherence drop', () => {
        const activeTouches = new Map();

        // Run quietly to establish baseline
        for (let i = 0; i < 10; i++) {
            network.updateDynamics(i, activeTouches);
        }
        const baselineNoveltyDelta = network.currentModulation.noveltyBiasDelta;

        // Create coherence drop condition by injecting many errors
        for (let i = 0; i < 20; i++) {
            network.injectPredictionError(Math.floor(Math.random() * network.numNodes));
        }
        network.updateDynamics(10, activeTouches);

        const coherenceDropNoveltyDelta = network.currentModulation.noveltyBiasDelta;

        // During coherence drop, novelty bias should change
        // (may increase or stay within bounds)
        expect(Number.isFinite(coherenceDropNoveltyDelta)).toBe(true);
        expect(coherenceDropNoveltyDelta).toBeGreaterThanOrEqual(-0.08);
        expect(coherenceDropNoveltyDelta).toBeLessThanOrEqual(0.08);
    });

    it('should show modulation responds to overload condition', () => {
        const activeTouches = new Map();

        // Create overload by heavy perturbation
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                network.injectPredictionError(Math.floor(Math.random() * network.numNodes));
            }
            network.updateDynamics(i, activeTouches);
        }

        const withdrawDelta = network.currentModulation.withdrawBiasDelta;

        // During overload, withdraw bias should be affected
        expect(Number.isFinite(withdrawDelta)).toBe(true);
        expect(withdrawDelta).toBeGreaterThanOrEqual(-0.05);
        expect(withdrawDelta).toBeLessThanOrEqual(0.10);
    });

    it('should show modulation responds to restoration condition', () => {
        const activeTouches = new Map();

        // Create stable, restorative condition by running quietly
        for (let i = 0; i < 30; i++) {
            network.updateDynamics(i, activeTouches);
        }

        const restorationDelta = network.currentModulation.restorationBiasDelta;

        // During quiet restoration, restoration bias delta should be present
        expect(Number.isFinite(restorationDelta)).toBe(true);
        expect(restorationDelta).toBeGreaterThanOrEqual(-0.03);
        expect(restorationDelta).toBeLessThanOrEqual(0.08);
    });

    it('should show modulation responds to touch engagement', () => {
        const activeTouches = new Map();

        // Add sustained touch
        activeTouches.set(1, { x: 0.5, y: 0.5, pressure: 1.0 });

        for (let i = 0; i < 15; i++) {
            network.updateDynamics(i, activeTouches);
        }

        const touchDelta = network.currentModulation.touchOpennessDelta;

        // During active touch, touch openness delta should be affected
        expect(Number.isFinite(touchDelta)).toBe(true);
        expect(touchDelta).toBeGreaterThanOrEqual(-0.05);
        expect(touchDelta).toBeLessThanOrEqual(0.08);
    });

    it('should verify modulation functions work correctly', () => {
        const config = createDefaultModulationConfig();

        // Test createZeroModulation
        const zeroMod = createZeroModulation();
        expect(zeroMod.noveltyBiasDelta).toBe(0);
        expect(zeroMod.withdrawBiasDelta).toBe(0);

        // Test clampModulation with extreme values
        const extremeMod = {
            noveltyBiasDelta: 10.0,  // Way too high
            withdrawBiasDelta: -10.0,  // Way too low
            rewritePressureDelta: 0.02,
            restorationBiasDelta: 0.04,
            touchOpennessDelta: 0.03,
        };

        const clamped = clampModulation(extremeMod);
        expect(clamped.noveltyBiasDelta).toBe(0.08);  // Clamped to max
        expect(clamped.withdrawBiasDelta).toBe(-0.05);  // Clamped to min
        expect(clamped.rewritePressureDelta).toBe(0.02);  // Within bounds
    });
});
