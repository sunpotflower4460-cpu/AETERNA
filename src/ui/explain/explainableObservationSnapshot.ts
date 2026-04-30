/**
 * explainableObservationSnapshot.ts
 * U5: Overview / Now Summary / Event Timeline
 *
 * Defines the ExplainableObservationSnapshot type — a bundled snapshot of
 * current overview, summary, and recent events intended for the Guide /
 * Explanation System (U6).
 *
 * U5 only PREPARES this interface. U6 will implement the actual guide logic.
 * No LLM calls are made here.
 *
 * Principles:
 * - Snapshot is read-only — does NOT modify any runtime state.
 * - Used as input to local guide rules in U6.
 * - No LLM / API dependency.
 *
 * Reference: docs/default-guide-principles.md
 */

import type { OverviewState } from '../../types/overviewState.ts';
import type { NowSummaryState } from '../../types/nowSummary.ts';
import type { AeternaEvent } from '../../types/aeternaEvent.ts';

// ── ExplainableObservationSnapshot ─────────────────────────────────────────────

/**
 * A bundled snapshot of observable state for use by the Guide / Explanation
 * System (U6).
 *
 * Contains:
 * - overview:      Current OverviewState (metric cards + overall status)
 * - nowSummary:    Current NowSummaryState (3–5 line observation summary)
 * - recentEvents:  Most recent AeternaEvent entries (newest first)
 *
 * Usage (U6 will read this):
 *   const snapshot = buildExplainableSnapshot(overview, nowSummary, recentEvents);
 *   // U6 guide rules will use snapshot to generate local explanations
 */
export interface ExplainableObservationSnapshot {
    /** Current overview metric state (may be null if not yet derived) */
    overview: OverviewState | null;

    /** Current Now Summary (may be null if not yet derived) */
    nowSummary: NowSummaryState | null;

    /**
     * Most recent observed events (newest first).
     * Slice to the desired depth before passing to guide rules.
     */
    recentEvents: AeternaEvent[];

    /** Wall-clock timestamp of this snapshot */
    timestamp: number;
}

// ── Builder ────────────────────────────────────────────────────────────────────

/**
 * Assemble an ExplainableObservationSnapshot from the current observation state.
 *
 * @param overview      Current OverviewState (or null)
 * @param nowSummary    Current NowSummaryState (or null)
 * @param recentEvents  Recent AeternaEvent array (newest first)
 */
export function buildExplainableSnapshot(
    overview: OverviewState | null,
    nowSummary: NowSummaryState | null,
    recentEvents: AeternaEvent[]
): ExplainableObservationSnapshot {
    return {
        overview,
        nowSummary,
        recentEvents: [...recentEvents],
        timestamp: Date.now(),
    };
}
