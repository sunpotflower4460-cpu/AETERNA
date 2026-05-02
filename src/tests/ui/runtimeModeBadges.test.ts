import { describe, expect, it } from 'vitest';

import { deriveRuntimeModeBadges } from '../../ui/natural/RuntimeModeBadge.js';

describe('runtime mode badges', () => {
    it('renders the safe default stack clearly', () => {
        const badges = deriveRuntimeModeBadges({});

        expect(badges.map((badge) => badge.value)).toEqual([
            'Flat',
            'Scalar',
            'Observer',
            'Off',
            'Neutral',
            'Safe',
        ]);
    });

    it('marks experimental and legacy modes explicitly', () => {
        const badges = deriveRuntimeModeBadges({
            metricMode: 'curved',
            fieldMode: 'complexRuntime',
            membraneMode: 'weakCoupling',
            plasticityMode: 'resistanceOnly',
            constantsMode: 'legacy',
            safetyMode: 'experimental',
        });

        expect(badges.find((badge) => badge.id === 'field')?.tone).toBe('experimental');
        expect(badges.find((badge) => badge.id === 'membrane')?.tone).toBe('experimental');
        expect(badges.find((badge) => badge.id === 'plasticity')?.tone).toBe('experimental');
        expect(badges.find((badge) => badge.id === 'constants')?.tone).toBe('legacy');
        expect(badges.find((badge) => badge.id === 'safety')?.value).toBe('Experimental');
    });

    it('keeps neutral constants marked as the default baseline', () => {
        const badge = deriveRuntimeModeBadges({ constantsMode: 'neutral' })
            .find((entry) => entry.id === 'constants');

        expect(badge?.isDefault).toBe(true);
        expect(badge?.note).toContain('default runtime baseline');
    });
});
