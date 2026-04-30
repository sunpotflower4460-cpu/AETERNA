/**
 * scientificTorusRenderer.test.ts
 * U3: Scientific Torus Renderer — static smoke tests
 *
 * Verifies that:
 * - Render mode types are correctly defined
 * - Color map is defined with all required entries
 * - Layer registry is defined with all required layers
 * - Coverage metrics can be computed
 * - Diagnostic warnings can be generated
 * - Render mode manager state is correct
 * - No fake visual functions are defined
 * - No semantic / consciousness / emotion claims exist in renderer files
 * - Runtime dynamics are not modified by renderer files
 *
 * These are static / unit tests that do not require a browser or DOM.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Import modules under test ─────────────────────────────────────────────────

import {
    DEFAULT_TORUS_RENDER_STATE,
} from '../../types/torusRenderState.js';

import {
    TORUS_COLOR_MAP,
    TORUS_COLOR_LEGEND,
    getTorusColor,
    lerpTorusColor,
    mapActivityToColor,
} from '../../ui/render/torusColorMap.js';

import {
    getAllLayers,
    getLayer,
    getVisibleLayers,
    setLayerVisible,
    toggleLayer,
    resetLayerVisibility,
} from '../../ui/render/torusLayerRegistry.js';

import {
    computeTorusCoverageMetrics,
    estimateVisibleCoverageRatio,
} from '../../ui/render/torusCoverageMetrics.js';

import {
    generateDiagnosticReport,
    formatDiagnosticSummary,
} from '../../ui/render/torusDiagnosticWarnings.js';

import {
    getTorusRenderState,
    setRenderMode,
    setNormalizationMode,
    setPerformanceMode,
    renderModeLabel,
    normalizationModeLabel,
    performanceModeLabel,
    getMeshResolutionFactor,
    getBloomIntensity,
    getParticleCountFactor,
} from '../../ui/render/torusRenderModeManager.js';

// ── Source file strings for static analysis ───────────────────────────────────

const ROOT = resolve(__dirname, '../..');

const renderStateSrc       = readFileSync(resolve(ROOT, 'types/torusRenderState.ts'), 'utf-8');
const colorMapSrc          = readFileSync(resolve(ROOT, 'ui/render/torusColorMap.ts'), 'utf-8');
const layerRegistrySrc     = readFileSync(resolve(ROOT, 'ui/render/torusLayerRegistry.ts'), 'utf-8');
const coverageMetricsSrc   = readFileSync(resolve(ROOT, 'ui/render/torusCoverageMetrics.ts'), 'utf-8');
const diagnosticWarningSrc = readFileSync(resolve(ROOT, 'ui/render/torusDiagnosticWarnings.ts'), 'utf-8');
const renderModeManagerSrc = readFileSync(resolve(ROOT, 'ui/render/torusRenderModeManager.ts'), 'utf-8');

const allRendererSrcs = [
    renderStateSrc, colorMapSrc, layerRegistrySrc,
    coverageMetricsSrc, diagnosticWarningSrc, renderModeManagerSrc,
];

// ── Render Mode Types ─────────────────────────────────────────────────────────

describe('U3: TorusRenderState types', () => {
    it('TorusRenderMode type includes raw, smooth, overlay, diagnostic', () => {
        expect(renderStateSrc).toContain("'raw'");
        expect(renderStateSrc).toContain("'smooth'");
        expect(renderStateSrc).toContain("'overlay'");
        expect(renderStateSrc).toContain("'diagnostic'");
    });

    it('TorusNormalizationMode includes global and local', () => {
        expect(renderStateSrc).toContain("'global'");
        expect(renderStateSrc).toContain("'local'");
    });

    it('TorusPerformanceMode includes high, balanced, battery, diagnostic', () => {
        expect(renderStateSrc).toContain("'high'");
        expect(renderStateSrc).toContain("'balanced'");
        expect(renderStateSrc).toContain("'battery'");
    });

    it('TorusRenderState interface is defined', () => {
        expect(renderStateSrc).toContain('TorusRenderState');
    });

    it('DEFAULT_TORUS_RENDER_STATE is exported', () => {
        expect(renderStateSrc).toContain('DEFAULT_TORUS_RENDER_STATE');
    });

    it('DEFAULT_TORUS_RENDER_STATE mode defaults to raw', () => {
        expect(DEFAULT_TORUS_RENDER_STATE.mode).toBe('raw');
    });

    it('DEFAULT_TORUS_RENDER_STATE normalization defaults to global', () => {
        expect(DEFAULT_TORUS_RENDER_STATE.normalization).toBe('global');
    });

    it('DEFAULT_TORUS_RENDER_STATE performance defaults to balanced', () => {
        expect(DEFAULT_TORUS_RENDER_STATE.performance).toBe('balanced');
    });

    it('DEFAULT_TORUS_RENDER_STATE smoothingEnabled defaults to false', () => {
        expect(DEFAULT_TORUS_RENDER_STATE.smoothingEnabled).toBe(false);
    });

    it('DEFAULT_TORUS_RENDER_STATE showInactiveSurface defaults to true', () => {
        expect(DEFAULT_TORUS_RENDER_STATE.showInactiveSurface).toBe(true);
    });

    it('DEFAULT_TORUS_RENDER_STATE showBackside defaults to true', () => {
        expect(DEFAULT_TORUS_RENDER_STATE.showBackside).toBe(true);
    });
});

// ── Color Map ─────────────────────────────────────────────────────────────────

describe('U3: torusColorMap', () => {
    it('TORUS_COLOR_MAP is defined', () => {
        expect(TORUS_COLOR_MAP).toBeDefined();
    });

    it('flow color is defined (Blue/Cyan)', () => {
        expect(TORUS_COLOR_MAP.flow).toBeDefined();
        expect(TORUS_COLOR_MAP.flow.hex).toBe('#22d3ee');
    });

    it('recovery color is defined (Green)', () => {
        expect(TORUS_COLOR_MAP.recovery).toBeDefined();
        expect(TORUS_COLOR_MAP.recovery.hex).toBe('#34d399');
    });

    it('coherentActivity color is defined (White / near-white)', () => {
        expect(TORUS_COLOR_MAP.coherentActivity).toBeDefined();
    });

    it('trace color is defined (Purple)', () => {
        expect(TORUS_COLOR_MAP.trace).toBeDefined();
        expect(TORUS_COLOR_MAP.trace.hex).toBe('#a78bfa');
    });

    it('sensoryReturn color is defined (Orange)', () => {
        expect(TORUS_COLOR_MAP.sensoryReturn).toBeDefined();
    });

    it('saturation color is defined (Red — overload risk only)', () => {
        expect(TORUS_COLOR_MAP.saturation).toBeDefined();
        expect(TORUS_COLOR_MAP.saturation.observationLabel).toContain('Saturation');
    });

    it('inactiveSurface color is defined (Dark)', () => {
        expect(TORUS_COLOR_MAP.inactiveSurface).toBeDefined();
    });

    it('backsideFaint color is defined', () => {
        expect(TORUS_COLOR_MAP.backsideFaint).toBeDefined();
    });

    it('all color entries have hex, r, g, b, observationLabel, valueType, description', () => {
        for (const [key, entry] of Object.entries(TORUS_COLOR_MAP)) {
            expect(entry.hex, `${key}.hex`).toBeDefined();
            expect(typeof entry.r, `${key}.r`).toBe('number');
            expect(typeof entry.g, `${key}.g`).toBe('number');
            expect(typeof entry.b, `${key}.b`).toBe('number');
            expect(entry.observationLabel, `${key}.observationLabel`).toBeTruthy();
            expect(entry.valueType, `${key}.valueType`).toBeTruthy();
            expect(entry.description, `${key}.description`).toBeTruthy();
        }
    });

    it('getTorusColor returns an entry for valid key', () => {
        const entry = getTorusColor('flow');
        expect(entry.hex).toBe('#22d3ee');
    });

    it('getTorusColor returns inactiveSurface for unknown key', () => {
        const entry = getTorusColor('nonexistent_key_xyz');
        expect(entry).toEqual(TORUS_COLOR_MAP.inactiveSurface);
    });

    it('lerpTorusColor returns a value between the two colors', () => {
        const result = lerpTorusColor(TORUS_COLOR_MAP.inactiveSurface, TORUS_COLOR_MAP.flow, 0.5);
        expect(result.r).toBeGreaterThan(TORUS_COLOR_MAP.inactiveSurface.r);
        expect(result.r).toBeLessThan(TORUS_COLOR_MAP.flow.r);
    });

    it('mapActivityToColor(0) returns dark color', () => {
        const c = mapActivityToColor(0);
        // inactiveSurface: r=0.118, g=0.161, b=0.231 → sum ≈ 0.51 (dark)
        expect(c.r + c.g + c.b).toBeLessThan(0.6);
    });

    it('mapActivityToColor(0.5) returns mid-range (activity) color', () => {
        const c = mapActivityToColor(0.5);
        // Should be in the cyan range
        expect(c.b).toBeGreaterThan(0.3);
    });

    it('mapActivityToColor(1.0) reaches saturation red territory', () => {
        const c = mapActivityToColor(1.0);
        // Red component should be significant
        expect(c.r).toBeGreaterThan(0.5);
    });

    it('TORUS_COLOR_LEGEND is defined and non-empty', () => {
        expect(TORUS_COLOR_LEGEND.length).toBeGreaterThan(0);
    });

    it('TORUS_COLOR_LEGEND entries have key, label, hex, valueType', () => {
        for (const entry of TORUS_COLOR_LEGEND) {
            expect(entry.key).toBeTruthy();
            expect(entry.label).toBeTruthy();
            expect(entry.hex).toBeTruthy();
            expect(entry.valueType).toBeTruthy();
        }
    });
});

// ── Layer Registry ────────────────────────────────────────────────────────────

describe('U3: torusLayerRegistry', () => {
    it('getAllLayers returns a non-empty array', () => {
        const layers = getAllLayers();
        expect(layers.length).toBeGreaterThan(0);
    });

    it('energy layer is defined and visible by default', () => {
        const layer = getLayer('energy');
        expect(layer).toBeDefined();
        expect(layer?.visible).toBe(true);
    });

    it('trace layer is defined', () => {
        expect(getLayer('trace')).toBeDefined();
    });

    it('sensoryReturn layer is defined', () => {
        expect(getLayer('sensoryReturn')).toBeDefined();
    });

    it('closureMatch layer is defined', () => {
        expect(getLayer('closureMatch')).toBeDefined();
    });

    it('localExcitability layer is defined', () => {
        expect(getLayer('localExcitability')).toBeDefined();
    });

    it('repeatedFlow layer is defined', () => {
        expect(getLayer('repeatedFlow')).toBeDefined();
    });

    it('protoNetwork layer is defined', () => {
        expect(getLayer('protoNetwork')).toBeDefined();
    });

    it('all layers have id, label, description, visible, colorHex, valueType, available', () => {
        for (const layer of getAllLayers()) {
            expect(layer.id).toBeTruthy();
            expect(layer.label).toBeTruthy();
            expect(layer.description).toBeTruthy();
            expect(typeof layer.visible).toBe('boolean');
            expect(layer.colorHex).toBeTruthy();
            expect(layer.valueType).toBeTruthy();
            expect(typeof layer.available).toBe('boolean');
        }
    });

    it('setLayerVisible works', () => {
        setLayerVisible('trace', true);
        expect(getLayer('trace')?.visible).toBe(true);
        setLayerVisible('trace', false);
        expect(getLayer('trace')?.visible).toBe(false);
    });

    it('setLayerVisible returns false for unknown id', () => {
        expect(setLayerVisible('nonexistent_xyz', true)).toBe(false);
    });

    it('toggleLayer toggles visibility', () => {
        const before = getLayer('trace')?.visible ?? false;
        const after  = toggleLayer('trace');
        expect(after).toBe(!before);
        toggleLayer('trace'); // restore
    });

    it('toggleLayer returns undefined for unknown id', () => {
        expect(toggleLayer('nonexistent_xyz')).toBeUndefined();
    });

    it('resetLayerVisibility restores only energy as visible', () => {
        setLayerVisible('trace', true);
        setLayerVisible('closureMatch', true);
        resetLayerVisibility();
        expect(getLayer('energy')?.visible).toBe(true);
        expect(getLayer('trace')?.visible).toBe(false);
        expect(getLayer('closureMatch')?.visible).toBe(false);
    });

    it('getVisibleLayers returns only visible + available layers', () => {
        resetLayerVisibility();
        const visible = getVisibleLayers();
        expect(visible.every((l) => l.visible && l.available)).toBe(true);
    });
});

// ── Coverage Metrics ──────────────────────────────────────────────────────────

describe('U3: torusCoverageMetrics', () => {
    it('computeTorusCoverageMetrics returns a metrics object', () => {
        const buf = new Float32Array(72 * 72).fill(0.5);
        const result = computeTorusCoverageMetrics(buf, 72 * 72, 72);
        expect(result).toBeDefined();
        expect(result.totalRegionCount).toBeGreaterThan(0);
    });

    it('all-active buffer gives activeCoverageRatio = 1.0', () => {
        const buf = new Float32Array(72 * 72).fill(1.0);
        const result = computeTorusCoverageMetrics(buf, 72 * 72, 72, 0.05);
        expect(result.activeCoverageRatio).toBe(1.0);
    });

    it('all-zero buffer gives activeCoverageRatio = 0', () => {
        const buf = new Float32Array(72 * 72).fill(0.0);
        const result = computeTorusCoverageMetrics(buf, 72 * 72, 72, 0.05);
        expect(result.activeCoverageRatio).toBe(0);
        expect(result.activeRegionCount).toBe(0);
        expect(result.inactiveRegionCount).toBeGreaterThan(0);
    });

    it('activeRegionConcentration is 0-1', () => {
        const buf = new Float32Array(72 * 72).fill(0.5);
        const result = computeTorusCoverageMetrics(buf, 72 * 72, 72);
        expect(result.activeRegionConcentration).toBeGreaterThanOrEqual(0);
        expect(result.activeRegionConcentration).toBeLessThanOrEqual(1);
    });

    it('uniform distribution gives low concentration', () => {
        const buf = new Float32Array(72 * 72).fill(1.0);
        const result = computeTorusCoverageMetrics(buf, 72 * 72, 72, 0.05);
        // Uniform distribution should have concentration near 0
        expect(result.activeRegionConcentration).toBeLessThan(0.2);
    });

    it('maxActivityRegionIndex is -1 when no active regions', () => {
        const buf = new Float32Array(72 * 72).fill(0.0);
        const result = computeTorusCoverageMetrics(buf, 72 * 72, 72, 0.05);
        expect(result.maxActivityRegionIndex).toBe(-1);
    });

    it('visibleCoverageRatio is within 0-1', () => {
        const buf = new Float32Array(72 * 72).fill(0.5);
        const result = computeTorusCoverageMetrics(buf, 72 * 72, 72, 0.05, 0.7);
        expect(result.visibleCoverageRatio).toBe(0.7);
    });

    it('estimateVisibleCoverageRatio returns 0-1 for any elevation', () => {
        for (const e of [0, 0.5, Math.PI / 2, -0.3]) {
            const r = estimateVisibleCoverageRatio(e);
            expect(r).toBeGreaterThanOrEqual(0);
            expect(r).toBeLessThanOrEqual(1);
        }
    });
});

// ── Diagnostic Warnings ───────────────────────────────────────────────────────

describe('U3: torusDiagnosticWarnings', () => {
    it('clean buffer produces no warnings', () => {
        const buf = new Float32Array(100).fill(1.0);
        const report = generateDiagnosticReport(buf, 100);
        expect(report.warnings.length).toBe(0);
        expect(report.hasErrors).toBe(false);
    });

    it('NaN values produce an error warning', () => {
        const buf = new Float32Array(100).fill(1.0);
        buf[0] = NaN;
        buf[1] = NaN;
        const report = generateDiagnosticReport(buf, 100);
        const nanWarn = report.warnings.find((w) => w.id === 'nan');
        expect(nanWarn).toBeDefined();
        expect(nanWarn?.severity).toBe('error');
        expect(nanWarn?.count).toBe(2);
        expect(report.hasErrors).toBe(true);
    });

    it('Infinity values produce an error warning', () => {
        const buf = new Float32Array(100).fill(1.0);
        buf[5] = Infinity;
        const report = generateDiagnosticReport(buf, 100);
        const infWarn = report.warnings.find((w) => w.id === 'infinity');
        expect(infWarn).toBeDefined();
        expect(infWarn?.severity).toBe('error');
        expect(infWarn?.count).toBe(1);
    });

    it('values above clipping threshold produce a clipping warning', () => {
        const buf = new Float32Array(10).fill(10.0); // exceeds default clippingThreshold=8
        const report = generateDiagnosticReport(buf, 10);
        expect(report.warnings.find((w) => w.id === 'clipping')).toBeDefined();
    });

    it('values above overbright threshold produce an info warning', () => {
        const buf = new Float32Array(10).fill(6.0); // exceeds overbrightThreshold=5 but not clippingThreshold=8
        const report = generateDiagnosticReport(buf, 10);
        expect(report.warnings.find((w) => w.id === 'overbright')).toBeDefined();
    });

    it('hidden backside produces info warning when checkBacksideVisibility=true', () => {
        const buf = new Float32Array(10).fill(1.0);
        const report = generateDiagnosticReport(buf, 10, {
            checkBacksideVisibility: true,
            backsideVisible: false,
        });
        expect(report.warnings.find((w) => w.id === 'backside_hidden')).toBeDefined();
    });

    it('low coverage produces info warning when hasCoverageMetrics=true', () => {
        const buf = new Float32Array(10).fill(1.0);
        const report = generateDiagnosticReport(buf, 10, {
            hasCoverageMetrics: true,
            activeCoverageRatio: 0.02,
        });
        expect(report.warnings.find((w) => w.id === 'coverage_low')).toBeDefined();
    });

    it('formatDiagnosticSummary returns OK message for clean report', () => {
        const buf = new Float32Array(10).fill(1.0);
        const report = generateDiagnosticReport(buf, 10);
        const summary = formatDiagnosticSummary(report);
        expect(summary).toContain('OK');
    });

    it('formatDiagnosticSummary includes error indicator for NaN', () => {
        const buf = new Float32Array(10).fill(1.0);
        buf[0] = NaN;
        const report = generateDiagnosticReport(buf, 10);
        const summary = formatDiagnosticSummary(report);
        expect(summary).toContain('✗');
    });

    it('sampledCount equals numNodes', () => {
        const buf = new Float32Array(50).fill(1.0);
        const report = generateDiagnosticReport(buf, 50);
        expect(report.sampledCount).toBe(50);
    });
});

// ── Render Mode Manager ───────────────────────────────────────────────────────

describe('U3: torusRenderModeManager', () => {
    it('initial mode is raw', () => {
        // Reset to default by calling setRenderMode first
        setRenderMode('raw');
        expect(getTorusRenderState().mode).toBe('raw');
    });

    it('setRenderMode to smooth enables smoothingEnabled', () => {
        setRenderMode('smooth');
        expect(getTorusRenderState().smoothingEnabled).toBe(true);
        setRenderMode('raw');
    });

    it('setRenderMode to raw disables smoothingEnabled', () => {
        setRenderMode('raw');
        expect(getTorusRenderState().smoothingEnabled).toBe(false);
    });

    it('setRenderMode to diagnostic enables showDiagnosticWarnings', () => {
        setRenderMode('diagnostic');
        expect(getTorusRenderState().showDiagnosticWarnings).toBe(true);
        setRenderMode('raw');
    });

    it('setNormalizationMode sets normalization', () => {
        setNormalizationMode('local');
        expect(getTorusRenderState().normalization).toBe('local');
        setNormalizationMode('global');
        expect(getTorusRenderState().normalization).toBe('global');
    });

    it('setPerformanceMode sets performance', () => {
        setPerformanceMode('battery');
        expect(getTorusRenderState().performance).toBe('battery');
        setPerformanceMode('balanced');
    });

    it('renderModeLabel returns correct label for each mode', () => {
        expect(renderModeLabel('raw')).toBe('Raw');
        expect(renderModeLabel('smooth')).toBe('Scientific Smooth');
        expect(renderModeLabel('overlay')).toBe('Layer Overlay');
        expect(renderModeLabel('diagnostic')).toBe('Diagnostic');
    });

    it('normalizationModeLabel describes local norm as presentation aid', () => {
        const label = normalizationModeLabel('local');
        expect(label).toContain('presentation aid');
    });

    it('performanceModeLabel returns non-empty string for each mode', () => {
        for (const mode of ['high', 'balanced', 'battery', 'diagnostic'] as const) {
            expect(performanceModeLabel(mode)).toBeTruthy();
        }
    });

    it('getMeshResolutionFactor > 1 for high, <= 1 for balanced and below', () => {
        expect(getMeshResolutionFactor('high')).toBeGreaterThan(1);
        expect(getMeshResolutionFactor('balanced')).toBeLessThanOrEqual(1);
        expect(getMeshResolutionFactor('battery')).toBeLessThan(1);
    });

    it('getBloomIntensity is 0 for diagnostic mode', () => {
        expect(getBloomIntensity('diagnostic')).toBe(0);
    });

    it('getBloomIntensity is <= 1 for all modes', () => {
        for (const mode of ['high', 'balanced', 'battery', 'diagnostic'] as const) {
            expect(getBloomIntensity(mode)).toBeLessThanOrEqual(1.0);
        }
    });

    it('getParticleCountFactor < 1 for battery mode', () => {
        expect(getParticleCountFactor('battery')).toBeLessThan(1);
    });
});

// ── Safety: No Fake Visuals ───────────────────────────────────────────────────

describe('U3: Safety — no fake visuals', () => {
    it('no fakeEnergy in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('fakeEnergy'));
    });

    it('no fakeFlow in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('fakeFlow'));
    });

    it('no fakeTrace in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('fakeTrace'));
    });

    it('no artificialFluctuation in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('artificialFluctuation'));
    });

    it('no addOrganicWobble in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('addOrganicWobble'));
    });

    it('no randomGlowWhenQuiet in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('randomGlowWhenQuiet'));
    });

    it('no forceBeautifulFlow in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('forceBeautifulFlow'));
    });
});

// ── Safety: No Semantic / Consciousness / Emotion Claims ─────────────────────

describe('U3: Safety — no semantic/consciousness/emotion claims', () => {
    it('no consciousness claim in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('consciousness'));
    });

    it('no self-awareness claim in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('self-awareness'));
    });

    it('no emotion claim in renderer files', () => {
        allRendererSrcs.forEach((src) => {
            const matches = (src.match(/\bemotion\b/g) ?? []).length;
            expect(matches).toBe(0);
        });
    });

    it('no semanticNode in renderer files', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('semanticNode'));
    });
});

// ── Safety: Runtime Not Modified ─────────────────────────────────────────────

describe('U3: Safety — runtime not modified', () => {
    it('renderer files do not touch AeternaNetwork', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('AeternaNetwork'));
    });

    it('renderer files do not call updateDynamics', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain('updateDynamics'));
    });

    it('renderer files do not modify organism state', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toContain("from '../../organism/state"));
    });

    it('renderer files do not write to currentBuffer', () => {
        allRendererSrcs.forEach((src) => {
            // Reading is allowed; writing (assignment) is not
            expect(src).not.toMatch(/currentBuffer\[.*\]\s*=/);
        });
    });

    it('renderer files do not modify traceMap', () => {
        allRendererSrcs.forEach((src) => expect(src).not.toMatch(/traceMap\[.*\]\s*=/));
    });
});
