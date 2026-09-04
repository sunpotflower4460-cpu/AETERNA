import { describe, expect, it } from 'vitest';
import { containsAffirmativeClaim, findAffirmativeClaim } from './claimGuard.ts';

describe('claimGuard', () => {
  it('flags a claim stated as fact', () => {
    expect(containsAffirmativeClaim('The console printed: AETERNA is conscious today.', 'AETERNA is conscious')).toBe(true);
  });

  it('does not flag a claim inside a "do not say this" heading section', () => {
    const doc = '## Guidance\n\n### ❌ Avoid\n\n- "AETERNA is conscious"\n- "AETERNA is alive"\n\n### ✅ Recommended\n\n- "Observed fluctuation"\n';
    expect(containsAffirmativeClaim(doc, 'AETERNA is conscious')).toBe(false);
    expect(containsAffirmativeClaim(doc, 'AETERNA is alive')).toBe(false);
  });

  it('does not flag a claim negated in the same sentence, even across a code fence', () => {
    const doc = 'Not:\n\n```text\nEnergy is flowing through AETERNA.\n```\n';
    expect(containsAffirmativeClaim(doc, 'Energy is flowing through AETERNA.')).toBe(false);
  });

  it('does not flag a disclaimer that names the forbidden word to disclaim it', () => {
    const json = '{"notes":["This does not prove life, consciousness, intelligence, or selfhood."]}';
    expect(containsAffirmativeClaim(json, 'life')).toBe(false);
  });

  it('still flags a violation that appears shortly after an unrelated negated sentence', () => {
    const text = 'Not: the sky is blue. Also, separately: AETERNA is conscious.';
    expect(containsAffirmativeClaim(text, 'AETERNA is conscious')).toBe(true);
  });

  it('still flags a violation under an unrelated heading', () => {
    const text = '## Status Panel\n\nAETERNA is conscious right now.';
    expect(containsAffirmativeClaim(text, 'AETERNA is conscious')).toBe(true);
  });

  it('returns to affirmative-checking once a non-negative heading follows a negative one', () => {
    const doc = '### ❌ Avoid\n\n- "AETERNA is alive"\n\n### Status\n\nAETERNA is alive right now.\n';
    expect(containsAffirmativeClaim(doc, 'AETERNA is alive')).toBe(true);
  });

  it('findAffirmativeClaim returns the first matching claim or undefined', () => {
    expect(findAffirmativeClaim('nothing forbidden here', ['AETERNA is alive', 'AETERNA is conscious'])).toBeUndefined();
    expect(findAffirmativeClaim('AETERNA is conscious.', ['AETERNA is alive', 'AETERNA is conscious'])).toBe('AETERNA is conscious');
  });
});
