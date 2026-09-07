/**
 * docs/vessel/vessel-report-v2.json is a checked-in artifact, generated
 * from exportVesselReportV2Json() by scripts/k16-generate-vessel-
 * report-v2.ts. This test guards against the checked-in file silently
 * going stale relative to the code that produces it - mirroring
 * src/tests/pure/vesselReportJsonUpToDate.test.ts's own pattern for V1.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { exportVesselReportV2Json } from '../../pure/run/exportVesselReportV2.ts';

describe('pure core K16 vessel-report-v2.json: matches exportVesselReportV2Json() exactly', () => {
  it('the on-disk JSON equals a fresh call to exportVesselReportV2Json()', () => {
    const fresh = exportVesselReportV2Json();
    const onDiskPath = fileURLToPath(new URL('../../../docs/vessel/vessel-report-v2.json', import.meta.url));
    const onDisk = JSON.parse(readFileSync(onDiskPath, 'utf-8'));
    expect(fresh).toEqual(onDisk);
  });
});
