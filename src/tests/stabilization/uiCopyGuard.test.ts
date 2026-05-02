import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

function read(relPath: string): string {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const sources = [
    read('index.html'),
    read('src/ui/guide/deriveGuideExplanation.ts'),
    read('src/ui/guide/guideCopy.ts'),
    read('src/ui/summary/deriveNowSummary.ts'),
    read('src/ui/comparison/ComparisonHighlights.tsx'),
    read('src/ui/comparison/VariantSummaryCard.tsx'),
    read('src/ui/natural/ObservationDashboard.tsx'),
];

describe('v1.1 observation UX copy guard', () => {
    it('does not introduce affirmative proof or semantic claims', () => {
        const joined = sources.join('\n').toLowerCase();
        [
            'intelligence proved',
            'life proved',
            'memory formed',
            'learned meaning',
        ].forEach((term) => {
            expect(joined).not.toContain(term);
        });

        [
            'proves intelligence',
            'proves life',
            'is mystical proof',
            'is healing proof',
        ].forEach((pattern) => {
            expect(joined).not.toContain(pattern);
        });
    });

    it('does not introduce the Japanese forbidden claim phrases as UI copy', () => {
        const joined = sources.join('\n');
        [
            '知性が証明',
            '生命が証明',
            '神秘の証明',
            '癒しの証明',
            '記憶しました',
            '意味を学習',
        ].forEach((term) => {
            expect(joined).not.toContain(term);
        });
    });
});
