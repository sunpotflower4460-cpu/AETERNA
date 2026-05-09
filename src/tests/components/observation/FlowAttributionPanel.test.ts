import { describe, expect, it } from 'vitest';
import { renderFlowAttributionPanel } from '../../../components/observation/FlowAttributionPanel.ts';
import type { FlowAttributionReport } from '../../../types/observation.ts';

function makeReport(overrides: Partial<FlowAttributionReport> = {}): FlowAttributionReport {
  return {
    tick: 2,
    items: [
      {
        tick: 2,
        fieldName: 'ExternalDriveField',
        kind: 'transfer',
        direction: 'decrease',
        amount: 1,
        reason: 'ExternalDriveField decreased because transfer source out matched SpatialWorldMedium destination input.',
        confidence: 'high',
        metricKind: 'derived',
      },
      {
        tick: 2,
        fieldName: 'SpatialWorldMedium',
        kind: 'transfer',
        direction: 'increase',
        amount: 1,
        reason: 'SpatialWorldMedium increased because transfer destination input matched ExternalDriveField source out.',
        confidence: 'high',
        metricKind: 'derived',
      },
    ],
    unknownChangeCount: 0,
    summaryLine: 'tick 2: 2 attribution item(s), unknown=0',
    warnings: [],
    metricKind: 'derived',
    ...overrides,
  };
}

describe('flow attribution panel', () => {
  it('renders flow attribution items for desktop', () => {
    const html = renderFlowAttributionPanel(makeReport(), 'desktop');

    expect(html).toContain('Flow Attribution');
    expect(html).toContain('ExternalDriveField');
    expect(html).toContain('SpatialWorldMedium');
    expect(html).toContain('transfer');
    expect(html).toContain('1.000');
    expect(html).toContain('data-layout="desktop"');
    expect(html).toContain('data-unknown-count="0"');
  });

  it('renders empty placeholder when no report is attached', () => {
    const html = renderFlowAttributionPanel(undefined, 'mobile');

    expect(html).toContain('No flow attribution report attached');
    expect(html).toContain('data-layout="mobile"');
  });

  it('renders warning text and unknown count', () => {
    const html = renderFlowAttributionPanel(makeReport({
      unknownChangeCount: 1,
      warnings: ['1 unexplained field change(s) detected.'],
    }), 'desktop');

    expect(html).toContain('data-unknown-count="1"');
    expect(html).toContain('unexplained field change');
  });

  it('escapes attribution reason text', () => {
    const report = makeReport({
      items: [
        {
          tick: 2,
          fieldName: 'SpatialWorldMedium',
          kind: 'unknownChange',
          direction: 'increase',
          amount: 1,
          reason: '<script>alert(1)</script>',
          confidence: 'low',
          metricKind: 'derived',
        },
      ],
      unknownChangeCount: 1,
      summaryLine: '<script>bad()</script>',
    });

    const html = renderFlowAttributionPanel(report, 'mobile');

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;script&gt;bad()&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
