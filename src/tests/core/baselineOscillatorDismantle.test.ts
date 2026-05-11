import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    applyLegacyBaselineOscillator,
    LEGACY_BASELINE_AMP,
    LEGACY_BASELINE_TIME_DRIFT,
} from '../../core/legacyBaselineOscillator.ts';
import { deriveEmergentBaselineFromSubstrate } from '../../core/emergentBaselineFromSubstrate.ts';
import { updateBaseline } from '../../core/dynamicCore.ts';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeMinimalNetwork(numNodes: number): Record<string, unknown> {
    return {
        numNodes,
        baselineActivity: new Float64Array(numNodes),
        nodePhase: new Float64Array(numNodes).map((_, i) => (i / numNodes) * Math.PI * 2),
        simTime: 0,
        modePhase: 0,
        currentModeDynamics: null,
        topDownModulation: null,
        livingState: null,
    };
}

function makeSubstrateOf(width: number, height: number, fill: (i: number) => number): Record<string, unknown> {
    const size = width * height;
    const storage = new Float64Array(size);
    for (let i = 0; i < size; i++) storage[i] = fill(i);
    return {
        width,
        height,
        boundaryMode: 'torus',
        storageField: storage,
        dissipationField: new Float64Array(size),
        residueField: new Float64Array(size),
        outflowField: new Float64Array(size),
        tick: 0,
    };
}

// ── Legacy oscillator: numeric equivalence ─────────────────────────────────────

describe('applyLegacyBaselineOscillator (v4.4 isolation)', () => {
    it('produces sinusoidal baselineActivity values matching the pre-refactor formula', () => {
        const net = makeMinimalNetwork(8);
        (net as { simTime: number }).simTime = 100;
        applyLegacyBaselineOscillator(net);

        // Reproduce the formula manually with the same constants and verify match.
        const t = 100 * LEGACY_BASELINE_TIME_DRIFT;
        const gain = 1.0;
        const clampedGain = Math.max(0.5, Math.min(1.5, gain));
        const longTone = 0.12;
        const longContrib = longTone * 0.02;
        for (let i = 0; i < 8; i++) {
            const expected =
                LEGACY_BASELINE_AMP * clampedGain * Math.sin((net as { nodePhase: Float64Array }).nodePhase[i] + t) +
                longContrib;
            expect((net as { baselineActivity: Float64Array }).baselineActivity[i]).toBeCloseTo(expected, 14);
        }
    });

    it('exposes LEGACY_BASELINE_AMP = 0.003 and LEGACY_BASELINE_TIME_DRIFT = 0.0008', () => {
        expect(LEGACY_BASELINE_AMP).toBe(0.003);
        expect(LEGACY_BASELINE_TIME_DRIFT).toBe(0.0008);
    });
});

// ── Emergent (substrate-derived) baseline ──────────────────────────────────────

describe('deriveEmergentBaselineFromSubstrate (v4.4 observation-only)', () => {
    it('returns zero baselineActivity when no substrate is attached ("nothing emerged" is valid)', () => {
        const net = makeMinimalNetwork(4);
        const status = deriveEmergentBaselineFromSubstrate(net);
        expect(status.substrateAttached).toBe(false);
        expect(status.totalAbsoluteBaseline).toBe(0);
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity)).toEqual([0, 0, 0, 0]);
    });

    it('returns zero baselineActivity when substrate is empty (zero storage everywhere)', () => {
        const net = makeMinimalNetwork(4);
        (net as { localConservationSubstrate: unknown }).localConservationSubstrate = makeSubstrateOf(2, 2, () => 0);
        const status = deriveEmergentBaselineFromSubstrate(net);
        expect(status.substrateAttached).toBe(true);
        expect(status.totalAbsoluteBaseline).toBe(0);
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity)).toEqual([0, 0, 0, 0]);
    });

    it('copies substrate.storageField into baselineActivity at default unit scale', () => {
        const net = makeMinimalNetwork(4);
        (net as { localConservationSubstrate: unknown }).localConservationSubstrate = makeSubstrateOf(2, 2, (i) => (i + 1) * 0.5);
        const status = deriveEmergentBaselineFromSubstrate(net);
        expect(status.substrateAttached).toBe(true);
        expect(status.totalAbsoluteBaseline).toBeCloseTo(0.5 + 1.0 + 1.5 + 2.0, 12);
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity)).toEqual([0.5, 1.0, 1.5, 2.0]);
    });

    it('applies the substrateScale config to all cells uniformly', () => {
        const net = makeMinimalNetwork(4);
        (net as { localConservationSubstrate: unknown }).localConservationSubstrate = makeSubstrateOf(2, 2, () => 1);
        deriveEmergentBaselineFromSubstrate(net, { substrateScale: 0.01 });
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity)).toEqual([0.01, 0.01, 0.01, 0.01]);
    });

    it('falls back to zeros when substrate size does not match numNodes (sizeMismatch)', () => {
        const net = makeMinimalNetwork(4);
        // Substrate sized 9 (3x3), but numNodes = 4. Treated as size mismatch.
        (net as { localConservationSubstrate: unknown }).localConservationSubstrate = makeSubstrateOf(3, 3, (i) => i);
        const status = deriveEmergentBaselineFromSubstrate(net);
        expect(status.substrateAttached).toBe(true);
        expect(status.sizeMismatch).toBe(true);
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity)).toEqual([0, 0, 0, 0]);
    });

    it('honors min/max clamps and treats NaN substrate cells as zero', () => {
        const net = makeMinimalNetwork(4);
        const sub = makeSubstrateOf(2, 2, (i) => (i === 2 ? Number.NaN : i + 1));
        (net as { localConservationSubstrate: unknown }).localConservationSubstrate = sub;
        deriveEmergentBaselineFromSubstrate(net, { minValue: 0, maxValue: 2 });
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity)).toEqual([1, 2, 0, 2]);
    });

    it('does not introduce time-driven oscillation: same substrate => same baseline at any simTime', () => {
        const net = makeMinimalNetwork(4);
        (net as { localConservationSubstrate: unknown }).localConservationSubstrate = makeSubstrateOf(2, 2, () => 0.5);
        (net as { simTime: number }).simTime = 0;
        deriveEmergentBaselineFromSubstrate(net);
        const at0 = Array.from((net as { baselineActivity: Float64Array }).baselineActivity);
        (net as { simTime: number }).simTime = 1000000;
        deriveEmergentBaselineFromSubstrate(net);
        const atFar = Array.from((net as { baselineActivity: Float64Array }).baselineActivity);
        expect(atFar).toEqual(at0);
    });
});

