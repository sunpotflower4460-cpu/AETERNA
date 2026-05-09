import { describe, expect, it } from 'vitest';
import { renderAnomalyPanel } from '../../../components/observation/AnomalyPanel.ts';
import type { ObservationAnomalyReport } from '../../../types/observation.ts';

function makeReport(overrides: Partial<ObservationAnomalyReport> = {}): ObservationAnomalyReport {
  return {
    anomalies: [
      {
        id: 'unknown-change:2:SpatialWorldMedium:0',
        tick: 2,
        severity: 'warning',
        kind: 'unknownChange',
        message: 'SpatialWorldMedium had an unexplained increase of 1.',
        suspectedCause: 'SpatialWorldMedium changed by an amount not explained by transfer or named destination fields.',
        relatedFields: ['SpatialWorldMedium'],
        metricKind: 'derived',
      },
    ],
    infoCount: 0,
    warningCount: 1,
    criticalCount: 0,
    maxSeverity: 'warning',
    summaryLine: 'anomalies=1 info=0 warning=1 critical=0',
    metricKind: 'derived',
    ...overrides,
  };
}

describe('anomaly panel', () => {
  it('renders anomaly counts and items for desktop', () => {
    const html = renderAnomalyPanel(makeReport(), 'desktop');

    expect(html).toContain('Audit');
    expect(html).toContain('data-layout="desktop"');
    expect(html).toContain('data-max-severity="warning"');
    expect(html).toContain('SpatialWorldMedium');
    expect(html).toContain('unknownChange');
    expect(html).toContain('warning');
    expect(html).toContain('unexplained increase');
  });

  it('renders no-anomaly state clearly', () => {
    const html = renderAnomalyPanel({
      anomalies: [],
      infoCount: 0,
      warningCount: 0,
      criticalCount: 0,
      maxSeverity: 'none',
      summaryLine: 'No observation anomalies detected.',
      metricKind: 'derived',
    }, 'mobile');

    expect(html).toContain('data-layout="mobile"');
    expect(html).toContain('data-max-severity="none"');
    expect(html).toContain('No anomalies detected.');
  });

  it('renders empty placeholder when no report is attached', () => {
    const html = renderAnomalyPanel(undefined, 'mobile');

    expect(html).toContain('No anomaly report attached');
    expect(html).toContain('data-layout="mobile"');
  });

  it('renders critical anomalies without hiding severity', () => {
    const html = renderAnomalyPanel(makeReport({
      anomalies: [
        {
          id: 'pair-residual-too-high:frame:3',
          tick: 3,
          severity: 'critical',
          kind: 'pairResidualTooHigh',
          message: 'Pair residual exceeded tolerance at tick 3.',
          suspectedCause: 'Timeline frame residual is larger than the configured observation tolerance.',
          relatedFields: ['ExternalDriveField', 'SpatialWorldMedium'],
          metricKind: 'derived',
        },
      ],
      infoCount: 0,
      warningCount: 0,
      criticalCount: 1,
      maxSeverity: 'critical',
      summaryLine: 'anomalies=1 info=0 warning=0 critical=1',
    }), 'desktop');

    expect(html).toContain('data-max-severity="critical"');
    expect(html).toContain('critical');
    expect(html).toContain('pairResidualTooHigh');
    expect(html).toContain('Pair residual exceeded tolerance');
  });

  it('escapes anomaly text', () => {
    const html = renderAnomalyPanel(makeReport({
      anomalies: [
        {
          id: 'xss-test',
          tick: null,
          severity: 'warning',
          kind: 'upstreamWarning',
          message: '<script>alert(1)</script>',
          suspectedCause: '<img src=x onerror=alert(1)>',
          relatedFields: ['<bad>'],
          metricKind: 'derived',
        },
      ],
      summaryLine: '<script>bad()</script>',
    }), 'mobile');

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;bad&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
