/**
 * Tests for InternalUtteranceLoop (Phase C-2).
 *
 * The most important test in this file is the text-leak guard: the meta
 * packet must contain only the documented numeric fields and must not carry
 * the underlying utterance text, glossJa, sentencePlan, or any other string
 * surface. If a future refactor sneaks a string-bearing field in, this test
 * fails immediately.
 */

import { describe, it, expect } from 'vitest';
import {
  createZeroInternalUtteranceMeta,
  deriveInternalUtteranceMeta,
  INTERNAL_UTTERANCE_META_FIELDS,
  stanceValenceFor,
} from '../../signal/internalUtteranceLoop.ts';
import type { SignalRuntimeResult } from '../../signal/types.ts';

const FORBIDDEN_TEXT = 'SECRET-UTTERANCE-MARKER-XYZZY';

function makeSignalRuntime(overrides: Partial<SignalRuntimeResult> = {}): SignalRuntimeResult {
  return {
    stimulus: {
      rawText: FORBIDDEN_TEXT,
      tokens: [FORBIDDEN_TEXT, 'foo', 'bar'],
      salience: 0.5,
      novelty: 0.5,
      emotionalCharge: 0.5,
      explicitQuestion: false,
    },
    signals: [
      { id: 'a', label: FORBIDDEN_TEXT, source: 'self', activation: 0.6, persistence: 0.5, kind: 'dominant', reasons: [FORBIDDEN_TEXT] },
      { id: 'b', label: 'b', source: 'self', activation: 0.4, persistence: 0.5, kind: 'coactive', reasons: [] },
    ],
    boundary: { permeability: 0.5, selfOuterSeparation: 0.5, shockAbsorption: 0.5, externalPressure: 0.5 },
    field: {
      closeness: 0.5,
      fragility: 0.6,
      urgency: 0.4,
      permission: 0.5,
      answerPressure: 0.7,
      unfinishedness: 0.55,
    },
    bindings: [
      { id: 'b1', sourceId: 'a', targetId: 'b', weight: 0.5, reasons: [FORBIDDEN_TEXT] },
    ],
    protoMeanings: [
      { id: 'pm1', glossJa: FORBIDDEN_TEXT, strength: 0.5, sourceSignalIds: ['a'], sourceBindingIds: ['b1'] },
    ],
    decision: {
      stance: 'soft_answer',
      replyIntent: 'emotional_holding',
      closeness: 0.5,
      answerDepth: 0.4,
      shouldAnswerQuestion: true,
      shouldOfferStep: false,
      shouldStayOpen: false,
      withheldBias: 0.45,
    },
    lexicalCandidates: [{ protoMeaningId: 'pm1', candidates: [FORBIDDEN_TEXT, 'alt'] }],
    sentencePlan: { reaction: FORBIDDEN_TEXT, core: FORBIDDEN_TEXT },
    utterance: FORBIDDEN_TEXT,
    debugNotes: [FORBIDDEN_TEXT],
    ...overrides,
  };
}

describe('createZeroInternalUtteranceMeta', () => {
  it('returns all-zero numeric fields and hasUtterance=false', () => {
    const z = createZeroInternalUtteranceMeta(7);
    expect(z.timestamp).toBe(7);
    expect(z.answerPressure).toBe(0);
    expect(z.fragility).toBe(0);
    expect(z.unfinishedness).toBe(0);
    expect(z.stanceValence).toBe(0);
    expect(z.withheldBias).toBe(0);
    expect(z.hasUtterance).toBe(false);
    expect(z.signalCount).toBe(0);
    expect(z.bindingCount).toBe(0);
  });
});

describe('stanceValenceFor', () => {
  it('maps each stance to a bounded valence', () => {
    expect(stanceValenceFor('hold')).toBeLessThan(0);
    expect(stanceValenceFor('soft_answer')).toBeGreaterThan(0);
    expect(stanceValenceFor('answer')).toBeGreaterThan(stanceValenceFor('soft_answer'));
    expect(stanceValenceFor('open_reflect')).toBeGreaterThan(0);
    for (const v of [
      stanceValenceFor('hold'),
      stanceValenceFor('soft_answer'),
      stanceValenceFor('answer'),
      stanceValenceFor('open_reflect'),
    ]) {
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('deriveInternalUtteranceMeta - extraction', () => {
  it('extracts numeric meta-features faithfully', () => {
    const sig = makeSignalRuntime();
    const meta = deriveInternalUtteranceMeta(sig, 42);
    expect(meta.timestamp).toBe(42);
    expect(meta.answerPressure).toBe(0.7);
    expect(meta.fragility).toBe(0.6);
    expect(meta.unfinishedness).toBe(0.55);
    expect(meta.withheldBias).toBe(0.45);
    expect(meta.hasUtterance).toBe(true);
    expect(meta.signalCount).toBe(2);
    expect(meta.bindingCount).toBe(1);
    expect(meta.stanceValence).toBe(stanceValenceFor('soft_answer'));
  });

  it('clamps out-of-range numeric inputs', () => {
    const sig = makeSignalRuntime();
    sig.field = {
      closeness: 0.5,
      fragility: 99,
      urgency: 0.4,
      permission: 0.5,
      answerPressure: -99,
      unfinishedness: Number.NaN,
    };
    sig.decision.withheldBias = 99;
    const meta = deriveInternalUtteranceMeta(sig, 1);
    expect(meta.fragility).toBe(1);
    expect(meta.answerPressure).toBe(0);
    expect(meta.unfinishedness).toBe(0);
    expect(meta.withheldBias).toBe(1);
  });

  it('reports hasUtterance=false for empty utterance string', () => {
    const sig = makeSignalRuntime({ utterance: '' });
    const meta = deriveInternalUtteranceMeta(sig, 1);
    expect(meta.hasUtterance).toBe(false);
  });
});

describe('deriveInternalUtteranceMeta - text-leak guard', () => {
  it('output object carries exactly the documented fields and nothing else', () => {
    const sig = makeSignalRuntime();
    const meta = deriveInternalUtteranceMeta(sig, 1);
    const keys = Object.keys(meta).sort();
    const expected = [...INTERNAL_UTTERANCE_META_FIELDS].sort();
    expect(keys).toEqual(expected);
  });

  it('output values contain no string fields whatsoever', () => {
    const sig = makeSignalRuntime();
    const meta = deriveInternalUtteranceMeta(sig, 1);
    for (const key of Object.keys(meta)) {
      const v = (meta as Record<string, unknown>)[key];
      expect(typeof v).not.toBe('string');
    }
  });

  it('serialised output does not include the forbidden marker even when source carried it everywhere', () => {
    const sig = makeSignalRuntime();
    const meta = deriveInternalUtteranceMeta(sig, 1);
    const json = JSON.stringify(meta);
    expect(json).not.toContain(FORBIDDEN_TEXT);
    // Sanity: the FORBIDDEN marker really did exist throughout the source.
    const sourceJson = JSON.stringify(sig);
    expect(sourceJson).toContain(FORBIDDEN_TEXT);
  });
});
