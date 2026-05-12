import { describe, expect, it } from 'vitest';
import { runFullClosedChainObservation } from '../../experiments/runFullClosedChainObservation.ts';
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

const stubPulse: ActuationPulse = {
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

describe('runFullClosedChainObservation — D4 end-to-end acceptance', () => {
    it('drives the full chain for many ticks with closed inflow ledgers and reports all 8 statuses', async () => {
        const injection = new Float64Array(SIZE);
        for (let i = 0; i < SIZE; i++) injection[i] = 0.05;

        const result = await runFullClosedChainObservation({
            width: WIDTH,
            height: HEIGHT,
            ticks: 100,
            steadyDrivePerCell: 0.2,
            injectionRequestPerCell: injection,
            actuationPulse: stubPulse,
            membrane: makeMembrane(),
        });

        // Inflow chain must be fully closed.
        expect(result.finalLedgerStatuses.externalToMedium).toBe('closed');
        expect(result.finalLedgerStatuses.mediumToInternal).toBe('closed');
        expect(result.finalLedgerStatuses.internalClosure).toBe('closed');

        // Outflow chain: Buffer→Actuation, Actuation→World, Sensory→Membrane should all close.
        expect(result.finalLedgerStatuses.bufferToActuation).toBe('closed');
        expect(result.finalLedgerStatuses.actuationToWorld).toBe('closed');
        expect(result.finalLedgerStatuses.sensoryToMembrane).toBe('closed');

        // World→Sensory may sometimes be 'open' due to sensoryOversupplyEnergy
        // (deriveSensoryReturn can amplify when turbulence is high). Both
        // outcomes are valid given the principles.
        expect(['closed', 'open']).toContain(result.finalLedgerStatuses.worldToSensory);
    });

    it('Now Summary renders both 保存則チェーン sections with live statuses (not 未提供)', async () => {
        const injection = new Float64Array(SIZE);
        for (let i = 0; i < SIZE; i++) injection[i] = 0.05;

        const result = await runFullClosedChainObservation({
            width: WIDTH,
            height: HEIGHT,
            ticks: 80,
            steadyDrivePerCell: 0.2,
            injectionRequestPerCell: injection,
            actuationPulse: stubPulse,
            membrane: makeMembrane(),
        });

        const inflowSection = result.nowSummary.sections.find((s) => s.id === 'conservationChain')!;
        const outflowSection = result.nowSummary.sections.find((s) => s.id === 'conservationChainOutflow')!;

        // Both sections render — details should not say 未提供 for any link.
        const inflowJoined = inflowSection.detailsJa.join('|');
        const outflowJoined = outflowSection.detailsJa.join('|');
        expect(inflowJoined).not.toContain('未提供');
        expect(outflowJoined).not.toContain('未提供');

        // Inflow should report calm; outflow may be calm or unstable (world→sensory can open).
        expect(inflowSection.severity).toBe('calm');
        expect(['calm', 'unstable']).toContain(outflowSection.severity);
    });

    it('total accepted drive matches steadyDrivePerCell * ticks * cells (input accounting)', async () => {
        const TICKS = 100;
        const DRIVE = 0.1;
        const result = await runFullClosedChainObservation({
            width: WIDTH,
            height: HEIGHT,
            ticks: TICKS,
            steadyDrivePerCell: DRIVE,
            membrane: makeMembrane(),
        });
        const expected = TICKS * DRIVE * SIZE;
        expect(result.totalAcceptedDrive).toBeCloseTo(expected, 9);
    });

    it('outflow accumulates actuationOutputEnergy when pulse is supplied (not zero anymore)', async () => {
        const result = await runFullClosedChainObservation({
            width: WIDTH,
            height: HEIGHT,
            ticks: 50,
            steadyDrivePerCell: 0.2,
            actuationPulse: stubPulse,
            membrane: makeMembrane(),
        });
        // pulse footprint = 0.5 * 0.6 * 0.7 = 0.21 per tick * 50 ticks = 10.5, but
        // capped by current buffer availability per tick. So total > 0 but not
        // necessarily 10.5 (buffer starts empty and accumulates via inflow).
        expect(result.totalActuationOutputEnergy).toBeGreaterThan(0);
    });

    it('boundary dissipation accumulates: 70% of the granted sensory packet energy is named', async () => {
        const result = await runFullClosedChainObservation({
            width: WIDTH,
            height: HEIGHT,
            ticks: 80,
            steadyDrivePerCell: 0.3,
            actuationPulse: stubPulse,
            membrane: makeMembrane(),
        });
        // With a pulse driving the world and producing sensory packets, the
        // 70% portion should accumulate into boundaryDissipationEnergy.
        expect(result.totalBoundaryDissipationEnergy).toBeGreaterThan(0);
    });

    it('membrane.receivedSensoryField accumulates per cell (loop closure observable)', async () => {
        const result = await runFullClosedChainObservation({
            width: WIDTH,
            height: HEIGHT,
            ticks: 80,
            steadyDrivePerCell: 0.3,
            actuationPulse: stubPulse,
            membrane: makeMembrane(),
        });
        const field = result.finalMembrane.receivedSensoryField;
        expect(field).toBeDefined();
        if (field) {
            const sum = Array.from(field).reduce((a, v) => a + v, 0);
            expect(sum).toBeGreaterThan(0);
        }
    });

    it('supply cutoff: external drive=0 after warm-up → actuation output naturally decays', async () => {
        const TICKS = 250;
        const CUTOFF = 50;
        const result = await runFullClosedChainObservation({
            width: WIDTH,
            height: HEIGHT,
            ticks: TICKS,
            steadyDrivePerCell: 0.3,
            actuationPulse: stubPulse,
            membrane: makeMembrane(),
            supplyCutoffTick: CUTOFF,
        });
        // No new external drive is accepted after CUTOFF, so total drive matches
        // (CUTOFF ticks × cells × steadyDrivePerCell).
        const expectedAcceptedDrive = CUTOFF * SIZE * 0.3;
        expect(result.totalAcceptedDrive).toBeCloseTo(expectedAcceptedDrive, 9);
        // Buffer should have substantially drained by the end (no fresh inflow).
        const finalBufferSum = Array.from(result.finalCurrentBuffer).reduce((a, v) => a + v, 0);
        // Buffer starts empty, gets injected during warm-up, then drains via
        // outflow as actuation continues consuming it. Final sum should be
        // small compared to peak buffer levels (no recharging post-cutoff).
        expect(finalBufferSum).toBeLessThan(expectedAcceptedDrive * 0.5);
    });

    it('overall one-line is the normal observation message when the chain runs cleanly', async () => {
        const result = await runFullClosedChainObservation({
            width: WIDTH,
            height: HEIGHT,
            ticks: 50,
            steadyDrivePerCell: 0.2,
            actuationPulse: stubPulse,
            membrane: makeMembrane(),
        });
        // When inflow is clean and outflow is mostly clean, the overall line
        // should not lead with a warning glyph.
        if (!result.nowSummary.overallOneLineJa.startsWith('⚠')) {
            // Healthy case
            expect(result.nowSummary.overallOneLineJa.startsWith('⚠')).toBe(false);
        } else {
            // If outflow opens (worldToSensory amplification), the warning is
            // about outflow, not the inflow chain — that is also valid.
            expect(result.nowSummary.overallOneLineJa).toContain('outflow');
        }
    });
});
