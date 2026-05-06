/**
 * selectedObservationState.ts
 * v1.7: Deep Inspector / Time Replay — Selected Observation State
 *
 * Extends the v1.6 CellInspectorState with replay-aware selected observation
 * state.  This is the top-level UI state object connecting:
 * - Cell selection (selectedCellIndex)
 * - Active metric / lens (selectedMetricId, activeLensId)
 * - Replay mode (replayMode, replayTick)
 * - Recent events context
 *
 * Design principles:
 * - Pure state model: all transitions are (old state → new state).
 * - No runtime dynamics are modified.
 * - Replay mode does NOT rewind the runtime — it only changes UI display.
 * - No fake selections, fake replay ticks, or fabricated event data.
 *
 * Reference: docs/deep-inspector-time-replay.md
 */

import type { MetricLensId } from '../ui/lens/metricLensRegistry.ts';
import type { ReplayModeState } from '../types/timeReplay.ts';

// ── SelectedObservationState ──────────────────────────────────────────────────

/**
 * Top-level UI state for cell observation and replay.
 */
export interface SelectedObservationState {
    /** Flat cell index of the currently selected cell, or null */
    selectedCellIndex: number | null;
    /** ID of the currently selected metric path, or null */
    selectedMetricId: string | null;
    /** ID of the active Metric Visual Lens, or null */
    activeLensId: MetricLensId | null;
    /** Whether the Cell Inspector panel is open */
    panelOpen: boolean;
    /**
     * Whether the UI is in Replay Mode or Live Mode.
     * 'replay' = showing a recorded snapshot.
     * 'live'   = showing current runtime state.
     * IMPORTANT: 'replay' does NOT stop or rewind the runtime.
     */
    replayMode: ReplayModeState;
    /**
     * Tick being displayed in replay mode.
     * null when replayMode === 'live'.
     */
    replayTick: number | null;
    /** Current live simulation tick (updated by runtime) */
    liveTick: number;
    /** Wall-clock timestamp of the last state change */
    lastChangedAt: number;
}

// ── Default State ─────────────────────────────────────────────────────────────

export const DEFAULT_SELECTED_OBSERVATION_STATE: SelectedObservationState = {
    selectedCellIndex: null,
    selectedMetricId: null,
    activeLensId: null,
    panelOpen: false,
    replayMode: 'live',
    replayTick: null,
    liveTick: 0,
    lastChangedAt: 0,
};

// ── State Transitions ─────────────────────────────────────────────────────────

/** Select a cell; opens panel and clears metric selection. */
export function selectObservationCell(
    state: SelectedObservationState,
    cellIndex: number | null,
): SelectedObservationState {
    return {
        ...state,
        selectedCellIndex: cellIndex,
        selectedMetricId: cellIndex === null ? null : state.selectedMetricId,
        panelOpen: cellIndex !== null ? true : state.panelOpen,
        lastChangedAt: Date.now(),
    };
}

/** Select a metric and optionally activate a corresponding lens. */
export function selectObservationMetric(
    state: SelectedObservationState,
    metricId: string | null,
    correspondingLensId: MetricLensId | null = null,
): SelectedObservationState {
    return {
        ...state,
        selectedMetricId: metricId,
        activeLensId: metricId !== null ? correspondingLensId : state.activeLensId,
        lastChangedAt: Date.now(),
    };
}

/** Activate a Metric Visual Lens; null deactivates. */
export function activateObservationLens(
    state: SelectedObservationState,
    lensId: MetricLensId | null,
): SelectedObservationState {
    return { ...state, activeLensId: lensId, lastChangedAt: Date.now() };
}

/**
 * Enter Replay Mode at a specific tick.
 *
 * IMPORTANT: Entering replay mode does NOT stop or rewind the runtime.
 * The runtime continues advancing; only the UI display changes.
 */
export function enterReplayMode(
    state: SelectedObservationState,
    replayTick: number,
): SelectedObservationState {
    return {
        ...state,
        replayMode: 'replay',
        replayTick,
        lastChangedAt: Date.now(),
    };
}

/**
 * Exit Replay Mode and return to Live display.
 * The runtime tick is not affected.
 */
export function exitReplayMode(
    state: SelectedObservationState,
): SelectedObservationState {
    return {
        ...state,
        replayMode: 'live',
        replayTick: null,
        lastChangedAt: Date.now(),
    };
}

/** Update the live tick counter (called each runtime tick). */
export function updateLiveTick(
    state: SelectedObservationState,
    tick: number,
): SelectedObservationState {
    return { ...state, liveTick: tick };
}

/** Toggle the observation panel open/closed. */
export function toggleObservationPanel(
    state: SelectedObservationState,
): SelectedObservationState {
    return { ...state, panelOpen: !state.panelOpen, lastChangedAt: Date.now() };
}

/** Reset to default state (no selection, live mode, panel closed). */
export function resetObservationState(
    _state: SelectedObservationState,
): SelectedObservationState {
    return { ...DEFAULT_SELECTED_OBSERVATION_STATE, lastChangedAt: Date.now() };
}
