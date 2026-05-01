import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

const SOURCES = [
    'index.html',
    'src/types/torusRenderState.ts',
    'src/ui/render/torusColorMap.ts',
    'src/ui/render/torusLayerRegistry.ts',
    'src/ui/render/torusRenderModeManager.ts',
    'src/ui/render/fieldLayerRegistry.ts',
    'src/ui/render/fieldLayerOverlayRules.ts',
    'src/ui/render/torusCoverageMetrics.ts',
    'src/ui/render/torusDiagnosticWarnings.ts',
    'src/ui/summary/deriveNowSummary.ts',
    'src/ui/guide/deriveGuideExplanation.ts',
    'src/ui/guide/guideCopy.ts',
    'src/scenario/scenarioPresetRegistry.ts',
    'src/ui/layout/layoutControls.js',
] as const;

const BANNED_NAMES = [
    'addFakeEnergy',
    'addFakeFlow',
    'addFakeTrace',
    'addOrganicWobble',
    'randomGlowWhenQuiet',
    'forceBeautifulFlow',
    'fakeLifeLikeMotion',
] as const;

const contents = SOURCES.map((file) => readFileSync(resolve(ROOT, file), 'utf-8'));
const combined = contents.join('\n');

describe('U8 fake visual guard', () => {
    it('audited UI sources do not define banned fake-visual helpers', () => {
        for (const name of BANNED_NAMES) {
            expect(combined).not.toContain(name);
        }
    });

    it('renderer state remains presentation-focused rather than life-like staging', () => {
        expect(combined).toContain('presentation');
        expect(combined).not.toContain('artificial fluctuation');
        expect(combined).not.toContain('life-like');
    });

    it('diagnostic and smoothing copy stays tied to observation values', () => {
        expect(combined).toContain('presentation-only');
        expect(combined).toContain('does not create activity');
    });
});
