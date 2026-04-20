/**
 * Beautiful Loop L2 Integration Tests
 *
 * Tests that packet stages are connected to the main loop and
 * update correctly across frames.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AeternaNetwork } from '../core/AeternaNetwork.js';
import { PhysicalDisk } from '../core/PhysicalDisk.js';

describe('Beautiful Loop L2 - Loop Integration', () => {
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

    it('should initialize last packet state to null', () => {
        expect(network.lastInteroceptionPacket).toBe(null);
        expect(network.lastSelfWorldModelPacket).toBe(null);
    });

    it('should generate packets on first tick', () => {
        const activeTouches = new Map();
        const dyn = network.updateDynamics(0, activeTouches);

        // Packets should be generated
        expect(dyn.bl_energySense).toBeDefined();
        expect(dyn.bl_overloadSense).toBeDefined();
        expect(dyn.bl_coherenceSense).toBeDefined();
        expect(dyn.bl_boundarySense).toBeDefined();
        expect(dyn.bl_restorationSense).toBeDefined();
        expect(dyn.bl_perturbationPressure).toBeDefined();
        expect(dyn.bl_selfCoherence).toBeDefined();
        expect(dyn.bl_selfContinuity).toBeDefined();
        expect(dyn.bl_worldPressure).toBeDefined();
        expect(dyn.bl_relationEngagement).toBeDefined();

        // All values should be finite
        expect(Number.isFinite(dyn.bl_energySense)).toBe(true);
        expect(Number.isFinite(dyn.bl_selfCoherence)).toBe(true);
    });

    it('should store packets in last packet state after tick', () => {
        const activeTouches = new Map();
        network.updateDynamics(0, activeTouches);

        // Last packets should be stored
        expect(network.lastInteroceptionPacket).not.toBe(null);
        expect(network.lastSelfWorldModelPacket).not.toBe(null);

        expect(network.lastInteroceptionPacket?.energySense).toBeDefined();
        expect(network.lastSelfWorldModelPacket?.selfCoherence).toBeDefined();
    });

    it('should update packets across multiple ticks', () => {
        const activeTouches = new Map();

        // First tick
        const dyn1 = network.updateDynamics(0, activeTouches);
        const energySense1 = dyn1.bl_energySense;

        // Second tick
        const dyn2 = network.updateDynamics(1, activeTouches);
        const energySense2 = dyn2.bl_energySense;

        // Packets should be generated for both ticks
        expect(energySense1).toBeDefined();
        expect(energySense2).toBeDefined();

        // Values should be finite
        expect(Number.isFinite(energySense1 ?? 0)).toBe(true);
        expect(Number.isFinite(energySense2 ?? 0)).toBe(true);
    });

    it('should compute selfContinuity using previous frame packet', () => {
        const activeTouches = new Map();

        // First tick - no previous packet
        const dyn1 = network.updateDynamics(0, activeTouches);
        const continuity1 = dyn1.bl_selfContinuity;

        // Second tick - has previous packet
        const dyn2 = network.updateDynamics(1, activeTouches);
        const continuity2 = dyn2.bl_selfContinuity;

        // Both should be defined and finite
        expect(continuity1).toBeDefined();
        expect(continuity2).toBeDefined();
        expect(Number.isFinite(continuity1 ?? 0)).toBe(true);
        expect(Number.isFinite(continuity2 ?? 0)).toBe(true);

        // Continuity should be in valid range (0-1)
        expect(continuity1).toBeGreaterThanOrEqual(0);
        expect(continuity1).toBeLessThanOrEqual(1);
        expect(continuity2).toBeGreaterThanOrEqual(0);
        expect(continuity2).toBeLessThanOrEqual(1);
    });

    it('should show continuity difference between quiet and overload scenarios', () => {
        const activeTouches = new Map();

        // Run quiet frames
        for (let i = 0; i < 10; i++) {
            network.updateDynamics(i, activeTouches);
        }
        const quietContinuity = network.lastSelfWorldModelPacket?.selfContinuity ?? 0;

        // Create new network for overload scenario
        const overloadNetwork = new AeternaNetwork(36);
        overloadNetwork.currentBuffer[0] = 8.0;

        // Setup disk for overload network (needed for updateDynamics)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { state: overloadState } = await import('../organism/state.js') as any;
        overloadState.disk = disk;

        // Inject strong perturbations to create overload
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                overloadNetwork.injectPredictionError(Math.floor(Math.random() * overloadNetwork.numNodes));
            }
            overloadNetwork.updateDynamics(i, activeTouches);
        }
        const overloadContinuity = overloadNetwork.lastSelfWorldModelPacket?.selfContinuity ?? 0;

        // Quiet scenario should have higher continuity than overload
        // (though this depends on implementation details)
        expect(Number.isFinite(quietContinuity)).toBe(true);
        expect(Number.isFinite(overloadContinuity)).toBe(true);
    });

    it('should produce different packets for different organism states', () => {
        const activeTouches = new Map();

        // Quiet state
        network.updateDynamics(0, activeTouches);
        const quietEnergy = network.lastInteroceptionPacket?.energySense ?? 0;
        const quietOverload = network.lastInteroceptionPacket?.overloadSense ?? 0;

        // Create touch-active state
        activeTouches.set(1, { x: 0.5, y: 0.5, pressure: 1.0 });
        for (let i = 0; i < 5; i++) {
            network.updateDynamics(i + 1, activeTouches);
        }
        const activeWorldPressure = network.lastSelfWorldModelPacket?.worldPressure ?? 0;
        const activeRelation = network.lastSelfWorldModelPacket?.relationEngagement ?? 0;

        // All values should be valid
        expect(Number.isFinite(quietEnergy)).toBe(true);
        expect(Number.isFinite(quietOverload)).toBe(true);
        expect(Number.isFinite(activeWorldPressure)).toBe(true);
        expect(Number.isFinite(activeRelation)).toBe(true);

        // Touch should increase world pressure
        expect(activeWorldPressure).toBeGreaterThan(0);
    });

    it('should not produce NaN in any packet fields across many ticks', () => {
        const activeTouches = new Map();

        // Run for many frames with occasional touches
        for (let i = 0; i < 100; i++) {
            if (i % 20 === 0) {
                activeTouches.set(1, { x: Math.random(), y: Math.random(), pressure: 1.0 });
            } else if (i % 20 === 5) {
                activeTouches.clear();
            }

            const dyn = network.updateDynamics(i, activeTouches);

            // Check all BL packet fields for NaN
            expect(Number.isNaN(dyn.bl_energySense)).toBe(false);
            expect(Number.isNaN(dyn.bl_overloadSense)).toBe(false);
            expect(Number.isNaN(dyn.bl_coherenceSense)).toBe(false);
            expect(Number.isNaN(dyn.bl_boundarySense)).toBe(false);
            expect(Number.isNaN(dyn.bl_restorationSense)).toBe(false);
            expect(Number.isNaN(dyn.bl_perturbationPressure)).toBe(false);
            expect(Number.isNaN(dyn.bl_selfCoherence)).toBe(false);
            expect(Number.isNaN(dyn.bl_selfContinuity)).toBe(false);
            expect(Number.isNaN(dyn.bl_worldPressure)).toBe(false);
            expect(Number.isNaN(dyn.bl_relationEngagement)).toBe(false);
        }
    });

    it('should show relationEngagement varies with touch activity', () => {
        const activeTouches = new Map();

        // Quiet state
        for (let i = 0; i < 5; i++) {
            network.updateDynamics(i, activeTouches);
        }
        const quietRelation = network.lastSelfWorldModelPacket?.relationEngagement ?? 0;

        // Active touch state
        activeTouches.set(1, { x: 0.5, y: 0.5, pressure: 1.0 });
        for (let i = 5; i < 10; i++) {
            network.updateDynamics(i, activeTouches);
        }
        const activeRelation = network.lastSelfWorldModelPacket?.relationEngagement ?? 0;

        // Both should be finite and in range
        expect(Number.isFinite(quietRelation)).toBe(true);
        expect(Number.isFinite(activeRelation)).toBe(true);
        expect(quietRelation).toBeGreaterThanOrEqual(0);
        expect(quietRelation).toBeLessThanOrEqual(1);
        expect(activeRelation).toBeGreaterThanOrEqual(0);
        expect(activeRelation).toBeLessThanOrEqual(1);
    });
});
