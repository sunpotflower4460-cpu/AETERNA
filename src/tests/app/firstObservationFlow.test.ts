/**
 * firstObservationFlow.test.ts
 *
 * Confirms:
 * - the state machine only moves forward on the correct trigger from the
 *   correct stage, and is a no-op otherwise (no skipping/faking stages)
 * - recordTouch() outside TOUCH_INVITED does nothing (no fabricated reaction)
 * - subscribers are notified only on an actual transition
 * - deriveInsightText: null inputs, no-change case (exact master-spec
 *   wording), and a real-change case
 */

import { describe, it, expect, vi } from 'vitest';
import { createFirstObservationFlow } from '../../app/onboarding/FirstObservationFlow.js';
import { deriveInsightText } from '../../ui/onboarding/renderFirstObservationCard.js';

describe('createFirstObservationFlow', () => {
  it('starts at WELCOME', () => {
    expect(createFirstObservationFlow().getState().stage).toBe('WELCOME');
  });

  it('walks the full happy path in order', () => {
    const flow = createFirstObservationFlow();
    flow.start();
    expect(flow.getState().stage).toBe('BASELINE_OBSERVING');
    flow.invite();
    expect(flow.getState().stage).toBe('TOUCH_INVITED');
    flow.recordTouch();
    expect(flow.getState().stage).toBe('REACTION_OBSERVED');
    flow.presentInsight();
    expect(flow.getState().stage).toBe('INSIGHT_PRESENTED');
    flow.finish();
    expect(flow.getState().stage).toBe('FREE_EXPLORATION');
  });

  it('ignores out-of-order transitions (no stage skipping)', () => {
    const flow = createFirstObservationFlow();
    flow.invite(); // WELCOME, not BASELINE_OBSERVING — no-op
    expect(flow.getState().stage).toBe('WELCOME');
    flow.recordTouch(); // no-op
    expect(flow.getState().stage).toBe('WELCOME');
    flow.finish(); // no-op
    expect(flow.getState().stage).toBe('WELCOME');
  });

  it('recordTouch outside TOUCH_INVITED does not fabricate a reaction', () => {
    const flow = createFirstObservationFlow();
    flow.start();
    flow.recordTouch(); // BASELINE_OBSERVING, not TOUCH_INVITED — no-op
    expect(flow.getState().stage).toBe('BASELINE_OBSERVING');
  });

  it('FREE_EXPLORATION is terminal — no further transitions', () => {
    const flow = createFirstObservationFlow();
    flow.start();
    flow.invite();
    flow.recordTouch();
    flow.presentInsight();
    flow.finish();
    flow.start();
    expect(flow.getState().stage).toBe('FREE_EXPLORATION');
  });

  it('notifies subscribers only on an actual transition', () => {
    const flow = createFirstObservationFlow();
    const listener = vi.fn();
    flow.subscribe(listener);
    flow.invite(); // no-op from WELCOME
    expect(listener).not.toHaveBeenCalled();
    flow.start();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ stage: 'BASELINE_OBSERVING' });
  });

  it('unsubscribe stops notifications', () => {
    const flow = createFirstObservationFlow();
    const listener = vi.fn();
    const unsubscribe = flow.subscribe(listener);
    unsubscribe();
    flow.start();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('deriveInsightText', () => {
  it('reports missing data when either sigma is null', () => {
    expect(deriveInsightText(null, 1.0)).toBe('観測データを取得できませんでした。');
    expect(deriveInsightText(1.0, null)).toBe('観測データを取得できませんでした。');
  });

  it('reports no significant change below threshold — exact master-spec wording', () => {
    expect(deriveInsightText(1.0, 1.005)).toBe('今回の条件では、大きな変化は観測されませんでした。');
  });

  it('reports a real change above threshold, with the measured delta', () => {
    const text = deriveInsightText(1.0, 1.05);
    expect(text).toContain('変化が観測されました');
    expect(text).toContain('0.050');
  });
});
