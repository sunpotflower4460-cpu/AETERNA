/**
 * ObservationHeader.tsx
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — Observation Header
 *
 * Renders the top header bar for the observation workspace.
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - All user/data content is XSS-safe via _esc().
 * - Live vs Replay mode clearly distinguished.
 * - Safety/research mode badges shown only when non-default.
 * - Replay Mode note is always shown when isReplayMode=true.
 * - AI Guide note: "このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。"
 * - No consciousness/life/intelligence proof claims.
 * - No "AETERNA feels", "AETERNA wants", "AETERNA understands" text.
 */

// ── ObservationHeaderProps ────────────────────────────────────────────────────

export interface ObservationHeaderProps {
    /** Current live simulation tick */
    liveTick: number;
    /** Currently displayed replay tick (null when in live mode) */
    replayTick: number | null;
    /** Whether the workspace is showing a replay snapshot */
    isReplayMode: boolean;
    /** Index of the currently selected cell, or null */
    selectedCellIndex: number | null;
    /** Currently active metric lens ID, or null */
    activeLensId: string | null;
    /** Safety mode: 'safe' | 'research' | 'experimental' */
    safetyMode?: string;
    /** Research mode: 'publicResearch' | 'research' | 'experimental' */
    researchMode?: string;
}

// ── renderObservationHeaderHTML ───────────────────────────────────────────────

/**
 * Render the observation workspace header as an HTML string.
 *
 * @param props - ObservationHeaderProps
 * @returns HTML string
 */
export function renderObservationHeaderHTML(props: ObservationHeaderProps): string {
    const {
        liveTick,
        replayTick,
        isReplayMode,
        selectedCellIndex,
        activeLensId,
        safetyMode,
        researchMode,
    } = props;

    const researchBadge = _renderResearchBadge(researchMode);
    const safetyBadge   = _renderSafetyBadge(safetyMode);
    const modeBadge     = _renderModeBadge(isReplayMode, liveTick, replayTick);
    const replayNote    = isReplayMode
        ? `<p class="observation-header__replay-note" role="alert" aria-live="polite">
    Replay Mode は記録された観測 snapshot を表示しています。runtime 自体が過去に戻ったわけではありません。
  </p>`
        : '';

    const cellDisplay = selectedCellIndex !== null
        ? `Cell ${_esc(selectedCellIndex)}`
        : '(no cell)';

    const lensDisplay = activeLensId
        ? _esc(activeLensId)
        : '(no lens)';

    return `<div class="observation-header">
  <div class="observation-header__top">
    <span class="observation-header__title">AETERNA-NATURAL</span>
    ${researchBadge}
    ${safetyBadge}
    ${modeBadge}
    <span class="observation-header__cell-display">
      Cell: <strong>${cellDisplay}</strong>
    </span>
    <span class="observation-header__lens-display">
      Lens: <strong>${lensDisplay}</strong>
    </span>
    <small class="observation-header__guide-note">
      このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。
    </small>
  </div>
  ${replayNote}
</div>`;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _renderModeBadge(
    isReplayMode: boolean,
    liveTick: number,
    replayTick: number | null,
): string {
    if (isReplayMode) {
        const replayTickDisplay = replayTick !== null ? _esc(replayTick) : '—';
        return `<span class="observation-header__mode-badge observation-header__mode-badge--replay">Replay</span>
    <span class="observation-header__tick-info">
      Replay tick ${replayTickDisplay} / Live tick ${_esc(liveTick)}
    </span>`;
    }
    return `<span class="observation-header__mode-badge observation-header__mode-badge--live">Live</span>
  <span class="observation-header__tick-info">Live tick ${_esc(liveTick)}</span>`;
}

function _renderResearchBadge(researchMode: string | undefined): string {
    if (!researchMode || researchMode === 'publicResearch') return '';
    const label = researchMode === 'experimental' ? 'Experimental' : 'Research';
    const mod   = researchMode === 'experimental' ? 'experimental' : 'research';
    return `<span class="observation-header__research-badge observation-header__research-badge--${_esc(mod)}">${label}</span>`;
}

function _renderSafetyBadge(safetyMode: string | undefined): string {
    if (!safetyMode || safetyMode === 'safe') return '';
    const label = safetyMode === 'experimental' ? 'Experimental Safety' : 'Research Safety';
    const mod   = safetyMode === 'experimental' ? 'experimental' : 'research';
    return `<span class="observation-header__safety-badge observation-header__safety-badge--${_esc(mod)}">${label}</span>`;
}

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
