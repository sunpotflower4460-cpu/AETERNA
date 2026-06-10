import { describe, expect, it } from 'vitest';
import { createTorusGeometry, toIndex, wrapIndex } from '../../pure/geometry/torus.ts';
import { createPurePhysicsParams } from '../../pure/params.ts';

describe('PURE torus geometry', () => {
  it('creates positive cell areas', () => {
    const geometry = createTorusGeometry(createPurePhysicsParams());

    for (const area of geometry.dA) {
      expect(area).toBeGreaterThan(0);
    }
  });

  it('wraps periodic grid indices', () => {
    expect(wrapIndex(-1, 8)).toBe(7);
    expect(wrapIndex(8, 8)).toBe(0);
    expect(wrapIndex(17, 8)).toBe(1);
    expect(toIndex(-1, -1, 8)).toBe(63);
    expect(toIndex(8, 8, 8)).toBe(0);
  });

  it('approximates continuous torus area', () => {
    const params = createPurePhysicsParams({ R: 2, r: 0.7, gridSize: 64 });
    const geometry = createTorusGeometry(params);
    const expectedArea = 4 * Math.PI * Math.PI * params.R * params.r;
    const relativeError = Math.abs(geometry.totalArea - expectedArea) / expectedArea;

    expect(relativeError).toBeLessThan(1e-12);
  });
});
