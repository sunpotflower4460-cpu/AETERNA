/**
 * lensContextPacket.ts
 * v1.6: Super Observation Architecture — Lens Context Packet
 *
 * Defines the LensContextPacket type: a structured context bundle
 * produced when a cell and/or metric lens is selected.
 *
 * LensContextPacket is the bridge between the Cell Inspector state and
 * the AI Guide context interface.  It is produced client-side from
 * CellObservation + CellInspectorState data — no LLM or API call is made.
 *
 * Design principles:
 * - Read-only context only — does NOT modify runtime state.
 * - No fake values; all fields reflect actual observation data.
 * - No LLM / external API dependency in the packet itself.
 * - The packet is passed to buildAiGuideContext() in aiGuideContextInterface.ts
 *   which formats it for optional future guide integration.
 * - No semantic / consciousness / mystical proof claims in packet fields.
 *
 * Reference: docs/super-observation-architecture.md
 */

import type { CellObservation } from '../../types/cellObservation.ts';
import type { MetricLens } from './metricLensRegistry.ts';

// ── LensContextPacket ─────────────────────────────────────────────────────────

/**
 * Context bundle produced when a cell and/or lens is selected in the
 * Cell Inspector.  Used as input to the AI Guide context interface.
 */
export interface LensContextPacket {
    /** Wall-clock timestamp when this packet was built */
    timestamp: number;

    /** Simulation tick at time of context capture (if available) */
    tick?: number;

    /** The CellObservation for the selected cell */
    cellObservation: CellObservation;

    /**
     * The active Metric Visual Lens, if one is selected.
     * null = showing full cell overview, no specific lens active.
     */
    activeLens: MetricLens | null;

    /**
     * The specific metric value currently highlighted.
     * undefined = full overview shown.
     */
    highlightedMetricValue?: number | string | null;

    /**
     * Human-readable description of what the user is currently looking at.
     * Composed from lens label + observation value.
     * No consciousness / emotion / intent claims.
     */
    contextSummary: string;

    /**
     * Epistemic status note for the highlighted metric.
     * Pulled from the lens disclaimer or a generic note.
     */
    epistemicNote: string;
}

// ── buildLensContextPacket ────────────────────────────────────────────────────

/**
 * Build a LensContextPacket from a CellObservation and optional active lens.
 *
 * @param cellObservation - Integrated per-cell observation data
 * @param activeLens      - Currently active MetricLens, or null
 * @param tick            - Current simulation tick (optional)
 */
export function buildLensContextPacket(
    cellObservation: CellObservation,
    activeLens: MetricLens | null,
    tick?: number,
): LensContextPacket {
    const { cellIndex, geometry } = cellObservation;

    const cellLabel = geometry.i !== undefined && geometry.j !== undefined
        ? `cell (i=${geometry.i}, j=${geometry.j}, index=${cellIndex})`
        : `cell index=${cellIndex}`;

    let highlightedMetricValue: number | string | null | undefined = undefined;
    let contextSummary: string;
    let epistemicNote: string;

    if (activeLens) {
        const value = resolveObservationPath(cellObservation, activeLens.observationPath);
        highlightedMetricValue = value;
        const valueStr = formatMetricValue(value, activeLens.unit, activeLens.displayRange);
        contextSummary = `${cellLabel} — ${activeLens.label}: ${valueStr}`;
        epistemicNote = activeLens.disclaimer;
    } else {
        contextSummary = `${cellLabel} — full cell overview`;
        epistemicNote = 'Multiple observer-side metrics shown. All values are observational data only.';
    }

    return {
        timestamp: Date.now(),
        tick,
        cellObservation,
        activeLens,
        highlightedMetricValue,
        contextSummary,
        epistemicNote,
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve a dot-separated observation path from a CellObservation.
 * E.g. 'geometry.gaussianCurvature' → cellObservation.geometry.gaussianCurvature
 *
 * Returns null when the path cannot be resolved.
 */
export function resolveObservationPath(
    obs: CellObservation,
    path: string,
): number | string | null | undefined {
    const parts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = obs;
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
    }
    if (typeof current === 'number' || typeof current === 'string' || current === null) {
        return current;
    }
    return undefined;
}

/**
 * Format a metric value for display in the context summary.
 */
function formatMetricValue(
    value: number | string | null | undefined,
    unit: string,
    displayRange: [number, number] | null,
): string {
    if (value === undefined || value === null) return '(unavailable)';
    if (typeof value === 'string') return value;
    if (!Number.isFinite(value)) return '(non-finite)';
    const rounded = displayRange
        ? value.toFixed(4)
        : value.toFixed(6);
    return `${rounded} ${unit}`;
}
