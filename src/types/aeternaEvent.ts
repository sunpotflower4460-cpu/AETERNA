/**
 * aeternaEvent.ts
 * U5: Overview / Now Summary / Event Timeline
 *
 * Defines the AeternaEvent and AeternaEventKind types for the Event Timeline
 * and Event Strip. Events are fact-based observations — not narrative claims.
 *
 * Principles:
 * - Events describe observed state transitions or threshold crossings.
 * - Forbidden event text: "AETERNA wanted to respond", "AETERNA remembered",
 *   "AETERNA understood", "AETERNA felt unstable", or any emotion/intent claim.
 * - Events are derived from existing runtime state — no fake events are created.
 * - valueKind labels the epistemic status of each event.
 *
 * Reference: docs/scientific-ui-ux-principles.md §3
 */

// ── AeternaEventKind ───────────────────────────────────────────────────────────

/**
 * Taxonomy of observable event kinds in AETERNA.
 * Each kind maps to a specific measurable state transition or threshold crossing.
 */
export type AeternaEventKind =
    | 'actuationPulse'                  // Actuation pulse observed / changed
    | 'worldMediumChange'               // World medium echo or resistance changed
    | 'sensoryReturn'                   // Sensory return packet detected
    | 'reafferenceComparison'           // Reafference mismatch changed
    | 'closureMetricChange'             // Closure stability or loop gain changed
    | 'mediumProfileChange'             // Medium delay / echo / resistance profile changed
    | 'localExcitabilityShift'          // Local excitability shifted in one or more regions
    | 'repeatedFlowPathObserved'        // Repeated flow path candidate observed
    | 'protoNetworkCandidateObserved'   // Proto-network candidate observed
    | 'riskChange'                      // Saturation or extinction risk changed significantly
    | 'semanticLeakCheck'               // Semantic leak integrity check result
    | 'diagnosticWarning';              // NaN / Infinity / coverage / other diagnostic

// ── AeternaEvent ──────────────────────────────────────────────────────────────

/**
 * Severity levels for an event.
 * - 'info'    : Routine observation, no concern
 * - 'notice'  : Notable state change, worth tracking
 * - 'warning' : Risk threshold crossed, research attention advised
 */
export type AeternaEventSeverity = 'info' | 'notice' | 'warning';

/**
 * How the event's trigger value was produced.
 */
export type AeternaEventValueKind = 'measured' | 'derived' | 'proxy' | 'check';

/**
 * A single observed event in AETERNA's field history.
 * Used in the Event Timeline and Event Strip.
 */
export interface AeternaEvent {
    /**
     * Unique identifier for this event.
     * Format: "{kind}-{tick}-{index}" e.g. "actuationPulse-120-0"
     */
    id: string;

    /** Simulation tick at which this event was observed */
    tick: number;

    /** Wall-clock timestamp (Date.now()) when this event was recorded */
    timestamp: number;

    /** What kind of observation this event represents */
    kind: AeternaEventKind;

    /** How significant this event is */
    severity: AeternaEventSeverity;

    /**
     * Short, neutral observation text.
     * Must NOT include emotion / consciousness / intent claims.
     *
     * Good: "tick 120: Actuation pulse observed"
     * Good: "tick 140: Sensory return detected"
     * Forbidden: "AETERNA wanted to respond"
     * Forbidden: "AETERNA remembered a path"
     */
    text: string;

    /** Which state or observer this event originates from */
    source: string;

    /** Epistemic status of the triggering value */
    valueKind: AeternaEventValueKind;
}
