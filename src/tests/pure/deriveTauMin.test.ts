import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deriveTauMin } from '../../pure/emergence/deriveTauMin.ts';

describe('pure core K14: deriveTauMin (docs/vessel/K-series-II-brain-and-universe-plan.md K14, independent of K7\'s observed values)', () => {
  it('returns max(2*pi/omega, 1/nu0) - the dissipation time, when it is the larger of the two', () => {
    const omega = 3;
    const nu0 = 0.15;
    const drivePeriod = (2 * Math.PI) / omega; // ~2.09
    const dissipationTime = 1 / nu0; // ~6.67
    expect(deriveTauMin(omega, nu0)).toBeCloseTo(dissipationTime, 10);
    expect(dissipationTime).toBeGreaterThan(drivePeriod); // sanity: confirms which branch this case exercises
  });

  it('returns max(2*pi/omega, 1/nu0) - the drive period, when it is the larger of the two', () => {
    const omega = 0.5;
    const nu0 = 2;
    const drivePeriod = (2 * Math.PI) / omega; // ~12.57
    const dissipationTime = 1 / nu0; // 0.5
    expect(deriveTauMin(omega, nu0)).toBeCloseTo(drivePeriod, 10);
    expect(drivePeriod).toBeGreaterThan(dissipationTime);
  });

  it('throws for non-positive or non-finite omega or nu0', () => {
    expect(() => deriveTauMin(0, 0.15)).toThrow();
    expect(() => deriveTauMin(-1, 0.15)).toThrow();
    expect(() => deriveTauMin(3, 0)).toThrow();
    expect(() => deriveTauMin(3, -0.1)).toThrow();
    expect(() => deriveTauMin(Infinity, 0.15)).toThrow();
  });

  it('is a pure function: same inputs always give the same output', () => {
    expect(deriveTauMin(3, 0.15)).toBe(deriveTauMin(3, 0.15));
  });
});

describe('pure core K14: deriveTauMin commit barrier (the null-hypothesis calibration code cannot see any experiment\'s target config)', () => {
  it('src/pure/emergence/deriveTauMin.ts has ZERO imports - it cannot reference K7\'s observed values, any experiment config, or anything else by construction', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/emergence/deriveTauMin.ts', import.meta.url));
    const source = readFileSync(sourcePath, 'utf-8');
    const codeOnly = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); // strip comments so a mention of "import" in prose doesn't false-positive
    expect(codeOnly).not.toMatch(/\bimport\b/);
  });
});
