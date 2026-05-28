import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildScoutPoints, runScoutExplorer } from '../../observer/scoutExplorer/runScoutExplorer.ts';

describe('scout explorer phase0', () => {
  it('builds multi-point scout grid from parameter ranges', () => {
    const points = buildScoutPoints(
      [
        { name: 'gain', min: 0.1, max: 0.3 },
        { name: 'drag', min: 1, max: 2 },
      ],
      2,
    );

    expect(points).toHaveLength(4);
    expect(points[0].parameters).toEqual({ gain: 0.1, drag: 1 });
    expect(points[3].parameters).toEqual({ gain: 0.3, drag: 2 });
  });

  it('records no-emergence results and exports point json files', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'aeterna-scout-'));

    const records = await runScoutExplorer({
      experimentId: 'phase0-scout',
      ranges: [{ name: 'gain', min: 0, max: 1 }],
      samplesPerRange: 2,
      outputRootDir: temp,
      observePoint: (point) => (point.parameters.gain > 0.5 ? { score: 0.9 } : null),
    });

    expect(records).toHaveLength(2);
    expect(records[0].observation).toEqual({
      status: 'no_emergence',
      reason: 'No emergence observed at this scout point.',
    });

    const filePath = join(temp, 'phase0-scout', `${records[0].pointId}.json`);
    const parsed = JSON.parse(await readFile(filePath, 'utf8')) as { pointId: string };
    expect(parsed.pointId).toBe(records[0].pointId);
  });
});
