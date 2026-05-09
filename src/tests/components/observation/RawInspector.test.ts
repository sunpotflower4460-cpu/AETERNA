import { describe, expect, it } from 'vitest';
import { renderRawInspector } from '../../../components/observation/RawInspector.ts';
import type { ObservationReport } from '../../../types/observation.ts';

function makeReport(): ObservationReport {
  return {
    title: 'AETERNA Observation Layer',
    mode: 'observation-only',
    layout: 'desktop',
    status: 'closed',
    snapshots: [],
    timelineFrames: [
      {
        tick: 1,
        externalDriveTotal: 4,
        mediumStorageTotal: 0,
        dissipationTotal: 0,
        residueTotal: 0,
        outflowTotal: 0,
        membraneExchangeTotal: 0,
        transferEnergy: 0,
        pairResidual: 0,
        pairLedgerStatus: 'unknown',
        metricKind: 'derived',
      },
    ],
    anomalyReport: {
      anomalies: [],
      infoCount: 0,
      warningCount: 0,
      criticalCount: 0,
      maxSeverity: 'none',
      summaryLine: 'No observation anomalies detected.',
      metricKind: 'derived',
    },
    warnings: [],
    notes: ['Observation only — no runtime mutation'],
  };
}

describe('raw inspector', () => {
  it('renders JSON export by default for desktop', () => {
    const html = renderRawInspector(makeReport(), 'json', 'desktop');

    expect(html).toContain('Raw Inspector / Export');
    expect(html).toContain('data-layout="desktop"');
    expect(html).toContain('data-format="json"');
    expect(html).toContain('aeterna-observation-layer.json');
    expect(html).toContain('&quot;mode&quot;: &quot;observation-only&quot;');
  });

  it('renders summary text for mobile', () => {
    const html = renderRawInspector(makeReport(), 'summaryText', 'mobile');

    expect(html).toContain('data-layout="mobile"');
    expect(html).toContain('data-format="summaryText"');
    expect(html).toContain('aeterna-observation-layer-summary.txt');
    expect(html).toContain('mode: observation-only');
  });

  it('renders CSV timeline export', () => {
    const html = renderRawInspector(makeReport(), 'csv', 'desktop');

    expect(html).toContain('data-format="csv"');
    expect(html).toContain('aeterna-observation-layer-timeline.csv');
    expect(html).toContain('tick,externalDriveTotal,mediumStorageTotal');
  });

  it('escapes exported raw content', () => {
    const report = {
      ...makeReport(),
      title: '<script>alert(1)</script>',
    };
    const html = renderRawInspector(report, 'summaryText', 'mobile');

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
