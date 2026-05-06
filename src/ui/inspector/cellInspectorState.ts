/**
 * cellInspectorState.ts
 * v1.6: Super Observation Architecture — Cell Inspector State
 *
 * Manages the selected cell, selected metric, and active lens state for the
 * Cell Inspector UI.  This is a pure UI-side state model — it does NOT modify
 * runtime dynamics or create new observers.
 *
 * Design principles:
 * - No runtime state modification.
 * - No fake values or fake selections.
 * - Lens state is a UI-only enum; it does NOT alter field computation.
 * - All state transitions are pure (old state → new state).
 * - selectedCellIndex = null means nothing is selected.
 * - selectedMetricId = null means the overview (all metrics) is shown.
 * - activeLensId = null means no specific Visual Lens is active.
 *
 * Reference: docs/super-observation-architecture.md
 */

import type { MetricLensId } from '../lens/metricLensRegistry.ts';

// ── CellInspectorState ────────────────────────────────────────────────────────

/**
 * Complete state of the Cell Inspector UI.
 */
export interface CellInspectorState {
    /**
     * Index of the currently selected cell (0-based flat index).
     * null = no cell selected.
     */
    selectedCellIndex: number | null;

    /**
     * ID of the currently selected metric (from CellObservation field paths).
     * null = no specific metric selected (show full cell overview).
     *
     * Examples: 'geometry.gaussianCurvature', 'field.amplitude',
     *           'vortex.candidateConfidence', 'plasticity.resistanceScale'
     */
    selectedMetricId: string | null;

    /**
     * ID of the currently active Metric Visual Lens.
     * null = no lens active (default torus view).
     */
    activeLensId: MetricLensId | null;

    /**
     * Whether the Cell Inspector panel is currently open/visible.
     */
    panelOpen: boolean;

    /**
     * Wall-clock timestamp of the last state change.
     */
    lastChangedAt: number;
}

// ── Default State ─────────────────────────────────────────────────────────────

export const DEFAULT_CELL_INSPECTOR_STATE: CellInspectorState = {
    selectedCellIndex: null,
    selectedMetricId: null,
    activeLensId: null,
    panelOpen: false,
    lastChangedAt: 0,
};

// ── State Transitions ─────────────────────────────────────────────────────────

/**
 * Select a cell by flat index.
 * Selecting null deselects the current cell and clears the metric selection.
 * The active lens is preserved to allow browsing multiple cells in the same lens.
 */
export function selectCell(
    state: CellInspectorState,
    cellIndex: number | null,
): CellInspectorState {
    return {
        ...state,
        selectedCellIndex: cellIndex,
        selectedMetricId: cellIndex === null ? null : state.selectedMetricId,
        panelOpen: cellIndex !== null ? true : state.panelOpen,
        lastChangedAt: Date.now(),
    };
}

/**
 * Select a metric within the currently selected cell.
 * Setting metricId to null returns to the full-cell overview.
 * When a metric is selected, the corresponding lens is activated if
 * a lens for that metric exists in the registry.
 */
export function selectMetric(
    state: CellInspectorState,
    metricId: string | null,
    correspondingLensId: MetricLensId | null = null,
): CellInspectorState {
    return {
        ...state,
        selectedMetricId: metricId,
        activeLensId: metricId !== null ? correspondingLensId : state.activeLensId,
        lastChangedAt: Date.now(),
    };
}

/**
 * Activate a Metric Visual Lens by ID.
 * null deactivates the current lens (returns to default view).
 */
export function activateLens(
    state: CellInspectorState,
    lensId: MetricLensId | null,
): CellInspectorState {
    return {
        ...state,
        activeLensId: lensId,
        lastChangedAt: Date.now(),
    };
}

/**
 * Toggle the Cell Inspector panel open/closed.
 */
export function toggleInspectorPanel(
    state: CellInspectorState,
): CellInspectorState {
    return {
        ...state,
        panelOpen: !state.panelOpen,
        lastChangedAt: Date.now(),
    };
}

/**
 * Reset inspector to default (nothing selected, no lens, panel closed).
 */
export function resetCellInspector(
    _state: CellInspectorState,
): CellInspectorState {
    return {
        ...DEFAULT_CELL_INSPECTOR_STATE,
        lastChangedAt: Date.now(),
    };
}
