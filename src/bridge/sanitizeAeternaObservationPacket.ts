/**
 * sanitizeAeternaObservationPacket
 *
 * AETERNA Phase 8: AETERNA → Node bridge 最小版 — packet sanitizer
 *
 * Validates and sanitizes an AeternaObservationPacket before it is
 * passed to the Node side. This ensures:
 *
 * 1. No forbidden semantic fields are present.
 * 2. All numeric values are finite (no NaN / Infinity).
 * 3. Values are clamped to valid ranges.
 * 4. packetVersion is attached.
 *
 * Design:
 * - Pure function (no side effects, no mutation of input)
 * - Returns a sanitized copy; never modifies input in place
 * - Returns a SanitizeResult containing the clean packet and diagnostics
 * - Does NOT send packets anywhere — caller decides what to do with them
 *
 * Forbidden fields:
 *   label, meaning, concept, category, sameObject, objectId,
 *   teacherVerdict, language, utterance, semanticNode, objectLabel,
 *   teacherBinding, nodeBridge, naturalLanguage, interpretation
 */

import type { AeternaObservationPacket } from '../types/aeternaObservationPacket.js';
import { AETERNA_PACKET_VERSION } from '../types/aeternaObservationPacket.js';
import { AETERNA_PACKET_FORBIDDEN_FIELDS } from '../types/aeternaToNodeBridgeBoundary.js';

/** Result of the sanitization process. */
export interface SanitizeResult {
  /** The sanitized packet, safe for passing to the Node side. */
  packet: AeternaObservationPacket;

  /**
   * Names of forbidden fields that were found and stripped.
   * Empty array = clean packet (no semantic leak).
   * Non-empty = semantic leak was detected and removed.
   */
  forbiddenFieldsFound: string[];

  /**
   * Names of fields where NaN or Infinity was replaced with 0.
   * Empty array = all values were finite.
   */
  nonFiniteFieldsFixed: string[];

  /**
   * True if the packet was clean (no forbidden fields, no non-finite values).
   */
  isClean: boolean;

  /**
   * Semantic leak count for this packet.
   * 0 = no semantic content detected.
   * > 0 = forbidden fields were found and stripped (semantic leak).
   */
  semanticLeakCount: number;
}

/**
 * Clamp a number to [min, max]. Replace NaN/Infinity with `fallback`.
 * Used internally for input validation; exposed for testing.
 */
export function safeClamp(v: unknown, min: number, max: number, fallback = 0): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

/**
 * Sanitize a numeric field of a flat object in place.
 * Returns the field path if the value was non-finite and replaced.
 */
function sanitizeNumeric(
  obj: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  paths: string[],
  pathPrefix = '',
): void {
  const v = obj[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    obj[key] = 0;
    paths.push(pathPrefix ? `${pathPrefix}.${key}` : key);
  } else {
    obj[key] = Math.max(min, Math.min(max, v));
  }
}

/**
 * Recursively strip forbidden fields from an object (deep scan).
 * Returns list of forbidden field names found.
 */
function stripForbiddenFields(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any>,
  forbidden: readonly string[],
  found: string[],
): void {
  for (const key of Object.keys(obj)) {
    if ((forbidden as readonly string[]).includes(key)) {
      found.push(key);
      delete obj[key];
    } else if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      stripForbiddenFields(obj[key] as Record<string, unknown>, forbidden, found);
    }
  }
}

/**
 * Sanitize an AeternaObservationPacket.
 *
 * Returns a SanitizeResult with the cleaned packet and diagnostics.
 * Input packet is never modified.
 */
