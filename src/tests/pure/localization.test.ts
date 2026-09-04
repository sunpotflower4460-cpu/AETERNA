import { describe, expect, it } from 'vitest';
import { checkLocalization } from '../../pure/observe/localization.ts';
import type { VortexCandidate } from '../../pure/observe/vortexCandidates.ts';
import { createTorusGeometry } from '../../pure/geometry/torus.ts';

describe('pure core: localization check (docs/vessel/K7-natural-emergence-preregistration.md operationalization of L2 localized_components)', () => {
  it('zero candidates is not localized (localized_components must be > 0)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 10 });
    const result = checkLocalization([], geometry, 0.3);
    expect(result.candidateCount).toBe(0);
    expect(result.localized).toBe(false);
  });

  it('a few candidates well under the fraction threshold is localized', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 10 });
    const candidates: VortexCandidate[] = [{ cellIndex: 0, winding: 1 }, { cellIndex: 5, winding: -1 }];
    const result = checkLocalization(candidates, geometry, 0.3);
    expect(result.totalPlaquettes).toBe(100);
    expect(result.fraction).toBeCloseTo(0.02, 10);
    expect(result.localized).toBe(true);
  });

  it('candidates filling most of the grid are not localized', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 10 });
    const candidates: VortexCandidate[] = Array.from({ length: 40 }, (_, i) => ({ cellIndex: i, winding: 1 }));
    const result = checkLocalization(candidates, geometry, 0.3);
    expect(result.fraction).toBeCloseTo(0.4, 10);
    expect(result.localized).toBe(false);
  });

  it('exactly at the threshold fraction is not localized (strict <, not <=)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 10 });
    const candidates: VortexCandidate[] = Array.from({ length: 30 }, (_, i) => ({ cellIndex: i, winding: 1 }));
    const result = checkLocalization(candidates, geometry, 0.3);
    expect(result.fraction).toBeCloseTo(0.3, 10);
    expect(result.localized).toBe(false);
  });
});
