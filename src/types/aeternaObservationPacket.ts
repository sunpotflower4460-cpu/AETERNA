/**
 * AeternaObservationPacket
 *
 * AETERNA Phase 8: AETERNA → Node bridge 最小版
 *
 * A pre-semantic observation packet that carries field-state measurements,
 * structural pattern candidate counts, pressure tendencies, and trace/replay
 * indicators from the AETERNA torus life-field to a downstream Node receiver.
 *
 * Design constraints:
 * - NO semantic labels, meanings, object identities, or concept nodes.
 * - NO same-object detection, teacher verdicts, or language interpretation.
 * - All values are derived/proxy — not confirmed structural facts.
 * - Packet is read-only: it must NOT feed back into AETERNA core dynamics.
 * - Node bridge is strictly AETERNA → Node (one-way in this phase).
 *
 * What this packet is:
 *   A compressed, sanitized summary of pre-semantic field observations.
 *   AETERNA exports observation; Node side is responsible for any later
 *   structural interpretation or meaning-making.
 *
 * What this packet is NOT:
 *   A semantic node, a memory item, an object description,
 *   or a claim about what anything "means".
 */

/** Packet format version string for forward-compatibility tracking. */
export const AETERNA_PACKET_VERSION = '0.1.0';

/**
 * Pre-semantic observation packet from the AETERNA torus life-field.
 *
 * Forbidden fields (must never be present):
 *   label, meaning, concept, category, sameObject, objectId,
 *   teacherVerdict, language, utterance.
 */
export interface AeternaObservationPacket {
  /** Unix-like timestamp or frame tick at packet generation. */
  timestamp: number;

  /** Always 'aeterna' — identifies the packet origin. */
  source: 'aeterna';

  /**
   * Current life-field state summary.
   * All values are derived proxies from existing organism state.
   */
  fieldState: {
    /**
     * Composite proxy for sustained, non-collapsed ongoing activity.
     * [PROXY — derived from collapseRate, saturationRate, quietBaselineFloor]
     * Range: 0–1; higher = field is more persistently alive.
     */
    ongoingness: number;

    /**
     * Structural stability of the current field configuration.
     * [PROXY — derived from competitionStability and homeostaticStability]
     * Range: 0–1.
     */
    stability: number;

    /**
     * Temporal variability / fluctuation level of the field.
     * [PROXY — derived from activity variance and arousal dynamics]
     * Range: 0–1.
     */
    volatility: number;

    /**
     * Integrity of the organism boundary / self-preservation pressure.
     * [PROXY — from boundaryIntegrity]
     * Range: 0–1.
     */
    boundaryIntegrity: number;

    /**
     * Current recovery pressure in the field.
     * [PROXY — from recoveryState.recoveryPressure]
     * Range: 0–1.
     */
    recoveryPressure: number;

    /**
     * Risk of collapse into silence.
     * [PROXY — from recoveryState.collapseRisk or homeostaticState.collapseRisk]
     * Range: 0–1; higher = greater collapse risk.
     */
    collapseRisk: number;
  };

  /**
   * Summary counts of structural pattern candidates observed in the field.
   * These are proxy counts — not confirmed structures.
   */
  patternCandidates: {
    /** Proxy count of locally recurring activity clusters. */
    knotCount: number;
    /** Proxy count of flow-path candidates. */
    pathCount: number;
    /** Proxy count of regions that re-activate across events. */
    recurrenceLocusCount: number;
    /** Proxy count of stable-return zone candidates. */
    basinCount: number;
    /** Proxy count of persistent field deviations surviving recovery. */
    longLivedAnomalyCount: number;
    /** Proxy count of field regions accumulating multiple observation criteria. */
    protoPointCandidateCount: number;
  };

  /**
   * Pre-semantic pressure state.
   * Derived from need/motivation tendencies — not goals or intentions.
   */
  pressureState: {
    /** Boundary-maintenance / overload-protection pressure. Range: 0–1.2. */
    safetyPressure: number;
    /** Recovery / settling / repair tendency. Range: 0–1. */
    restorationPressure: number;
    /** Tendency toward unfamiliar / new patterns. Range: 0–1. */
    noveltyPressure: number;
    /** Tendency toward familiar / known patterns. Range: 0–1. */
    repetitionPressure: number;
    /** Tendency to probe / orient / engage. Range: 0–1. */
    explorationPressure: number;
    /** Tendency to pull back / dampen / protect. Range: 0–1. */
    withdrawalPressure: number;
  };

  /**
   * Trace and replay state summary.
   * Residue / replay tendencies in the field — not semantic memory.
   */
  traceState: {
    /** Overall residue currently remaining in the field. Range: 0–1. */
    traceStrength: number;
    /** Whether replay-like re-activation is likely. Range: 0–1. */
    replayReadiness: number;
    /** How much repeated patterns become easier to re-enter. Range: 0–1. */
    recurrenceWeight: number;
    /** Residue left by salient mismatch / disturbance. Range: 0–1. */
    salienceResidue: number;
  };

  /**
   * Composite confidence of this observation packet.
   * NOT semantic confidence — measures observation stability.
   * Derived from: ongoingness level, NaN absence, boundaryIntegrity health,
   * moderate candidate confidence, long-run consistency.
   * Range: 0–1; 1 = stable, finite, consistent observation.
   * [DERIVED/PROXY — not a probability]
   */
  confidence?: number;

  /**
   * Long-cycle coherence shift (optional).
   * Slow drift in field coherence across many ticks.
   * [PROXY — from phaseCoherence trend if available]
   * Range: -1 to +1; positive = coherence rising, negative = coherence falling.
   */
  longCycleCoherenceShift?: number;

  /** Packet format version string. */
  packetVersion?: string;
}
