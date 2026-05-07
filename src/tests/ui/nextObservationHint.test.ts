import { describe, it, expect } from 'vitest';
import { renderNextObservationHintHTML } from '../../ui/onboarding/NextObservationHint.js';

describe('renderNextObservationHintHTML: null hint', () => {
  it('returns empty string when hint is null', () => {
    const html = renderNextObservationHintHTML({ hint: null });
    expect(html).toBe('');
  });
});

describe('renderNextObservationHintHTML: hint present', () => {
  const hint = {
    titleJa: 'まず場を見る',
    descriptionJa: '気になる場所をタップしてみる',
    actionLabelJa: 'セルをタップ',
    targetPanel: 'field',
  };

  it('renders next-observation-hint container', () => {
    const html = renderNextObservationHintHTML({ hint });
    expect(html).toContain('next-observation-hint');
  });

  it('renders titleJa', () => {
    const html = renderNextObservationHintHTML({ hint });
    expect(html).toContain('まず場を見る');
  });

  it('renders descriptionJa', () => {
    const html = renderNextObservationHintHTML({ hint });
    expect(html).toContain('気になる場所をタップしてみる');
  });

  it('renders data-panel attribute when targetPanel is present', () => {
    const html = renderNextObservationHintHTML({ hint });
    expect(html).toContain('data-panel="field"');
  });

  it('renders actionLabelJa in button', () => {
    const html = renderNextObservationHintHTML({ hint });
    expect(html).toContain('セルをタップ');
  });
});

describe('renderNextObservationHintHTML: no targetPanel', () => {
  it('renders without data-panel when targetPanel is absent', () => {
    const hint = {
      titleJa: 'テスト',
      descriptionJa: '説明',
      actionLabelJa: 'アクション',
    };
    const html = renderNextObservationHintHTML({ hint });
    expect(html).not.toContain('data-panel');
  });
});
