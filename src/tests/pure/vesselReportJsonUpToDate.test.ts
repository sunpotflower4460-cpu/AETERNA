import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runReafferenceStudy, type ReafferenceStudyConfig } from '../../pure/reafference/runReafferenceStudy.ts';
import { exportVesselReportJson } from '../../pure/run/exportVesselReport.ts';

/**
 * docs/vessel/vessel-report.json is a checked-in artifact, generated
 * from the exact frozen K6 config (see docs/vessel/K6-reafference-
 * preregistration.md). This test guards against the checked-in file
 * silently going stale relative to the code that produced it - if a
 * future change to the pure core alters the frozen finding, this test
 * fails until docs/vessel/vessel-report.json is regenerated and the
 * change is reviewed (not silently overwritten).
 */
const FROZEN_CONFIG: ReafferenceStudyConfig = {
  N: 6,
  M: 20,
  shiftCellsPerTick: 2,
  alpha: 1,
  g: 1,
  nu0: 0.2,
  kappa: 1,
  rho: 0.3,
  lambda: 20,
  dt: 0.01,
  shoutAmplitude: 0.5,
  shoutOmega: 5,
  shoutPhase: 0.3,
  shoutTicks: 5,
  windowHalfWidth: 2,
  observeAfterTicks: 3,
  calibrationSeed: 0,
  baseSeed: 1,
  seedCount: 20,
};

describe('pure core K8: docs/vessel/vessel-report.json matches the frozen config it was generated from', () => {
  it('the checked-in JSON is exactly reproducible from FROZEN_CONFIG', () => {
    const result = runReafferenceStudy(FROZEN_CONFIG);
    const report = exportVesselReportJson(FROZEN_CONFIG, result);
    const fullReport = { ...report, perSeed: result.perSeed };

    const onDisk = JSON.parse(readFileSync(resolve(__dirname, '../../../docs/vessel/vessel-report.json'), 'utf8'));

    expect(fullReport).toEqual(onDisk);
  });
});
