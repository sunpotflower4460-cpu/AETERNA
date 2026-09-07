import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * K15's decisive falsifier (docs/vessel/K15-runtime-design.md): "観測API
 * がψに直接触れる経路を1本でも持てば無効". This is checked structurally:
 * the observation layer's source files must never IMPORT anything that
 * can drive/step/checkpoint the field or feed the input port - only
 * geometry (pure data), observe/ (already-proven read-only measurement,
 * per K11's own observerNonInterference tests), and its own sibling type
 * module are allowed.
 */
const FORBIDDEN_IMPORT_PATTERNS = [
  '../run/',
  '../field/stepConservative',
  '../field/stepDissipation',
  '../field/stepDrive',
  '../drive/',
  '../ledger/',
  '../medium/',
  '../world/worldTick',
  '../world/worldField',
  '../world/distributedBoundary',
  '../world/delayLineControl',
  '../world/foreignFieldControl',
  '../runtime/transducer',
  '../runtime/inputLog',
  '../runtime/builtinTransducers',
  '../persist/',
];

const OBSERVATION_FILES = ['../../pure/runtime/observationState.ts', '../../pure/runtime/observationApi.ts'];

function importLines(source: string): string[] {
  return source
    .split('\n')
    .filter((line) => /^\s*import\s/.test(line));
}

describe('pure core K15 observation layer: import boundary (decisive falsifier structural check)', () => {
  for (const relativePath of OBSERVATION_FILES) {
    it(`${relativePath} never imports a module that can drive/step/checkpoint the field`, () => {
      const sourcePath = fileURLToPath(new URL(relativePath, import.meta.url));
      const source = readFileSync(sourcePath, 'utf-8');
      const lines = importLines(source);
      expect(lines.length).toBeGreaterThan(0); // sanity: the file does import something

      for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
        const offendingLine = lines.find((line) => line.includes(pattern));
        expect(offendingLine, `${relativePath} imports forbidden module matching '${pattern}': ${offendingLine}`).toBeUndefined();
      }
    });
  }

  it('observationState.ts only imports from geometry/ and observe/', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/runtime/observationState.ts', import.meta.url));
    const lines = importLines(readFileSync(sourcePath, 'utf-8'));
    for (const line of lines) {
      expect(line.includes('../geometry/') || line.includes('../observe/')).toBe(true);
    }
  });

  it('observationApi.ts only imports from ws, node:net, and its own observationState.ts', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/runtime/observationApi.ts', import.meta.url));
    const lines = importLines(readFileSync(sourcePath, 'utf-8'));
    for (const line of lines) {
      expect(line.includes("'ws'") || line.includes('node:net') || line.includes('./observationState.ts')).toBe(true);
    }
  });
});
