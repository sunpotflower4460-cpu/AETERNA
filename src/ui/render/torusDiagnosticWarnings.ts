/**
 * torusDiagnosticWarnings.ts
 * U3: Scientific Torus Renderer — diagnostic warnings
 *
 * Computes renderer diagnostic warnings that help identify:
 *   - Field data integrity issues (NaN, Infinity)
 *   - Display integrity issues (clipping, overbright, coverage gaps)
 *
 * These warnings help distinguish "something is wrong with the data"
 * from "something is wrong with how it is displayed."
 *
 * Observer-side pure functions. Does NOT modify field values.
 */

/** Severity of a diagnostic warning. */
export type DiagnosticSeverity = 'info' | 'warn' | 'error';

/** A single diagnostic warning item. */
export interface DiagnosticWarning {
    /** Warning identifier */
    id: string;
    /** Human-readable title */
    title: string;
    /** Detailed explanation */
    detail: string;
    /** Severity level */
    severity: DiagnosticSeverity;
    /** Numeric count (e.g. number of NaN nodes) */
    count: number;
}

/** Full set of diagnostic warnings for the current renderer state. */
export interface TorusDiagnosticReport {
    /** Warnings present in the current state */
    warnings: DiagnosticWarning[];
    /** Total number of field values sampled */
    sampledCount: number;
    /** Total number of finite, in-range values */
    cleanCount: number;
    /** Whether any error-level warnings are present */
    hasErrors: boolean;
    /** Timestamp (ms since epoch) when this report was generated */
    timestamp: number;
}

/** Options for generating a diagnostic report. */
export interface DiagnosticOptions {
    /** Values above this are flagged as overbright (default: 5.0) */
    overbrightThreshold?: number;
    /** Values above this are flagged as clipped (default: 8.0) */
    clippingThreshold?: number;
    /** Fraction below which coverage is flagged as low (default: 0.1) */
    lowCoverageThreshold?: number;
    /** Whether to warn about backside visibility (default: false) */
    checkBacksideVisibility?: boolean;
    /** Whether the backside is currently shown */
    backsideVisible?: boolean;
    /** Whether coverage metrics are available */
    hasCoverageMetrics?: boolean;
    /** Active coverage ratio from coverage metrics */
    activeCoverageRatio?: number;
}

/**
 * Generate a diagnostic report for the current renderer state.
 *
 * @param currentBuffer     Node field values
 * @param numNodes          Total number of nodes
 * @param options           Diagnostic thresholds and flags
 */
export function generateDiagnosticReport(
    currentBuffer: ArrayLike<number>,
    numNodes: number,
    options: DiagnosticOptions = {}
): TorusDiagnosticReport {
    const {
        overbrightThreshold = 5.0,
        clippingThreshold = 8.0,
        lowCoverageThreshold = 0.1,
        checkBacksideVisibility = false,
        backsideVisible = true,
        hasCoverageMetrics = false,
        activeCoverageRatio = 1.0,
    } = options;

    const warnings: DiagnosticWarning[] = [];
    let nanCount = 0;
    let infinityCount = 0;
    let clippedCount = 0;
    let overbrightCount = 0;

    for (let i = 0; i < numNodes; i++) {
        const v = currentBuffer[i];
        if (Number.isNaN(v)) {
            nanCount++;
        } else if (!Number.isFinite(v)) {
            infinityCount++;
        } else {
            const abs = Math.abs(v);
            if (abs > clippingThreshold) clippedCount++;
            else if (abs > overbrightThreshold) overbrightCount++;
        }
    }

    if (nanCount > 0) {
        warnings.push({
            id: 'nan',
            title: 'NaN Values Detected',
            detail: `${nanCount} node(s) have NaN values. These indicate a field calculation error and will appear as black / missing in the renderer.`,
            severity: 'error',
            count: nanCount,
        });
    }

    if (infinityCount > 0) {
        warnings.push({
            id: 'infinity',
            title: 'Infinity Values Detected',
            detail: `${infinityCount} node(s) have Infinity values. These indicate unbounded field growth and will be clamped by the renderer.`,
            severity: 'error',
            count: infinityCount,
        });
    }

    if (clippedCount > 0) {
        warnings.push({
            id: 'clipping',
            title: 'Value Clipping',
            detail: `${clippedCount} node(s) exceed the clipping threshold (${clippingThreshold}). High-activity regions may appear saturated. Check for overload risk.`,
            severity: 'warn',
            count: clippedCount,
        });
    }

    if (overbrightCount > 0) {
        const ratio = (overbrightCount / numNodes * 100).toFixed(1);
        warnings.push({
            id: 'overbright',
            title: 'Overbright Region',
            detail: `${overbrightCount} node(s) (${ratio}%) are above the overbright threshold (${overbrightThreshold}). Local normalization may make these dominate the display.`,
            severity: 'info',
            count: overbrightCount,
        });
    }

    if (checkBacksideVisibility && !backsideVisible) {
        warnings.push({
            id: 'backside_hidden',
            title: 'Backside Not Visible',
            detail: 'Torus backside display is disabled. Activity on the back of the torus is not visible. Enable showBackside to see the full torus.',
            severity: 'info',
            count: 0,
        });
    }

    if (hasCoverageMetrics && activeCoverageRatio < lowCoverageThreshold) {
        const pct = (activeCoverageRatio * 100).toFixed(1);
        warnings.push({
            id: 'coverage_low',
            title: 'Low Activity Coverage',
            detail: `Only ${pct}% of torus regions are active. This may indicate localized activity (normal) or a display/sampling issue. Check camera angle and normalization mode.`,
            severity: 'info',
            count: 0,
        });
    }

    const cleanCount = numNodes - nanCount - infinityCount;
    const hasErrors = warnings.some((w) => w.severity === 'error');

    return {
        warnings,
        sampledCount: numNodes,
        cleanCount: Math.max(0, cleanCount),
        hasErrors,
        timestamp: Date.now(),
    };
}

/** Format a diagnostic report as a plain text summary string (for HUD / overlay). */
export function formatDiagnosticSummary(report: TorusDiagnosticReport): string {
    if (report.warnings.length === 0) {
        return `OK — ${report.sampledCount} nodes sampled, no warnings`;
    }
    const lines = report.warnings.map((w) => {
        const icon = w.severity === 'error' ? '✗' : w.severity === 'warn' ? '!' : 'i';
        return `[${icon}] ${w.title}${w.count > 0 ? ` (${w.count})` : ''}`;
    });
    return lines.join('\n');
}
