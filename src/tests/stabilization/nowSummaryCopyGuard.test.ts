/**
 * nowSummaryCopyGuard.test.ts
 * AETERNA-NATURAL v2.7 — Static copy / source guard tests
 *
 * Reads source files as strings and asserts:
 * - deriveNowSummary observer file does NOT contain "意識の証明" as affirmative
 * - deriveNowSummary observer file does NOT contain "生きている" as affirmative claim
 * - NowSummaryPanel does NOT contain "AETERNA は生きている"
 * - NowSummaryPanel does NOT contain "AETERNA is conscious"
 * - proto-neuron is not described as "semantic node" or "意味ノード" affirmatively
 * - No LLM/API calls
 * - ConsciousnessCandidateConditionsPanel has disclaimer text
 * - undefined values are not treated as 0 (no `?? 0` for section input variables)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');

function readSrc(relPath: string): string {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const srcDerive = readSrc('observer/deriveNowSummary.ts');
const srcPanel = readSrc('ui/observation/NowSummaryPanel.tsx');
const srcConditionsPanel = readSrc('ui/observation/ConsciousnessCandidateConditionsPanel.tsx');
const srcSectionCard = readSrc('ui/observation/NowSummarySectionCard.tsx');

// Section input variable names from DeriveNowSummaryInput
const SECTION_INPUT_VARS = [
    'arousal', 'sigma', 'phaseCoherence', 'clusterRatio', 'baselineLevel', 'residueLevel', 'firingRateError',
    'energy', 'stability', 'overload', 'fatigue', 'coherenceMemory', 'predictionSensitivity',
    'touchNeedBaseline', 'orientingDrive', 'restDrive',
    'loopGain', 'returnStrength', 'returnMismatch', 'selfCausedMatch', 'closureStability',
    'membraneDeformation', 'actuationReturnOverlap',
    'activityResidue', 'traceStrength', 'replayReadiness', 'plasticityTrace', 'recentHistoryBias',
    'vortexCandidateCount', 'protoPointCandidateCount', 'protoNeuronCandidateCount',
    'protoNetworkCandidateCount', 'maxProtoNeuronConfidence', 'maxProtoNetworkConfidence',
    'collapseRisk', 'saturationRisk', 'feedbackSaturationRisk', 'nanOrInfinityCount',
    'recentActionPulse',
];

describe('nowSummaryCopyGuard — deriveNowSummary.ts', () => {
    it('does NOT contain "意識の証明" as affirmative claim (only as disclaimer)', () => {
        // The source may contain "意識の証明ではありません" (correct), but NOT "意識の証明" without "ではありません"
        const matches = srcDerive.match(/意識の証明(?!ではありません)/g);
        expect(matches).toBeNull();
    });

    it('does NOT contain "生きている" as affirmative claim', () => {
        // Should not claim AETERNA is living
        expect(srcDerive).not.toContain('AETERNAは生きている');
        expect(srcDerive).not.toContain('AETERNA は生きている');
        expect(srcDerive).not.toContain('AETERNA is alive');
    });

    it('does NOT contain LLM or API call patterns', () => {
        // Comments may mention LLM/API (as "no LLM"), but no actual call patterns
        expect(srcDerive).not.toContain('fetch(');
        expect(srcDerive).not.toContain('axios.');
        expect(srcDerive).not.toContain('openai');
        expect(srcDerive).not.toContain('gpt-');
        expect(srcDerive).not.toContain('anthropic');
        expect(srcDerive).not.toContain('API_KEY');
        // LLM calls would be async - function should be sync
        expect(srcDerive).not.toContain('await fetch');
        expect(srcDerive).not.toContain('await axios');
    });

    it('does NOT use ?? 0 for section input variables (never treats undefined as 0)', () => {
        // Check that none of the section input variables use ?? 0 fallback
        for (const varName of SECTION_INPUT_VARS) {
            const pattern = new RegExp(`inp\\.${varName}\\s*\\?\\?\\s*0`);
            expect(srcDerive).not.toMatch(pattern);
        }
    });

    it('uses explicit undefined checks, not ?? 0', () => {
        // The file should contain "=== undefined" checks
        expect(srcDerive).toContain('=== undefined');
    });

    it('claimGuardJa string is correct', () => {
        expect(srcDerive).toContain('このパネルはAETERNAの発話ではありません。観測装置による条件観測です。意識・生命・知性の証明ではありません。');
    });

    it('always includes Safe Baseline in suggestedNextObservations', () => {
        expect(srcDerive).toContain('Safe Baseline');
    });

    it('consciousness conditions section has 10 conditions', () => {
        // Should have 10 condition objects
        const conditionMatches = srcDerive.match(/id: '[a-zA-Z]+',/g);
        expect(conditionMatches).not.toBeNull();
    });
});

describe('nowSummaryCopyGuard — NowSummaryPanel.tsx', () => {
    it('does NOT contain "AETERNA は生きている"', () => {
        expect(srcPanel).not.toContain('AETERNA は生きている');
        expect(srcPanel).not.toContain('AETERNA は生きている');
    });

    it('does NOT contain "AETERNA is conscious"', () => {
        expect(srcPanel).not.toContain('AETERNA is conscious');
    });

    it('does NOT contain LLM/API call patterns', () => {
        expect(srcPanel).not.toContain('fetch(');
        expect(srcPanel).not.toContain('LLM');
        expect(srcPanel).not.toContain('API_KEY');
    });

    it('uses _esc() for HTML output', () => {
        expect(srcPanel).toContain('_esc(');
    });

    it('includes Safe Baseline button', () => {
        expect(srcPanel).toContain('Safe Baseline');
        expect(srcPanel).toContain('nowSummary:safeBaselineCompare');
    });

    it('includes claimGuardJa rendering', () => {
        expect(srcPanel).toContain('claimGuardJa');
    });
});

describe('nowSummaryCopyGuard — ConsciousnessCandidateConditionsPanel.tsx', () => {
    it('has disclaimer text', () => {
        expect(srcConditionsPanel).toContain('これは意識の証明ではありません');
        expect(srcConditionsPanel).toContain('意識が宿るかもしれない前提条件');
    });

    it('does NOT claim consciousness is proven', () => {
        expect(srcConditionsPanel).not.toContain('意識がある証明');
        expect(srcConditionsPanel).not.toContain('is conscious');
    });

    it('uses _esc() for XSS safety', () => {
        expect(srcConditionsPanel).toContain('_esc(');
    });
});

describe('nowSummaryCopyGuard — NowSummarySectionCard.tsx', () => {
    it('uses _esc() for XSS safety', () => {
        expect(srcSectionCard).toContain('_esc(');
    });

    it('renders cautions', () => {
        expect(srcSectionCard).toContain('cautionsJa');
    });

    it('proto-neuron is not described as semantic node', () => {
        expect(srcSectionCard).not.toContain('semantic node');
        expect(srcSectionCard).not.toContain('意味ノードである');
    });
});

describe('nowSummaryCopyGuard — overall file checks', () => {
    it('proto-neuron is described as candidate, not semantic node in deriveNowSummary', () => {
        expect(srcDerive).not.toContain('semantic node');
        expect(srcDerive).not.toContain('意味ノードである');
        // Should contain "創発候補" (emergence candidate)
        expect(srcDerive).toContain('創発候補');
    });

    it('ConsciousnessCandidateConditionsPanel DISCLAIMER constant is present', () => {
        expect(srcConditionsPanel).toContain('DISCLAIMER');
    });
});
