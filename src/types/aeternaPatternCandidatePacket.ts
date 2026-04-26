/**
 * AeternaPatternCandidatePacket
 *
 * AETERNA Phase 8: AETERNA → Node bridge 最小版 — detailed candidate packet
 *
 * Optional detailed packet for per-candidate structural observations.
 * Separated from the main AeternaObservationPacket to keep summary packets
 * lightweight. Use when downstream receivers need per-candidate detail.
 *
 * Design constraints (same as AeternaObservationPacket):
 * - NO semantic labels, meanings, object identities, or concept nodes.
 * - NO same-object detection, teacher verdicts, or language.
 * - All values are derived/proxy — not confirmed structural facts.
 * - Packet is read-only: must NOT feed back into AETERNA core dynamics.
 * - AETERNA → Node direction only (one-way in this phase).
 */

/**
 * Per-candidate record for a proto-point candidate in the detailed packet.
 * Mirrors ProtoPointCandidate fields but omits observer-only lifecycle/ID
 * details not needed by the downstream Node receiver.
 *
 * Forbidden fields: label, meaning, concept, sameObject, objectId,
 * teacherVerdict, language, utterance.
 */
export interface AeternaProtoPointCandidateEntry {
  /** Observer-side candidate ID (opaque string, not a semantic identifier). */
  candidateId: string;

  /**
   * Rough locality proxy identifier on the torus life-field.
   * e.g. "proxy-recurrence-dominant" — NOT a semantic label.
   */
  regionId: string | null;

  /** Observer-side persistence counter (ticks above threshold). */
  persistence: number;

  /**
   * How much this region repeatedly re-activates.
   * [PROXY] Range 0–1.
   */
  recurrenceScore: number;

  /**
   * Overlap with trace/residue patterns.
   * [PROXY] Range 0–1.
   */
  traceAffinity: number;

  /**
   * Replay accessibility proxy.
   * [PROXY] Range 0–1.
   */
  replayAffinity: number;

  /**
   * How much this region stands out from ambient field context.
   * [PROXY] Range 0–1.
   */
  localContrast: number;

  /**
   * Composite observer confidence.
   * [DERIVED/PROXY — not a probability] Range 0–1.
   */
  confidence: number;
}

/**
 * Per-candidate record for a knot candidate in the detailed packet.
 *
 * Forbidden fields: label, meaning, concept, sameObject, objectId,
 * teacherVerdict, language, utterance.
 */
export interface AeternaKnotCandidateEntry {
  /** Observer-side candidate ID (opaque string, not a semantic identifier). */
  candidateId: string;

  /**
   * Rough locality proxy identifier.
   * NOT a semantic label.
   */
  regionId: string | null;

  /** Observer-side persistence counter. */
  persistence: number;

  /**
   * Recurrence activation proxy.
   * [PROXY] Range 0–1.
   */
  recurrenceScore: number;

  /**
   * Composite observer confidence.
   * [DERIVED/PROXY] Range 0–1.
   */
  confidence: number;
}

/**
 * Detailed per-candidate observation packet.
 *
 * Use when summary counts in AeternaObservationPacket are insufficient
 * and the Node side needs individual candidate details.
 *
 * This packet is heavier than AeternaObservationPacket. Generate only
 * when the downstream Node receiver has opted in to detailed observations.
 */
export interface AeternaPatternCandidatePacket {
  /** Unix-like timestamp or frame tick at packet generation. */
  timestamp: number;

  /** Always 'aeterna' — identifies the packet origin. */
  source: 'aeterna';

  /**
   * Detailed proto-point candidate list.
   * Observer-side only. NOT semantic nodes. NOT passed to any teacher.
   */
  protoPointCandidates: AeternaProtoPointCandidateEntry[];

  /**
   * Detailed knot candidate list (optional).
   * Observer-side only.
   */
  knotCandidates?: AeternaKnotCandidateEntry[];

  /** Packet format version string. */
  packetVersion?: string;
}
