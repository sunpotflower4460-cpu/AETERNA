/**
 * ObservationDiagnosticStrip.tsx
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — Diagnostic Strip
 *
 * Renders a thin diagnostic strip showing NaN alerts, replay mode,
 * active lens, and warning items inline.
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - All user/data content is XSS-safe via _esc().
 * - Max 3 warnings shown inline; remainder collapsed to "+N more".
 * - Severity colors: info=grey, notice=blue, warning=yellow, critical=red, experimental=amber.
 * - No consciousness/life/intelligence proof claims.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ObservationSeverity =
    | 'info'
    | 'notice'
    | 'warning'
    | 'critical'
    | 'experimental';

export interface ObservationWarningItem {
    severity: ObservationSeverity;
    text: string;
    id?: string;
}

// ── ObservationDiagnosticStripProps ───────────────────────────────────────────

export interface ObservationDiagnosticStripProps {
    /** Warning items to display */
    warnings: ObservationWarningItem[];
    /** Whether in replay mode */
    isReplayMode: boolean;
    /** Currently active lens ID, or null */
    activeLensId: string | null;
    /** Whether a NaN value has been detected */
    nanDetected?: boolean;
}

// ── Severity color map ────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<ObservationSeverity, string> = {
    info:         '#9ca3af',
    notice:       '#60a5fa',
    warning:      '#fbbf24',
    critical:     '#f87171',
    experimental: '#fb923c',
};

const MAX_INLINE_WARNINGS = 3;

// ── renderObservationDiagnosticStripHTML ──────────────────────────────────────

/**
 * Render the observation diagnostic strip as an HTML string.
 *
 * @param props - ObservationDiagnosticStripProps
 * @returns HTML string
 */
export function renderObservationDiagnosticStripHTML(
    props: ObservationDiagnosticStripProps,
): string {
    const { warnings, isReplayMode, activeLensId, nanDetected = false } = props;

    const nanBadge = nanDetected
        ? `<span class="observation-diagnostic-strip__badge observation-diagnostic-strip__badge--critical"
         style="color:${SEVERITY_COLOR.critical}">
      Critical: NaN detected.
    </span>`
        : '';

    const replayBadge = isReplayMode
        ? `<span class="observation-diagnostic-strip__badge observation-diagnostic-strip__badge--info"
         style="color:${SEVERITY_COLOR.info}">
      Replay Mode
    </span>`
        : '';

    const lensBadge = activeLensId
        ? `<span class="observation-diagnostic-strip__badge observation-diagnostic-strip__badge--lens">
      Lens: ${_esc(activeLensId)}
    </span>`
        : '';

    const inlineWarnings = warnings.slice(0, MAX_INLINE_WARNINGS);
    const overflowCount  = warnings.length - inlineWarnings.length;

    const warningBadges = inlineWarnings.map((w) => {
        const color = SEVERITY_COLOR[w.severity] ?? '#9ca3af';
        const label = w.severity.charAt(0).toUpperCase() + w.severity.slice(1);
        const idAttr = w.id ? ` data-warning-id="${_esc(w.id)}"` : '';
        return `<span class="observation-diagnostic-strip__badge observation-diagnostic-strip__badge--${_esc(w.severity)}"
         style="color:${color}"${idAttr}>
      ${_esc(label)}: ${_esc(w.text)}
    </span>`;
    }).join('\n    ');

    const overflowBadge = overflowCount > 0
        ? `<span class="observation-diagnostic-strip__badge observation-diagnostic-strip__badge--overflow">
      +${overflowCount} more
    </span>`
        : '';

    const hasContent = nanDetected || isReplayMode || activeLensId || warnings.length > 0;
    const emptyClass = hasContent ? '' : ' observation-diagnostic-strip--empty';

    return `<div class="observation-diagnostic-strip${emptyClass}" role="status" aria-live="polite">
  ${nanBadge}
  ${replayBadge}
  ${lensBadge}
  ${warningBadges}
  ${overflowBadge}
</div>`;
}

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
