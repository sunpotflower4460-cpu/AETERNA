/**
 * PUT-IN: a list of paired per-seed differences (condition A measurement
 *   minus condition B measurement, for the same seed)
 * EMERGED: the mean difference, its standard error across seeds, and
 *   whether the frozen decision rule calls it distinguishable from zero
 * claim-tier: C2 (implemented exactly per docs/vessel/K6-reafference-
 *   preregistration.md's judgment rule; unit-validated with SYNTHETIC
 *   data in src/tests/pure/reafferenceStatistics.test.ts - never with
 *   real experiment output, so these tests cannot have been tuned by
 *   looking at the actual result)
 * floors (誠実な床): this is an exploratory, non-confirmatory rule
 *   (|mean| > 2*standard-error, no multiple-comparison correction) - the
 *   pre-registration document says so explicitly. It is not a
 *   peer-review-grade statistical test, and this file does not claim
 *   otherwise.
 *
 * docs/vessel/K6-reafference-preregistration.md 判定規則:
 *   mean, sem = stddev/sqrt(seedCount) を計算し、
 *   |mean| > 2*sem かつ sem が有限で非ゼロなら「区別できた」と判定する。
 */

export interface PairedComparisonResult {
  meanDifference: number;
  standardError: number;
  distinguishable: boolean;
}

export function comparePaired(deltas: readonly number[]): PairedComparisonResult {
  const n = deltas.length;
  if (n === 0) {
    throw new Error('comparePaired: deltas must not be empty');
  }

  const mean = deltas.reduce((sum, value) => sum + value, 0) / n;
  const variance = n > 1 ? deltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1) : 0;
  const standardError = Math.sqrt(variance) / Math.sqrt(n);

  const distinguishable = Number.isFinite(standardError) && standardError > 0 && Math.abs(mean) > 2 * standardError;

  return { meanDifference: mean, standardError, distinguishable };
}
