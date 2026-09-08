import { describe, expect, it } from 'vitest';
import { exportVesselReportV2Json, buildSizeTimescaleWorldTable } from '../../pure/run/exportVesselReportV2.ts';
import { EMERGENCE_CEILING_MAP } from '../../pure/run/emergenceCeilingMap.ts';

describe('pure core K16 exportVesselReportV2: shape and consistency', () => {
  it('covers exactly K9 through K15', () => {
    const report = exportVesselReportV2Json();
    expect(report.formatVersion).toBe(2);
    expect(report.coveredPhases).toEqual(['K9', 'K10', 'K11', 'K12', 'K13', 'K14', 'K15']);
  });

  it('embeds the same EMERGENCE_CEILING_MAP array the doc generator uses (no separate copy)', () => {
    const report = exportVesselReportV2Json();
    expect(report.emergenceCeilingMap).toBe(EMERGENCE_CEILING_MAP);
  });

  it('is deterministic: two calls produce deeply equal reports', () => {
    expect(exportVesselReportV2Json()).toEqual(exportVesselReportV2Json());
  });

  it('every phase reports a positive newTests count', () => {
    const report = exportVesselReportV2Json();
    for (const phase of [report.k9, report.k10, report.k11, report.k12, report.k13, report.k14, report.k15]) {
      expect(phase.newTests).toBeGreaterThan(0);
    }
  });

  it('K9 performance table has one row per tested N, ticksPerSecond decreasing as N increases past 32', () => {
    const { performanceTable } = exportVesselReportV2Json().k9;
    expect(performanceTable).toHaveLength(5);
    const spectralRows = performanceTable.filter((r) => r.solverKind === 'spectral');
    for (let i = 1; i < spectralRows.length; i++) {
      expect(spectralRows[i].ticksPerSecond).toBeLessThan(spectralRows[i - 1].ticksPerSecond);
    }
  });

  it('K10 honestly reports the cross-process and chained runs never reaching the literal 10^6-tick target', () => {
    const k10 = exportVesselReportV2Json().k10;
    expect(k10.chainedRun.totalTicks).toBeLessThan(1_000_000);
    expect(k10.honestShortfall.length).toBeGreaterThan(0);
  });

  it('K12 records L2 satisfaction as 0/10 for both arms with zero variance (the decisive-falsifier-defining fact)', () => {
    const k12 = exportVesselReportV2Json().k12;
    for (const arm of k12.arms) {
      expect(arm.l2SatisfiedFraction).toContain('0/10');
      expect(arm.varianceAcrossAllRuns).toBe(0);
    }
  });

  it('K14 L2 table has one row per system size tested, all showing L2 unsatisfied', () => {
    const l2 = exportVesselReportV2Json().k14.l2;
    expect(l2.map((r) => r.N)).toEqual([64, 128, 256]);
    for (const row of l2) {
      expect(row.l2Satisfied).toBe('0/10');
    }
  });

  it('K14 L6 result shows zero censored runs alongside 0/10 satisfaction (a confirmed null, not an unknown)', () => {
    const l6 = exportVesselReportV2Json().k14.l6;
    expect(l6.satisfiesL6Fraction).toBe('0/10');
    expect(l6.censoredCount).toBe(0);
  });

  it('K15 validation table has 6 rows, none reporting a failure', () => {
    const validation = exportVesselReportV2Json().k15.validation;
    expect(validation).toHaveLength(6);
    for (const row of validation) {
      expect(row.result).not.toMatch(/失敗|FAIL|不一致|停止条件.*(あり|検出)/);
    }
  });
});

describe('pure core K16 buildSizeTimescaleWorldTable: mechanical derivation from emergenceCeilingMap', () => {
  it('excludes every n/a (no scored dynamical run) entry', () => {
    const table = buildSizeTimescaleWorldTable();
    const naCount = EMERGENCE_CEILING_MAP.filter((e) => e.worldPresence === 'n/a').length;
    expect(table).toHaveLength(EMERGENCE_CEILING_MAP.length - naCount);
    for (const row of table) {
      expect(row.worldPresence).not.toBe('n/a');
    }
  });

  it('every row has a non-empty systemSizes array and a positive ticks value', () => {
    for (const row of buildSizeTimescaleWorldTable()) {
      expect(row.systemSizes.length).toBeGreaterThan(0);
      expect(row.ticks).toBeGreaterThan(0);
    }
  });

  it('includes the K14-PR3 row with all three tested system sizes', () => {
    const row = buildSizeTimescaleWorldTable().find((r) => r.phase === 'K14-PR3');
    expect(row).toBeDefined();
    expect(row!.systemSizes).toEqual([64, 128, 256]);
  });

  it('accepts a custom entries array (not hardcoded to the module-level singleton)', () => {
    const custom = [EMERGENCE_CEILING_MAP[3]]; // K2 PR5, has real systemSizes
    const table = buildSizeTimescaleWorldTable(custom);
    expect(table).toHaveLength(1);
    expect(table[0].phase).toBe('K2 PR5');
  });
});
