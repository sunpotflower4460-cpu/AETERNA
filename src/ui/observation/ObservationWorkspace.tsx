/**
 * ObservationWorkspace.tsx
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — Observation Workspace
 *
 * Orchestrates all observation panels into one workspace layout.
 * Two-column on desktop (field view | panels), stacked on mobile.
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - All user/data content is XSS-safe via _esc().
 * - Panels are conditionally rendered based on available data.
 * - Mobile tab bar always rendered; hidden on desktop via CSS.
 * - AI Guide note: "このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。"
 * - No consciousness/life/intelligence proof claims.
 * - No "AETERNA feels", "AETERNA wants", "AETERNA understands" text.
 *
 * Reference: docs/deep-inspector-time-replay.md
 */

import type { CellObservation } from '../../types/cellObservation.ts';
import type { MetricLensId } from '../lens/metricLensRegistry.ts';
import type { ReplayUIState } from '../../types/timeReplay.ts';
import type { TimeReplayBuffer } from '../../replay/timeReplayBuffer.ts';
import type { CausalTraceResult } from '../../types/causalTrace.ts';
import type { LayerCorrelationState } from '../../types/layerCorrelation.ts';
import type { ObservationDifferenceState } from '../../types/observationDifference.ts';
import type { ObservedRatioInvolvement } from '../../observation/buildObservedRatioInvolvement.ts';
import type { LensGuideResponse } from '../../guide/lensGuideTypes.ts';
import type { LensGuideMode } from '../../config/lensGuideConfig.ts';
import type { FieldLayerId } from '../render/fieldLayerRegistry.ts';

import { renderObservationHeaderHTML } from './ObservationHeader.tsx';
import { renderInspectorDrawerHTML } from './InspectorDrawer.tsx';
import { renderObservationMobileTabsHTML } from './ObservationMobileTabs.tsx';
import {
    renderObservationDiagnosticStripHTML,
    type ObservationWarningItem,
} from './ObservationDiagnosticStrip.tsx';
import { renderCellInspectorPanelHTML } from './CellInspectorPanel.tsx';
import { renderMetricSpotlightPanelHTML } from './MetricSpotlightPanel.tsx';
import { renderTimeReplayPanelHTML } from '../replay/TimeReplayPanel.tsx';
import { renderCausalTracePanelHTML } from './CausalTracePanel.tsx';
import { renderLayerCorrelationPanelHTML } from './LayerCorrelationPanel.tsx';
import { renderDifferenceViewPanelHTML } from './DifferenceViewPanel.tsx';
import { renderObservedRatioInvolvementPanelHTML } from './ObservedRatioInvolvementPanel.tsx';
import { renderLensAwareGuidePanelHTML } from '../guide/LensAwareGuidePanel.tsx';

// ── ObservationWorkspaceProps ─────────────────────────────────────────────────

export interface ObservationWorkspaceProps {
    // Selection state
    observation: CellObservation | null;
    activeLensId: MetricLensId | null;
    selectedMetricId: string | null;
    selectedCellIndex: number | null;
    // Mode state
    isReplayMode: boolean;
    replayState: ReplayUIState;
    buffer: TimeReplayBuffer;
    // Runtime modes
    safetyMode?: string;
    researchMode?: string;
    // Observation data
    causalTraceResult: CausalTraceResult | null;
    correlationState: LayerCorrelationState | null;
    differenceState: ObservationDifferenceState | null;
    ratioInvolvements: ObservedRatioInvolvement[];
    // Guide
    guideResponse: LensGuideResponse | null;
    guideMode: LensGuideMode;
    isPublicMode?: boolean;
    // Lens
    availableLayerIds?: Set<FieldLayerId>;
    // Events
    recentEvents?: Array<{ id: string; tick: number; kind?: string; text?: string }>;
    // Warnings
    warnings?: ObservationWarningItem[];
    nanDetected?: boolean;
    // Mobile tab state
    activeMobileTab?: 'beginner' | 'field' | 'inspector' | 'lens' | 'replay' | 'trace' | 'guide';
    activeInspectorTab?: 'cell' | 'metric' | 'events' | 'warnings';
}

// ── renderObservationWorkspaceHTML ────────────────────────────────────────────

/**
 * Render the full observation workspace as an HTML string.
 *
 * @param props - ObservationWorkspaceProps
 * @returns HTML string
 */
