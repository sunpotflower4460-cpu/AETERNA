/**
 * scientificTorusRenderer.test.ts
 * U3: Scientific Torus Renderer — smoke tests
 *
 * Verifies that:
 * - Render mode types are correctly defined
 * - Color map is defined and consistent
 * - Layer registry is defined with correct structure
 * - Coverage metrics computation is correct
 * - Diagnostic warnings are computed correctly
 * - Performance mode configs are defined
 * - Raw / smooth / overlay / diagnostic are distinct and labelled
 * - No fake visual functions were introduced
 * - No runtime dynamics are touched
 * - No semantic / consciousness / emotion claims exist in renderer files
 *
 * These are static / unit tests; no browser or DOM environment is required.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── TypeScript imports (for runtime logic tests) ────────────────────────────
import {
    DEFAULT_TORUS_RENDER_STATE,
    type TorusRenderMode,
    type TorusNormalizationMode,
    type TorusPerformanceMode,
} from '../../types/torusRenderState.js';
import {
    mapActivityToColor,
    mapTraceToColor,
    mapReturnToColor,
    mapRecoveryToColor,
    mapSaturationToColor,
    getInactiveSurfaceColor,
    TORUS_COLOR_LEGEND,
    TORUS_COLOR_MEANINGS,
    COLOR_FLOW_CYAN,
    COLOR_TRACE_PURPLE,
    COLOR_RETURN_ORANGE,
    COLOR_RECOVERY_GREEN,
    COLOR_SATURATION_RED,
    COLOR_INACTIVE_DARK,
    rgbToHex,
} from '../../ui/render/torusColorMap.js';
import {
    TORUS_LAYER_REGISTRY,
    TORUS_LAYER_ORDER,
    isLayerVisible,
    setLayerVisible,
    toggleLayerVisible,
    getVisibleLayers,
    getU3Layers,
} from '../../ui/render/torusLayerRegistry.js';
import {
    computeCoverageMetrics,
    OVERBRIGHT_THRESHOLD,
    COVERAGE_WARNING_THRESHOLD,
} from '../../ui/render/TorusCoveragePanel.js';
import {
    computeDiagnosticWarnings,
    buildDiagnosticSummary,
} from '../../ui/render/TorusDiagnosticOverlay.js';
import {
    PERFORMANCE_QUALITY_CONFIGS,
    PERFORMANCE_MODE_LABELS,
    getQualityConfig,
} from '../../ui/render/TorusPerformanceSelector.js';
import {
    RENDER_MODE_LABELS,
    RENDER_MODE_DESCRIPTIONS,
    NORMALIZATION_LABELS,
} from '../../ui/render/TorusRenderModeToggle.js';

const ROOT = resolve(__dirname, '../../..');

// Source files for static checks
const colorMapSrc          = readFileSync(resolve(ROOT, 'src/ui/render/torusColorMap.ts'), 'utf-8');
const layerRegistrySrc     = readFileSync(resolve(ROOT, 'src/ui/render/torusLayerRegistry.ts'), 'utf-8');
const renderModeToggleSrc  = readFileSync(resolve(ROOT, 'src/ui/render/TorusRenderModeToggle.ts'), 'utf-8');
const layerLegendSrc       = readFileSync(resolve(ROOT, 'src/ui/render/TorusLayerLegend.ts'), 'utf-8');
const coveragePanelSrc     = readFileSync(resolve(ROOT, 'src/ui/render/TorusCoveragePanel.ts'), 'utf-8');
const diagnosticOverlaySrc = readFileSync(resolve(ROOT, 'src/ui/render/TorusDiagnosticOverlay.ts'), 'utf-8');
const perfSelectorSrc      = readFileSync(resolve(ROOT, 'src/ui/render/TorusPerformanceSelector.ts'), 'utf-8');
const renderStateSrc       = readFileSync(resolve(ROOT, 'src/types/torusRenderState.ts'), 'utf-8');

const allSrcs = [
    colorMapSrc, layerRegistrySrc, renderModeToggleSrc, layerLegendSrc,
    coveragePanelSrc, diagnosticOverlaySrc, perfSelectorSrc, renderStateSrc,
];

// ── Render Mode Types ──────────────────────────────────────────────────────

describe('U3: Render Mode Types (torusRenderState.ts)', () => {
    it('TorusRenderMode type includes raw', () => {
        expect(renderStateSrc).toContain("'raw'");
    });
    it('TorusRenderMode type includes smooth', () => {
        expect(renderStateSrc).toContain("'smooth'");
    });
    it('TorusRenderMode type includes overlay', () => {
        expect(renderStateSrc).toContain("'overlay'");
    });
    it('TorusRenderMode type includes diagnostic', () => {
        expect(renderStateSrc).toContain("'diagnostic'");
    });
    it('TorusNormalizationMode includes global and local', () => {
        expect(renderStateSrc).toContain("'global'");
        expect(renderStateSrc).toContain("'local'");
    });
    it('TorusPerformanceMode includes high / balanced / battery / diagnostic', () => {
        expect(renderStateSrc).toContain("'high'");
        expect(renderStateSrc).toContain("'balanced'");
        expect(renderStateSrc).toContain("'battery'");
    });
    it('TorusRenderState interface is defined', () => {
        expect(renderStateSrc).toContain('TorusRenderState');
    });
    it('TorusRenderState has mode field', () => {
        expect(renderStateSrc).toContain('mode: TorusRenderMode');
    });
    it('TorusRenderState has normalization field', () => {
        expect(renderStateSrc).toContain('normalization:');
    });
    it('TorusRenderState has performance field', () => {
        expect(renderStateSrc).toContain('performance:');
    });
    it('TorusRenderState has showGrid field', () => {
        expect(renderStateSrc).toContain('showGrid:');
    });
    it('TorusRenderState has showBackside field', () => {
        expect(renderStateSrc).toContain('showBackside:');
    });
    it('TorusRenderState has showInactiveSurface field', () => {
        expect(renderStateSrc).toContain('showInactiveSurface:');
    });
    it('TorusRenderState has showCoverage field', () => {
        expect(renderStateSrc).toContain('showCoverage:');
    });
    it('TorusRenderState has smoothingEnabled field', () => {
        expect(renderStateSrc).toContain('smoothingEnabled:');
    });
    it('DEFAULT_TORUS_RENDER_STATE is exported', () => {
        expect(renderStateSrc).toContain('DEFAULT_TORUS_RENDER_STATE');
    });
    it('TorusCoverageMetrics type is defined', () => {
        expect(renderStateSrc).toContain('TorusCoverageMetrics');
    });
    it('TorusDiagnosticWarnings type is defined', () => {
        expect(renderStateSrc).toContain('TorusDiagnosticWarnings');
    });

    it('DEFAULT_TORUS_RENDER_STATE has expected defaults at runtime', () => {
        expect(DEFAULT_TORUS_RENDER_STATE.mode).toBe('smooth');
        expect(DEFAULT_TORUS_RENDER_STATE.normalization).toBe('global');
        expect(DEFAULT_TORUS_RENDER_STATE.performance).toBe('balanced');
        expect(DEFAULT_TORUS_RENDER_STATE.showBackside).toBe(true);
        expect(DEFAULT_TORUS_RENDER_STATE.showInactiveSurface).toBe(true);
        expect(DEFAULT_TORUS_RENDER_STATE.smoothingEnabled).toBe(true);
    });
});

// ── Color Map ──────────────────────────────────────────────────────────────

describe('U3: Color Map (torusColorMap.ts)', () => {
    it('COLOR_FLOW_CYAN is defined (blue/cyan = flow/activity)', () => {
        expect(colorMapSrc).toContain('COLOR_FLOW_CYAN');
    });
    it('COLOR_RECOVERY_GREEN is defined (green = recovery/viability)', () => {
        expect(colorMapSrc).toContain('COLOR_RECOVERY_GREEN');
    });
    it('COLOR_COHERENT_WHITE is defined (white = high coherent activity)', () => {
        expect(colorMapSrc).toContain('COLOR_COHERENT_WHITE');
    });
    it('COLOR_TRACE_PURPLE is defined (purple = trace/residue)', () => {
        expect(colorMapSrc).toContain('COLOR_TRACE_PURPLE');
    });
    it('COLOR_RETURN_ORANGE is defined (orange = return/echo)', () => {
        expect(colorMapSrc).toContain('COLOR_RETURN_ORANGE');
    });
    it('COLOR_SATURATION_RED is defined (red = saturation/overload risk only)', () => {
        expect(colorMapSrc).toContain('COLOR_SATURATION_RED');
    });
    it('COLOR_INACTIVE_DARK is defined (dark = low activity)', () => {
        expect(colorMapSrc).toContain('COLOR_INACTIVE_DARK');
    });
    it('TORUS_COLOR_LEGEND is exported', () => {
        expect(colorMapSrc).toContain('TORUS_COLOR_LEGEND');
    });
    it('TORUS_COLOR_MEANINGS is exported', () => {
        expect(colorMapSrc).toContain('TORUS_COLOR_MEANINGS');
    });
    it('mapActivityToColor is exported', () => {
        expect(colorMapSrc).toContain('mapActivityToColor');
    });
    it('mapTraceToColor is exported', () => {
        expect(colorMapSrc).toContain('mapTraceToColor');
    });
    it('mapReturnToColor is exported', () => {
        expect(colorMapSrc).toContain('mapReturnToColor');
    });
    it('mapRecoveryToColor is exported', () => {
        expect(colorMapSrc).toContain('mapRecoveryToColor');
    });
    it('mapSaturationToColor is exported', () => {
        expect(colorMapSrc).toContain('mapSaturationToColor');
    });
    it('red is documented as saturation/overload risk only', () => {
        expect(colorMapSrc).toContain('saturation');
        expect(colorMapSrc).toContain('overload');
    });

    // Runtime color tests
    it('mapActivityToColor(0) returns dark color', () => {
        const c = mapActivityToColor(0);
        expect(c.r).toBeLessThan(0.2);
        expect(c.g).toBeLessThan(0.2);
        expect(c.b).toBeLessThan(0.2);
    });
    it('mapActivityToColor(0.5) returns a cyan-range color', () => {
        const c = mapActivityToColor(0.5);
        expect(c.b).toBeGreaterThan(c.r); // more blue/cyan than red
    });
    it('mapActivityToColor(1.0) returns a bright/white color', () => {
        const c = mapActivityToColor(1.0);
        expect(c.r).toBeGreaterThan(0.7);
        expect(c.g).toBeGreaterThan(0.7);
        expect(c.b).toBeGreaterThan(0.7);
    });
    it('mapActivityToColor clamps values below 0', () => {
        const c = mapActivityToColor(-1);
        expect(c.r).toBeGreaterThanOrEqual(0);
    });
    it('mapActivityToColor clamps values above 1', () => {
        const c = mapActivityToColor(2);
        expect(c.r).toBeLessThanOrEqual(1);
        expect(c.g).toBeLessThanOrEqual(1);
        expect(c.b).toBeLessThanOrEqual(1);
    });
    it('mapTraceToColor(1.0) returns purple-range color', () => {
        const c = mapTraceToColor(1.0);
        expect(c.b).toBeGreaterThan(c.g); // more blue/purple than green
    });
    it('mapReturnToColor(1.0) returns orange-range color', () => {
        const c = mapReturnToColor(1.0);
        expect(c.r).toBeGreaterThan(c.b); // more red/orange than blue
    });
    it('mapSaturationToColor(1.0) returns red-range color', () => {
        const c = mapSaturationToColor(1.0);
        expect(c.r).toBeGreaterThan(0.7);
        expect(c.g).toBeLessThan(0.5);
    });
    it('getInactiveSurfaceColor returns a dark color', () => {
        const c = getInactiveSurfaceColor();
        expect(c.r).toBeLessThan(0.2);
        expect(c.g).toBeLessThan(0.2);
        expect(c.b).toBeLessThan(0.2);
    });
    it('rgbToHex produces correct format', () => {
        const hex = rgbToHex({ r: 0, g: 0, b: 0 });
        expect(hex).toBe('#000000');
        const hex2 = rgbToHex({ r: 1, g: 1, b: 1 });
        expect(hex2).toBe('#ffffff');
    });
    it('TORUS_COLOR_LEGEND has entries for all key observation values', () => {
        const labels = TORUS_COLOR_LEGEND.map((e) => e.label);
        expect(labels.some((l) => l.toLowerCase().includes('flow'))).toBe(true);
        expect(labels.some((l) => l.toLowerCase().includes('trace'))).toBe(true);
        expect(labels.some((l) => l.toLowerCase().includes('return'))).toBe(true);
        expect(labels.some((l) => l.toLowerCase().includes('saturation'))).toBe(true);
    });
    it('TORUS_COLOR_LEGEND distinguishes value types', () => {
        const types = TORUS_COLOR_LEGEND.map((e) => e.valueType);
        expect(types).toContain('derived');
        expect(types).toContain('raw');
    });
});

// ── Layer Registry ─────────────────────────────────────────────────────────

describe('U3: Layer Registry (torusLayerRegistry.ts)', () => {
    it('TORUS_LAYER_REGISTRY is defined', () => {
        expect(layerRegistrySrc).toContain('TORUS_LAYER_REGISTRY');
    });
    it('energy_activity layer is defined', () => {
        expect(layerRegistrySrc).toContain('energy_activity');
    });
    it('trace_residue layer is defined', () => {
        expect(layerRegistrySrc).toContain('trace_residue');
    });
    it('actuation_pulse layer is defined', () => {
        expect(layerRegistrySrc).toContain('actuation_pulse');
    });
    it('sensory_return layer is defined', () => {
        expect(layerRegistrySrc).toContain('sensory_return');
    });
    it('closure_match layer is defined', () => {
        expect(layerRegistrySrc).toContain('closure_match');
    });
    it('local_excitability layer is defined', () => {
        expect(layerRegistrySrc).toContain('local_excitability');
    });
    it('repeated_flow_path layer is defined', () => {
        expect(layerRegistrySrc).toContain('repeated_flow_path');
    });
    it('proto_network layer is defined', () => {
        expect(layerRegistrySrc).toContain('proto_network');
    });
    it('TORUS_LAYER_ORDER is exported', () => {
        expect(layerRegistrySrc).toContain('TORUS_LAYER_ORDER');
    });
    it('isLayerVisible is exported', () => {
        expect(layerRegistrySrc).toContain('isLayerVisible');
    });
    it('setLayerVisible is exported', () => {
        expect(layerRegistrySrc).toContain('setLayerVisible');
    });
    it('toggleLayerVisible is exported', () => {
        expect(layerRegistrySrc).toContain('toggleLayerVisible');
    });
    it('getVisibleLayers is exported', () => {
        expect(layerRegistrySrc).toContain('getVisibleLayers');
    });
    it('each layer has valueType field', () => {
        expect(layerRegistrySrc).toContain('valueType:');
    });
    it('each layer has colorHex field', () => {
        expect(layerRegistrySrc).toContain('colorHex:');
    });
    it('each layer has availableInU3 flag', () => {
        expect(layerRegistrySrc).toContain('availableInU3');
    });

    // Runtime registry tests
    it('TORUS_LAYER_REGISTRY contains all 8 layers', () => {
        const keys = Object.keys(TORUS_LAYER_REGISTRY);
        expect(keys).toContain('energy_activity');
        expect(keys).toContain('trace_residue');
        expect(keys).toContain('actuation_pulse');
        expect(keys).toContain('sensory_return');
        expect(keys).toContain('closure_match');
        expect(keys).toContain('local_excitability');
        expect(keys).toContain('repeated_flow_path');
        expect(keys).toContain('proto_network');
    });
    it('TORUS_LAYER_ORDER has 8 entries', () => {
        expect(TORUS_LAYER_ORDER.length).toBe(8);
    });
    it('energy_activity is visible by default', () => {
        expect(TORUS_LAYER_REGISTRY.energy_activity.defaultVisible).toBe(true);
    });
    it('trace_residue is not visible by default', () => {
        expect(TORUS_LAYER_REGISTRY.trace_residue.defaultVisible).toBe(false);
    });
    it('energy_activity is available in U3', () => {
        expect(TORUS_LAYER_REGISTRY.energy_activity.availableInU3).toBe(true);
    });
    it('proto_network deferred to U4', () => {
        expect(TORUS_LAYER_REGISTRY.proto_network.availableInU3).toBe(false);
    });
    it('setLayerVisible changes visibility', () => {
        setLayerVisible('trace_residue', true);
        expect(isLayerVisible('trace_residue')).toBe(true);
        setLayerVisible('trace_residue', false);
        expect(isLayerVisible('trace_residue')).toBe(false);
    });
    it('toggleLayerVisible returns new state', () => {
        const initial = isLayerVisible('actuation_pulse');
        const toggled = toggleLayerVisible('actuation_pulse');
        expect(toggled).toBe(!initial);
        toggleLayerVisible('actuation_pulse'); // restore
    });
    it('getVisibleLayers returns only visible layers', () => {
        setLayerVisible('energy_activity', true);
        setLayerVisible('trace_residue', false);
        const visible = getVisibleLayers();
        const ids = visible.map((l) => l.id);
        expect(ids).toContain('energy_activity');
        expect(ids).not.toContain('trace_residue');
    });
    it('getU3Layers returns only U3-available layers', () => {
        const u3 = getU3Layers();
        u3.forEach((layer) => expect(layer.availableInU3).toBe(true));
    });
});

// ── Coverage Metrics ───────────────────────────────────────────────────────

describe('U3: Coverage Metrics (TorusCoveragePanel.ts)', () => {
    it('computeCoverageMetrics is exported', () => {
        expect(coveragePanelSrc).toContain('computeCoverageMetrics');
    });
    it('OVERBRIGHT_THRESHOLD is exported', () => {
        expect(coveragePanelSrc).toContain('OVERBRIGHT_THRESHOLD');
    });
    it('COVERAGE_WARNING_THRESHOLD is exported', () => {
        expect(coveragePanelSrc).toContain('COVERAGE_WARNING_THRESHOLD');
    });
    it('activeRegionCount is in the metrics output', () => {
        expect(coveragePanelSrc).toContain('activeRegionCount');
    });
    it('inactiveRegionCount is in the metrics output', () => {
        expect(coveragePanelSrc).toContain('inactiveRegionCount');
    });
    it('activeCoverageRatio is in the metrics output', () => {
        expect(coveragePanelSrc).toContain('activeCoverageRatio');
    });
    it('activeRegionConcentration is in the metrics output', () => {
        expect(coveragePanelSrc).toContain('activeRegionConcentration');
    });
    it('maxActivityRegion is in the metrics output', () => {
        expect(coveragePanelSrc).toContain('maxActivityRegion');
    });
    it('visibleCoverageRatio is in the metrics output', () => {
        expect(coveragePanelSrc).toContain('visibleCoverageRatio');
    });

    // Runtime tests
    it('empty array returns zero metrics', () => {
        const m = computeCoverageMetrics([]);
        expect(m.activeRegionCount).toBe(0);
        expect(m.inactiveRegionCount).toBe(0);
        expect(m.activeCoverageRatio).toBe(0);
    });
    it('all-zero values = all inactive', () => {
        const m = computeCoverageMetrics([0, 0, 0, 0]);
        expect(m.activeRegionCount).toBe(0);
        expect(m.inactiveRegionCount).toBe(4);
        expect(m.activeCoverageRatio).toBe(0);
    });
    it('all-active values = full coverage', () => {
        const m = computeCoverageMetrics([0.5, 0.6, 0.7, 0.8]);
        expect(m.activeRegionCount).toBe(4);
        expect(m.activeCoverageRatio).toBe(1);
    });
    it('half-active gives 0.5 coverage ratio', () => {
        const m = computeCoverageMetrics([0.5, 0.0, 0.6, 0.0]);
        expect(m.activeCoverageRatio).toBe(0.5);
    });
    it('maxActivityRegion points to highest value', () => {
        const m = computeCoverageMetrics([0.1, 0.9, 0.3, 0.2]);
        expect(m.maxActivityRegion).toBe(1);
    });
    it('visibleCoverageRatio uses mask when provided', () => {
        const m = computeCoverageMetrics(
            [0.5, 0.5, 0.5, 0.5],
            [true, true, false, false]
        );
        expect(m.visibleCoverageRatio).toBe(0.5);
    });
    it('computeCoverageMetrics does not modify input values', () => {
        const input = Object.freeze([0.1, 0.2, 0.3]);
        expect(() => computeCoverageMetrics(input)).not.toThrow();
    });
    it('OVERBRIGHT_THRESHOLD is a value between 0 and 1', () => {
        expect(OVERBRIGHT_THRESHOLD).toBeGreaterThan(0);
        expect(OVERBRIGHT_THRESHOLD).toBeLessThanOrEqual(1);
    });
    it('COVERAGE_WARNING_THRESHOLD is a small positive value', () => {
        expect(COVERAGE_WARNING_THRESHOLD).toBeGreaterThan(0);
        expect(COVERAGE_WARNING_THRESHOLD).toBeLessThan(0.3);
    });
});

// ── Diagnostic Warnings ────────────────────────────────────────────────────

describe('U3: Diagnostic Warnings (TorusDiagnosticOverlay.ts)', () => {
    it('computeDiagnosticWarnings is exported', () => {
        expect(diagnosticOverlaySrc).toContain('computeDiagnosticWarnings');
    });
    it('buildDiagnosticSummary is exported', () => {
        expect(diagnosticOverlaySrc).toContain('buildDiagnosticSummary');
    });
    it('nanCount is in warnings', () => {
        expect(diagnosticOverlaySrc).toContain('nanCount');
    });
    it('infinityCount is in warnings', () => {
        expect(diagnosticOverlaySrc).toContain('infinityCount');
    });
    it('clippedCount is in warnings', () => {
        expect(diagnosticOverlaySrc).toContain('clippedCount');
    });
    it('overbrightCount is in warnings', () => {
        expect(diagnosticOverlaySrc).toContain('overbrightCount');
    });
    it('hiddenBacksideWarning is in warnings', () => {
        expect(diagnosticOverlaySrc).toContain('hiddenBacksideWarning');
    });
    it('coverageWarning is in warnings', () => {
        expect(diagnosticOverlaySrc).toContain('coverageWarning');
    });

    // Runtime tests
    it('detects NaN values', () => {
        const w = computeDiagnosticWarnings([NaN, 1.0, 0.5], [0.5, 1.0, 0.5], 1.0, true);
        expect(w.nanCount).toBe(1);
    });
    it('detects Infinity values', () => {
        const w = computeDiagnosticWarnings([Infinity, 1.0], [1.0, 1.0], 1.0, true);
        expect(w.infinityCount).toBe(1);
    });
    it('reports hiddenBacksideWarning when showBackside is false', () => {
        const w = computeDiagnosticWarnings([1.0], [1.0], 1.0, false);
        expect(w.hiddenBacksideWarning).toBe(true);
    });
    it('no hiddenBacksideWarning when showBackside is true', () => {
        const w = computeDiagnosticWarnings([1.0], [1.0], 1.0, true);
        expect(w.hiddenBacksideWarning).toBe(false);
    });
    it('reports coverageWarning when coverage is very low', () => {
        const w = computeDiagnosticWarnings([0.5], [0.5], 0.0, true);
        expect(w.coverageWarning).toBe(true);
    });
    it('no coverageWarning when coverage is healthy', () => {
        const w = computeDiagnosticWarnings([0.5], [0.5], 0.8, true);
        expect(w.coverageWarning).toBe(false);
    });
    it('clean values produce no warnings', () => {
        const w = computeDiagnosticWarnings([0.5, 0.3], [0.5, 0.3], 0.8, true);
        expect(w.nanCount).toBe(0);
        expect(w.infinityCount).toBe(0);
        expect(w.clippedCount).toBe(0);
        expect(w.hiddenBacksideWarning).toBe(false);
        expect(w.coverageWarning).toBe(false);
    });
    it('buildDiagnosticSummary returns "clean" for no warnings', () => {
        const w = computeDiagnosticWarnings([0.5], [0.5], 0.8, true);
        expect(buildDiagnosticSummary(w)).toContain('clean');
    });
    it('buildDiagnosticSummary includes NaN count', () => {
        const w = computeDiagnosticWarnings([NaN, 0.5], [0.5, 0.5], 0.8, true);
        expect(buildDiagnosticSummary(w)).toContain('NaN');
    });
});

// ── Performance Mode ───────────────────────────────────────────────────────

describe('U3: Performance Mode (TorusPerformanceSelector.ts)', () => {
    it('PERFORMANCE_QUALITY_CONFIGS is defined', () => {
        expect(perfSelectorSrc).toContain('PERFORMANCE_QUALITY_CONFIGS');
    });
    it('PERFORMANCE_MODE_LABELS is defined', () => {
        expect(perfSelectorSrc).toContain('PERFORMANCE_MODE_LABELS');
    });
    it('high quality config is defined', () => {
        expect(perfSelectorSrc).toContain('high:');
    });
    it('balanced config is defined', () => {
        expect(perfSelectorSrc).toContain('balanced:');
    });
    it('battery saver config is defined', () => {
        expect(perfSelectorSrc).toContain('battery:');
    });
    it('diagnostic config is defined', () => {
        expect(perfSelectorSrc).toContain("diagnostic:");
    });
    it('performance mode does not change simulation tick', () => {
        expect(perfSelectorSrc).not.toContain('simulationTick');
        expect(perfSelectorSrc).not.toContain('updateDynamics');
        expect(perfSelectorSrc).not.toContain('currentBuffer');
    });
    it('docs clarify performance affects display only', () => {
        expect(perfSelectorSrc).toContain('display quality');
    });

    // Runtime tests
    it('getQualityConfig returns expected config for balanced', () => {
        const cfg = getQualityConfig('balanced');
        expect(cfg.bloomStrength).toBeLessThan(0.5); // bloom is kept weak
        expect(cfg.maxParticleCount).toBeGreaterThan(0);
    });
    it('battery mode has no bloom', () => {
        const cfg = getQualityConfig('battery');
        expect(cfg.bloomStrength).toBe(0);
    });
    it('diagnostic mode has grid lines enabled', () => {
        const cfg = getQualityConfig('diagnostic');
        expect(cfg.renderGridLines).toBe(true);
    });
    it('high mode has backside pass enabled', () => {
        const cfg = getQualityConfig('high');
        expect(cfg.renderBacksidePass).toBe(true);
    });
    it('battery mode has lower particle count than high', () => {
        const battCfg = getQualityConfig('battery');
        const highCfg = getQualityConfig('high');
        expect(battCfg.maxParticleCount).toBeLessThan(highCfg.maxParticleCount);
    });
    it('bloom strength is always ≤ 0.5 (keeps values readable)', () => {
        const modes: TorusPerformanceMode[] = ['high', 'balanced', 'battery', 'diagnostic'];
        modes.forEach((m) => {
            expect(getQualityConfig(m).bloomStrength).toBeLessThanOrEqual(0.5);
        });
    });
    it('PERFORMANCE_MODE_LABELS covers all modes', () => {
        const modes: TorusPerformanceMode[] = ['high', 'balanced', 'battery', 'diagnostic'];
        modes.forEach((m) => {
            expect(PERFORMANCE_MODE_LABELS[m]).toBeTruthy();
        });
    });
});

// ── Render Mode Toggle ─────────────────────────────────────────────────────

describe('U3: Render Mode Toggle (TorusRenderModeToggle.ts)', () => {
    it('RENDER_MODE_LABELS is exported', () => {
        expect(renderModeToggleSrc).toContain('RENDER_MODE_LABELS');
    });
    it('RENDER_MODE_DESCRIPTIONS is exported', () => {
        expect(renderModeToggleSrc).toContain('RENDER_MODE_DESCRIPTIONS');
    });
    it('NORMALIZATION_LABELS is exported', () => {
        expect(renderModeToggleSrc).toContain('NORMALIZATION_LABELS');
    });
    it('smooth mode label contains [S] marker', () => {
        expect(RENDER_MODE_LABELS['smooth' as TorusRenderMode]).toContain('[S]');
    });
    it('raw mode label does not contain [S]', () => {
        expect(RENDER_MODE_LABELS['raw' as TorusRenderMode]).not.toContain('[S]');
    });
    it('local normalization label contains [L] marker', () => {
        expect(NORMALIZATION_LABELS['local' as TorusNormalizationMode]).toContain('[L]');
    });
    it('smooth description mentions presentation-smoothed', () => {
        expect(RENDER_MODE_DESCRIPTIONS['smooth' as TorusRenderMode]).toContain('smoothed');
    });
    it('diagnostic description mentions grid', () => {
        expect(RENDER_MODE_DESCRIPTIONS['diagnostic' as TorusRenderMode]).toContain('grid');
    });
    it('syncRenderModeHUD is exported', () => {
        expect(renderModeToggleSrc).toContain('syncRenderModeHUD');
    });
    it('buildRenderModeToggleHTML is exported', () => {
        expect(renderModeToggleSrc).toContain('buildRenderModeToggleHTML');
    });
    it('buildNormModeToggleHTML is exported', () => {
        expect(renderModeToggleSrc).toContain('buildNormModeToggleHTML');
    });
});

// ── Safety: No Fake Visuals ────────────────────────────────────────────────

describe('U3: Safety — no fake visuals', () => {
    it('no fakeEnergy in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('fakeEnergy'));
    });
    it('no fakeFlow in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('fakeFlow'));
    });
    it('no fakeTrace in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('fakeTrace'));
    });
    it('no artificialFluctuation in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('artificialFluctuation'));
    });
    it('no addOrganicWobble in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('addOrganicWobble'));
    });
    it('no addLifeLikeSparkle in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('addLifeLikeSparkle'));
    });
    it('no forceBeautifulFlow in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('forceBeautifulFlow'));
    });
    it('no randomGlowWhenQuiet in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('randomGlowWhenQuiet'));
    });
});

// ── Safety: No Semantic / Consciousness / Emotion Claims ──────────────────

describe('U3: Safety — no semantic/consciousness/emotion claims', () => {
    it('no consciousness claim in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('consciousness'));
    });
    it('no self-awareness claim in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('self-awareness'));
    });
    it('no emotion claim in renderer files', () => {
        allSrcs.forEach((src) => {
            const count = (src.match(/\bemotion\b/g) ?? []).length;
            expect(count).toBe(0);
        });
    });
    it('no semanticNode in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('semanticNode'));
    });
    it('no LLM call in renderer files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('fetchLLM'));
    });
});

// ── Safety: Runtime Not Modified ──────────────────────────────────────────

describe('U3: Safety — runtime not modified', () => {
    it('renderer files do not import from organism/state', () => {
        allSrcs.forEach((src) => expect(src).not.toContain("from '../../organism/state"));
    });
    it('renderer files do not modify currentBuffer', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('currentBuffer'));
    });
    it('renderer files do not modify traceMap', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('traceMap'));
    });
    it('renderer files do not call updateDynamics', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('updateDynamics'));
    });
    it('renderer files do not call AeternaNetwork constructor', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('new AeternaNetwork'));
    });
});
