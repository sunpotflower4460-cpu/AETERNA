import { describe, expect, it } from 'vitest';
import { comparePaired } from '../../pure/reafference/statistics.ts';

describe('pure core K6 reafference: paired-difference statistic (docs/vessel/K6-reafference-preregistration.md 判定規則, synthetic data only)', () => {
  it('all-zero differences: mean=0, sem=0, not distinguishable', () => {
    const result = comparePaired([0, 0, 0, 0, 0]);
    expect(result.meanDifference).toBe(0);
    expect(result.standardError).toBe(0);
    expect(result.distinguishable).toBe(false);
  });

  it('identical nonzero differences (zero variance): mean nonzero, sem=0, NOT distinguishable per the frozen rule (sem must be nonzero)', () => {
    const result = comparePaired([5, 5, 5, 5]);
    expect(result.meanDifference).toBe(5);
    expect(result.standardError).toBe(0);
    expect(result.distinguishable).toBe(false);
  });

  it('a clear, consistent signal well above noise is distinguishable', () => {
    // mean ~10, small scatter -> sem << mean/2
    const deltas = [9.8, 10.1, 9.9, 10.2, 10.0, 9.7, 10.3, 9.9, 10.1, 10.0];
    const result = comparePaired(deltas);
    expect(result.distinguishable).toBe(true);
    expect(result.meanDifference).toBeCloseTo(10, 0);
  });

  it('noise with no consistent signal (mean near zero, large scatter) is not distinguishable', () => {
    const deltas = [5, -6, 4, -3, 7, -8, 2, -5, 6, -4];
    const result = comparePaired(deltas);
    expect(Math.abs(result.meanDifference)).toBeLessThan(2);
    expect(result.distinguishable).toBe(false);
  });

  it('a borderline case exactly at the threshold is not distinguishable (strict >, not >=)', () => {
    // For n=2 values [m+a, m-a]: mean=m, sample variance=[(a)^2+(a)^2]/(2-1)=2a^2,
    // stddev=sqrt(2)*a, sem=stddev/sqrt(2)=a. Choose a=1, m=2*sem=2 for an
    // exact mean/sem ratio of 2.
    const a = 1;
    const m = 2 * a;
    const deltas = [m + a, m - a]; // [3, 1]
    const result = comparePaired(deltas);
    expect(result.meanDifference).toBeCloseTo(m, 10);
    expect(result.standardError).toBeCloseTo(a, 10);
    expect(Math.abs(result.meanDifference) / result.standardError).toBeCloseTo(2, 6);
    expect(result.distinguishable).toBe(false);
  });

  it('throws for an empty input', () => {
    expect(() => comparePaired([])).toThrow();
  });

  it('a single-element input has sem=0 and is never distinguishable regardless of magnitude', () => {
    const result = comparePaired([1000]);
    expect(result.standardError).toBe(0);
    expect(result.distinguishable).toBe(false);
  });
});
