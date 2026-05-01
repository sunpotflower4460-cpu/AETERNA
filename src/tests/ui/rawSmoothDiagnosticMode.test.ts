import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_TORUS_RENDER_STATE } from '../../types/torusRenderState.js';
import { computeTorusCoverageMetrics, estimateVisibleCoverageRatio } from '../../ui/render/torusCoverageMetrics.js';
import { generateDiagnosticReport } from '../../ui/render/torusDiagnosticWarnings.js';
import {
    getBloomIntensity,
    getParticleCountFactor,
    getTorusRenderState,
    normalizationModeLabel,
    performanceModeLabel,
    renderModeLabel,
    setNormalizationMode,
    setPerformanceMode,
    setRenderMode,
} from '../../ui/render/torusRenderModeManager.js';

describe('U8 raw / smooth / diagnostic QA', () => {
    beforeEach(() => {
        setRenderMode(DEFAULT_TORUS_RENDER_STATE.mode);
        setNormalizationMode(DEFAULT_TORUS_RENDER_STATE.normalization);
        setPerformanceMode(DEFAULT_TORUS_RENDER_STATE.performance);
    });

    it('defaults to raw mode with smoothing disabled', () => {
        const state = getTorusRenderState();
        expect(state.mode).toBe('raw');
        expect(state.smoothingEnabled).toBe(false);
        expect(renderModeLabel(state.mode)).toBe('Raw');
    });

    it('smooth mode enables presentation smoothing and can return to raw', () => {
        setRenderMode('smooth');
        expect(getTorusRenderState().smoothingEnabled).toBe(true);
        expect(renderModeLabel('smooth')).toBe('Scientific Smooth');

        setRenderMode('raw');
        expect(getTorusRenderState().smoothingEnabled).toBe(false);
        expect(getTorusRenderState().mode).toBe('raw');
    });

    it('diagnostic mode enables coverage-friendly visibility flags', () => {
        setRenderMode('diagnostic');
        const state = getTorusRenderState();
        expect(state.showDiagnosticWarnings).toBe(true);
        expect(state.showInactiveSurface).toBe(true);
        expect(state.showGrid).toBe(true);
        expect(state.showBackside).toBe(true);
        expect(renderModeLabel('diagnostic')).toBe('Diagnostic');
    });

    it('local normalization and performance labels stay explicit', () => {
        setNormalizationMode('local');
        setPerformanceMode('diagnostic');
        expect(normalizationModeLabel('local')).toContain('presentation aid');
        expect(performanceModeLabel('diagnostic')).toBe('Diagnostic');
    });

    it('coverage metrics expose active, visible, and concentration ratios', () => {
        const buffer = Float32Array.from([1, 1, 0, 0, 0, 0, 0, 0, 0]);
        const metrics = computeTorusCoverageMetrics(buffer, buffer.length, 3, 0.05, 0.72);

        expect(metrics.activeCoverageRatio).toBeGreaterThan(0);
        expect(metrics.visibleCoverageRatio).toBe(0.72);
        expect(metrics.activeRegionConcentration).toBeGreaterThanOrEqual(0);
        expect(metrics.activeRegionConcentration).toBeLessThanOrEqual(1);
    });

    it('diagnostic report flags low coverage without inventing activity', () => {
        const buffer = Float32Array.from({ length: 36 }, (_, index) => (index === 0 ? 1 : 0));
        const metrics = computeTorusCoverageMetrics(buffer, buffer.length, 6, 0.05, 0.58);
        const report = generateDiagnosticReport(buffer, buffer.length, {
            hasCoverageMetrics: true,
            activeCoverageRatio: metrics.activeCoverageRatio,
            backsideVisible: true,
        });

        expect(report.warnings.some((warning) => warning.id === 'coverage_low')).toBe(true);
    });

    it('visible coverage estimate improves for higher elevation viewpoints', () => {
        expect(estimateVisibleCoverageRatio(0)).toBeCloseTo(0.5);
        expect(estimateVisibleCoverageRatio(Math.PI / 2)).toBeGreaterThan(estimateVisibleCoverageRatio(0));
    });

    it('performance modes reduce bloom and particles in battery/diagnostic modes', () => {
        expect(getBloomIntensity('diagnostic')).toBe(0);
        expect(getBloomIntensity('battery')).toBeLessThan(getBloomIntensity('high'));
        expect(getParticleCountFactor('battery')).toBeLessThan(getParticleCountFactor('balanced'));
    });
});
