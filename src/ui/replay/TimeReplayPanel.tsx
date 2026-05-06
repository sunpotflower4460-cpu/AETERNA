/**
 * TimeReplayPanel.tsx
 * v1.7: Deep Inspector / Time Replay — Time Replay Panel
 *
 * Main panel for the Time Replay system.  Combines:
 * - Replay Mode / Live Mode badge and indicator
 * - ReplaySlider for tick navigation
 * - ReplaySnapshotSummary for the selected tick
 * - "Return to Live" button
 *
 * Design principles:
 * - Replay Mode shows recorded observation snapshots ONLY.
 * - The runtime is NOT rewound or stopped in Replay Mode.
 * - Replay Mode badge is always visible when active.
 * - No consciousness/emotion claims in any display text.
 * - The distinction between "Replay Mode" and "Live Mode" is always explicit.
 *
 * Guardrails (must remain in UI):
 * "Replay Mode shows recorded observation snapshots.
 *  It does not imply the runtime itself has moved backward."
 *
 * Reference: docs/deep-inspector-time-replay.md §8
 */

import type { TimeReplaySnapshot, ReplayUIState } from '../../types/timeReplay.ts';
import type { TimeReplayBuffer } from '../../replay/timeReplayBuffer.ts';
import { getReplaySnapshotByTick, getAvailableTickRange } from '../../replay/timeReplayBuffer.ts';
import { renderReplaySliderHTML } from './ReplaySlider.tsx';
import { renderReplaySnapshotSummaryHTML } from './ReplaySnapshotSummary.tsx';

// ── TimeReplayPanelProps ──────────────────────────────────────────────────────

export interface TimeReplayPanelProps {
    /** Current UI replay state */
    replayState: ReplayUIState;
    /** Snapshot buffer */
    buffer: TimeReplayBuffer;
    /** Called when user selects a tick on the slider */
    onTickSelect: (tick: number) => void;
    /** Called when user clicks "Return to Live" */
    onReturnToLive: () => void;
}

// ── renderTimeReplayPanelHTML ─────────────────────────────────────────────────

/**
 * Render the Time Replay panel as an HTML string.
 *
 * Dispatches the following CustomEvents (registered by ReplaySlider):
 *   'replay:tickSelect'   → detail.tick: number
 *   'replay:returnToLive' → (no detail)
 */
export function renderTimeReplayPanelHTML(props: TimeReplayPanelProps): string {
    const { replayState, buffer } = props;
    const { mode, replayTick, liveTick } = replayState;

    const range = getAvailableTickRange(buffer);

    if (!range) {
        return `<div class="time-replay-panel time-replay-panel--empty">
  <div class="time-replay-panel__header">
    <span class="time-replay-panel__title">Time Replay</span>
  </div>
  <p class="time-replay-panel__no-data">
    No snapshots recorded yet. Snapshots are collected during the live simulation.
  </p>
  <p class="time-replay-panel__disclaimer">
    Replay Mode shows recorded observation snapshots.
    It does not imply the runtime itself has moved backward.
  </p>
</div>`;
    }

    const { minTick, maxTick } = range;
    const currentReplayTick = replayTick ?? maxTick;
    const isReplayMode = mode === 'replay';
    const snapshot: TimeReplaySnapshot | null = isReplayMode
        ? getReplaySnapshotByTick(buffer, currentReplayTick)
        : null;
    const snapshotAvailable = snapshot !== null;

    const sliderHtml = renderReplaySliderHTML({
        minTick,
        maxTick,
        currentReplayTick,
        liveTick,
        isReplayMode,
        onTickSelect: props.onTickSelect,
        onReturnToLive: props.onReturnToLive,
    });

    const summaryHtml = isReplayMode
        ? renderReplaySnapshotSummaryHTML(snapshot)
        : '';

    const modeBadge = isReplayMode
        ? `<span class="time-replay-panel__mode-badge time-replay-panel__mode-badge--replay">Replay Mode</span>`
        : `<span class="time-replay-panel__mode-badge time-replay-panel__mode-badge--live">Live</span>`;

    const snapshotNote = isReplayMode && !snapshotAvailable
        ? `<p class="time-replay-panel__missing-snapshot">
    No snapshot available for tick ${currentReplayTick}.
    Use the slider to select a tick with a recorded snapshot.
  </p>`
        : '';

    return `<div class="time-replay-panel${isReplayMode ? ' time-replay-panel--replay' : ' time-replay-panel--live'}">
  <div class="time-replay-panel__header">
    <span class="time-replay-panel__title">Time Replay</span>
    ${modeBadge}
  </div>
  <div class="time-replay-panel__info">
    <span>Live tick: ${liveTick}</span>
    <span>Snapshots: ${buffer.snapshots.length} / ${buffer.maxSnapshots}</span>
    <span>Range: tick ${minTick}–${maxTick}</span>
  </div>
  ${sliderHtml}
  ${snapshotNote}
  ${summaryHtml}
</div>`;
}
