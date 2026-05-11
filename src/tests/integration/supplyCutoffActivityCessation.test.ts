import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    createExternalDriveField,
    updateSteadyExternalDrive,
} from '../../world/externalDriveField.ts';
import {
    createSpatialWorldMedium,
    updateSpatialWorldMedium,
} from '../../world/spatialWorldMedium.ts';
import {
    createLocalConservationSubstrate,
    updateLocalConservationSubstrate,
} from '../../substrate/localConservationSubstrate.ts';
import { updateExternalDriveToMediumTransferPositive } from '../../world/externalDriveToMediumTransfer.ts';
import { updateMembraneToInternalTransferPositive } from '../../world/membraneToInternalTransfer.ts';
import { applyInternalToBufferInjectionRequest } from '../../core/internalToBufferTransfer.ts';

/**
 * v4.3-c acceptance test: supply cutoff naturally stops downstream activity
 * (without anyone writing a "if supply=0 then decay" rule).
 *
 * Chain:
 *   ExternalDriveField → SpatialWorldMedium → MembraneExchange → LocalConservationSubstrate
 *   → CurrentBuffer (via per-cell bounded injection request).
 *
 * Phase 1: steady external drive — chain runs, injection grants amounts.
 * Phase 2: external drive = 0 — substrate eventually drains through
 *          dissipation/residue/outflow, so injection requests can no longer
 *          be granted. Activity (granted-injection magnitude) decreases as a
 *          CONSEQUENCE, not as a written rule.
 */

const WIDTH = 3;
const HEIGHT = 3;
const SIZE = WIDTH * HEIGHT;
const TOL = 1e-9;

describe('supply cutoff → activity cessation (v4.3-c acceptance)', () => {
    it('substrate-backed injection naturally stops when external supply is cut', () => {
        let drive = createExternalDriveField({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
        let medium = createSpatialWorldMedium({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
        let substrate = createLocalConservationSubstrate({
            width: WIDTH,
            height: HEIGHT,
            boundaryMode: 'torus',
        });
        let buffer = new Float64Array(SIZE);

        // Constant per-cell injection request (every cell asks for 0.2 each tick).
        const requestedPerCell = new Float64Array(SIZE);
        for (let i = 0; i < SIZE; i++) requestedPerCell[i] = 0.2;

        function runOneTick(driveOn: boolean) {
            if (driveOn) {
                const ds = updateSteadyExternalDrive(drive, {
                    width: WIDTH,
                    height: HEIGHT,
                    boundaryMode: 'torus',
                    steadyDrivePerCell: 0.3,
                    dt: 1,
                    tolerance: TOL,
                });
                drive = ds.state;
            }

            const e2m = updateExternalDriveToMediumTransferPositive(drive, medium, {
                width: WIDTH,
                height: HEIGHT,
                boundaryMode: 'torus',
                cellMapping: 'same-index',
                transferCoefficient: 0.6,
                dt: 1,
                tolerance: TOL,
            });
            drive = e2m.externalDriveState;
            medium = e2m.spatialWorldMediumState;

            const ms = updateSpatialWorldMedium(medium, {
                width: WIDTH,
                height: HEIGHT,
                boundaryMode: 'torus',
                localExchangeCoefficient: 0.02,
                localDissipationCoefficient: 0.02,
                residueConversionCoefficient: 0.02,
                outflowCoefficient: 0.02,
                membraneExchangeCoefficient: 0.3,
                dt: 1,
                tolerance: TOL,
            });
            medium = ms.state;

            const m2i = updateMembraneToInternalTransferPositive(medium, substrate, {
                width: WIDTH,
                height: HEIGHT,
                boundaryMode: 'torus',
                cellMapping: 'same-index',
                transferCoefficient: 0.6,
                dt: 1,
                tolerance: TOL,
            });
            medium = m2i.spatialWorldMediumState;
            substrate = m2i.localConservationSubstrateState;

            const ss = updateLocalConservationSubstrate(substrate, {
                width: WIDTH,
                height: HEIGHT,
                boundaryMode: 'torus',
                localExchangeCoefficient: 0.02,
                localDissipationCoefficient: 0.02,
                residueConversionCoefficient: 0.02,
                outflowCoefficient: 0.02,
                dt: 1,
                tolerance: TOL,
            });
            substrate = ss.state;

            const inj = applyInternalToBufferInjectionRequest(
                substrate,
                buffer,
                { requestedPerCell },
                WIDTH,
                HEIGHT,
                TOL,
            );
            substrate = inj.substrateState;
            buffer = inj.currentBuffer;
            return inj.report;
        }

        // Phase 1: 100 ticks of steady drive. Substrate should fill enough to grant most injection.
        const phase1Grants: number[] = [];
        for (let t = 0; t < 100; t++) {
            const r = runOneTick(true);
            phase1Grants.push(r.totalGranted);
        }
        const lateGrantPhase1 = phase1Grants.slice(-20).reduce((a, v) => a + v, 0) / 20;

        // Phase 2: 200 ticks with no drive. Substrate drains through dissipation/residue/outflow
        // and through ongoing per-tick injection draws. Eventually injection is not granted.
        const phase2Grants: number[] = [];
        for (let t = 0; t < 200; t++) {
            const r = runOneTick(false);
            phase2Grants.push(r.totalGranted);
        }
        const lateGrantPhase2 = phase2Grants.slice(-20).reduce((a, v) => a + v, 0) / 20;

        // Acceptance: phase-2 late-window granted amount is materially smaller than phase-1's.
        expect(lateGrantPhase1).toBeGreaterThan(0);
        expect(lateGrantPhase2).toBeLessThan(lateGrantPhase1);

        // Strict: phase-2 should approach (or reach) zero after the substrate drains.
        const finalGrant = phase2Grants[phase2Grants.length - 1];
        expect(finalGrant).toBeLessThan(0.01);
    });
});

describe('v4.3-c lint guard: no bare *= 0.X literals in dynamicCore or relationalState', () => {
    it('dynamicCore.ts contains no bare `*= 0.<digit>` literal', () => {
        const source = readFileSync('src/core/dynamicCore.ts', 'utf8');
        const matches = source.match(/\*=\s*0\.[0-9]/g);
        expect(matches).toBeNull();
    });

    it('relationalState.ts contains no bare `*= 0.<digit>` literal', () => {
        const source = readFileSync('src/organism/relationalState.ts', 'utf8');
        const matches = source.match(/\*=\s*0\.[0-9]/g);
        expect(matches).toBeNull();
    });
});
