/**
 * getRecentEventsForCell.ts
 * v1.7: Deep Inspector / Time Replay — Recent Events for Cell
 *
 * Returns the subset of recent AeternaEvents that are relevant to a specific
 * cell, identified by its cellIndex and/or regionId.
 *
 * Design principles:
 * - Events are NEVER fabricated; only real events from the provided array are
 *   returned.
 * - Events are NOT described as intentions, emotions, or decisions.
 * - If no cell-specific matching is possible, global recent events are returned
 *   as a fallback (clearly labelled).
 * - The function is a pure read-only filter — no runtime state is modified.
 *
 * Guardrails:
 * - recent events are observational log entries, not intent or emotion claims.
 * - No events are created by this function.
 * - Event fabrication is explicitly prevented: only input events are returned.
 *
 * Reference: docs/deep-inspector-time-replay.md §9
 */

// ── AeternaEventLike ──────────────────────────────────────────────────────────

/**
 * Minimal interface for an AeternaEvent as needed by this function.
 * Keeps the function decoupled from the full AeternaEvent type.
 */
export interface AeternaEventLike {
    id: string;
    tick: number;
    source: string;
    kind?: string;
    text?: string;
    severity?: string;
    valueKind?: string;
}

// ── RecentEventsForCellResult ─────────────────────────────────────────────────

/**
 * Result of getRecentEventsForCell.
 */
export interface RecentEventsForCellResult {
    /** Events that matched the cell's regionId or cellIndex */
    cellEvents: AeternaEventLike[];
    /**
     * True if matching was done using regionId / source field.
     * False = no cell-specific match was possible; `cellEvents` may be global.
     */
    matchedByRegion: boolean;
    /**
     * True if the returned events are global fallback (no cell-specific match
     * was possible and `fallbackToGlobal` was enabled).
     */
    isGlobalFallback: boolean;
}

// ── getRecentEventsForCell ────────────────────────────────────────────────────

/**
 * Filter AeternaEvents for those relevant to a specific cell.
 *
 * Matching strategy (in order):
 * 1. Match event.source === cellRegionId (e.g. "u2-v3")
 * 2. If no matches and fallbackToGlobal is true, return the most recent
 *    global events up to maxEvents.
 *
 * This function NEVER fabricates events. If no events match, it returns an
 * empty array (or global fallback if enabled).
 *
 * @param params.cellIndex       - Flat cell index (used to derive regionId if not provided)
 * @param params.segments        - Grid dimension (segments × segments = total cells)
 * @param params.events          - Array of recent events (newest-first preferred)
 * @param params.regionId        - Pre-computed "uI-vJ" regionId (optional)
 * @param params.radius          - Unused in v1.7; reserved for future spatial matching
 * @param params.maxEvents       - Maximum number of events to return (default: 10)
 * @param params.fallbackToGlobal - If true and no cell match, return global recent events
 */
export function getRecentEventsForCell(params: {
    cellIndex: number;
    segments: number;
    events: AeternaEventLike[];
    regionId?: string | null;
    radius?: number;
    maxEvents?: number;
    fallbackToGlobal?: boolean;
}): RecentEventsForCellResult {
    const {
        cellIndex,
        segments,
        events,
        regionId,
        maxEvents = 10,
        fallbackToGlobal = true,
    } = params;

    if (!events || events.length === 0) {
        return { cellEvents: [], matchedByRegion: false, isGlobalFallback: false };
    }

    // Derive regionId if not supplied
    const cellRegionId: string = regionId != null
        ? regionId
        : (() => {
            const i = Math.floor(cellIndex / segments);
            const j = cellIndex % segments;
            return `u${i}-v${j}`;
        })();

    // Filter events whose source matches the cell's regionId
    const matched = events.filter((e) => e.source === cellRegionId);

    if (matched.length > 0) {
        return {
            cellEvents: matched.slice(0, maxEvents),
            matchedByRegion: true,
            isGlobalFallback: false,
        };
    }

    // Fallback: return most recent global events
    if (fallbackToGlobal) {
        return {
            cellEvents: events.slice(0, maxEvents),
            matchedByRegion: false,
            isGlobalFallback: true,
        };
    }

    return { cellEvents: [], matchedByRegion: false, isGlobalFallback: false };
}
