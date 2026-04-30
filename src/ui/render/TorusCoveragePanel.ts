/**
 * TorusCoveragePanel.ts
 * U3: Scientific Torus Renderer — coverage map / metrics panel
 *
 * Provides functions to compute and display coverage metrics.
 *
 * Coverage metrics help distinguish two different causes of "energy in only
 * part of the torus":
 *   A. The field genuinely has activity only in some regions (actual partial activity).
 *   B. Display settings or camera angle make a full-coverage field appear partial.
 *
 * Metrics:
 *   activeRegionCount        — Regions with activity above threshold
 *   inactiveRegionCount      — Regions with activity below threshold
 *   activeCoverageRatio      — Active fraction of all torus regions (0–1)
 *   activeRegionConcentration — Uniformity of active regions (1=uniform, 0=concentrated)
 *   maxActivityRegion        — Index of region with highest activity
 *   visibleCoverageRatio     — Fraction of surface visible from current camera
 *
 * This module does NOT modify runtime dynamics, field values, or energy.
 */

import type { TorusCoverageMetrics } from '../../types/torusRenderState.js';

// ── Thresholds ─────────────────────────────────────────────────────────────

/** Activity value considered above threshold (region is "active"). */
const ACTIVE_THRESHOLD = 0.05;

/** Overbright threshold: values above this are flagged as overbright. */
export const OVERBRIGHT_THRESHOLD = 0.95;

/** Coverage warning: activeCoverageRatio below this triggers warning. */
export const COVERAGE_WARNING_THRESHOLD = 0.05;

// ── Metric computation ─────────────────────────────────────────────────────

/**
 * Compute coverage metrics from a flat array of normalised activity values.
 *
 * @param normalizedValues  - Per-region activity values, normalised to [0, 1].
 *                            The caller is responsible for normalisation.
 *                            Raw values must not be altered by this function.
 * @param visibleMask       - Optional boolean mask: true = region is visible
 *                            from the current camera angle. If omitted,
 *                            visibleCoverageRatio defaults to 1.0.
 */
export function computeCoverageMetrics(
    normalizedValues: readonly number[],
    visibleMask?: readonly boolean[]
): TorusCoverageMetrics {
    const total = normalizedValues.length;
    if (total === 0) {
        return {
            activeRegionCount: 0,
            inactiveRegionCount: 0,
            activeCoverageRatio: 0,
            activeRegionConcentration: 0,
            maxActivityRegion: -1,
            visibleCoverageRatio: 1,
        };
    }

    let activeCount = 0;
    let maxVal = -Infinity;
    let maxIdx = 0;
    let sumActive = 0;
    let sumSqActive = 0;

    for (let i = 0; i < total; i++) {
        const v = normalizedValues[i];
        if (v > maxVal) { maxVal = v; maxIdx = i; }
        if (v >= ACTIVE_THRESHOLD) {
            activeCount++;
            sumActive += v;
            sumSqActive += v * v;
        }
    }

    const inactiveCount = total - activeCount;
    const activeCoverageRatio = activeCount / total;

    // Concentration: coefficient of variation inverse.
    // 1 = perfectly uniform; approaches 0 when one region dominates.
    let concentration = 0;
    if (activeCount > 1 && sumActive > 0) {
        const mean = sumActive / activeCount;
        const variance = sumSqActive / activeCount - mean * mean;
        const stddev = Math.sqrt(Math.max(0, variance));
        const cv = stddev / mean; // coefficient of variation
        concentration = Math.max(0, 1 - Math.min(1, cv));
    } else if (activeCount === 1) {
        concentration = 0; // single active region = maximum concentration
    }

    // Visible coverage
    let visibleCoverageRatio = 1.0;
    if (visibleMask && visibleMask.length === total) {
        const visibleCount = visibleMask.filter(Boolean).length;
        visibleCoverageRatio = visibleCount / total;
    }

    return {
        activeRegionCount: activeCount,
        inactiveRegionCount: inactiveCount,
        activeCoverageRatio,
        activeRegionConcentration: concentration,
        maxActivityRegion: maxIdx,
        visibleCoverageRatio,
    };
}

// ── DOM helpers ────────────────────────────────────────────────────────────

/**
 * Render coverage metrics into a DOM element.
 *
 * @param elementId - ID of the container element
 * @param metrics   - Coverage metrics snapshot
 */
export function renderCoveragePanel(
    elementId: string,
    metrics: TorusCoverageMetrics
): void {
    const el = document.getElementById(elementId);
    if (!el) return;

    const actPct = (metrics.activeCoverageRatio * 100).toFixed(1);
    const visPct = (metrics.visibleCoverageRatio * 100).toFixed(1);
    const concPct = (metrics.activeRegionConcentration * 100).toFixed(0);

    const coverageWarn = metrics.activeCoverageRatio < COVERAGE_WARNING_THRESHOLD
        ? '<span class="coverage-warning">⚠ Low coverage</span>'
        : '';

    el.innerHTML = `
        <div class="coverage-header">Coverage Map</div>
        <div class="coverage-note">
            Active = actual field activity ≥ threshold.
            Visible = camera-facing surface fraction.
            Compare to distinguish field sparsity from display occlusion.
        </div>
        <div class="coverage-rows">
            <div class="coverage-row">
                <span class="cov-label">Active Regions</span>
                <span class="cov-value">${metrics.activeRegionCount}</span>
            </div>
            <div class="coverage-row">
                <span class="cov-label">Inactive Regions</span>
                <span class="cov-value">${metrics.inactiveRegionCount}</span>
            </div>
            <div class="coverage-row">
                <span class="cov-label">Active Coverage</span>
                <span class="cov-value">${actPct}% ${coverageWarn}</span>
            </div>
            <div class="coverage-row">
                <span class="cov-label">Concentration</span>
                <span class="cov-value">${concPct}% uniform</span>
            </div>
            <div class="coverage-row">
                <span class="cov-label">Max Activity Region</span>
                <span class="cov-value">#${metrics.maxActivityRegion}</span>
            </div>
            <div class="coverage-row">
                <span class="cov-label">Visible Surface</span>
                <span class="cov-value">${visPct}%</span>
            </div>
        </div>
    `;
}
