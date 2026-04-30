/**
 * guideExplanation.ts
 * U6: Guide / Explanation System
 *
 * Defines the GuideExplanation, GuideSuggestion, and GuideGlossaryHint types
 * for the local Guide / Explanation System.
 *
 * Principles:
 * - Guide is a TRANSLATOR of observation metrics — not a personality or emotion engine.
 * - No LLM / API dependency.
 * - No consciousness / emotion / intent claims.
 * - "AETERNA thinks / wants / feels" style expressions are FORBIDDEN.
 * - valueKind labels document the epistemic status of each glossary entry.
 *
 * Reference: docs/default-guide-principles.md
 * Reference: docs/scientific-ui-ux-principles.md
 */

// ── GuideSuggestion ────────────────────────────────────────────────────────────

/**
 * Which UI action a suggestion will trigger.
 * Guide actions affect UI presentation only — they do NOT modify runtime dynamics.
 */
export type GuideActionKind =
    | 'openPanel'
    | 'toggleLayer'
    | 'runScenario'
    | 'resetView'
    | 'switchViewMode';

/**
 * A single panel / layer / action suggestion produced by the guide.
 * The `action` field (if present) describes a UI-only operation.
 * Runtime dynamics are never modified by guide actions.
 */
export interface GuideSuggestion {
    /** Stable identifier */
    id: string;

    /** Human-readable label shown in the UI */
    label: string;

    /** Why this suggestion is relevant now (observation-based reason) */
    reason: string;

    /**
     * Which Research Panel tab to highlight / open.
     * Optional — only set when the suggestion targets a specific panel.
     */
    targetPanel?: string;

    /**
     * Which field layer to toggle.
     * Optional — only set when the suggestion targets a specific layer.
     */
    targetLayer?: string;

    /**
     * UI-only action to execute.
     * Affects DOM / display state only.
     * Does NOT modify field values, energy, trace, or return signals.
     */
    action?: GuideActionKind;
}

// ── GuideGlossaryHint ──────────────────────────────────────────────────────────

/**
 * Epistemic status of a glossary term's definition.
 * Mirrors OverviewValueKind for consistency.
 */
export type GuideTermValueKind =
    | 'measured'
    | 'derived'
    | 'proxy'
    | 'presentation-smoothed'
    | 'check';

/**
 * A short glossary entry for a term shown in the Guide Panel.
 * Definitions must be factual — no consciousness / emotion claims.
 */
export interface GuideGlossaryHint {
    /** The term being defined */
    term: string;

    /**
     * A short, neutral definition.
     * Forbidden: "AETERNA understands X", "X is how AETERNA feels", etc.
     */
    shortDefinition: string;

    /**
     * How the value represented by this term is produced.
     * Helps users understand whether they are looking at a measurement, a derived
     * quantity, an indirect proxy, or a presentation-level smoothed value.
     */
    valueKind?: GuideTermValueKind;
}

// ── GuideExplanation ───────────────────────────────────────────────────────────

/**
 * A complete guide explanation derived from the current observation snapshot.
 *
 * Produced by `deriveGuideExplanation` — rule-based, no LLM / API.
 *
 * Sections:
 *   currentExplanation  — What is currently happening (observation lines)
 *   whatToLookAt        — Panels / layers the user should check
 *   tryNext             — Operations the user can try next
 *   glossaryHints       — Short definitions of terms relevant to the current state
 *   integrityNotes      — Scientific honesty reminders
 *   confidence          — How much source data was available (0–1)
 */
export interface GuideExplanation {
    /** Wall-clock timestamp when this explanation was generated */
    timestamp: number;

    /**
     * 2–5 observation lines describing the current field state.
     * Each line is a neutral fact; no emotion / consciousness / intent claims.
     */
    currentExplanation: string[];

    /**
     * Suggested panels / layers to inspect right now.
     * Ordered by relevance (most relevant first).
     */
    whatToLookAt: GuideSuggestion[];

    /**
     * Operations the user can try next.
     * Framed as research / experiment actions, not "things AETERNA wants".
     */
    tryNext: GuideSuggestion[];

    /**
     * Short definitions for terms that are currently relevant.
     * Subset of the full glossary selected by guide rules.
     */
    glossaryHints: GuideGlossaryHint[];

    /**
     * Brief reminders about scientific integrity.
     * Always included; reminds users what the guide does and does not claim.
     */
    integrityNotes: string[];

    /**
     * Confidence in this explanation (0–1).
     * Low when source snapshot is sparse or metrics are missing.
     */
    confidence: number;
}
