import { describe, expect, it } from 'vitest';
import { hashResearchConfig } from '../../research/hashResearchConfig.js';

describe('hashResearchConfig', () => {
    it('returns the same hash for equivalent configs', () => {
        const left = {
            fieldRuntimeMode: 'scalar',
            metricMode: 'flat',
            nested: { b: 2, a: 1 },
        };
        const right = {
            nested: { a: 1, b: 2 },
            metricMode: 'flat',
            fieldRuntimeMode: 'scalar',
        };

        expect(hashResearchConfig(left)).toBe(hashResearchConfig(right));
    });
});
