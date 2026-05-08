import type { FieldSnapshot } from '../types/observation.ts';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeSample(value: number): number {
  return isFiniteNumber(value) ? value : 0;
}

export function observeFieldSnapshot(
  fieldName: string,
  field: ArrayLike<number> | null | undefined,
): FieldSnapshot {
  const cellCount = field?.length ?? 0;
  if (!field || cellCount === 0) {
    return {
      fieldName,
      total: 0,
      min: 0,
      max: 0,
      mean: 0,
      nonZeroCount: 0,
      cellCount: 0,
      peakCellIndex: null,
      distributionSpread: 0,
      metricKind: 'measured',
    };
  }

  let total = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let nonZeroCount = 0;
  let peakCellIndex = 0;
  let peakAbsValue = 0;

  for (let i = 0; i < cellCount; i++) {
    const value = normalizeSample(field[i]);
    total += value;
    min = Math.min(min, value);
    max = Math.max(max, value);
    if (value !== 0) nonZeroCount += 1;

    const absValue = Math.abs(value);
    if (absValue > peakAbsValue) {
      peakAbsValue = absValue;
      peakCellIndex = i;
    }
  }

  const mean = total / cellCount;
  let variance = 0;
  for (let i = 0; i < cellCount; i++) {
    const value = normalizeSample(field[i]);
    const diff = value - mean;
    variance += diff * diff;
  }

  return {
    fieldName,
    total,
    min,
    max,
    mean,
    nonZeroCount,
    cellCount,
    peakCellIndex: peakAbsValue > 0 ? peakCellIndex : null,
    distributionSpread: Math.sqrt(variance / cellCount),
    metricKind: 'measured',
  };
}

export function observeFieldSnapshots(
  fields: Array<{ fieldName: string; field: ArrayLike<number> | null | undefined }>,
): FieldSnapshot[] {
  return fields.map(({ fieldName, field }) => observeFieldSnapshot(fieldName, field));
}
