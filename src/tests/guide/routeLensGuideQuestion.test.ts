/**
 * routeLensGuideQuestion.test.ts
 * v1.9: Lens-aware AI Guide
 *
 * Tests for routeLensGuideQuestion.
 */

import { describe, it, expect } from 'vitest';
import { routeLensGuideQuestion } from '../../guide/routeLensGuideQuestion.ts';

describe('routeLensGuideQuestion', () => {
  it('「これなに？」→ explain', () => {
    expect(routeLensGuideQuestion('これなに？')).toBe('explain');
  });

  it('「仮説」→ hypothesis', () => {
    expect(routeLensGuideQuestion('仮説を立ててみよう')).toBe('hypothesis');
  });

  it('「違い」→ compare', () => {
    expect(routeLensGuideQuestion('さっきとの違いは？')).toBe('compare');
  });

  it('「証明？」→ caution', () => {
    expect(routeLensGuideQuestion('これで証明できる？')).toBe('caution');
  });

  it('「次どこ見る？」→ nextObservation', () => {
    expect(routeLensGuideQuestion('次どこ見る？')).toBe('nextObservation');
  });

  it('default empty string → explain', () => {
    expect(routeLensGuideQuestion('')).toBe('explain');
  });

  it('default unrelated → explain', () => {
    expect(routeLensGuideQuestion('hello')).toBe('explain');
  });

  it('English "hypothesis" → hypothesis', () => {
    expect(routeLensGuideQuestion('Can you hypothesis this?')).toBe('hypothesis');
  });

  it('English "why" → hypothesis', () => {
    expect(routeLensGuideQuestion('why is this happening?')).toBe('hypothesis');
  });

  it('English "compare" → compare', () => {
    expect(routeLensGuideQuestion('compare these values')).toBe('compare');
  });

  it('English "difference" → compare', () => {
    expect(routeLensGuideQuestion('what is the difference?')).toBe('compare');
  });

  it('English "causal" → caution', () => {
    expect(routeLensGuideQuestion('is this causal?')).toBe('caution');
  });

  it('English "proof" → caution', () => {
    expect(routeLensGuideQuestion('is this proof?')).toBe('caution');
  });

  it('English "next" → nextObservation', () => {
    expect(routeLensGuideQuestion('what next should I look at?')).toBe('nextObservation');
  });

  it('English "where" → nextObservation', () => {
    expect(routeLensGuideQuestion('where should I look?')).toBe('nextObservation');
  });

  it('English "which layer" → nextObservation', () => {
    expect(routeLensGuideQuestion('which layer is relevant?')).toBe('nextObservation');
  });

  it('「次」 takes priority over other keywords', () => {
    // "次どこ見る" contains 次 → nextObservation takes priority
    expect(routeLensGuideQuestion('次に仮説を見る')).toBe('nextObservation');
  });

  it('「なぜ」→ hypothesis', () => {
    expect(routeLensGuideQuestion('なぜこうなった？')).toBe('hypothesis');
  });

  it('「比較」→ compare', () => {
    expect(routeLensGuideQuestion('比較してみよう')).toBe('compare');
  });

  it('「本当に」→ caution', () => {
    expect(routeLensGuideQuestion('本当にそうなの？')).toBe('caution');
  });
});
