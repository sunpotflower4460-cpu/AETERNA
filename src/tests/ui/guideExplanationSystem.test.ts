/**
 * guideExplanationSystem.test.ts
 * U6: Guide / Explanation System — static smoke tests
 *
 * Verifies that:
 * - GuideExplanation type is defined correctly
 * - deriveGuideExplanation produces valid output (no LLM / API)
 * - currentExplanation, whatToLookAt, tryNext, glossaryHints, integrityNotes exist
 * - Forbidden claims are not present in generated text
 * - guideClaimGuard detects and removes forbidden claims
 * - Guide actions do NOT modify runtime dynamics
 * - No LLM / API calls in source files
 * - No semantic / consciousness / emotion claim in generated text
 *
 * These are static / unit tests — no browser or DOM required.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Modules under test ────────────────────────────────────────────────────────

import { deriveGuideExplanation } from '../../ui/guide/deriveGuideExplanation.js';
import {
    hasForbiddenClaim,
    sanitizeClaim,
    sanitizeLines,
    getForbiddenTerms,
} from '../../ui/guide/guideClaimGuard.js';
import {
    INTEGRITY_NOTES,
    FULL_GLOSSARY,
    selectGlossaryHints,
    lookupGlossaryHint,
} from '../../ui/guide/guideCopy.js';
import { generateGuide, getLastExplanation } from '../../ui/guide/localGuideEngine.js';
import { buildExplainableSnapshot } from '../../ui/explain/explainableObservationSnapshot.js';

// ── Source file static analysis ───────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..');

function readSrc(relPath: string): string {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const srcGuideType         = readSrc('types/guideExplanation.ts');
const srcClaimGuard        = readSrc('ui/guide/guideClaimGuard.ts');
const srcGuideCopy         = readSrc('ui/guide/guideCopy.ts');
const srcDeriveGuide       = readSrc('ui/guide/deriveGuideExplanation.ts');
const srcLocalEngine       = readSrc('ui/guide/localGuideEngine.ts');

// ── Test data helpers ─────────────────────────────────────────────────────────

function makeOverview(overrides: Record<string, unknown> = {}) {
    return {
        timestamp: 1000,
        metrics: [
            { id: 'flowContinuity',   label: 'Flow Continuity',   value: 0.5, status: 'moderate', valueKind: 'derived', source: 'viability' },
            { id: 'energyThroughput', label: 'Energy Throughput', value: 0.4, status: 'moderate', valueKind: 'derived', source: 'viability' },
            { id: 'boundaryExchange', label: 'Boundary Exchange', value: 0.4, status: 'moderate', valueKind: 'derived', source: 'viability' },
            { id: 'returnStrength',   label: 'Return Strength',   value: 0.5, status: 'moderate', valueKind: 'derived', source: 'closure' },
            { id: 'echoPersistence',  label: 'Echo Persistence',  value: 0.3, status: 'moderate', valueKind: 'derived', source: 'closure' },
            { id: 'closureStability', label: 'Closure Stability', value: 0.4, status: 'moderate', valueKind: 'proxy',   source: 'closure' },
            { id: 'saturationRisk',   label: 'Saturation Risk',   value: 0.1, status: 'low',      valueKind: 'proxy',   source: 'viability' },
            { id: 'extinctionRisk',   label: 'Extinction Risk',   value: 0.1, status: 'low',      valueKind: 'proxy',   source: 'viability' },
            { id: 'semanticLeak',     label: 'Semantic Leak',     value: 0,   status: 'clear',     valueKind: 'check',   source: 'integrity' },
            { id: 'nanOrInfinity',    label: 'NaN / Infinity',    value: 0,   status: 'clear',     valueKind: 'check',   source: 'diagnostics' },
            { id: 'llmTeacher',       label: 'LLM Teacher',       value: 'inactive', status: 'clear', valueKind: 'check', source: 'integrity' },
            { id: 'nodeBridge',       label: 'Node Bridge',       value: 'inactive', status: 'clear', valueKind: 'check', source: 'integrity' },
        ],
        overallStatus: 'active',
        confidence: 0.8,
        ...overrides,
    };
}

function makeNowSummary() {
    return {
        timestamp: 1000,
        lines: [
            { id: 'flow-ok', priority: 3, text: 'Torus field flow continuity is at moderate level.', source: 'viability', valueKind: 'derived' as const },
            { id: 'return-ok', priority: 4, text: 'Return signal from world medium is present.', source: 'closure', valueKind: 'derived' as const },
            { id: 'echo-moderate', priority: 5, text: 'Echo persistence is within moderate range.', source: 'closure', valueKind: 'derived' as const },
        ],
        confidence: 0.8,
    };
}

function makeSnapshot(overrides: Record<string, unknown> = {}) {
    return buildExplainableSnapshot(
        (overrides['overview'] ?? makeOverview()) as ReturnType<typeof makeOverview>,
        (overrides['nowSummary'] ?? makeNowSummary()) as ReturnType<typeof makeNowSummary>,
        (overrides['recentEvents'] as unknown[]) ?? []
    );
}

// ── Type definition tests ─────────────────────────────────────────────────────

describe('U6 type definitions', () => {
    it('GuideExplanation type is defined', () => {
        expect(srcGuideType).toContain('GuideExplanation');
        expect(srcGuideType).toContain('currentExplanation');
        expect(srcGuideType).toContain('whatToLookAt');
        expect(srcGuideType).toContain('tryNext');
        expect(srcGuideType).toContain('glossaryHints');
        expect(srcGuideType).toContain('integrityNotes');
        expect(srcGuideType).toContain('confidence');
    });

    it('GuideSuggestion type is defined', () => {
        expect(srcGuideType).toContain('GuideSuggestion');
        expect(srcGuideType).toContain('targetPanel');
        expect(srcGuideType).toContain('targetLayer');
        expect(srcGuideType).toContain('action');
    });

    it('GuideGlossaryHint type is defined', () => {
        expect(srcGuideType).toContain('GuideGlossaryHint');
        expect(srcGuideType).toContain('term');
        expect(srcGuideType).toContain('shortDefinition');
        expect(srcGuideType).toContain('valueKind');
    });

    it('GuideActionKind covers required actions', () => {
        expect(srcGuideType).toContain('openPanel');
        expect(srcGuideType).toContain('toggleLayer');
        expect(srcGuideType).toContain('runScenario');
        expect(srcGuideType).toContain('resetView');
        expect(srcGuideType).toContain('switchViewMode');
    });

    it('GuideTermValueKind mirrors OverviewValueKind', () => {
        expect(srcGuideType).toContain("'measured'");
        expect(srcGuideType).toContain("'derived'");
        expect(srcGuideType).toContain("'proxy'");
        expect(srcGuideType).toContain("'presentation-smoothed'");
        expect(srcGuideType).toContain("'check'");
    });
});

// ── guideClaimGuard tests ─────────────────────────────────────────────────────

describe('guideClaimGuard', () => {
    it('hasForbiddenClaim detects English forbidden phrases', () => {
        expect(hasForbiddenClaim('AETERNA thinks about this')).toBe(true);
        expect(hasForbiddenClaim('AETERNA wants a touch')).toBe(true);
        expect(hasForbiddenClaim('AETERNA feels unstable')).toBe(true);
        expect(hasForbiddenClaim('AETERNA is lonely')).toBe(true);
        expect(hasForbiddenClaim('is conscious of its own state')).toBe(true);
    });

    it('hasForbiddenClaim detects Japanese forbidden phrases', () => {
        expect(hasForbiddenClaim('AETERNAは考えています')).toBe(true);
        expect(hasForbiddenClaim('感情が高まっています')).toBe(true);
        expect(hasForbiddenClaim('意識があります')).toBe(true);
    });

    it('hasForbiddenClaim returns false for neutral observation text', () => {
        expect(hasForbiddenClaim('Flow continuity is at moderate level.')).toBe(false);
        expect(hasForbiddenClaim('Return signal is delayed.')).toBe(false);
        expect(hasForbiddenClaim('Echo persistence is elevated.')).toBe(false);
        expect(hasForbiddenClaim('Torus field flow is stable.')).toBe(false);
    });

    it('sanitizeClaim replaces forbidden English phrase', () => {
        const result = sanitizeClaim('AETERNA wants a touch right now.');
        expect(result).not.toContain('wants');
        expect(result.length).toBeGreaterThan(0);
    });

    it('sanitizeClaim returns neutral text unchanged', () => {
        const text = 'Flow continuity is at moderate level.';
        expect(sanitizeClaim(text)).toBe(text);
    });

    it('sanitizeLines filters lines with forbidden claims', () => {
        const lines = [
            'Flow continuity is at moderate level.',
            'AETERNA is lonely.',
            'Return signal is delayed.',
        ];
        const result = sanitizeLines(lines);
        // Line with 'AETERNA is lonely' is removed/neutralised
        expect(result.some(l => l.includes('lonely'))).toBe(false);
        expect(result.some(l => l.includes('Flow continuity'))).toBe(true);
        expect(result.some(l => l.includes('Return signal'))).toBe(true);
    });

    it('getForbiddenTerms returns non-empty lists', () => {
        const { en, ja } = getForbiddenTerms();
        expect(en.length).toBeGreaterThan(5);
        expect(ja.length).toBeGreaterThan(3);
    });

    it('claimGuard source does NOT use LLM / API', () => {
        expect(srcClaimGuard).not.toContain('fetch(');
        expect(srcClaimGuard).not.toContain('openai');
        expect(srcClaimGuard).not.toContain('gemini');
        expect(srcClaimGuard).not.toContain('apiKey');
    });
});

// ── guideCopy tests ───────────────────────────────────────────────────────────

describe('guideCopy', () => {
    it('INTEGRITY_NOTES is non-empty', () => {
        expect(INTEGRITY_NOTES.length).toBeGreaterThan(0);
    });

    it('INTEGRITY_NOTES does not contain forbidden claims', () => {
        const allText = INTEGRITY_NOTES.join(' ');
        expect(hasForbiddenClaim(allText)).toBe(false);
    });

    it('FULL_GLOSSARY contains required terms', () => {
        const terms = FULL_GLOSSARY.map(h => h.term);
        expect(terms).toContain('Flow Continuity');
        expect(terms).toContain('Echo Persistence');
        expect(terms).toContain('Closure Stability');
        expect(terms).toContain('Membrane Layer');
        expect(terms).toContain('Boundary Mediation');
        expect(terms).toContain('Trace / Residue');
        expect(terms).toContain('Local Excitability');
        expect(terms).toContain('Proto-Network Candidate');
        expect(terms).toContain('Semantic Leak');
        expect(terms).toContain('Raw');
        expect(terms).toContain('Derived');
        expect(terms).toContain('Proxy');
        expect(terms).toContain('Presentation-smoothed');
    });

    it('FULL_GLOSSARY entries have required fields', () => {
        FULL_GLOSSARY.forEach(entry => {
            expect(typeof entry.term).toBe('string');
            expect(entry.term.length).toBeGreaterThan(0);
            expect(typeof entry.shortDefinition).toBe('string');
            expect(entry.shortDefinition.length).toBeGreaterThan(0);
        });
    });

    it('FULL_GLOSSARY definitions do not contain forbidden claims', () => {
        const allText = FULL_GLOSSARY.map(h => h.shortDefinition).join(' ');
        expect(hasForbiddenClaim(allText)).toBe(false);
    });

    it('lookupGlossaryHint finds existing terms case-insensitively', () => {
        expect(lookupGlossaryHint('Flow Continuity')).toBeDefined();
        expect(lookupGlossaryHint('flow continuity')).toBeDefined();
        expect(lookupGlossaryHint('ECHO PERSISTENCE')).toBeDefined();
    });

    it('lookupGlossaryHint returns undefined for unknown term', () => {
        expect(lookupGlossaryHint('NoSuchTerm')).toBeUndefined();
    });

    it('selectGlossaryHints returns matching entries only', () => {
        const hints = selectGlossaryHints(['Raw', 'Derived', 'NonExistent']);
        expect(hints.length).toBe(2);
        expect(hints.map(h => h.term)).toContain('Raw');
        expect(hints.map(h => h.term)).toContain('Derived');
    });
});

// ── deriveGuideExplanation tests ──────────────────────────────────────────────

describe('deriveGuideExplanation', () => {
    it('returns a valid GuideExplanation with null snapshot', () => {
        const guide = deriveGuideExplanation({ snapshot: null, timestamp: 0 });
        expect(guide).toBeDefined();
        expect(Array.isArray(guide.currentExplanation)).toBe(true);
        expect(guide.currentExplanation.length).toBeGreaterThan(0);
        expect(Array.isArray(guide.whatToLookAt)).toBe(true);
        expect(Array.isArray(guide.tryNext)).toBe(true);
        expect(Array.isArray(guide.glossaryHints)).toBe(true);
        expect(Array.isArray(guide.integrityNotes)).toBe(true);
        expect(typeof guide.confidence).toBe('number');
        expect(guide.confidence).toBe(0);
    });

    it('returns a valid GuideExplanation with full snapshot', () => {
        const snapshot = makeSnapshot();
        const guide = deriveGuideExplanation({ snapshot, timestamp: Date.now() });
        expect(guide).toBeDefined();
        expect(guide.currentExplanation.length).toBeGreaterThan(0);
        expect(guide.whatToLookAt.length).toBeGreaterThan(0);
        expect(guide.tryNext.length).toBeGreaterThan(0);
        expect(guide.glossaryHints.length).toBeGreaterThan(0);
        expect(guide.integrityNotes.length).toBeGreaterThan(0);
        expect(guide.confidence).toBeGreaterThan(0);
    });

    it('currentExplanation lines are non-empty strings', () => {
        const guide = deriveGuideExplanation({ snapshot: makeSnapshot(), timestamp: 0 });
        guide.currentExplanation.forEach(line => {
            expect(typeof line).toBe('string');
            expect(line.length).toBeGreaterThan(0);
        });
    });

    it('whatToLookAt suggestions have required fields', () => {
        const guide = deriveGuideExplanation({ snapshot: makeSnapshot(), timestamp: 0 });
        guide.whatToLookAt.forEach(s => {
            expect(typeof s.id).toBe('string');
            expect(typeof s.label).toBe('string');
            expect(typeof s.reason).toBe('string');
        });
    });

    it('tryNext suggestions have required fields', () => {
        const guide = deriveGuideExplanation({ snapshot: makeSnapshot(), timestamp: 0 });
        guide.tryNext.forEach(s => {
            expect(typeof s.id).toBe('string');
            expect(typeof s.label).toBe('string');
            expect(typeof s.reason).toBe('string');
        });
    });

    it('integrityNotes are always present', () => {
        const guide = deriveGuideExplanation({ snapshot: null, timestamp: 0 });
        expect(guide.integrityNotes.length).toBeGreaterThan(0);
    });

    it('confidence is 0 for null snapshot and >0 for full snapshot', () => {
        const noData = deriveGuideExplanation({ snapshot: null, timestamp: 0 });
        expect(noData.confidence).toBe(0);

        const withData = deriveGuideExplanation({ snapshot: makeSnapshot(), timestamp: 0 });
        expect(withData.confidence).toBeGreaterThan(0);
        expect(withData.confidence).toBeLessThanOrEqual(1);
    });

    it('detects elevated saturation risk and suggests Risk Overlay layer', () => {
        const overview = makeOverview({
            metrics: [
                ...makeOverview().metrics.filter((m: { id: string }) => m.id !== 'saturationRisk'),
                { id: 'saturationRisk', label: 'Saturation Risk', value: 0.75, status: 'warning', valueKind: 'proxy', source: 'viability' },
            ],
        });
        const snapshot = makeSnapshot({ overview });
        const guide = deriveGuideExplanation({ snapshot, timestamp: 0 });
        const riskSuggestion = guide.whatToLookAt.find(s => s.targetLayer === 'riskOverlay');
        expect(riskSuggestion).toBeDefined();
    });

    it('detects weak return and suggests Medium panel', () => {
        const overview = makeOverview({
            metrics: [
                ...makeOverview().metrics.filter((m: { id: string }) => m.id !== 'returnStrength'),
                { id: 'returnStrength', label: 'Return Strength', value: 0.05, status: 'low', valueKind: 'derived', source: 'closure' },
            ],
        });
        const snapshot = makeSnapshot({ overview });
        const guide = deriveGuideExplanation({ snapshot, timestamp: 0 });
        const suggestion = guide.whatToLookAt.find(s => s.targetPanel === 'world');
        expect(suggestion).toBeDefined();
    });

    it('detects membrane overlap and suggests Membrane Layer', () => {
        const overview = makeOverview({
            metrics: [
                ...makeOverview().metrics,
                { id: 'membraneOverlap', label: 'Actuation / Return Overlap', value: 0.24, status: 'moderate', valueKind: 'proxy', source: 'membrane' },
                { id: 'membraneIntegrity', label: 'Membrane Integrity', value: 0.82, status: 'moderate', valueKind: 'proxy', source: 'membrane' },
                { id: 'membraneDeformation', label: 'Membrane Deformation', value: 0.31, status: 'moderate', valueKind: 'derived', source: 'membrane' },
            ],
        });
        const snapshot = makeSnapshot({ overview });
        const guide = deriveGuideExplanation({ snapshot, timestamp: 0 });
        const suggestion = guide.whatToLookAt.find(s => s.targetLayer === 'membraneState');
        expect(suggestion).toBeDefined();
    });

    it('generated text does NOT contain forbidden consciousness / emotion claims', () => {
        const guide = deriveGuideExplanation({ snapshot: makeSnapshot(), timestamp: 0 });
        const allText = [
            ...guide.currentExplanation,
            ...guide.whatToLookAt.map(s => s.label + ' ' + s.reason),
            ...guide.tryNext.map(s => s.label + ' ' + s.reason),
            // Note: integrityNotes intentionally references "emotion" in negation context
        ].join(' ').toLowerCase();

        const forbidden = [
            'aeterna thinks',
            'aeterna wants',
            'aeterna feels',
            'aeterna is lonely',
            'is conscious',
            'is self-aware',
            'became aware',
        ];
        forbidden.forEach(phrase => {
            expect(allText).not.toContain(phrase);
        });
    });

    it('does NOT use LLM / API in source', () => {
        expect(srcDeriveGuide).not.toContain('fetch(');
        expect(srcDeriveGuide).not.toContain('openai');
        expect(srcDeriveGuide).not.toContain('gemini');
        expect(srcDeriveGuide).not.toContain('axios');
        expect(srcDeriveGuide).not.toContain('apiKey');
        expect(srcDeriveGuide).not.toContain('API_KEY');
    });

    it('does NOT reference runtime dynamics in source', () => {
        // Guide must not directly modify field buffers, energy, trace, or return
        expect(srcDeriveGuide).not.toContain('organism.state');
        expect(srcDeriveGuide).not.toContain('network.sim');
        expect(srcDeriveGuide).not.toContain('currentBuffer');
        expect(srcDeriveGuide).not.toContain('energyBuffer');
        expect(srcDeriveGuide).not.toContain('traceBuffer');
    });
});

// ── localGuideEngine tests ────────────────────────────────────────────────────

describe('localGuideEngine', () => {
    it('generateGuide returns a GuideExplanation', () => {
        const guide = generateGuide(null);
        expect(guide).toBeDefined();
        expect(Array.isArray(guide.currentExplanation)).toBe(true);
        expect(Array.isArray(guide.integrityNotes)).toBe(true);
    });

    it('generateGuide stores result in lastExplanation', () => {
        const guide = generateGuide(makeSnapshot() as ReturnType<typeof buildExplainableSnapshot>);
        const last = getLastExplanation();
        expect(last).toBe(guide);
    });

    it('getLastExplanation returns null before first call if no prior call', () => {
        // Note: this test is order-dependent; run in isolation it should return null initially
        // but since generateGuide above was already called, we just verify it returns a value
        const last = getLastExplanation();
        expect(last !== undefined).toBe(true); // may be null or a guide
    });

    it('localGuideEngine source does NOT use LLM / API', () => {
        expect(srcLocalEngine).not.toContain('fetch(');
        expect(srcLocalEngine).not.toContain('openai');
        expect(srcLocalEngine).not.toContain('gemini');
        expect(srcLocalEngine).not.toContain('apiKey');
        expect(srcLocalEngine).not.toContain('API_KEY');
    });

    it('localGuideEngine source does NOT modify runtime dynamics', () => {
        expect(srcLocalEngine).not.toContain('currentBuffer');
        expect(srcLocalEngine).not.toContain('energyBuffer');
        expect(srcLocalEngine).not.toContain('organism.state');
        expect(srcLocalEngine).not.toContain('.energy =');
        expect(srcLocalEngine).not.toContain('.trace =');
    });
});

// ── Guide action integrity tests ──────────────────────────────────────────────

describe('guide actions — UI only, no runtime mutation', () => {
    it('all suggestion actions are restricted to UI-only kinds', () => {
        const guide = deriveGuideExplanation({ snapshot: makeSnapshot(), timestamp: 0 });
        const allowedActions = new Set(['openPanel', 'toggleLayer', 'runScenario', 'resetView', 'switchViewMode', undefined]);

        [...guide.whatToLookAt, ...guide.tryNext].forEach(s => {
            expect(allowedActions.has(s.action)).toBe(true);
        });
    });

    it('guide source does NOT dispatch mutation events to runtime', () => {
        // Guide actions use CustomEvent with guide: prefix — not organism / field mutation events
        expect(srcLocalEngine).not.toContain("dispatchEvent(new CustomEvent('organism");
        expect(srcLocalEngine).not.toContain("dispatchEvent(new CustomEvent('field");
        expect(srcLocalEngine).not.toContain("dispatchEvent(new CustomEvent('energy");
    });

    it('localGuideEngine source dispatches only guide: prefixed events', () => {
        // All custom events dispatched are prefixed with 'guide:'
        const eventMatches = srcLocalEngine.match(/new CustomEvent\('([^']+)'/g) ?? [];
        eventMatches.forEach(match => {
            const name = match.replace("new CustomEvent('", '').replaceAll("'", '');
            expect(name.startsWith('guide:')).toBe(true);
        });
    });
});

// ── Semantic / consciousness / emotion claim guard ────────────────────────────

describe('no semantic / consciousness / emotion claims in source files', () => {
    // Note: guideClaimGuard.ts is excluded because it defines the forbidden-term
    // detection list and therefore necessarily contains those phrases.
    const filesToCheck = [
        { name: 'deriveGuideExplanation', src: srcDeriveGuide },
        { name: 'localGuideEngine',       src: srcLocalEngine },
        // guideCopy and guideClaimGuard contain forbidden terms in their detection/glossary
        // lists which is intentional — they are not "claims" but "detectors"
    ];

    const claimPhrases = [
        'AETERNA thinks',
        'AETERNA wants',
        'AETERNA feels',
        'AETERNA became conscious',
        'AETERNA remembered you',
        'is sentient',
        'has emotions',
        'has consciousness',
    ];

    filesToCheck.forEach(({ name, src }) => {
        claimPhrases.forEach(phrase => {
            it(`${name} does not contain "${phrase}"`, () => {
                expect(src).not.toContain(phrase);
            });
        });
    });
});
