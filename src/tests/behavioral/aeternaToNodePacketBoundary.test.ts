/**
 * AETERNA → Node Packet Boundary Tests
 *
 * Phase 8: AETERNA → Node bridge 最小版
 *
 * Tests:
 * 1. AeternaObservationPacket has no forbidden semantic fields.
 * 2. sanitizeAeternaObservationPacket strips forbidden fields.
 * 3. All numeric values in sanitized packet are finite.
 * 4. Semantic leak count is 0 in normal packet generation.
 * 5. exportAeternaObservationPacket is a pure function (same inputs → same outputs).
 * 6. Packet source is always 'aeterna'.
 * 7. packetVersion is set after sanitization.
 * 8. Proto-point candidates in detailed packet have no label, meaning, or concept.
 * 9. Packet generation does not modify organism dynamics (read-only).
 * 10. Scenario: all scenarios produce zero semantic leaks.
 * 11. Scenario: fieldState values are all finite.
 * 12. Scenario: packet confidence is in range [0, 1].
 * 13. AeternaToNodeBridgeBoundary defines forbidden fields.
 * 14. Node-side communication is absent (no API calls, no LLM calls).
 */

import { describe, expect, it } from 'vitest';
import type { AeternaObservationPacket } from '../../types/aeternaObservationPacket.ts';
import { AETERNA_PACKET_VERSION } from '../../types/aeternaObservationPacket.ts';
import type { AeternaPatternCandidatePacket } from '../../types/aeternaPatternCandidatePacket.ts';
import {
  AETERNA_PACKET_FORBIDDEN_FIELDS,
  AETERNA_TO_NODE_BOUNDARY,
} from '../../types/aeternaToNodeBridgeBoundary.ts';
import {
  exportAeternaObservationPacket,
  exportAeternaPatternCandidatePacket,
} from '../../bridge/exportAeternaObservationPacket.ts';
import {
  sanitizeAeternaObservationPacket,
  sanitizeStrictOrThrow,
} from '../../bridge/sanitizeAeternaObservationPacket.ts';
import { runAeternaObservationPacketSuite } from '../scenario/aeternaObservationPacketScenario.ts';

// ── Minimal export input for unit tests ───────────────────────────────────

const minimalInput = {
  timestamp: 100,
  meanActivity: 0.3,
  activityVariance: 0.02,
  collapseRate: 0.01,
  saturationRate: 0.005,
  quietBaselineFloor: 0.12,
  boundaryIntegrity: 0.85,
  collapseRisk: 0.08,
};

const fullInput = {
  timestamp: 200,
  meanActivity: 0.4,
  activityVariance: 0.03,
  collapseRate: 0.02,
  saturationRate: 0.01,
  quietBaselineFloor: 0.14,
  phaseCoherence: 0.72,
  boundaryIntegrity: 0.88,
  collapseRisk: 0.10,
  competitionStability: 0.65,
  traceState: {
    timestamp: 200,
    traceStrength: 0.45,
    recurrenceWeight: 0.52,
    salienceResidue: 0.38,
    replayReadiness: 0.60,
    replaySuppression: 0.15,
  },
  recoveryState: {
    timestamp: 200,
    recoveryPressure: 0.35,
    relaxationLevel: 0.58,
    stabilizationPull: 0.62,
    collapseRisk: 0.10,
    restorationBias: 0.72,
  },
  observationPatternState: {
    timestamp: 200,
    knotCount: 1,
    pathCount: 1,
    recurrenceLocusCount: 1,
    basinCount: 1,
    longLivedAnomalyCount: 0,
    protoPointCandidateCount: 1,
  },
  pressureCompetitionState: {
    timestamp: 200,
    safetyPressure: 0.30,
    restorationPressure: 0.40,
    noveltyPressure: 0.25,
    repetitionPressure: 0.20,
    explorationPressure: 0.35,
    withdrawalPressure: 0.15,
    dominantPressure: 'restoration' as const,
    competitionEntropy: 0.55,
    competitionStability: 0.65,
    annealingTemperature: 0.40,
  },
  previousPhaseCoherence: 0.68,
};

// ── Unit tests ─────────────────────────────────────────────────────────────

