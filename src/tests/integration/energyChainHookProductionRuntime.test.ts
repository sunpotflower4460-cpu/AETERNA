/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, expect, it } from 'vitest';
import {
    ensureEnergyChainState,
    applyEnergyChainInflowTick,
    applyEnergyChainOutflowTick,
    isEnergyChainFullyClosed,
    buildNowSummaryConservationInput,
    deriveChainOnlyNowSummary,
    getChainLedgerStatusesForNowSummary,
} from '../../experiments/energyChainHook.ts';
import { deriveNowSummaryPanel } from '../../observer/deriveNowSummary.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { MembraneCell, MembraneState } from '../../types/membraneState.ts';

const WIDTH = 4;
const HEIGHT = 4;
const SIZE = WIDTH * HEIGHT;

function makeMembrane(): MembraneState {
    const cells: MembraneCell[] = [];
    for (let i = 0; i < SIZE; i++) {
        cells.push({
            regionId: `u${Math.floor(i / WIDTH)}-v${i % WIDTH}`,
            index: i,
            permeability: 0.5,
            tension: 0.5,
            deformation: 0,
            recovery: 1,
            actuationImprint: 0,
            returnImprint: 0,
            twoSidedness: 0,
            localResistance: 0.5,
            localAttenuation: 0.1,
            confidence: 1,
        });
    }
    return {
        timestamp: 0,
        segments: WIDTH,
        cells,
        averagePermeability: 0.5,
        averageTension: 0.5,
        averageDeformation: 0,
        averageRecovery: 1,
        averageActuationImprint: 0,
        averageReturnImprint: 0,
        averageTwoSidedness: 0,
        maxDeformation: 0,
        deformationVariance: 0,
        membraneIntegrity: 1,
        membraneConfidence: 1,
        nanOrInfinityCount: 0,
    };
}

function makePulse(): ActuationPulse {
    return {
        timestamp: 1,
        channel: 'visual',
        intensity: 0.5,
        coherence: 0.7,
        rhythm: 0.4,
        locality: 0.3,
        recoveryLinked: 0.0,
        boundaryLinked: 0.0,
        traceLinked: 0.0,
        outputReadiness: 0.6,
    };
}

