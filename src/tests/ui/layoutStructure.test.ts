/**
 * U1: Layout Structure Smoke Tests
 *
 * Verifies that the 3-layer layout structure (Layer A / B / C) is present
 * in the generated HTML and that key architectural constraints are met.
 *
 * These are static tests that read index.html as a string; they do not
 * require a browser or DOM environment.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const html = readFileSync(resolve(__dirname, '../../../index.html'), 'utf-8');

describe('U1: Layout Structure', () => {
    describe('Layer A: Main Field View', () => {
        it('canvas-container exists', () => {
            expect(html).toContain('id="canvas-container"');
        });
        it('canvas-container is not inside a right panel', () => {
            // canvas-container should appear before research-panel in the DOM
            const canvasIdx = html.indexOf('id="canvas-container"');
            const panelIdx  = html.indexOf('id="research-panel"');
            expect(canvasIdx).toBeGreaterThan(0);
            expect(canvasIdx).toBeLessThan(panelIdx);
        });
    });

    describe('Layer B: Observation HUD', () => {
        it('observation-hud exists', () => {
            expect(html).toContain('id="observation-hud"');
        });
        it('HUD contains flow chip', () => {
            expect(html).toContain('id="hud-chip-flow"');
        });
        it('HUD contains return chip', () => {
            expect(html).toContain('id="hud-chip-return"');
        });
        it('HUD contains echo chip', () => {
            expect(html).toContain('id="hud-chip-echo"');
        });
        it('HUD contains risk chip', () => {
            expect(html).toContain('id="hud-chip-risk"');
        });
        it('system-state-badge exists inside HUD section', () => {
            expect(html).toContain('id="system-state-badge"');
        });
        it('major-process-indicator exists', () => {
            expect(html).toContain('id="major-process-indicator"');
        });
    });

    describe('Layer C: Research Panel', () => {
        it('research-panel exists', () => {
            expect(html).toContain('id="research-panel"');
        });
        it('research-panel starts collapsed (rp-closed)', () => {
            expect(html).toContain('class="rp-closed"');
        });
        it('research-panel has a toggle button', () => {
            expect(html).toContain('id="research-panel-toggle"');
        });
        it('research tabs exist', () => {
            expect(html).toContain('id="research-tabs"');
        });
        it('Overview is the first tab and starts active', () => {
            const tabsSection = html.slice(html.indexOf('id="research-tabs"'));
            const firstRtab = tabsSection.match(/class="rtab([^"]*)"[^>]*data-tab="([^"]+)"/);
            expect(firstRtab).toBeTruthy();
            expect(firstRtab?.[1]).toContain('rtab-active');
            expect(firstRtab?.[2]).toBe('overview');
        });
        it('tab-overview content is visible by default', () => {
            expect(html).toContain('id="tab-overview" class="rtab-content rtab-visible');
        });
        it('all 8 expected tabs exist', () => {
            for (const tab of ['overview', 'field', 'world', 'medium', 'paths', 'network', 'scenarios', 'raw']) {
                expect(html).toContain(`data-tab="${tab}"`);
                expect(html).toContain(`id="tab-${tab}"`);
            }
        });
    });

    describe('Overview Panel', () => {
        it('overview-cards section exists', () => {
            expect(html).toContain('id="overview-cards"');
        });
        it('Flow Continuity card exists', () => {
            expect(html).toContain('id="ov-card-flow"');
        });
        it('Return Strength card exists', () => {
            expect(html).toContain('id="ov-card-return"');
        });
        it('Energy card exists', () => {
            expect(html).toContain('id="ov-card-energy"');
        });
        it('Saturation Risk card exists', () => {
            expect(html).toContain('id="ov-card-saturation"');
        });
        it('Collapse Risk card exists', () => {
            expect(html).toContain('id="ov-card-collapse"');
        });
        it('Semantic Leak card shows 0 (semantic layer is not active)', () => {
            expect(html).toContain('ov-card-semantic');
            expect(html).toContain('always 0');
        });
    });

    describe('Explain Button', () => {
        it('explain-btn exists', () => {
            expect(html).toContain('id="explain-btn"');
        });
        it('explain-panel exists', () => {
            expect(html).toContain('id="explain-panel"');
        });
        it('explain panel is hidden by default (no explain-visible class on page load)', () => {
            // explain-panel should not have explain-visible class in the static HTML (it is JS-toggled at runtime)
            const panelDecl = html.match(/id="explain-panel"[^>]*/)?.[0] ?? '';
            expect(panelDecl).not.toContain('explain-visible');
        });
        it('Explain button calls toggleExplain()', () => {
            expect(html).toContain('onclick="toggleExplain()"');
        });
    });

    describe('Event Strip', () => {
        it('event-strip exists', () => {
            expect(html).toContain('id="event-strip"');
        });
        it('event-strip-list exists', () => {
            expect(html).toContain('id="event-strip-list"');
        });
    });

    describe('Mobile Layout', () => {
        it('mobile-bottom-nav exists', () => {
            expect(html).toContain('id="mobile-bottom-nav"');
        });
        it('mobile sheet drag handle exists', () => {
            expect(html).toContain('id="sheet-drag-handle"');
        });
        it('mobile close button exists', () => {
            expect(html).toContain('id="sheet-close-btn"');
        });
        it('mobile nav has 5 navigation buttons', () => {
            const navSection = html.slice(
                html.indexOf('id="mobile-bottom-nav"'),
                html.indexOf('</div>', html.indexOf('id="mobile-bottom-nav"') + 200) + 2000
            );
            const btnCount = (navSection.match(/class="mobile-nav-btn"/g) || []).length;
            expect(btnCount).toBe(5);
        });
    });

    describe('Raw / Advanced isolation', () => {
        it('API key input is inside tab-raw, not in the main visible area', () => {
            const rawTabIdx = html.indexOf('id="tab-raw"');
            const apiKeyIdx = html.indexOf('id="api-key"');
            expect(rawTabIdx).toBeGreaterThan(0);
            expect(apiKeyIdx).toBeGreaterThan(rawTabIdx);
        });
        it('tab-raw does NOT start visible', () => {
            const rawTabMatch = html.match(/id="tab-raw" class="([^"]*)"/);
            expect(rawTabMatch).toBeTruthy();
            expect(rawTabMatch?.[1]).not.toContain('rtab-visible');
        });
    });

    describe('Runtime / Safety checks', () => {
        it('does not contain fake visual functions', () => {
            expect(html).not.toContain('fakeEnergy');
            expect(html).not.toContain('fakeFlow');
            expect(html).not.toContain('fakeTrace');
            expect(html).not.toContain('artificialFluctuation');
        });
        it('does not contain consciousness / emotion claims in UI text', () => {
            // emotionalCharge is an existing signal runtime field name (not a claim) - exclude it
            // Check for actual UI claims using more specific patterns
            expect(html).not.toContain('consciousness');
            expect(html).not.toContain('self-awareness');
            // "emotion" as a standalone claim (not "emotionalCharge" signal field or "emotions" in docs)
            const emotionClaims = html.match(/[^a-zA-Z]emotion[^a-zA-Z]/g) ?? [];
            expect(emotionClaims.length).toBe(0);
        });
        it('semantic layer note correctly indicates inactive status', () => {
            // The ov-card-semantic shows "always 0" to indicate semantic layer is not active
            expect(html).toContain('always 0');
        });
    });
});
