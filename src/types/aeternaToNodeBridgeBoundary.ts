/**
 * AeternaToNodeBridgeBoundary
 *
 * AETERNA Phase 8: AETERNA → Node bridge 最小版 — boundary definition
 *
 * This type and the constants below define the formal boundary between
 * AETERNA (observer/field side) and the Node side (future structural
 * interpretation side).
 *
 * Key rules:
 * 1. AETERNA → Node is the only direction in this phase.
 * 2. Node → AETERNA feedback is NOT implemented here.
 * 3. AETERNA sends pre-semantic observation only.
 * 4. Node side is responsible for any structural interpretation.
 */

/**
 * Fields that are ALLOWED in an AeternaObservationPacket.
 *
 * Any field not in this list must be rejected by the sanitizer.
 */
export const AETERNA_PACKET_ALLOWED_FIELDS = [
  'timestamp',
  'source',
  'fieldState',
  'patternCandidates',
  'pressureState',
  'traceState',
  'confidence',
  'longCycleCoherenceShift',
  'packetVersion',
] as const;

/**
 * Fields that are FORBIDDEN in any AETERNA → Node packet.
 *
 * These fields must never appear in a packet. If found, the sanitizer
 * will strip them and optionally increment a semantic leak counter.
 */
export const AETERNA_PACKET_FORBIDDEN_FIELDS = [
  'label',
  'meaning',
  'concept',
  'category',
  'sameObject',
  'objectId',
  'teacherVerdict',
  'language',
  'utterance',
  'semanticNode',
  'objectLabel',
  'teacherBinding',
  'nodeBridge',
  'naturalLanguage',
  'interpretation',
] as const;

export type AeternaPacketAllowedField = (typeof AETERNA_PACKET_ALLOWED_FIELDS)[number];
export type AeternaPacketForbiddenField = (typeof AETERNA_PACKET_FORBIDDEN_FIELDS)[number];

/**
 * Formal boundary specification for AETERNA → Node packet exchange.
 *
 * This type exists as documentation-in-code: the constraints are enforced
 * by sanitizeAeternaObservationPacket.
 */
export interface AeternaToNodeBridgeBoundary {
  /**
   * Packet direction: always AETERNA → Node in this phase.
   * Node → AETERNA feedback is reserved for a future phase.
   */
  direction: 'aeterna-to-node';

  /**
   * Fields that may be present in a packet crossing this boundary.
   */
  allowedFields: readonly string[];

  /**
   * Fields that must never appear in a packet crossing this boundary.
   * These carry semantic content that AETERNA must not produce.
   */
  forbiddenFields: readonly string[];

  /**
   * Packet must be read-only: receiving side must not write back to AETERNA.
   */
  readOnly: true;

  /**
   * No semantic guarantee: packets contain pre-semantic observations only.
   * The Node side must not treat a packet as a semantic claim.
   */
  noSemanticGuarantee: true;

  /**
   * No direct feedback rule: this packet must not directly modify AETERNA
   * organism dynamics.
   */
  noDirectFeedback: true;
}

/**
 * Singleton boundary spec used by the sanitizer.
 */
export const AETERNA_TO_NODE_BOUNDARY: AeternaToNodeBridgeBoundary = {
  direction: 'aeterna-to-node',
  allowedFields: AETERNA_PACKET_ALLOWED_FIELDS,
  forbiddenFields: AETERNA_PACKET_FORBIDDEN_FIELDS,
  readOnly: true,
  noSemanticGuarantee: true,
  noDirectFeedback: true,
};