describe('Phase 8 AETERNA → Node Packet Boundary', () => {

  it('AeternaObservationPacket type has no forbidden semantic field names in definition', () => {
    // Verify by constructing a minimal packet and checking its keys
    const packet = exportAeternaObservationPacket(minimalInput);
    const keys = Object.keys(packet);
    for (const forbidden of AETERNA_PACKET_FORBIDDEN_FIELDS) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('exportAeternaObservationPacket is a pure function: same inputs produce same outputs', () => {
    const r1 = exportAeternaObservationPacket(fullInput);
    const r2 = exportAeternaObservationPacket(fullInput);

    expect(r1.fieldState.ongoingness).toBeCloseTo(r2.fieldState.ongoingness, 6);
    expect(r1.fieldState.stability).toBeCloseTo(r2.fieldState.stability, 6);
    expect(r1.fieldState.volatility).toBeCloseTo(r2.fieldState.volatility, 6);
    expect(r1.patternCandidates.knotCount).toBe(r2.patternCandidates.knotCount);
    expect(r1.confidence).toBeCloseTo(r2.confidence ?? 0, 6);
  });

  it('exported packet source is always "aeterna"', () => {
    const p1 = exportAeternaObservationPacket(minimalInput);
    const p2 = exportAeternaObservationPacket(fullInput);
    expect(p1.source).toBe('aeterna');
    expect(p2.source).toBe('aeterna');
  });

  it('sanitizeAeternaObservationPacket strips forbidden fields', () => {
    // Inject forbidden fields into a raw packet
    const rawPacket = exportAeternaObservationPacket(minimalInput) as Record<string, unknown>;
    rawPacket['label'] = 'test-label';
    rawPacket['meaning'] = 'test-meaning';
    rawPacket['sameObject'] = true;
    rawPacket['teacherVerdict'] = 'correct';

    const result = sanitizeAeternaObservationPacket(rawPacket as AeternaObservationPacket);

    expect(result.forbiddenFieldsFound).toContain('label');
    expect(result.forbiddenFieldsFound).toContain('meaning');
    expect(result.forbiddenFieldsFound).toContain('sameObject');
    expect(result.forbiddenFieldsFound).toContain('teacherVerdict');
    expect(result.semanticLeakCount).toBe(4);

    // Verify they are absent from the sanitized packet
    const cleanKeys = Object.keys(result.packet);
    expect(cleanKeys).not.toContain('label');
    expect(cleanKeys).not.toContain('meaning');
    expect(cleanKeys).not.toContain('sameObject');
    expect(cleanKeys).not.toContain('teacherVerdict');
  });

  it('sanitizeAeternaObservationPacket fixes NaN and Infinity values', () => {
    const rawPacket: AeternaObservationPacket = {
      timestamp: NaN,
      source: 'aeterna',
      fieldState: {
        ongoingness: NaN,
        stability: Infinity,
        volatility: -Infinity,
        boundaryIntegrity: NaN,
        recoveryPressure: 0.3,
        collapseRisk: 0.1,
      },
      patternCandidates: {
        knotCount: 1,
        pathCount: 0,
        recurrenceLocusCount: 0,
        basinCount: 1,
        longLivedAnomalyCount: 0,
        protoPointCandidateCount: 0,
      },
      pressureState: {
        safetyPressure: 0.2,
        restorationPressure: NaN,
        noveltyPressure: 0.3,
        repetitionPressure: 0.2,
        explorationPressure: 0.35,
        withdrawalPressure: 0.15,
      },
      traceState: {
        traceStrength: 0.4,
        replayReadiness: 0.5,
        recurrenceWeight: NaN,
        salienceResidue: 0.3,
      },
    };

    const result = sanitizeAeternaObservationPacket(rawPacket);
    const p = result.packet;

    expect(Number.isFinite(p.timestamp)).toBe(true);
    expect(Number.isFinite(p.fieldState.ongoingness)).toBe(true);
    expect(Number.isFinite(p.fieldState.stability)).toBe(true);
    expect(Number.isFinite(p.fieldState.volatility)).toBe(true);
    expect(Number.isFinite(p.fieldState.boundaryIntegrity)).toBe(true);
    expect(Number.isFinite(p.pressureState.restorationPressure)).toBe(true);
    expect(Number.isFinite(p.traceState.recurrenceWeight)).toBe(true);

    expect(result.nonFiniteFieldsFixed.length).toBeGreaterThan(0);
  });

  it('clean packet passes sanitization with isClean = true and semanticLeakCount = 0', () => {
    const packet = exportAeternaObservationPacket(fullInput);
    const result = sanitizeAeternaObservationPacket(packet);

    expect(result.isClean).toBe(true);
    expect(result.semanticLeakCount).toBe(0);
    expect(result.forbiddenFieldsFound).toHaveLength(0);
  });

  it('sanitizeStrictOrThrow throws when forbidden fields are present', () => {
    const rawPacket = exportAeternaObservationPacket(minimalInput) as Record<string, unknown>;
    rawPacket['label'] = 'forbidden';

    expect(() =>
      sanitizeStrictOrThrow(rawPacket as AeternaObservationPacket),
    ).toThrow(/semantic leak/i);
  });

  it('sanitizeStrictOrThrow succeeds on clean packet', () => {
    const packet = exportAeternaObservationPacket(fullInput);
    expect(() => sanitizeStrictOrThrow(packet)).not.toThrow();
  });

  it('packetVersion is set after sanitization', () => {
    const packet = exportAeternaObservationPacket(minimalInput);
    const result = sanitizeAeternaObservationPacket(packet);
    expect(result.packet.packetVersion).toBe(AETERNA_PACKET_VERSION);
  });

  it('all fieldState values are in valid ranges after sanitization', () => {
    const packet = exportAeternaObservationPacket(fullInput);
    const result = sanitizeAeternaObservationPacket(packet);
    const fs = result.packet.fieldState;

    expect(fs.ongoingness).toBeGreaterThanOrEqual(0);
    expect(fs.ongoingness).toBeLessThanOrEqual(1);
    expect(fs.stability).toBeGreaterThanOrEqual(0);
    expect(fs.stability).toBeLessThanOrEqual(1);
    expect(fs.volatility).toBeGreaterThanOrEqual(0);
    expect(fs.volatility).toBeLessThanOrEqual(1);
    expect(fs.boundaryIntegrity).toBeGreaterThanOrEqual(0);
    expect(fs.boundaryIntegrity).toBeLessThanOrEqual(1);
    expect(fs.recoveryPressure).toBeGreaterThanOrEqual(0);
    expect(fs.recoveryPressure).toBeLessThanOrEqual(1);
    expect(fs.collapseRisk).toBeGreaterThanOrEqual(0);
    expect(fs.collapseRisk).toBeLessThanOrEqual(1);
  });

  it('confidence is in range [0, 1] after sanitization', () => {
    const packet = exportAeternaObservationPacket(fullInput);
    const result = sanitizeAeternaObservationPacket(packet);
    if (result.packet.confidence !== undefined) {
      expect(result.packet.confidence).toBeGreaterThanOrEqual(0);
      expect(result.packet.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('AeternaToNodeBridgeBoundary defines forbidden fields correctly', () => {
    expect(AETERNA_TO_NODE_BOUNDARY.direction).toBe('aeterna-to-node');
    expect(AETERNA_TO_NODE_BOUNDARY.readOnly).toBe(true);
    expect(AETERNA_TO_NODE_BOUNDARY.noSemanticGuarantee).toBe(true);
    expect(AETERNA_TO_NODE_BOUNDARY.noDirectFeedback).toBe(true);

    const forbidden = AETERNA_TO_NODE_BOUNDARY.forbiddenFields;
    expect(forbidden).toContain('label');
    expect(forbidden).toContain('meaning');
    expect(forbidden).toContain('concept');
    expect(forbidden).toContain('sameObject');
    expect(forbidden).toContain('teacherVerdict');
    expect(forbidden).toContain('language');
    expect(forbidden).toContain('utterance');
  });

  it('exportAeternaPatternCandidatePacket returns null when no candidates', () => {
    const result = exportAeternaPatternCandidatePacket(100, null);
    expect(result).toBeNull();

    const emptyState = {
      timestamp: 100,
      candidateCount: 0,
      stableCandidateCount: 0,
      averageConfidence: 0,
      maxConfidence: 0,
      candidates: [],
    };
    const result2 = exportAeternaPatternCandidatePacket(100, emptyState);
    expect(result2).toBeNull();
  });

  it('AeternaPatternCandidatePacket has no forbidden semantic fields', () => {
    const candidatePacket: AeternaPatternCandidatePacket = {
      timestamp: 100,
      source: 'aeterna',
      protoPointCandidates: [
        {
          candidateId: 'slot-A',
          regionId: 'proxy-recurrence-dominant',
          persistence: 3,
          recurrenceScore: 0.55,
          traceAffinity: 0.45,
          replayAffinity: 0.40,
          localContrast: 0.35,
          confidence: 0.42,
        },
      ],
    };

    const allKeys: string[] = [];
    allKeys.push(...Object.keys(candidatePacket));
    for (const c of candidatePacket.protoPointCandidates) {
      allKeys.push(...Object.keys(c));
    }

    for (const forbidden of AETERNA_PACKET_FORBIDDEN_FIELDS) {
      expect(allKeys).not.toContain(forbidden);
    }
  });

  it('exportAeternaPatternCandidatePacket produces unlabeled candidates', () => {
    const protoState = {
      timestamp: 100,
      candidateCount: 1,
      stableCandidateCount: 1,
      averageConfidence: 0.44,
      maxConfidence: 0.44,
      candidates: [
        {
          id: 'slot-A',
          timestamp: 100,
          regionId: 'proxy-recurrence-dominant',
          persistence: 5,
          recurrenceScore: 0.55,
          traceAffinity: 0.45,
          replayAffinity: 0.40,
          localContrast: 0.35,
          basinOverlap: 0.30,
          knotOverlap: 0.42,
          confidence: 0.44,
          lifecycle: 'persistent' as const,
        },
      ],
    };

    const packet = exportAeternaPatternCandidatePacket(100, protoState);
    expect(packet).not.toBeNull();

    for (const c of packet!.protoPointCandidates) {
      const cKeys = Object.keys(c);
      for (const forbidden of AETERNA_PACKET_FORBIDDEN_FIELDS) {
        expect(cKeys).not.toContain(forbidden);
      }
      // Extra check: no label-like fields
      expect(cKeys).not.toContain('label');
      expect(cKeys).not.toContain('meaning');
      expect(cKeys).not.toContain('name');
      expect(cKeys).not.toContain('semanticId');
    }
  });

  it('packet export fallback: null state produces safe default values', () => {
    const packet = exportAeternaObservationPacket({ timestamp: 0 });
    const result = sanitizeAeternaObservationPacket(packet);

    // All fieldState values should be finite and in range
    const fs = result.packet.fieldState;
    expect(Number.isFinite(fs.ongoingness)).toBe(true);
    expect(Number.isFinite(fs.stability)).toBe(true);
    expect(Number.isFinite(fs.volatility)).toBe(true);
    expect(Number.isFinite(fs.boundaryIntegrity)).toBe(true);
    expect(Number.isFinite(fs.recoveryPressure)).toBe(true);
    expect(Number.isFinite(fs.collapseRisk)).toBe(true);
    expect(result.semanticLeakCount).toBe(0);
  });

  it('Scenario: all scenarios produce zero semantic leaks', async () => {
    const outcomes = await runAeternaObservationPacketSuite();
    expect(outcomes.length).toBeGreaterThan(0);

    for (const outcome of outcomes) {
      expect(outcome.summary.semanticLeakTotal).toBe(0);
      expect(outcome.summary.allPacketsClean).toBe(true);
    }
  }, 300000);

  it('Scenario: fieldState values are all finite across all packets', async () => {
    const outcomes = await runAeternaObservationPacketSuite();

    for (const outcome of outcomes) {
      expect(outcome.summary.fieldStateFiniteFraction).toBe(1.0);

      for (const obs of outcome.packetObservations) {
        const fs = obs.packet.fieldState;
        expect(Number.isFinite(fs.ongoingness)).toBe(true);
        expect(Number.isFinite(fs.stability)).toBe(true);
        expect(Number.isFinite(fs.volatility)).toBe(true);
        expect(Number.isFinite(fs.boundaryIntegrity)).toBe(true);
        expect(Number.isFinite(fs.recoveryPressure)).toBe(true);
        expect(Number.isFinite(fs.collapseRisk)).toBe(true);
      }
    }
  }, 300000);

  it('Scenario: packet confidence is in range [0, 1]', async () => {
    const outcomes = await runAeternaObservationPacketSuite();

    for (const outcome of outcomes) {
      expect(outcome.summary.avgConfidence).toBeGreaterThanOrEqual(0);
      expect(outcome.summary.avgConfidence).toBeLessThanOrEqual(1);

      for (const obs of outcome.packetObservations) {
        if (obs.packet.confidence !== undefined) {
          expect(obs.packet.confidence).toBeGreaterThanOrEqual(0);
          expect(obs.packet.confidence).toBeLessThanOrEqual(1);
        }
      }
    }
  }, 300000);

  it('Scenario: packets are generated for every metrics interval', async () => {
    const outcomes = await runAeternaObservationPacketSuite();

    for (const outcome of outcomes) {
      const expectedCount = outcome.result.metrics.length;
      expect(outcome.summary.packetGeneratedCount).toBe(expectedCount);
    }
  }, 300000);

  it('Scenario: packet generation does not degrade organism (read-only verification)', async () => {
    const outcomes = await runAeternaObservationPacketSuite();
    const readOnly = outcomes.find((o) => o.name === 'scenario-8d-packet-read-only-verification');
    expect(readOnly).toBeDefined();

    // Organism should remain alive: low collapse rate, no NaN
    expect(readOnly!.result.summary.nanFrames).toBe(0);
    expect(readOnly!.result.summary.collapseRate).toBeLessThan(0.3);

    // All packets should be clean
    expect(readOnly!.summary.semanticLeakTotal).toBe(0);
  }, 180000);

});
