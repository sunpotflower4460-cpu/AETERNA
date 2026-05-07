/**
 * NowSummaryPanel.tsx
 * v2.4: AETERNA-NATURAL Japanese-First UI — "今起きていること" Summary Panel
 *
 * Renders a short natural-language summary of the current observation state.
 * Always visible in the observation workspace.
 *
 * Design principles:
 * - Japanese-first. Summary lines are in plain Japanese.
 * - Shows only observation facts — no semantic/consciousness/proof claims.
 * - Disclaimer is always included.
 * - Pure HTML string rendering — no React JSX.
 * - All user content is XSS-safe via _esc().
 *
 * Reference: docs/japanese-first-ui.md §3
 */

// ── NowSummaryContext ─────────────────────────────────────────────────────────

export interface NowSummaryContext {
    /** Whether the simulation is in safe mode */
    isSafeMode?: boolean;
    /** Whether the workspace is in replay mode */
    isReplayMode?: boolean;
    /** Selected cell index, or null if no cell is selected */
    selectedCellIndex?: number | null;
    /** Active lens ID, or null */
    activeLensId?: string | null;
    /** Approximate vortex candidate confidence (0–1), or null if unknown */
    vortexCandidateConfidence?: number | null;
    /** Whether the field is currently active (amplitude > baseline) */
    fieldIsActive?: boolean;
    /** Whether NaN has been detected */
    nanDetected?: boolean;
    /** Current live tick */
    liveTick?: number;
}

// ── buildNowSummaryLines ──────────────────────────────────────────────────────

/**
 * Build an array of Japanese summary lines from the current context.
 * Each line is a short, plain-language observation statement.
 */
export function buildNowSummaryLines(ctx: NowSummaryContext): string[] {
    const lines: string[] = [];

    // Safety / mode
    if (ctx.isReplayMode) {
        lines.push('再生モードで観測スナップショットを表示しています。');
    } else if (ctx.isSafeMode !== false) {
        lines.push('現在は安全な観測モードです。');
    }

    // Field status
    if (ctx.fieldIsActive === true) {
        lines.push('トーラス場は活動状態にあります。');
    } else if (ctx.fieldIsActive === false) {
        lines.push('トーラス場は静止状態に近い状態です。');
    } else {
        lines.push('トーラス場の状態を観測しています。');
    }

    // NaN guard
    if (ctx.nanDetected) {
        lines.push('⚠ 数値異常（NaN）が検出されています。観測結果は不安定な可能性があります。');
    }

    // Cell selection
    if (ctx.selectedCellIndex !== null && ctx.selectedCellIndex !== undefined) {
        lines.push(`セル ${ctx.selectedCellIndex} を選択して観測中です。`);
    }

    // Lens
    if (ctx.activeLensId) {
        lines.push(`${ctx.activeLensId} レンズで可視化中です。`);
    }

    // Vortex candidate
    if (ctx.vortexCandidateConfidence !== null && ctx.vortexCandidateConfidence !== undefined) {
        if (ctx.vortexCandidateConfidence > 0.7) {
            lines.push('近くに渦候補があります（信頼度：高）。');
        } else if (ctx.vortexCandidateConfidence > 0.4) {
            lines.push('近くに渦候補が見られますが、信頼度は中程度です。');
        } else {
            lines.push('渦候補は見当たりません（信頼度：低）。');
        }
    }

    return lines;
}

// ── NowSummaryPanelProps ──────────────────────────────────────────────────────

export interface NowSummaryPanelProps {
    context: NowSummaryContext;
    /** Optional extra lines to append */
    extraLines?: string[];
}

// ── renderNowSummaryPanelHTML ─────────────────────────────────────────────────

/**
 * Render the "今起きていること" panel as an HTML string.
 *
 * @param props - NowSummaryPanelProps
 * @returns HTML string
 */
export function renderNowSummaryPanelHTML(props: NowSummaryPanelProps): string {
    const { context, extraLines = [] } = props;

    const summaryLines = [...buildNowSummaryLines(context), ...extraLines];

    const linesHtml = summaryLines.map(
        (line) => `<p class="now-summary-panel__line">${_esc(line)}</p>`,
    ).join('');

    return `<div class="now-summary-panel" aria-label="今起きていること">
  <div class="now-summary-panel__header">
    <span class="now-summary-panel__title">今起きていること</span>
  </div>
  <div class="now-summary-panel__lines">
    ${linesHtml}
  </div>
  <div class="now-summary-panel__disclaimer">
    <small>ここで見えているものは、場の変化を観測しやすくしたものです。断定ではなく、観測と仮説のための手がかりとして見てください。</small>
  </div>
</div>`;
}

// ── _esc ──────────────────────────────────────────────────────────────────────

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
