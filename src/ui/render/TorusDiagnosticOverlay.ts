/**
 * TorusDiagnosticOverlay.ts
 * U3: Scientific Torus Renderer — diagnostic overlay
 *
 * Shows renderer reliability warnings in Diagnostic mode:
 *   - NaN count in field values
 *   - Infinity count in field values
 *   - Clipped value count (values clamped by display range)
 *   - Overbright region count
 *   - Hidden backside warning
 *   - Coverage warning
 *
 * These warnings help distinguish renderer artefacts from genuine field state.
 * They are shown in Diagnostic mode and in the Raw tab.
 *
 * This module does NOT modify runtime dynamics, field values, or energy.
 */

import type { TorusDiagnosticWarnings } from '../../types/torusRenderState.js';
import { OVERBRIGHT_THRESHOLD, COVERAGE_WARNING_THRESHOLD } from './TorusCoveragePanel.js';

// ── Warning computation ────────────────────────────────────────────────────

/**
 * Compute diagnostic warning flags from a flat array of raw field values
 * and a set of renderer-side metrics.
 *
 * @param rawValues           - Raw (unnormalised) field values.
 *                              This function reads values; it does not modify them.
 * @param normalizedValues    - Normalised [0,1] values used for display.
 * @param activeCoverageRatio - Active coverage ratio from coverage metrics.
 * @param showBackside        - Whether backside faint display is currently enabled.
 */
export function computeDiagnosticWarnings(
    rawValues: readonly number[],
    normalizedValues: readonly number[],
    activeCoverageRatio: number,
    showBackside: boolean
): TorusDiagnosticWarnings {
    let nanCount = 0;
    let infinityCount = 0;

    for (const v of rawValues) {
        if (Number.isNaN(v))        nanCount++;
        else if (!Number.isFinite(v)) infinityCount++;
    }

    let clippedCount = 0;
    let overbrightCount = 0;

    for (const v of normalizedValues) {
        if (v < 0 || v > 1)             clippedCount++;
        if (v > OVERBRIGHT_THRESHOLD)   overbrightCount++;
    }

    const hiddenBacksideWarning = !showBackside;
    const coverageWarning = activeCoverageRatio < COVERAGE_WARNING_THRESHOLD;

    return {
        nanCount,
        infinityCount,
        clippedCount,
        overbrightCount,
        hiddenBacksideWarning,
        coverageWarning,
    };
}

// ── DOM helpers ────────────────────────────────────────────────────────────

/**
 * Render diagnostic warnings into a DOM element.
 *
 * @param elementId - ID of the container element
 * @param warnings  - Warning snapshot from computeDiagnosticWarnings
 */
export function renderDiagnosticOverlay(
    elementId: string,
    warnings: TorusDiagnosticWarnings
): void {
    const el = document.getElementById(elementId);
    if (!el) return;

    const rows: string[] = [];

    rows.push(buildWarningRow('NaN Values', warnings.nanCount, warnings.nanCount > 0));
    rows.push(buildWarningRow('Infinity Values', warnings.infinityCount, warnings.infinityCount > 0));
    rows.push(buildWarningRow('Clipped Values', warnings.clippedCount, warnings.clippedCount > 0));
    rows.push(buildWarningRow('Overbright Regions', warnings.overbrightCount, warnings.overbrightCount > 50));

    rows.push(buildFlagRow(
        'Backside Hidden',
        warnings.hiddenBacksideWarning,
        'Backside faint display is off. Torus shape may appear partial.'
    ));
    rows.push(buildFlagRow(
        'Low Coverage',
        warnings.coverageWarning,
        `Active coverage below ${(COVERAGE_WARNING_THRESHOLD * 100).toFixed(0)}%. ` +
        'Check if this is genuine field sparsity or a display artefact.'
    ));

    const hasWarning = warnings.nanCount > 0
        || warnings.infinityCount > 0
        || warnings.clippedCount > 0
        || warnings.hiddenBacksideWarning
        || warnings.coverageWarning;

    const statusBadge = hasWarning
        ? '<span class="diag-status-warn">⚠ Warnings</span>'
        : '<span class="diag-status-ok">✓ Clean</span>';

    el.innerHTML = `
        <div class="diag-header">Diagnostic Warnings ${statusBadge}</div>
        <div class="diag-note">
            These flags indicate renderer reliability issues.
            NaN / Infinity come from field values.
            Clipped / Overbright come from display scale.
            Backside / Coverage help detect display artefacts.
        </div>
        <div class="diag-rows">${rows.join('')}</div>
    `;
}

function buildWarningRow(label: string, count: number, isWarn: boolean): string {
    const cls = isWarn ? 'diag-row diag-row-warn' : 'diag-row diag-row-ok';
    const icon = isWarn ? '⚠' : '✓';
    return `
        <div class="${cls}">
            <span class="diag-icon">${icon}</span>
            <span class="diag-label">${label}</span>
            <span class="diag-count">${count}</span>
        </div>
    `;
}

function buildFlagRow(label: string, isActive: boolean, description: string): string {
    const cls = isActive ? 'diag-row diag-row-warn' : 'diag-row diag-row-ok';
    const icon = isActive ? '⚠' : '✓';
    return `
        <div class="${cls}" title="${description}">
            <span class="diag-icon">${icon}</span>
            <span class="diag-label">${label}</span>
            <span class="diag-count">${isActive ? 'Yes' : 'No'}</span>
        </div>
    `;
}

/**
 * Build a compact one-line diagnostic summary for the HUD.
 *
 * @param warnings - Warning snapshot
 * @returns Short summary string, e.g. "Diag: 2 NaN · Backside hidden"
 */
export function buildDiagnosticSummary(warnings: TorusDiagnosticWarnings): string {
    const parts: string[] = [];
    if (warnings.nanCount > 0)         parts.push(`${warnings.nanCount} NaN`);
    if (warnings.infinityCount > 0)    parts.push(`${warnings.infinityCount} Inf`);
    if (warnings.clippedCount > 0)     parts.push(`${warnings.clippedCount} clipped`);
    if (warnings.overbrightCount > 50) parts.push(`${warnings.overbrightCount} overbright`);
    if (warnings.hiddenBacksideWarning) parts.push('Backside hidden');
    if (warnings.coverageWarning)       parts.push('Low coverage');
    return parts.length > 0 ? 'Diag: ' + parts.join(' · ') : 'Diag: clean';
}
