/**
 * recommendedDemoFlow.test.ts
 * AETERNA-NATURAL v2.2 — Recommended Demo Flow Tests
 *
 * Tests that RecommendedDemoFlow has the correct structure and copy.
 */

import { describe, it, expect } from 'vitest';
import {
  RECOMMENDED_DEMO_FLOW,
  renderRecommendedDemoFlowText,
  renderRecommendedDemoFlowMarkdown,
} from '../../ui/public/RecommendedDemoFlow.tsx';

describe('RecommendedDemoFlow — v2.2', () => {
  it('has at least 5 steps', () => {
    expect(RECOMMENDED_DEMO_FLOW.length).toBeGreaterThanOrEqual(5);
  });

  it('step numbers are sequential starting from 1', () => {
    for (let i = 0; i < RECOMMENDED_DEMO_FLOW.length; i++) {
      expect(RECOMMENDED_DEMO_FLOW[i].stepNumber).toBe(i + 1);
    }
  });

  it('first step is Start Safe Observation', () => {
    const first = RECOMMENDED_DEMO_FLOW[0];
    expect(first.action).toContain('Safe Observation');
    expect(first.actionKey).toBe('startSafeObservation');
  });

  it('flow includes Quiet Baseline', () => {
    const ids = RECOMMENDED_DEMO_FLOW.map(s => s.actionKey);
    expect(ids).toContain('runQuietBaseline');
  });

  it('flow includes Cell Inspector', () => {
    const ids = RECOMMENDED_DEMO_FLOW.map(s => s.actionKey);
    expect(ids).toContain('openCellInspector');
  });

  it('flow includes Replay', () => {
    const ids = RECOMMENDED_DEMO_FLOW.map(s => s.actionKey);
    expect(ids).toContain('openReplay');
  });

  it('flow includes ask Guide', () => {
    const ids = RECOMMENDED_DEMO_FLOW.map(s => s.actionKey);
    expect(ids).toContain('askGuide');
  });

  it('flow includes export', () => {
    const ids = RECOMMENDED_DEMO_FLOW.map(s => s.actionKey);
    expect(ids).toContain('exportMarkdown');
  });

  it('no step detail claims proof of consciousness, life, or mystical truth', () => {
    const forbidden = ['consciousness proved', 'life proved', 'mystical proof', 'healing proof'];
    for (const step of RECOMMENDED_DEMO_FLOW) {
      const combined = `${step.detail} ${step.detailJa}`.toLowerCase();
      for (const term of forbidden) {
        expect(combined).not.toContain(term);
      }
    }
  });

  it('each step has a non-empty action and actionJa', () => {
    for (const step of RECOMMENDED_DEMO_FLOW) {
      expect(step.action.length).toBeGreaterThan(0);
      expect(step.actionJa.length).toBeGreaterThan(0);
    }
  });

  it('renderRecommendedDemoFlowText includes all step actions', () => {
    const text = renderRecommendedDemoFlowText().join('\n');
    for (const step of RECOMMENDED_DEMO_FLOW) {
      expect(text).toContain(step.action);
    }
  });

  it('renderRecommendedDemoFlowMarkdown includes "Recommended first demo" heading', () => {
    const md = renderRecommendedDemoFlowMarkdown();
    expect(md).toContain('Recommended first demo');
  });
});
