import { describe, it, expect } from 'vitest';
import { renderObservationMobileTabsHTML } from '../../ui/observation/ObservationMobileTabs.js';

describe('ObservationMobileTabs: beginner tab', () => {
  it('includes beginner tab with data-tab="beginner"', () => {
    const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
    expect(html).toContain('data-tab="beginner"');
  });

  it('beginner tab label is はじめに', () => {
    const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
    expect(html).toContain('はじめに');
  });

  it('beginner tab appears before field tab in HTML', () => {
    const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
    const beginnerPos = html.indexOf('data-tab="beginner"');
    const fieldPos = html.indexOf('data-tab="field"');
    expect(beginnerPos).toBeGreaterThanOrEqual(0);
    expect(fieldPos).toBeGreaterThan(beginnerPos);
  });

  it('beginner tab icon is 🏠', () => {
    const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
    expect(html).toContain('🏠');
  });

  it('beginner tab can be set as active', () => {
    const html = renderObservationMobileTabsHTML({ activeTab: 'beginner' });
    expect(html).toContain('observation-mobile-tabs__tab--active');
  });
});