describe('energyChainHook — G4 production-runtime end-to-end acceptance', () => {
    it('default (no enableEnergyChain): every helper is a no-op and the network is untouched', () => {
        const network: any = {};
        expect(ensureEnergyChainState(network, { width: WIDTH, height: HEIGHT, steadyDrivePerCell: 0.2 })).toBeNull();
        expect(applyEnergyChainInflowTick(network, 0)).toBeNull();
        expect(applyEnergyChainOutflowTick(network, 0, null, makeMembrane())).toBeNull();
        expect(getChainLedgerStatusesForNowSummary(network)).toBeNull();
        expect(isEnergyChainFullyClosed(network)).toBe(false);
        expect(buildNowSummaryConservationInput(network)).toEqual({});
        expect(deriveChainOnlyNowSummary(network, 0)).toBeNull();

        // Network must remain free of chain artifacts.
        expect(network.energyChain).toBeUndefined();
        expect(network.chainLedgerStatuses).toBeUndefined();
        expect(network.localConservationSubstrate).toBeUndefined();
    });

    it('enabled: drives the full chain for 100 ticks with all 7 ledgers reported (inflow + outflow)', () => {
        const network: any = { enableEnergyChain: true };
        const injection = new Float64Array(SIZE);
        for (let i = 0; i < SIZE; i++) injection[i] = 0.05;

        const chain = ensureEnergyChainState(network, {
            width: WIDTH,
            height: HEIGHT,
            steadyDrivePerCell: 0.2,
            bufferInjectionRequestPerCell: injection,
        });
        expect(chain).not.toBeNull();
        expect(network.localConservationSubstrate).toBeDefined();

        const membrane = makeMembrane();
        const pulse = makePulse();

        for (let t = 0; t < 100; t++) {
            applyEnergyChainInflowTick(network, t);
            applyEnergyChainOutflowTick(network, t, pulse, membrane);
        }

        const statuses = getChainLedgerStatusesForNowSummary(network)!;
        // Inflow chain must be fully closed.
        expect(statuses.externalToMedium).toBe('closed');
        expect(statuses.mediumToInternal).toBe('closed');
        expect(statuses.internalClosure).toBe('closed');
        // Outflow chain: bufferToActuation, actuationToWorld, sensoryToMembrane all closed.
        expect(statuses.bufferToActuation).toBe('closed');
        expect(statuses.actuationToWorld).toBe('closed');
        expect(statuses.sensoryToMembrane).toBe('closed');
        // World→Sensory: closed or open are both principled outcomes.
        expect(['closed', 'open']).toContain(statuses.worldToSensory);
    });

    it('Now Summary conservation sections receive live ledger statuses (not 未提供)', () => {
        const network: any = { enableEnergyChain: true };
        const injection = new Float64Array(SIZE);
        for (let i = 0; i < SIZE; i++) injection[i] = 0.05;
        ensureEnergyChainState(network, {
            width: WIDTH,
            height: HEIGHT,
            steadyDrivePerCell: 0.2,
            bufferInjectionRequestPerCell: injection,
        });

        const membrane = makeMembrane();
        const pulse = makePulse();
        for (let t = 0; t < 80; t++) {
            applyEnergyChainInflowTick(network, t);
            applyEnergyChainOutflowTick(network, t, pulse, membrane);
        }

        const panel = deriveChainOnlyNowSummary(network, 80)!;
        const inflowSection = panel.sections.find((s) => s.id === 'conservationChain')!;
        const outflowSection = panel.sections.find((s) => s.id === 'conservationChainOutflow')!;

        const inflowJoined = inflowSection.detailsJa.join('|');
        const outflowJoined = outflowSection.detailsJa.join('|');
        expect(inflowJoined).not.toContain('未提供');
        expect(outflowJoined).not.toContain('未提供');
        expect(inflowSection.severity).toBe('calm');
        expect(['calm', 'unstable']).toContain(outflowSection.severity);
    });

    it('buildNowSummaryConservationInput spreads correctly into a full Now Summary input', () => {
        const network: any = { enableEnergyChain: true };
        ensureEnergyChainState(network, {
            width: WIDTH,
            height: HEIGHT,
            steadyDrivePerCell: 0.1,
        });
        applyEnergyChainInflowTick(network, 0);
        applyEnergyChainOutflowTick(network, 0, null, makeMembrane());

        const partial = buildNowSummaryConservationInput(network);
        expect(partial.externalToMediumLedgerStatus).toBeDefined();
        expect(partial.bufferToActuationLedgerStatus).toBeDefined();

        // Spread alongside organism fields and confirm panel renders.
        const panel = deriveNowSummaryPanel({
            timestamp: 1,
            arousal: 0.4,
            sigma: 1.0,
            energy: 0.5,
            ...partial,
        });
        expect(panel.sections.length).toBeGreaterThan(0);
    });

    it('supply cutoff: zero drive → substrate naturally drains over time', () => {
        const network: any = { enableEnergyChain: true };
        const injection = new Float64Array(SIZE);
        for (let i = 0; i < SIZE; i++) injection[i] = 0.05;
        const chain = ensureEnergyChainState(network, {
            width: WIDTH,
            height: HEIGHT,
            steadyDrivePerCell: 0.3,
            bufferInjectionRequestPerCell: injection,
        })!;

        const membrane = makeMembrane();
        const pulse = makePulse();

        // Warm-up: 60 ticks with drive on.
        for (let t = 0; t < 60; t++) {
            applyEnergyChainInflowTick(network, t);
            applyEnergyChainOutflowTick(network, t, pulse, membrane);
        }
        const substrateSumAfterWarmup = Array.from(chain.substrate.storageField).reduce((a, v) => a + v, 0);
        expect(substrateSumAfterWarmup).toBeGreaterThan(0);

        // Cutoff phase: 200 ticks with drive forced to 0.
        for (let t = 60; t < 260; t++) {
            applyEnergyChainInflowTick(network, t, { supplyCutoffTick: 60 });
            applyEnergyChainOutflowTick(network, t, pulse, membrane);
        }
        const substrateSumAfterCutoff = Array.from(chain.substrate.storageField).reduce((a, v) => a + v, 0);
        // Substrate drains relative to peak.
        expect(substrateSumAfterCutoff).toBeLessThan(substrateSumAfterWarmup);
    });

    it('ledgers stay closed even at the very first tick (warm-up not required)', () => {
        const network: any = { enableEnergyChain: true };
        ensureEnergyChainState(network, {
            width: WIDTH,
            height: HEIGHT,
            steadyDrivePerCell: 0.2,
        });
        applyEnergyChainInflowTick(network, 0);
        applyEnergyChainOutflowTick(network, 0, makePulse(), makeMembrane());

        const s = getChainLedgerStatusesForNowSummary(network)!;
        expect(s.externalToMedium).toBe('closed');
        expect(s.mediumToInternal).toBe('closed');
        expect(s.internalClosure).toBe('closed');
        expect(s.bufferToActuation).toBe('closed');
        expect(s.actuationToWorld).toBe('closed');
        expect(s.sensoryToMembrane).toBe('closed');
    });
});
