import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

function read(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const sources = [
  read('src/onboarding/defaultObservationRoute.ts'),
  read('src/onboarding/guidedDemoConfig.ts'),
  read('src/ui/onboarding/BeginnerHomePanel.tsx'),
  read('src/ui/onboarding/FirstRunGuide.tsx'),
];

const FORBIDDEN_PHRASES = [
  '証明します',
  '意識を持つ',
  '生命を持つ',
  '知性の証明',
  '神秘',
];

describe('onboardingCopyGuard: forbidden phrases not present', () => {
  for (const phrase of FORBIDDEN_PHRASES) {
    it(`does not contain "${phrase}"`, () => {
      const joined = sources.join('\n');
      expect(joined).not.toContain(phrase);
    });
  }
});