export function renderObservationWorkspaceHTML(props: ObservationWorkspaceProps): string {
    const {
        observation,
        activeLensId,
        selectedMetricId,
        selectedCellIndex,
        isReplayMode,
        replayState,
        buffer,
        safetyMode,
        researchMode,
        causalTraceResult,
        correlationState,
        differenceState,
        ratioInvolvements,
        guideResponse,
        guideMode,
        isPublicMode = false,
        availableLayerIds,
        recentEvents = [],
        warnings = [],
        nanDetected = false,
        activeMobileTab = 'field',
        activeInspectorTab = 'cell',
    } = props;

    const liveTick   = replayState.liveTick;
    const replayTick = replayState.replayTick ?? null;

    // ── Header ────────────────────────────────────────────────────────────────
    const headerHtml = renderObservationHeaderHTML({
        liveTick,
        replayTick,
        isReplayMode,
        selectedCellIndex,
        activeLensId,
        safetyMode,
        researchMode,
    });

    // ── Diagnostic strip ──────────────────────────────────────────────────────
    const diagnosticStripHtml = renderObservationDiagnosticStripHTML({
        warnings,
        isReplayMode,
        activeLensId,
        nanDetected,
    });

    // ── Inspector drawer ──────────────────────────────────────────────────────
    const inspectorDrawerHtml = renderInspectorDrawerHTML({
        activeTab: activeInspectorTab,
        observation,
        activeLensId,
        selectedMetricId,
        recentEvents,
        isReplayMode,
        warnings,
    });

    // ── Metric spotlight (only when a lens is active) ─────────────────────────
    const metricSpotlightHtml = activeLensId
        ? renderMetricSpotlightPanelHTML({
            activeLensId,
            observation,
            availableLayerIds,
        })
        : '';

    // ── Time replay panel ─────────────────────────────────────────────────────
    const timeReplayHtml = renderTimeReplayPanelHTML({
        replayState,
        buffer,
        onTickSelect:    () => { /* handled via replay:tickSelect CustomEvent */ },
        onReturnToLive:  () => { /* handled via replay:returnToLive CustomEvent */ },
    });

    // ── Causal trace panel (only when result is available) ────────────────────
    const causalTraceHtml = causalTraceResult
        ? renderCausalTracePanelHTML({ result: causalTraceResult })
        : '';

    // ── Layer correlation panel ───────────────────────────────────────────────
    const layerCorrelationHtml = correlationState
        ? renderLayerCorrelationPanelHTML({ state: correlationState })
        : '';

    // ── Difference view panel ─────────────────────────────────────────────────
    const differenceViewHtml = differenceState
        ? renderDifferenceViewPanelHTML({ state: differenceState })
        : '';

    // ── Observed ratio involvement panel ─────────────────────────────────────
    const ratioInvolvementHtml = ratioInvolvements.length > 0
        ? renderObservedRatioInvolvementPanelHTML({ involvements: ratioInvolvements })
        : '';

    // ── Guide panel ───────────────────────────────────────────────────────────
    const guidePanelHtml = renderLensAwareGuidePanelHTML({
        activeLensId,
        selectedCellIndex,
        activeMode: guideMode,
        response: guideResponse,
        isPublicMode,
    });

    // ── Mobile tabs ───────────────────────────────────────────────────────────
    const mobileTabsHtml = renderObservationMobileTabsHTML({
        activeTab: activeMobileTab,
    });

    return `<div class="observation-workspace">
  ${headerHtml}
  ${diagnosticStripHtml}
  <div class="observation-content">
    <div class="observation-content__field-view" aria-label="Field View">
      <!-- Main torus field view is rendered by the field renderer into this container -->
    </div>
    <div class="observation-content__panels">
      ${inspectorDrawerHtml}
      ${metricSpotlightHtml}
      ${timeReplayHtml}
      ${causalTraceHtml}
      ${layerCorrelationHtml}
      ${differenceViewHtml}
      ${ratioInvolvementHtml}
      <div class="observation-content__guide-note">
        <small>このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。</small>
      </div>
      ${guidePanelHtml}
    </div>
  </div>
  ${mobileTabsHtml}
  <div class="observation-nav-hint" aria-label="Navigation hint">
    セルをタップ → セル観測 → 観測値 → レンズ → 時間 → 関連候補 → 観測ガイド
  </div>
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
