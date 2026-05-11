import { describe, expect, it } from 'vitest';
import { runChainObservationScenario } from '../../experiments/runChainObservationScenario.ts';

const WIDTH = 4;
const HEIGHT = 4;

describe('runChainObservationScenario (B: observer wiring example)', () => {
    it('populates the Now Summary "保存則チェーン" section with closed ledger statuses when chain is healthy', async () => {
        const result = await runChainObservationScenario({
            width: WIDTH,
            height: HEIGHT,
            ticks: 50,
            steadyDrivePerCell: 0.2,
        });

        // All three chain links should land in 'closed' status after warm-up.
        expect(result.finalLedgerStatuses.externalToMedium).toBe('closed');
        expect(result.finalLedgerStatuses.mediumToInternal).toBe('closed');
        expect(result.finalLedgerStatuses.internalClosure).toBe('closed');

        // Section is rendered with severity 'calm' and the one-line text reflects 'closed'.
        const section = result.nowSummary.sections.find((s) => s.id === 'conservationChain')!;
        expect(section).toBeDefined();
        expect(section.severity).toBe('calm');
        expect(section.confidence).toBe('high');
        expect(section.oneLineJa).toContain('閉じています');

        // No "Energy flow is not yet verified" warning in any cautions or the panel one-line.
        const combinedCautions = result.nowSummary.sections.flatMap((s) => s.cautionsJa).join('|');
        expect(combinedCautions).not.toContain('Energy flow is not yet verified');
        expect(result.nowSummary.overallOneLineJa).not.toContain('Energy flow is not yet verified');
    });

    it('populates the per-cell Cell Observation conservation group with live values from the chain', async () => {
        const result = await runChainObservationScenario({
            width: WIDTH,
            height: HEIGHT,
            ticks: 50,
            steadyDrivePerCell: 0.2,
            inspectedCellIndex: 5,
        });

        const cons = result.inspectedCellObservation.conservation;
        // All six medium fields and four substrate fields should have real values
        // (not undefined) once the chain has been running.
        expect(cons.mediumStorage).toBeDefined();
        expect(cons.mediumDissipation).toBeDefined();
        expect(cons.mediumResidue).toBeDefined();
        expect(cons.mediumOutflow).toBeDefined();
        expect(cons.membraneInflow).toBeDefined();
        expect(cons.membraneReleased).toBeDefined();
        expect(cons.substrateStorage).toBeDefined();
        expect(cons.substrateDissipation).toBeDefined();
        expect(cons.substrateResidue).toBeDefined();
        expect(cons.substrateOutflow).toBeDefined();

        // The conservation observation kind should be 'measured' (raw field values).
        expect(result.inspectedCellObservation.diagnostics.valueKinds.conservation).toBe('measured');

        // Sanity: with positive drive, at least mediumStorage or substrateStorage
        // should be non-zero somewhere downstream.
        const someEnergyFlowed =
            (cons.mediumStorage ?? 0) > 0 ||
            (cons.substrateStorage ?? 0) > 0 ||
            (cons.membraneInflow ?? 0) > 0;
        expect(someEnergyFlowed).toBe(true);
    });

    it('reports accumulated chain totals consistent with the steady drive supplied', async () => {
        const TICKS = 100;
        const DRIVE_PER_CELL = 0.1;
        const result = await runChainObservationScenario({
            width: WIDTH,
            height: HEIGHT,
            ticks: TICKS,
            steadyDrivePerCell: DRIVE_PER_CELL,
        });

        const expectedTotalInput = TICKS * DRIVE_PER_CELL * WIDTH * HEIGHT;
        expect(result.totalAcceptedDrive).toBeCloseTo(expectedTotalInput, 9);
        expect(result.totalMembraneTransfer).toBeGreaterThan(0);
        // No injection request configured -> totalBufferInjectionGranted is 0.
        expect(result.totalBufferInjectionGranted).toBe(0);
    });

    it('grants per-cell injection requests bounded by substrate availability when configured', async () => {
        const SIZE = WIDTH * HEIGHT;
        const injectionRequest = new Float64Array(SIZE);
        for (let i = 0; i < SIZE; i++) injectionRequest[i] = 0.05;

        const result = await runChainObservationScenario({
            width: WIDTH,
            height: HEIGHT,
            ticks: 30,
            steadyDrivePerCell: 0.3,
            injectionRequestPerCell: injectionRequest,
        });

        expect(result.totalBufferInjectionGranted).toBeGreaterThan(0);

        // currentBuffer must hold what was granted; sum of granted = sum of buffer
        // since buffer started at zero.
        const bufferSum = Array.from(result.finalCurrentBuffer).reduce((a, v) => a + v, 0);
        expect(bufferSum).toBeCloseTo(result.totalBufferInjectionGranted, 9);
    });

    it('reports overall one-line as the normal observation message when all ledgers are closed', async () => {
        const result = await runChainObservationScenario({
            width: WIDTH,
            height: HEIGHT,
            ticks: 30,
            steadyDrivePerCell: 0.2,
        });

        // When the chain is healthy and no risk/conservation issue is open, the
        // overall one-line should not start with the warning glyph.
        expect(result.nowSummary.overallOneLineJa.startsWith('⚠')).toBe(false);
    });
});
