import { describe, expect, it } from 'vitest';

import { deriveRuntimeModeBadges } from '../../ui/natural/RuntimeModeBadge.js';
import {
    createObservationDashboardState,
    renderObservationDashboardHtml,
} from '../../ui/natural/ObservationDashboard.js';

describe('observation dashboard', () => {
    it('renders the target observation sections', () => {
        const state = createObservationDashboardState({
            runtimeBadges: deriveRuntimeModeBadges({}),
            sections: [
                { id: 'field-status', title: 'Current Field Status', items: [{ label: 'System state', value: 'ACTIVE', kind: 'check' }] },
                { id: 'geometry', title: 'Natural Geometry', items: [{ label: 'Gaussian curvature range', value: '-0.1 .. 0.1', kind: 'derived' }] },
                { id: 'complex-field', title: 'Complex Field / Vortex', items: [{ label: 'Signed total charge', value: '0', kind: 'check' }] },
                { id: 'membrane', title: 'Boundary / Membrane', items: [{ label: 'Membrane integrity', value: '0.900', kind: 'check' }] },
                { id: 'plasticity', title: 'Weak Plasticity', items: [{ label: 'Total accumulation', value: '0.0000', kind: 'proxy' }] },
                { id: 'observed-ratios', title: 'Observed Ratios', items: [{ label: 'Closest reference', value: 'goldenRatio', kind: 'reference' }] },
                { id: 'comparison', title: 'Long-Run Comparison', items: [{ label: 'Current live status', value: 'Ready for comparison', kind: 'check' }] },
                { id: 'diagnostics', title: 'Diagnostics', items: [{ label: 'NaN / Infinity count', value: '0', kind: 'check' }] },
            ],
        });

        const html = renderObservationDashboardHtml(state);
        expect(html).toContain('Current Runtime Mode');
        expect(html).toContain('Current Field Status');
        expect(html).toContain('Natural Geometry');
        expect(html).toContain('Complex Field / Vortex');
        expect(html).toContain('Boundary / Membrane');
        expect(html).toContain('Weak Plasticity');
        expect(html).toContain('Observed Ratios');
        expect(html).toContain('Long-Run Comparison');
        expect(html).toContain('Diagnostics');
        expect(html).toContain('data-kind="reference"');
    });
});
