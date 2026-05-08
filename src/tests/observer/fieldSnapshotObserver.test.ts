import { describe, expect, it } from 'vitest';
import { observeFieldSnapshot, observeFieldSnapshots } from '../../observer/fieldSnapshotObserver.ts';

describe('field snapshot observer', () => {
  it('measures field totals and distribution without mutating the field', () => {
    const field = new Float64Array([0, 2, 4, 0]);
    const before = Array.from(field);

    const snapshot = observeFieldSnapshot('SpatialWorldMedium', field);

    expect(snapshot.fieldName).toBe('SpatialWorldMedium');
    expect(snapshot.total).toBe(6);
    expect(snapshot.min).toBe(0);
    expect(snapshot.max).toBe(4);
    expect(snapshot.mean).toBe(1.5);
    expect(snapshot.nonZeroCount).toBe(2);
    expect(snapshot.cellCount).toBe(4);
    expect(snapshot.peakCellIndex).toBe(2);
    expect(snapshot.metricKind).toBe('measured');
    expect(Array.from(field)).toEqual(before);
  });

  it('handles empty or missing fields as measured zero snapshots', () => {
    const snapshot = observeFieldSnapshot('EmptyField', null);

    expect(snapshot.total).toBe(0);
    expect(snapshot.min).toBe(0);
    expect(snapshot.max).toBe(0);
    expect(snapshot.mean).toBe(0);
    expect(snapshot.nonZeroCount).toBe(0);
    expect(snapshot.cellCount).toBe(0);
    expect(snapshot.peakCellIndex).toBeNull();
    expect(snapshot.metricKind).toBe('measured');
  });

  it('observes multiple fields in order', () => {
    const snapshots = observeFieldSnapshots([
      { fieldName: 'ExternalDriveField', field: [1, 1, 0] },
      { fieldName: 'SpatialWorldMedium', field: [0, 2, 0] },
    ]);

    expect(snapshots.map((snapshot) => snapshot.fieldName)).toEqual([
      'ExternalDriveField',
      'SpatialWorldMedium',
    ]);
    expect(snapshots.map((snapshot) => snapshot.total)).toEqual([2, 2]);
  });

  it('does not turn non-finite samples into hidden energy', () => {
    const snapshot = observeFieldSnapshot('MixedField', [1, Number.NaN, Number.POSITIVE_INFINITY, 2]);

    expect(snapshot.total).toBe(3);
    expect(snapshot.nonZeroCount).toBe(2);
    expect(snapshot.max).toBe(2);
  });
});
