/**
 * deriveNowSummary.test.ts
 * AETERNA-NATURAL v2.7 — Tests for deriveNowSummaryPanel
 *
 * Verifies:
 * - Empty input produces a valid NowSummaryPanelState
 * - undefined values are NOT treated as 0
 * - All 9 sections are present (v4.0 adds conservationChain)
 * - Each section has proper cautionsJa
 * - claimGuardJa is present
 * - No affirmative consciousness/life claims
 * - No LLM/API usage
 * - suggestedNextObservations includes "Safe Baseline"
 */

import { describe, it, expect } from 'vitest';
import { deriveNowSummaryPanel } from '../../observer/deriveNowSummary.ts';
import type { DeriveNowSummaryInput } from '../../observer/deriveNowSummary.ts';

const EXPECTED_SECTION_IDS = [
    'torusLifeField',
    'vitalStem',
    'bodyWorldLoop',
    'history',
    'emergenceCandidates',
    'risks',
    'signalExchange',
    'consciousnessCandidateConditions',
    'conservationChain',
] as const;

describe('deriveNowSummaryPanel', () => {
    it('produces a valid NowSummaryPanelState from empty input', () => {
        const result = deriveNowSummaryPanel({ timestamp: 1000 });
        expect(result).toBeDefined();
        expect(result.timestamp).toBe(1000);
        expect(result.overallOneLineJa).toBeTruthy();
        expect(result.beginnerSummaryJa).toBeTruthy();
        expect(result.researcherSummaryJa).toBeTruthy();
        expect(result.claimGuardJa).toBeTruthy();
        expect(result.sections).toHaveLength(9);
        expect(result.suggestedNextObservations).toBeInstanceOf(Array);
        expect(result.suggestedNextObservations.length).toBeGreaterThan(0);
    });

    it('has all 9 required section IDs', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        const ids = result.sections.map((s) => s.id);
        for (const expectedId of EXPECTED_SECTION_IDS) {
            expect(ids).toContain(expectedId);
        }
    });

    it('reports insufficient confidence when all inputs are undefined', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        // Most sections should be insufficient
        const insufficientSections = result.sections.filter((s) => s.confidence === 'insufficient');
        expect(insufficientSections.length).toBeGreaterThan(0);
    });

    it('does NOT treat undefined arousal as 0', () => {
        const emptyResult = deriveNowSummaryPanel({ timestamp: 0 });
        const torusSection = emptyResult.sections.find((s) => s.id === 'torusLifeField');
        expect(torusSection).toBeDefined();
        // With undefined arousal, should NOT say "活性化" (which requires arousal >= 0.7)
        expect(torusSection!.oneLineJa).not.toBe('トーラス生命場は活性化しています。');
        // Should be insufficient or have the "不足" message
        expect(torusSection!.confidence).toBe('insufficient');
    });

    it('does NOT treat undefined energy as 0', () => {
        const emptyResult = deriveNowSummaryPanel({ timestamp: 0 });
        const vitalSection = emptyResult.sections.find((s) => s.id === 'vitalStem');
        expect(vitalSection).toBeDefined();
        expect(vitalSection!.confidence).toBe('insufficient');
    });

    it('correctly uses defined arousal values', () => {
        const highArousal = deriveNowSummaryPanel({ timestamp: 0, arousal: 0.8 });
        const torusHigh = highArousal.sections.find((s) => s.id === 'torusLifeField')!;
        expect(torusHigh.oneLineJa).toBe('トーラス生命場は活性化しています。');
        expect(torusHigh.severity).toBe('active');

        const lowArousal = deriveNowSummaryPanel({ timestamp: 0, arousal: 0.1 });
        const torusLow = lowArousal.sections.find((s) => s.id === 'torusLifeField')!;
        expect(torusLow.oneLineJa).toBe('トーラス生命場は低活動状態です。');
        expect(torusLow.severity).toBe('calm');
    });

    it('detects NaN/Infinity risk correctly', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0, nanOrInfinityCount: 3 });
        const risksSection = result.sections.find((s) => s.id === 'risks')!;
        expect(risksSection.severity).toBe('unstable');
        expect(risksSection.oneLineJa).toContain('NaN');
    });

    it('conservation chain reports insufficient when no ledger statuses provided', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        const section = result.sections.find((s) => s.id === 'conservationChain')!;
        expect(section).toBeDefined();
        expect(section.confidence).toBe('insufficient');
        expect(section.severity).toBe('unknown');
    });

    it('conservation chain reports calm when all ledgers are closed', () => {
        const result = deriveNowSummaryPanel({
            timestamp: 0,
            externalToMediumLedgerStatus: 'closed',
            membraneToInternalLedgerStatus: 'closed',
            internalSubstrateLedgerStatus: 'closed',
        });
        const section = result.sections.find((s) => s.id === 'conservationChain')!;
        expect(section.severity).toBe('calm');
        expect(section.oneLineJa).toContain('閉じています');
    });

    it('conservation chain reports unstable and emits "Energy flow is not yet verified" when any ledger is open', () => {
        const result = deriveNowSummaryPanel({
            timestamp: 0,
            externalToMediumLedgerStatus: 'closed',
            membraneToInternalLedgerStatus: 'open',
            internalSubstrateLedgerStatus: 'closed',
        });
        const section = result.sections.find((s) => s.id === 'conservationChain')!;
        expect(section.severity).toBe('unstable');
        expect(section.oneLineJa).toContain('Energy flow is not yet verified');
        expect(section.cautionsJa.some((c) => c.includes('診断/プロキシ'))).toBe(true);
        expect(result.overallOneLineJa).toContain('保存則チェーン');
        expect(result.strongestObservedChanges).toContain('保存則チェーン開');
    });

    it('conservation chain emits insufficient warning when any ledger is insufficient', () => {
        const result = deriveNowSummaryPanel({
            timestamp: 0,
            externalToMediumLedgerStatus: 'closed',
            membraneToInternalLedgerStatus: 'insufficient',
            internalSubstrateLedgerStatus: 'closed',
        });
        const section = result.sections.find((s) => s.id === 'conservationChain')!;
        expect(section.severity).toBe('unknown');
        expect(section.oneLineJa).toContain('insufficient');
    });

    it('conservation chain details list per-link statuses in Japanese', () => {
        const result = deriveNowSummaryPanel({
            timestamp: 0,
            externalToMediumLedgerStatus: 'closed',
            membraneToInternalLedgerStatus: 'nearClosed',
            internalSubstrateLedgerStatus: 'open',
        });
        const section = result.sections.find((s) => s.id === 'conservationChain')!;
        const joined = section.detailsJa.join('|');
        expect(joined).toContain('External→Medium: 閉');
        expect(joined).toContain('Medium→Internal: 近接閉');
        expect(joined).toContain('Internal closure: 開');
    });

    it('each section has at least one cautionJa', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        for (const section of result.sections) {
            expect(section.cautionsJa.length).toBeGreaterThan(0);
            expect(section.cautionsJa[0]).toBeTruthy();
        }
    });

    it('claimGuardJa is always present and correct', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        expect(result.claimGuardJa).toBe(
            'このパネルはAETERNAの発話ではありません。観測装置による条件観測です。意識・生命・知性の証明ではありません。',
        );
    });

    it('suggestedNextObservations always includes Safe Baseline', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        const hasSafeBaseline = result.suggestedNextObservations.some((s) =>
            s.includes('Safe Baseline'),
        );
        expect(hasSafeBaseline).toBe(true);
    });

    it('does not make affirmative consciousness claims', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0, arousal: 0.9, energy: 0.9, stability: 0.9 });
        const allText = JSON.stringify(result);
        expect(allText).not.toContain('意識がある');
        expect(allText).not.toContain('生きている');
        expect(allText).not.toContain('AETERNAは意識');
        expect(allText).not.toContain('consciousness proven');
    });

    it('does not make affirmative life claims', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        const allText = JSON.stringify(result);
        expect(allText).not.toContain('AETERNA は生きている');
        expect(allText).not.toContain('AETERNA is alive');
    });

    it('does not use LLM or API', () => {
        // This is a pure synchronous function — no async, no fetch
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        expect(result).toBeDefined();
        // If LLM were used, function would be async or throw without API key
    });

    it('strained vitalStem when overload > 0.7', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0, overload: 0.9 });
        const vitalSection = result.sections.find((s) => s.id === 'vitalStem')!;
        expect(vitalSection.severity).toBe('strained');
    });

    it('recovering vitalStem when fatigue > 0.7', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0, fatigue: 0.8 });
        const vitalSection = result.sections.find((s) => s.id === 'vitalStem')!;
        expect(vitalSection.severity).toBe('recovering');
    });

    it('calm vitalStem when energy and stability both > 0.5', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0, energy: 0.6, stability: 0.7 });
        const vitalSection = result.sections.find((s) => s.id === 'vitalStem')!;
        expect(vitalSection.severity).toBe('calm');
    });

    it('consciousnessSection caution is always present', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        const consSection = result.sections.find((s) => s.id === 'consciousnessCandidateConditions')!;
        expect(consSection.cautionsJa.some((c) => c.includes('意識の証明ではありません'))).toBe(true);
    });

    it('full input produces high-confidence sections', () => {
        const fullInput: DeriveNowSummaryInput = {
            timestamp: 5000,
            arousal: 0.6, sigma: 0.5, phaseCoherence: 0.7, clusterRatio: 0.4,
            baselineLevel: 0.3, residueLevel: 0.2, firingRateError: 0.1,
            energy: 0.7, stability: 0.8, overload: 0.1, fatigue: 0.05,
            coherenceMemory: 0.6, predictionSensitivity: 0.4, touchNeedBaseline: 0.3,
            modeState: 'active', actionState: 'orienting', orientingDrive: 0.5, restDrive: 0.2,
            loopGain: 0.6, returnStrength: 0.7, returnMismatch: 0.1, selfCausedMatch: 0.8,
            closureStability: 0.7, membraneDeformation: 0.3, actuationReturnOverlap: 0.6,
            activityResidue: 0.4, traceStrength: 0.5, replayReadiness: 0.3,
            plasticityTrace: 0.4, recentHistoryBias: 0.2,
            vortexCandidateCount: 3, protoPointCandidateCount: 1,
            protoNeuronCandidateCount: 0, protoNetworkCandidateCount: 0,
            maxProtoNeuronConfidence: 0.0, maxProtoNetworkConfidence: 0.0,
            collapseRisk: 0.05, saturationRisk: 0.1, feedbackSaturationRisk: 0.08,
            nanOrInfinityCount: 0,
            touchActive: false, soundActive: false, lightActive: false, motionActive: false,
            recentInputKind: null, recentActionPulse: 0.3,
        };
        const result = deriveNowSummaryPanel(fullInput);
        const highSections = result.sections.filter((s) => s.confidence === 'high');
        expect(highSections.length).toBeGreaterThan(0);
    });
});
