import { describe, expect, it } from 'vitest';
import { renderTimelinePanel } from '../../../components/observation/TimelinePanel.ts';
import { summarizeObservationTimeline } from '../../../observer/observationTimeline.ts';
import type { ObservationTimelineFrame } from '../../../types/observation.ts';

function makeFrame(tick: number, overrides: Partial<ObservationTimelineFrame> = {}): ObservationTimelineFrame {
  return {
    tick,
    externalDriveTotal: 4 - tick,
    mediumStorageTotal: tick,
    dissipationTotal: 0,
    residueTotal: 0,
    outflowTotal: 0,
    membraneExchangeTotal: 0,
    transferEnergy: tick === 1 ? 0 : 1,
    pairResidual: 0,
    pairLedgerStatus: tick === 1 ? 'unknown' : 'closed',
    metricKind: 'derived',
    ...overrides,
  };
}

describe('timeline panel', () => {
  it('renders empty placeholder when no timeline frames exist', () => {
    const html = renderTimelinePanel(undefined, undefined, 'mobile');

    expect(html).toContain('Observation Timeline');
    expect(html).toContain('No timeline frames recorded');
    expect(html).toContain('data-layout="mobile"');
  });

  it('renders mobile tick cards', () => {
    const frames = [makeFrame(1), makeFrame(2)];
    const summary = summarizeObservationTimeline(frames);
    const html = renderTimelinePanel(frames, summary, 'mobile');

    expect(html).toContain('data-layout="mobile"');
    expect(html).toContain('tick 1');
    expect(html).toContain('tick 2');
    expect(html).toContain('External');
    expect(html).toContain('Transfer');
    expect(html).toContain('total transfer 1.000');
  });

  it('renders desktop table rows', () => {
    const frames = [makeFrame(1), makeFrame(2)];
    const summary = summarizeObservationTimeline(frames);
    const html = renderTimelinePanel(frames, summary, 'desktop');

    expect(html).toContain('data-layout="desktop"');
    expect(html).toContain('<th>tick</th>');
    expect(html).toContain('<td>2</td>');
    expect(html).toContain('<th>external</th>');
    expect(html).toContain('<th>medium</th>');
    expect(html).toContain('<th>residual</th>');
  });

  it('renders open status without hiding residual', () => {
    const frames = [makeFrame(3, { pairLedgerStatus: 'open', pairResidual: 0.25 })];
    const summary = summarizeObservationTimeline(frames);
    const html = renderTimelinePanel(frames, summary, 'desktop');

    expect(html).toContain('data-status="open"');
    expect(html).toContain('0.250');
    expect(html).toContain('open');
  });

  it('does not include life metaphor terms in timeline output', () => {
    const frames = [makeFrame(1), makeFrame(2)];
    const html = renderTimelinePanel(frames, summarizeObservationTimeline(frames), 'desktop');
    const forbidden = ['vital', 'breath', 'heartbeat', 'pulse', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];

    for (const term of forbidden) {
      expect(html.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
