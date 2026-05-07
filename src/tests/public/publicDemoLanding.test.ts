/**
 * publicDemoLanding.test.ts
 * AETERNA-NATURAL v2.2 — Public Demo Landing Tests
 *
 * Tests that PublicResearchLanding contains the required v2.2 copy.
 */

import { describe, it, expect } from 'vitest';
import {
  PUBLIC_LANDING_TITLE,
  PUBLIC_LANDING_SUBTITLE,
  PUBLIC_LANDING_SHORT_DESCRIPTION_EN,
  PUBLIC_LANDING_NO_PROOF_NOTE,
  PUBLIC_LANDING_ACTION_BUTTONS,
  LANDING_WHAT_THIS_IS_EN,
  LANDING_WHAT_THIS_IS_NOT_EN,
  LANDING_VISUAL_COPY_EN,
  renderPublicLandingText,
  renderPublicLandingMarkdown,
} from '../../ui/public/PublicResearchLanding.tsx';

describe('PublicResearchLanding — v2.2', () => {
  it('title is AETERNA-NATURAL', () => {
    expect(PUBLIC_LANDING_TITLE).toBe('AETERNA-NATURAL');
  });

  it('subtitle is Torus Field Observation Lab', () => {
    expect(PUBLIC_LANDING_SUBTITLE).toContain('Torus Field Observation Lab');
  });

  it('short description references observation, not proof', () => {
    expect(PUBLIC_LANDING_SHORT_DESCRIPTION_EN).toContain('Observe');
    expect(PUBLIC_LANDING_SHORT_DESCRIPTION_EN).not.toMatch(/proof/i);
  });

  it('no-proof note is present', () => {
    expect(PUBLIC_LANDING_NO_PROOF_NOTE).toContain('not proof');
  });

  it('no-proof note covers consciousness, life, intelligence, healing, mystical', () => {
    const note = PUBLIC_LANDING_NO_PROOF_NOTE.toLowerCase();
    expect(note).toContain('consciousness');
    expect(note).toContain('life');
    expect(note).toContain('intelligence');
    expect(note).toContain('healing');
    expect(note).toContain('mystical');
  });

  it('primary action is Start Safe Observation', () => {
    const primary = PUBLIC_LANDING_ACTION_BUTTONS.find(b => b.isPrimary);
    expect(primary).toBeDefined();
    expect(primary!.label).toContain('Safe Observation');
  });

  it('action buttons include research scenarios, observation guide, export', () => {
    const ids = PUBLIC_LANDING_ACTION_BUTTONS.map(b => b.id);
    expect(ids).toContain('openResearchScenarios');
    expect(ids).toContain('viewObservationGuide');
    expect(ids).toContain('exportReproducibility');
  });

  it('"what this is" has at least 3 items', () => {
    expect(LANDING_WHAT_THIS_IS_EN.length).toBeGreaterThanOrEqual(3);
  });

  it('"what this is not" covers all key forbidden claims', () => {
    const notItems = LANDING_WHAT_THIS_IS_NOT_EN.join('\n').toLowerCase();
    expect(notItems).toContain('consciousness');
    expect(notItems).toContain('life');
    expect(notItems).toContain('intelligence');
    expect(notItems).toContain('healing');
    expect(notItems).toContain('mystical');
  });

  it('visual copy references observation actions only', () => {
    const forbidden = ['life', 'consciousness', 'soul', 'mystical', 'proof'];
    for (const line of LANDING_VISUAL_COPY_EN) {
      for (const term of forbidden) {
        expect(line.toLowerCase()).not.toContain(term);
      }
    }
  });

  it('renderPublicLandingText includes title and no-proof note', () => {
    const text = renderPublicLandingText().join('\n');
    expect(text).toContain('AETERNA-NATURAL');
    expect(text).toContain('not proof');
    expect(text).toContain('What this is');
    expect(text).toContain('What this is not');
  });

  it('renderPublicLandingMarkdown includes hero section', () => {
    const md = renderPublicLandingMarkdown();
    expect(md).toContain('# AETERNA-NATURAL');
    expect(md).toContain('Torus Field Observation Lab');
    expect(md).toContain('What this is');
    expect(md).toContain('What this is not');
  });
});
