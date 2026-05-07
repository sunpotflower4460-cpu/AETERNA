/**
 * publicScenarioCopy.test.ts
 * AETERNA-NATURAL v2.2 — Public Scenario Copy Tests
 *
 * Tests that publicResearchScenarioSet has the correct v2.2 grouping and copy.
 */

import { describe, it, expect } from 'vitest';
import {
  PUBLIC_SAFE_SCENARIO_IDS,
  PUBLIC_SCENARIO_DISPLAY_LIST,
  getScenarioDisplayGroup,
  isPublicSafeScenario,
  isCautiousScenario,
  isAdvancedScenario,
} from '../../scenario/publicResearchScenarioSet.ts';

describe('publicResearchScenarioSet — v2.2', () => {
  it('public safe scenarios include quietBaseline and singlePulseReturn', () => {
    expect(PUBLIC_SAFE_SCENARIO_IDS).toContain('quietBaseline');
    expect(PUBLIC_SAFE_SCENARIO_IDS).toContain('singlePulseReturn');
  });

  it('display list has beginner group', () => {
    const beginner = getScenarioDisplayGroup('beginner');
    expect(beginner.length).toBeGreaterThanOrEqual(1);
  });

  it('display list has observation group', () => {
    const observation = getScenarioDisplayGroup('observation');
    expect(observation.length).toBeGreaterThanOrEqual(1);
  });

  it('display list has advanced group', () => {
    const advanced = getScenarioDisplayGroup('advanced');
    expect(advanced.length).toBeGreaterThanOrEqual(1);
  });

  it('beginner group includes quietBaseline', () => {
    const beginner = getScenarioDisplayGroup('beginner');
    const ids = beginner.map(e => e.id);
    expect(ids).toContain('quietBaseline');
  });

  it('observation group includes phaseVortexEmergence', () => {
    const observation = getScenarioDisplayGroup('observation');
    const ids = observation.map(e => e.id);
    expect(ids).toContain('phaseVortexEmergence');
  });

  it('observation group includes observedRatioSurvey with caution note', () => {
    const observation = getScenarioDisplayGroup('observation');
    const survey = observation.find(e => e.id === 'observedRatioSurvey');
    expect(survey).toBeDefined();
    // one-line description should clarify it's comparison, not proof
    const desc = survey!.oneLineDescription.toLowerCase();
    expect(desc).toMatch(/comparison|not proof|compare/);
  });

  it('each display entry has non-empty one-line descriptions', () => {
    for (const entry of PUBLIC_SCENARIO_DISPLAY_LIST) {
      expect(entry.oneLineDescription.length).toBeGreaterThan(0);
      expect(entry.oneLineDescriptionJa.length).toBeGreaterThan(0);
    }
  });

  it('no one-line description claims proof of consciousness, life, or mystical truth', () => {
    const forbidden = ['consciousness proved', 'life proved', 'mystical proof', 'healing proof'];
    for (const entry of PUBLIC_SCENARIO_DISPLAY_LIST) {
      const combined = `${entry.oneLineDescription} ${entry.oneLineDescriptionJa}`.toLowerCase();
      for (const term of forbidden) {
        expect(combined).not.toContain(term);
      }
    }
  });

  it('isPublicSafeScenario returns true for quietBaseline', () => {
    expect(isPublicSafeScenario('quietBaseline')).toBe(true);
  });

  it('isPublicSafeScenario returns false for fullNaturalLongRun', () => {
    expect(isPublicSafeScenario('fullNaturalLongRun')).toBe(false);
  });

  it('isCautiousScenario returns true for plasticityTraceObservation', () => {
    expect(isCautiousScenario('plasticityTraceObservation')).toBe(true);
  });

  it('isAdvancedScenario returns true for fullNaturalLongRun', () => {
    expect(isAdvancedScenario('fullNaturalLongRun')).toBe(true);
  });
});
