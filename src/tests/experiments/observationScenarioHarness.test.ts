import { describe, expect, it } from 'vitest';
import { runObservationScenarioHarness } from '../../experiments/observationScenarioHarness.ts';

describe('observation scenario harness', () => {
  it('runs a repeatable transfer scenario through the full observation pipeline', () => {
    const result = runObservationScenarioHarness({
      width: 2,
      height: 2,
      steadyDrivePerCell: 1,
      transferCoefficient: 0.25,
      dt: 1,
      tolerance: 1e-9,
    });

    expect(result.report.mode).toBe('observation-only');
    expect(result.report.status).toBe('closed');
    expect(result.frames).toHaveLength(2);
    expect(result.report.timelineFrames).toHaveLength(2);
    expect(result.report.transferObservation?.pairLedgerStatus).toBe('closed');
    expect(result.report.transferObservation?.transferEnergy).toBe(1);
    expect(result.report.timelineSummary?.totalTransferred).toBe(1);
    expect(result.report.flowAttribution?.unknownChangeCount).toBe(0);
    expect(result.report.anomalyReport?.anomalies).toEqual([]);
    expect(result.exports.json.format).toBe('json');
    expect(result.exports.csv.format).toBe('csv');
    expect(result.exports.summaryText.format).toBe('summaryText');
  });

  it('keeps the scenario scoped to transfer observation and does not run medium update destinations', () => {
    const result = runObservationScenarioHarness();
    const finalFrame = result.frames[result.frames.length - 1];

    expect(finalFrame.dissipationTotal).toBe(0);
    expect(finalFrame.residueTotal).toBe(0);
    expect(finalFrame.outflowTotal).toBe(0);
    expect(finalFrame.membraneExchangeTotal).toBe(0);
    expect(result.report.notes.join('\n')).toContain('does not run SpatialWorldMedium update behavior');
    expect(result.report.notes.join('\n')).toContain('does not couple into AETERNA internals');
  });

  it('is deterministic for the same input config', () => {
    const first = runObservationScenarioHarness({ steadyDrivePerCell: 0.5, transferCoefficient: 0.5 });
    const second = runObservationScenarioHarness({ steadyDrivePerCell: 0.5, transferCoefficient: 0.5 });

    expect(first.report.timelineFrames).toEqual(second.report.timelineFrames);
    expect(first.report.transferObservation).toEqual(second.report.transferObservation);
    expect(first.exports.csv.content).toBe(second.exports.csv.content);
  });

  it('exports observation report content from the harness', () => {
    const result = runObservationScenarioHarness();

    expect(result.exports.json.content).toContain('AETERNA Observation Scenario Harness');
    expect(result.exports.csv.content).toContain('tick,externalDriveTotal,mediumStorageTotal');
    expect(result.exports.summaryText.content).toContain('mode: observation-only');
    expect(result.exports.summaryText.content).toContain('timelineFrames: 2');
  });

  it('does not include life metaphor terms in scenario report or exports', () => {
    const result = runObservationScenarioHarness();
    const combined = [
      JSON.stringify(result.report),
      result.exports.json.content,
      result.exports.csv.content,
      result.exports.summaryText.content,
    ].join('\n');
    const forbidden = ['vital', 'breath', 'heartbeat', 'pulse', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];

    for (const term of forbidden) {
      expect(combined.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
