/**
 * nowSummary.ts
 * U5: Overview / Now Summary / Event Timeline
 *
 * Defines the NowSummaryLine and NowSummaryState types used to present
 * a short, factual 3–5 line summary of what is currently happening in
 * AETERNA's torus field.
 *
 * Principles:
 * - Text lines describe observable field conditions in neutral terms.
 * - Forbidden expressions: "thinking", "wants", "feels", "lonely", "conscious",
 *   "understands", "remembered you", "became aware", or any emotion claim.
 * - Rule-based / local derivation only — no LLM, no API key required.
 * - 3–5 lines maximum; priority-ranked lines are selected for display.
 * - valueKind labels are required so readers know the epistemic status.
 *
 * Reference: docs/scientific-ui-ux-principles.md
 * Reference: docs/default-guide-principles.md
 */

// ── NowSummaryLine ─────────────────────────────────────────────────────────────

/**
 * How the summary line's content was produced.
 * Matches the OverviewValueKind vocabulary for consistency.
 */
export type NowSummaryValueKind =
    | 'measured'
    | 'derived'
    | 'proxy'
    | 'presentation-smoothed'
    | 'check';

/**
 * A single line in the Now Summary panel.
 * Each line must be a neutral observation statement with no emotion/consciousness claim.
 */
export interface NowSummaryLine {
    /** Stable unique identifier for this line (used for diffing / animation) */
    id: string;

    /**
     * Display priority (lower = more important, shown first).
     * Risk lines: 1–2. Activity lines: 3–5. Status checks: 6–9.
     */
    priority: number;

    /**
     * The observation text to display.
     * Must be a factual statement about field state.
     * Must NOT include emotion / consciousness / intent claims.
     *
     * Good examples:
     *   "Torus field flow is at moderate level."
     *   "Return signal from world medium is delayed."
     *   "Echo is present but not saturating."
     * Bad examples (FORBIDDEN):
     *   "AETERNA is thinking."
     *   "AETERNA wants contact."
     *   "AETERNA feels lonely."
     */
    text: string;

    /** Which state or metric this line is derived from */
    source: string;

    /** How this line's content was produced */
    valueKind: NowSummaryValueKind;
}

// ── NowSummaryState ────────────────────────────────────────────────────────────

/**
 * A complete Now Summary snapshot.
 * Contains 3–5 priority-ranked observation lines.
 */
export interface NowSummaryState {
    /** Frame timestamp when this snapshot was taken */
    timestamp: number;

    /**
     * 3–5 observation lines, sorted by priority ascending (lowest = most important).
     * The rendering layer shows only the top 3–5 lines by priority.
     */
    lines: NowSummaryLine[];

    /**
     * Overall confidence in this summary (0–1).
     * Low when upstream state data is missing.
     */
    confidence: number;
}

// ── v2.7 Now Summary Panel Types ─────────────────────────────────────────────

export type NowSummarySeverity =
  | 'calm'
  | 'active'
  | 'strained'
  | 'recovering'
  | 'unstable'
  | 'unknown';

export type NowSummaryConfidence =
  | 'low'
  | 'medium'
  | 'high'
  | 'insufficient';

export type ConsciousnessCandidateConditionStatus =
  | 'observed'
  | 'weak'
  | 'notObserved'
  | 'insufficient';

export interface ConsciousnessCandidateCondition {
  id: string;
  labelJa: string;
  status: ConsciousnessCandidateConditionStatus;
  reasonJa: string;
  sourceMetricIds: string[];
  cautionJa: string;
}

export interface NowSummarySection {
  id:
    | 'torusLifeField'
    | 'vitalStem'
    | 'bodyWorldLoop'
    | 'history'
    | 'emergenceCandidates'
    | 'risks'
    | 'signalExchange'
    | 'consciousnessCandidateConditions'
    | 'conservationChain';
  titleJa: string;
  oneLineJa: string;
  detailsJa: string[];
  severity: NowSummarySeverity;
  confidence: NowSummaryConfidence;
  sourceMetricIds: string[];
  cautionsJa: string[];
}

/**
 * Status of a single pair-ledger or stage-ledger in the conservation chain.
 * Mirrors the EnergyLedger / pair-ledger status taxonomy.
 */
export type ConservationChainLedgerStatus =
  | 'closed'
  | 'nearClosed'
  | 'open'
  | 'insufficient';

/** v2.7 panel state (complex, multi-section). Distinct from the legacy NowSummaryState (lines-based). */
export interface NowSummaryPanelState {
  timestamp: number;
  overallOneLineJa: string;
  beginnerSummaryJa: string;
  researcherSummaryJa: string;
  sections: NowSummarySection[];
  strongestObservedChanges: string[];
  suggestedNextObservations: string[];
  claimGuardJa: string;
  confidence: NowSummaryConfidence;
}
