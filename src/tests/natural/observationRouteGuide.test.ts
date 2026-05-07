/**
 * observationRouteGuide.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — ObservationRouteGuide tests
 */

import { describe, it, expect } from 'vitest';
import {
    renderObservationRouteGuideHTML,
    buildNextStepHint,
    OBSERVATION_ROUTE_STEPS,
} from '../../ui/natural/ObservationRouteGuide.tsx';

// ── OBSERVATION_ROUTE_STEPS ───────────────────────────────────────────────────

describe('OBSERVATION_ROUTE_STEPS: structure', () => {
    it('has exactly 8 steps', () => {
        expect(OBSERVATION_ROUTE_STEPS).toHaveLength(8);
    });

    it('all steps have id, label, and description', () => {
        for (const step of OBSERVATION_ROUTE_STEPS) {
            expect(step.id).toBeTruthy();
            expect(step.label).toBeTruthy();
            expect(step.description).toBeTruthy();
        }
    });

    it('first step is "場全体を見る"', () => {
        expect(OBSERVATION_ROUTE_STEPS[0].label).toContain('場全体');
    });

    it('last step is "結果を書き出す"', () => {
        const last = OBSERVATION_ROUTE_STEPS[OBSERVATION_ROUTE_STEPS.length - 1];
        expect(last.label).toContain('書き出す');
    });
});

// ── buildNextStepHint ─────────────────────────────────────────────────────────

describe('buildNextStepHint', () => {
    it('returns hint for next step', () => {
        const hint = buildNextStepHint(0);
        expect(hint).toContain('次におすすめ');
    });

    it('returns completion message at last step', () => {
        const hint = buildNextStepHint(OBSERVATION_ROUTE_STEPS.length - 1);
        expect(hint).toContain('完了');
    });
});

// ── renderObservationRouteGuideHTML ───────────────────────────────────────────

describe('renderObservationRouteGuideHTML: full list mode', () => {
    it('renders the title "おすすめ観測ルート"', () => {
        const html = renderObservationRouteGuideHTML({});
        expect(html).toContain('おすすめ観測ルート');
    });

    it('renders all 8 step IDs as data-step-id attributes', () => {
        const html = renderObservationRouteGuideHTML({});
        for (const step of OBSERVATION_ROUTE_STEPS) {
            expect(html).toContain(`data-step-id="${step.id}"`);
        }
    });

    it('marks current step as active', () => {
        const html = renderObservationRouteGuideHTML({ currentStepIndex: 2 });
        expect(html).toContain('observation-route-guide__step--active');
    });
});

describe('renderObservationRouteGuideHTML: compact mode', () => {
    it('renders compact variant when compact=true', () => {
        const html = renderObservationRouteGuideHTML({
            currentStepIndex: 1,
            compact: true,
        });
        expect(html).toContain('observation-route-guide--compact');
    });

    it('shows current step label in compact mode', () => {
        const html = renderObservationRouteGuideHTML({
            currentStepIndex: 1,
            compact: true,
        });
        expect(html).toContain(OBSERVATION_ROUTE_STEPS[1].label);
    });

    it('shows next step hint in compact mode', () => {
        const html = renderObservationRouteGuideHTML({
            currentStepIndex: 0,
            compact: true,
        });
        expect(html).toContain('次におすすめ');
    });

    it('shows completion message when past last step', () => {
        const html = renderObservationRouteGuideHTML({
            currentStepIndex: 999,
            compact: true,
        });
        expect(html).toContain('完了');
    });
});

describe('renderObservationRouteGuideHTML: no forbidden claims', () => {
    const forbidden = [
        'consciousness proved',
        'aeterna feels',
        'soul',
        'life proof',
        'intelligence emerged',
    ];

    it('contains no forbidden claims', () => {
        const html = renderObservationRouteGuideHTML({}).toLowerCase();
        for (const phrase of forbidden) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