// ── Dispatcher behavior ────────────────────────────────────────────────────────

describe('dynamicCore.updateBaseline dispatcher (v4.4)', () => {
    it('default path (no flag) invokes the legacy oscillator, producing variation across cells', () => {
        const net = makeMinimalNetwork(8);
        (net as { simTime: number }).simTime = 50;
        updateBaseline(net);
        const out = Array.from((net as { baselineActivity: Float64Array }).baselineActivity);
        // Should not all be the same (there's a sin term that varies per cell).
        const allSame = out.every((v) => v === out[0]);
        expect(allSame).toBe(false);
    });

    it('emergentBaselineFromSubstrate=true with empty substrate yields all zeros (valid quiescent observation)', () => {
        const net = makeMinimalNetwork(4);
        (net as { emergentBaselineFromSubstrate: boolean }).emergentBaselineFromSubstrate = true;
        updateBaseline(net);
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity)).toEqual([0, 0, 0, 0]);
    });

    it('emergentBaselineFromSubstrate=true with populated substrate yields substrate-derived values', () => {
        const net = makeMinimalNetwork(4);
        (net as { emergentBaselineFromSubstrate: boolean }).emergentBaselineFromSubstrate = true;
        (net as { localConservationSubstrate: unknown }).localConservationSubstrate = makeSubstrateOf(2, 2, (i) => (i + 1) * 0.1);
        updateBaseline(net);
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity).map((v) => Number(v.toFixed(10)))).toEqual([0.1, 0.2, 0.3, 0.4]);
    });

    it('emergentBaselineSubstrateScale config knob is forwarded to the deriver', () => {
        const net = makeMinimalNetwork(4);
        (net as { emergentBaselineFromSubstrate: boolean }).emergentBaselineFromSubstrate = true;
        (net as { emergentBaselineSubstrateScale: number }).emergentBaselineSubstrateScale = 0.5;
        (net as { localConservationSubstrate: unknown }).localConservationSubstrate = makeSubstrateOf(2, 2, () => 1);
        updateBaseline(net);
        expect(Array.from((net as { baselineActivity: Float64Array }).baselineActivity)).toEqual([0.5, 0.5, 0.5, 0.5]);
    });
});

// ── Lint guards ────────────────────────────────────────────────────────────────

describe('v4.4 lint guards', () => {
    it('dynamicCore.ts source contains no Math.sin function call', () => {
        const source = readFileSync('src/core/dynamicCore.ts', 'utf8');
        const matches = source.match(/Math\.sin\s*\(/g);
        expect(matches).toBeNull();
    });

    it('dynamicCore.ts source contains no BASELINE_AMP identifier', () => {
        const source = readFileSync('src/core/dynamicCore.ts', 'utf8');
        const matches = source.match(/\bBASELINE_AMP\b/g);
        expect(matches).toBeNull();
    });

    it('dynamicCore.ts source contains no Math.sin literal (even in comments) — strict guard', () => {
        const source = readFileSync('src/core/dynamicCore.ts', 'utf8');
        expect(source).not.toContain('Math.sin');
    });

    it('legacyBaselineOscillator.ts and emergentBaselineFromSubstrate.ts contain no life-metaphor terms', () => {
        const forbidden = ['vital', 'breath', 'heartbeat', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];
        const files = ['src/core/legacyBaselineOscillator.ts', 'src/core/emergentBaselineFromSubstrate.ts'];
        for (const f of files) {
            const src = readFileSync(f, 'utf8').toLowerCase();
            for (const term of forbidden) {
                expect(src).not.toContain(term.toLowerCase());
            }
        }
    });
});
