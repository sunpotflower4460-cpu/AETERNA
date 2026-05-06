/**
 * ReplaySlider.tsx
 * v1.7: Deep Inspector / Time Replay — Replay Slider
 *
 * A slider input for navigating between available replay snapshots.
 *
 * Design principles:
 * - Slider maps directly to available snapshot tick range.
 * - Selecting a tick triggers onTickSelect with the chosen tick.
 * - No interpolation between ticks — only ticks with actual snapshots are shown.
 * - "Live" button exits replay mode.
 * - Replay Mode badge is displayed when in replay mode.
 * - No consciousness/emotion copy in slider text.
 *
 * Reference: docs/deep-inspector-time-replay.md §8
 */

// ── ReplaySliderProps ─────────────────────────────────────────────────────────

export interface ReplaySliderProps {
    /** Minimum available tick in the snapshot buffer */
    minTick: number;
    /** Maximum available tick in the snapshot buffer */
    maxTick: number;
    /** Currently selected replay tick */
    currentReplayTick: number;
    /** Current live simulation tick */
    liveTick: number;
    /** Whether replay mode is active */
    isReplayMode: boolean;
    /** Called when the user selects a tick on the slider */
    onTickSelect: (tick: number) => void;
    /** Called when the user clicks "Live" to exit replay mode */
    onReturnToLive: () => void;
}

// ── renderReplaySliderHTML ────────────────────────────────────────────────────

/**
 * Render the replay slider as an HTML string.
 *
 * Dispatches CustomEvents for slider input and live button click.
 * Consumers should listen for:
 *   'replay:tickSelect'   → detail.tick: number
 *   'replay:returnToLive' → (no detail)
 */
export function renderReplaySliderHTML(props: ReplaySliderProps): string {
    const {
        minTick,
        maxTick,
        currentReplayTick,
        liveTick,
        isReplayMode,
    } = props;

    const replayBadge = isReplayMode
        ? `<span class="replay-slider__mode-badge">Replay Mode</span>`
        : '';

    const liveLabel = isReplayMode
        ? `<span class="replay-slider__live-indicator replay-slider__live-indicator--replaying">Live: tick ${liveTick}</span>`
        : `<span class="replay-slider__live-indicator replay-slider__live-indicator--live">Live: tick ${liveTick}</span>`;

    const disabled = maxTick <= minTick ? ' disabled' : '';
    const sliderValue = Math.max(minTick, Math.min(maxTick, currentReplayTick));

    return `<div class="replay-slider" role="region" aria-label="Time Replay Controls">
  <div class="replay-slider__header">
    ${replayBadge}
    ${liveLabel}
  </div>
  <div class="replay-slider__controls">
    <label class="replay-slider__label" for="replay-tick-slider">
      Replay tick: <strong>${sliderValue}</strong>
    </label>
    <input
      id="replay-tick-slider"
      class="replay-slider__input"
      type="range"
      min="${minTick}"
      max="${maxTick}"
      value="${sliderValue}"
      step="1"
      ${disabled}
      oninput="window.dispatchEvent(new CustomEvent('replay:tickSelect',{detail:{tick:parseInt(this.value)}}))"
    />
    <div class="replay-slider__tick-range">
      <span class="replay-slider__tick-min">tick ${minTick}</span>
      <span class="replay-slider__tick-max">tick ${maxTick}</span>
    </div>
  </div>
  <button
    class="replay-slider__live-btn${isReplayMode ? ' replay-slider__live-btn--active' : ''}"
    onclick="window.dispatchEvent(new CustomEvent('replay:returnToLive'))"
  >
    ↩ Return to Live
  </button>
  <p class="replay-slider__disclaimer">
    Replay Mode shows recorded observation snapshots.
    It does not imply the runtime itself has moved backward.
  </p>
</div>`;
}
