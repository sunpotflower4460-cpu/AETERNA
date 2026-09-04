import { describe, expect, it } from 'vitest';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';

describe('pure core exchange ring geometry (docs/vessel/K5-exchange-medium-adr.md choice 1)', () => {
  it('builds a uniform-spacing ring with cellArea = dx everywhere and totalLength = M*dx', () => {
    const geometry = createExchangeRingGeometry(10, 0.3);
    expect(geometry.M).toBe(10);
    expect(geometry.dx).toBe(0.3);
    expect(geometry.cellArea).toHaveLength(10);
    for (const area of geometry.cellArea) {
      expect(area).toBe(0.3);
    }
    expect(geometry.totalLength).toBeCloseTo(3.0, 12);
  });

  it('throws for M < 2', () => {
    expect(() => createExchangeRingGeometry(1, 0.1)).toThrow();
    expect(() => createExchangeRingGeometry(0, 0.1)).toThrow();
  });

  it('throws for a non-integer M', () => {
    expect(() => createExchangeRingGeometry(5.5, 0.1)).toThrow();
  });

  it('throws for a non-positive dx', () => {
    expect(() => createExchangeRingGeometry(8, 0)).toThrow();
    expect(() => createExchangeRingGeometry(8, -0.1)).toThrow();
  });
});