export function sanitizeAeternaObservationPacket(
  raw: AeternaObservationPacket,
): SanitizeResult {
  // Deep clone to avoid mutating input
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packet: AeternaObservationPacket = JSON.parse(JSON.stringify(raw)) as any;

  const forbiddenFieldsFound: string[] = [];
  const nonFiniteFieldsFixed: string[] = [];

  // 1. Strip forbidden semantic fields (deep scan)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stripForbiddenFields(packet as unknown as Record<string, any>, AETERNA_PACKET_FORBIDDEN_FIELDS, forbiddenFieldsFound);

  // 2. Enforce source
  packet.source = 'aeterna';

  // 3. Sanitize timestamp
  if (!Number.isFinite(packet.timestamp)) {
    packet.timestamp = 0;
    nonFiniteFieldsFixed.push('timestamp');
  }

  // 4. Sanitize fieldState
  if (packet.fieldState && typeof packet.fieldState === 'object') {
    const fs = packet.fieldState as Record<string, unknown>;
    for (const key of ['ongoingness', 'stability', 'volatility', 'boundaryIntegrity', 'recoveryPressure']) {
      sanitizeNumeric(fs, key, 0, 1, nonFiniteFieldsFixed, 'fieldState');
    }
    sanitizeNumeric(fs, 'collapseRisk', 0, 1, nonFiniteFieldsFixed, 'fieldState');
  } else {
    // Provide safe defaults if missing
    packet.fieldState = {
      ongoingness: 0,
      stability: 0,
      volatility: 0,
      boundaryIntegrity: 0,
      recoveryPressure: 0,
      collapseRisk: 0,
    };
    nonFiniteFieldsFixed.push('fieldState (missing)');
  }

  // 5. Sanitize patternCandidates
  if (packet.patternCandidates && typeof packet.patternCandidates === 'object') {
    const pc = packet.patternCandidates as Record<string, unknown>;
    for (const key of [
      'knotCount', 'pathCount', 'recurrenceLocusCount',
      'basinCount', 'longLivedAnomalyCount', 'protoPointCandidateCount',
    ]) {
      sanitizeNumeric(pc, key, 0, 1000, nonFiniteFieldsFixed, 'patternCandidates');
    }
  } else {
    packet.patternCandidates = {
      knotCount: 0,
      pathCount: 0,
      recurrenceLocusCount: 0,
      basinCount: 0,
      longLivedAnomalyCount: 0,
      protoPointCandidateCount: 0,
    };
    nonFiniteFieldsFixed.push('patternCandidates (missing)');
  }

  // 6. Sanitize pressureState
  if (packet.pressureState && typeof packet.pressureState === 'object') {
    const ps = packet.pressureState as Record<string, unknown>;
    for (const key of [
      'restorationPressure', 'noveltyPressure', 'repetitionPressure',
      'explorationPressure', 'withdrawalPressure',
    ]) {
      sanitizeNumeric(ps, key, 0, 1, nonFiniteFieldsFixed, 'pressureState');
    }
    // safetyPressure has a slightly wider range (0–1.2)
    sanitizeNumeric(ps, 'safetyPressure', 0, 1.2, nonFiniteFieldsFixed, 'pressureState');
  } else {
    packet.pressureState = {
      safetyPressure: 0,
      restorationPressure: 0,
      noveltyPressure: 0,
      repetitionPressure: 0,
      explorationPressure: 0,
      withdrawalPressure: 0,
    };
    nonFiniteFieldsFixed.push('pressureState (missing)');
  }

  // 7. Sanitize traceState
  if (packet.traceState && typeof packet.traceState === 'object') {
    const ts = packet.traceState as Record<string, unknown>;
    for (const key of ['traceStrength', 'replayReadiness', 'recurrenceWeight', 'salienceResidue']) {
      sanitizeNumeric(ts, key, 0, 1, nonFiniteFieldsFixed, 'traceState');
    }
  } else {
    packet.traceState = {
      traceStrength: 0,
      replayReadiness: 0,
      recurrenceWeight: 0,
      salienceResidue: 0,
    };
    nonFiniteFieldsFixed.push('traceState (missing)');
  }

  // 8. Sanitize optional confidence
  if (packet.confidence !== undefined) {
    if (!Number.isFinite(packet.confidence)) {
      packet.confidence = 0;
      nonFiniteFieldsFixed.push('confidence');
    } else {
      packet.confidence = Math.max(0, Math.min(1, packet.confidence));
    }
  }

  // 9. Sanitize optional longCycleCoherenceShift
  if (packet.longCycleCoherenceShift !== undefined) {
    if (!Number.isFinite(packet.longCycleCoherenceShift)) {
      delete packet.longCycleCoherenceShift;
      nonFiniteFieldsFixed.push('longCycleCoherenceShift');
    } else {
      packet.longCycleCoherenceShift = Math.max(-1, Math.min(1, packet.longCycleCoherenceShift));
    }
  }

  // 10. Attach packetVersion
  packet.packetVersion = AETERNA_PACKET_VERSION;

  const isClean = forbiddenFieldsFound.length === 0 && nonFiniteFieldsFixed.length === 0;

  return {
    packet,
    forbiddenFieldsFound,
    nonFiniteFieldsFixed,
    isClean,
    semanticLeakCount: forbiddenFieldsFound.length,
  };
}

/**
 * Convenience: sanitize and return only the clean packet.
 * Throws if semanticLeakCount > 0 (strict mode).
 *
 * Prefer sanitizeAeternaObservationPacket for normal use; this helper
 * is for tests and strict validation contexts.
 */
export function sanitizeStrictOrThrow(raw: AeternaObservationPacket): AeternaObservationPacket {
  const result = sanitizeAeternaObservationPacket(raw);
  if (result.semanticLeakCount > 0) {
    throw new Error(
      `AeternaObservationPacket semantic leak detected: ${result.forbiddenFieldsFound.join(', ')}`,
    );
  }
  return result.packet;
}
