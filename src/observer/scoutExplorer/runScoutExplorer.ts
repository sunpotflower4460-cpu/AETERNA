import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ObservationResult } from '../experimentKind.ts';
import { normalizeObservationResult } from '../experimentKind.ts';

export interface ScoutParameterRange {
  name: string;
  min: number;
  max: number;
}

export interface ScoutPoint {
  pointId: string;
  parameters: Record<string, number>;
}

export interface ScoutResultRecord {
  experimentId: string;
  pointId: string;
  parameters: Record<string, number>;
  observation: ObservationResult<Record<string, unknown>>;
}

export interface RunScoutExplorerParams {
  experimentId: string;
  ranges: ScoutParameterRange[];
  samplesPerRange: number;
  observePoint: (point: ScoutPoint) => Promise<Record<string, unknown> | null | undefined> | Record<string, unknown> | null | undefined;
  outputRootDir?: string;
}

function sampleRange(range: ScoutParameterRange, samplesPerRange: number): number[] {
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.max < range.min) {
    throw new Error(`Invalid range for ${range.name}`);
  }
  if (!Number.isInteger(samplesPerRange) || samplesPerRange <= 0) {
    throw new Error('samplesPerRange must be a positive integer.');
  }

  if (samplesPerRange === 1) return [range.min];

  const out: number[] = [];
  const step = (range.max - range.min) / (samplesPerRange - 1);
  for (let i = 0; i < samplesPerRange; i += 1) {
    out.push(range.min + step * i);
  }
  return out;
}

export function buildScoutPoints(ranges: ScoutParameterRange[], samplesPerRange: number): ScoutPoint[] {
  if (ranges.length === 0) {
    throw new Error('Scout explorer requires at least one parameter range.');
  }

  const sampled = ranges.map((range) => ({
    name: range.name,
    values: sampleRange(range, samplesPerRange),
  }));

  const points: ScoutPoint[] = [];

  const walk = (index: number, current: Record<string, number>) => {
    if (index >= sampled.length) {
      points.push({
        pointId: `point-${String(points.length + 1).padStart(4, '0')}`,
        parameters: { ...current },
      });
      return;
    }

    const next = sampled[index];
    for (const value of next.values) {
      current[next.name] = value;
      walk(index + 1, current);
    }
  };

  walk(0, {});
  return points;
}

export async function runScoutExplorer(params: RunScoutExplorerParams): Promise<ScoutResultRecord[]> {
  const points = buildScoutPoints(params.ranges, params.samplesPerRange);
  const records: ScoutResultRecord[] = [];

  for (const point of points) {
    const observed = await params.observePoint(point);
    const observation = normalizeObservationResult(observed, 'No emergence observed at this scout point.');
    records.push({
      experimentId: params.experimentId,
      pointId: point.pointId,
      parameters: point.parameters,
      observation,
    });
  }

  const outputRoot = params.outputRootDir ?? 'results/scout';
  const outputDir = join(outputRoot, params.experimentId);
  await mkdir(outputDir, { recursive: true });

  await Promise.all(records.map((record) => {
    const filePath = join(outputDir, `${record.pointId}.json`);
    const content = JSON.stringify(record, null, 2);
    return writeFile(filePath, `${content}\n`, 'utf8');
  }));

  return records;
}
