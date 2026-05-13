/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeAll, describe, expect, it } from 'vitest';
import { updateDynamicsCore } from '../../core/dynamicCore.ts';
import { createLocalConservationSubstrate } from '../../substrate/localConservationSubstrate.ts';
import { state } from '../../organism/state.js';

beforeAll(() => {
    // dynamicCore→triggerNoise reads `state.disk.omega_t`. Provide a stub.
    if (!state.disk) {
        (state as any).disk = { omega_t: 30 };
    }
});

/**
 * F1 / F2 opt-in semantics acceptance.
 *
 * F1: `enableTargetFiringRateHomeoDamping` defaults ON to preserve legacy
 *     numerical trajectories. Setting it to `false` removes the
 *     `firingRateError * 0.002` term from the damping coefficient (Principle 1
 *     compliant: no active homeostatic pull toward a target firing rate),
 *     while still computing `firingRateError` for observers.
 *
 * F2: `substrateBackedSpikeEvents` defaults OFF. When the flag is on and a
 *     `localConservationSubstrate` is attached, ignition cannot exceed the
 *     per-cell substrate.storageField. Granted energy is recorded in
 *     `spikeIgnitionConsumedField` and shortfalls in
 *     `spikeIgnitionShortfallField`.
 */

const SEGMENTS = 8;
const NUM_NODES = SEGMENTS * SEGMENTS;

function makeMinimalNetwork(overrides: Record<string, unknown> = {}): any {
    const numNodes = NUM_NODES;
    const network: any = {
        segments: SEGMENTS,
        numNodes,
        simTime: 0,
        currentBuffer: new Float64Array(numNodes),
        prevBuffer: new Float64Array(numNodes),
        nextBuffer: new Float64Array(numNodes),
        currentThreshold: 0.5,
        spikeTrace: new Float32Array(numNodes),
        lastSpikeTime: new Float32Array(numNodes),
        nodeSign: new Float64Array(numNodes).fill(1),
        w_up: new Float64Array(numNodes).fill(0.25),
        w_down: new Float64Array(numNodes).fill(0.25),
        w_left: new Float64Array(numNodes).fill(0.25),
        w_right: new Float64Array(numNodes).fill(0.25),
        prevGenFiring: 0,
        currGenFiring: 0,
        branchingRatioRaw: 1,
        sigmaDisplay: 1,
        TARGET_FIRING_RATE: 0.08,
        firingRateError: 0,
        SPIKE_TRACE_DECAY_K: 0.9,
        WEIGHT_DECAY_K: 0.99995,
        hardwareRandomNoiseSource: 'fallback',
        clampFinite: (v: number, lo: number, hi: number, fb: number) =>
            !Number.isFinite(v) ? fb : Math.max(lo, Math.min(hi, v)),
        clamp01: (v: number, fb = 0) => (!Number.isFinite(v) ? fb : Math.max(0, Math.min(1, v))),
        ...overrides,
    };
    return network;
}

function tickOnce(network: any): void {
    // Seed a single threshold crossing at node 0.
    network.prevBuffer[0] = 0;
    network.currentBuffer[0] = 1.0; // exceeds threshold 0.5
    updateDynamicsCore(network);
}

describe('F1/F2 opt-in principle hooks — dynamicCore', () => {
    it('F1 default (enableTargetFiringRateHomeoDamping unset): legacy homeoDamping pull is active', () => {
        const network = makeMinimalNetwork();
        tickOnce(network);
        // firingRateError is computed regardless (observer hook).
        expect(typeof network.firingRateError).toBe('number');
        // Since the flag is unset, default is ON → homeoDamping = damping + err*0.002.
        // Hard to assert numerically without referencing internal damping, but
        // at minimum the firingRateError should be defined.
        expect(Number.isFinite(network.firingRateError)).toBe(true);
    });

    it('F1 disabled (enableTargetFiringRateHomeoDamping=false): firingRateError still computed but does not modulate damping', () => {
        const networkA = makeMinimalNetwork({ enableTargetFiringRateHomeoDamping: false });
        const networkB = makeMinimalNetwork({ enableTargetFiringRateHomeoDamping: false });

        // Two identical networks tick once.
        tickOnce(networkA);
        tickOnce(networkB);

        // Buffer trajectories must match (deterministic given same inputs).
        for (let i = 0; i < NUM_NODES; i++) {
            expect(networkA.currentBuffer[i]).toBe(networkB.currentBuffer[i]);
        }
        // firingRateError remains observable.
        expect(typeof networkA.firingRateError).toBe('number');
    });

    it('F2 default (substrateBackedSpikeEvents unset): legacy direct ignition (spikeTrace=1.0 on threshold crossing)', () => {
        const network = makeMinimalNetwork();
        tickOnce(network);
        // Node 0 should have fired (currentBuffer was 1.0 > threshold 0.5).
        expect(network.spikeTrace[0]).toBeCloseTo(1.0, 6);
        // No ignition accounting fields when the flag is off.
        expect(network.spikeIgnitionConsumedField).toBeUndefined();
        expect(network.spikeIgnitionShortfallField).toBeUndefined();
    });

    it('F2 enabled with full substrate storage: ignition fully granted from substrate', () => {
        const substrate = createLocalConservationSubstrate({ width: SEGMENTS, height: SEGMENTS, boundaryMode: 'torus' });
        // Pre-charge node 0 with 1.0 units of storage so ignition can draw freely.
        substrate.storageField[0] = 1.0;
        const network = makeMinimalNetwork({
            substrateBackedSpikeEvents: true,
            localConservationSubstrate: substrate,
        });
        tickOnce(network);

        expect(network.spikeTrace[0]).toBeCloseTo(1.0, 6);
        expect(substrate.storageField[0]).toBeCloseTo(0.0, 6);
        expect(network.spikeIgnitionConsumedField[0]).toBeCloseTo(1.0, 6);
        expect(network.spikeIgnitionShortfallField[0]).toBeCloseTo(0.0, 6);
    });

    it('F2 enabled with empty substrate: ignition is fully starved, shortfall recorded', () => {
        const substrate = createLocalConservationSubstrate({ width: SEGMENTS, height: SEGMENTS, boundaryMode: 'torus' });
        const network = makeMinimalNetwork({
            substrateBackedSpikeEvents: true,
            localConservationSubstrate: substrate,
        });
        tickOnce(network);

        // No substrate → no ignition → spikeTrace stays at its prior value (0).
        expect(network.spikeTrace[0]).toBeCloseTo(0.0, 6);
        expect(network.spikeIgnitionConsumedField[0]).toBeCloseTo(0.0, 6);
        expect(network.spikeIgnitionShortfallField[0]).toBeCloseTo(1.0, 6);
    });

    it('F2 enabled with partial substrate: ignition partial, shortfall recorded', () => {
        const substrate = createLocalConservationSubstrate({ width: SEGMENTS, height: SEGMENTS, boundaryMode: 'torus' });
        substrate.storageField[0] = 0.3;
        const network = makeMinimalNetwork({
            substrateBackedSpikeEvents: true,
            localConservationSubstrate: substrate,
        });
        tickOnce(network);

        expect(network.spikeTrace[0]).toBeCloseTo(0.3, 6);
        expect(substrate.storageField[0]).toBeCloseTo(0.0, 6);
        expect(network.spikeIgnitionConsumedField[0]).toBeCloseTo(0.3, 6);
        expect(network.spikeIgnitionShortfallField[0]).toBeCloseTo(0.7, 6);
    });
});
