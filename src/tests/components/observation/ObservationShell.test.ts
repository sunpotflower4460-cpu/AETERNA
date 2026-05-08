import { describe, expect, it } from 'vitest';
import { observeFieldSnapshots } from '../../../observer/fieldSnapshotObserver.ts';
import { renderObservationShell, resolveObservationLayout } from '../../../components/observation/ObservationShell.ts';
import type { ObservationReport, TransferObservation } from '../../../types/observation.ts';

function makeTransferObservation(): TransferObservation {
  return {
    sourceName: 'ExternalDriveField',
    destinationName: 'SpatialWorldMedium',
    sourceOutEnergy: 1,
    destinationInputEnergy: 1,
    transferEnergy: 1,
    residual: 0,
    signedResidual: 0,
    pairLedgerStatus: 'closed',
    matched: true,
    mapping: 'same-index',
    metricKind: 'ledger',
    summaryLine: 'Transfer matched: sourceOut=1.000000 destinationInput=1.000000 residual=0.000000',
    warnings: [],
  };
}

function makeReport(): ObservationReport {
  return {
    title: 'AETERNA Observation Layer',
    mode: 'observation-only',
    layout: 'desktop',
    status: 'closed',
    snapshots: observeFieldSnapshots([
      { fieldName: 'ExternalDriveField', field: [1, 1, 0, 0] },
      { fieldName: 'SpatialWorldMedium', field: [0, 2, 0, 0] },
    ]),
    transferObservation: makeTransferObservation(),
    warnings: [],
    notes: ['Observation only — no runtime mutation'],
  };
}

describe('observation shell', () => {
  it('resolves mobile, tablet, and desktop layouts from viewport width', () => {
    expect(resolveObservationLayout({ width: 390 })).toBe('mobile');
    expect(resolveObservationLayout({ width: 900 })).toBe('tablet');
    expect(resolveObservationLayout({ width: 1440 })).toBe('desktop');
  });

  it('renders mobile tabs and transfer cards for small screens', () => {
    const result = renderObservationShell(makeReport(), { width: 390 });

    expect(result.layout).toBe('mobile');
    expect(result.html).toContain('obs-mobile');
    expect(result.html).toContain('data-tab="current"');
    expect(result.html).toContain('data-panel="flow"');
    expect(result.html).toContain('data-panel="ledger"');
    expect(result.html).toContain('Transfer Pair Ledger');
    expect(result.html).toContain('↓ 1.000');
    expect(result.html).toContain('Observation only');
  });

  it('renders desktop dashboard with transfer ledger and flow panels for wide screens', () => {
    const result = renderObservationShell(makeReport(), { width: 1440 });

    expect(result.layout).toBe('desktop');
    expect(result.html).toContain('obs-desktop');
    expect(result.html).toContain('obs-dashboard-grid');
    expect(result.html).toContain('Raw Inspector');
    expect(result.html).toContain('Transfer Pair Ledger');
    expect(result.html).toContain('Source Out');
    expect(result.html).toContain('Destination Input');
    expect(result.html).toContain('Observation only — no runtime mutation');
  });

  it('uses the same observation data while changing only the layout', () => {
    const report = makeReport();
    const mobile = renderObservationShell(report, { width: 390 });
    const desktop = renderObservationShell(report, { width: 1440 });

    expect(mobile.html).toContain('ExternalDriveField');
    expect(desktop.html).toContain('ExternalDriveField');
    expect(mobile.html).toContain('Transfer matched');
    expect(desktop.html).toContain('Transfer matched');
    expect(mobile.sections).toEqual(desktop.sections);
  });

  it('does not include life metaphor terms in shell output', () => {
    const html = renderObservationShell(makeReport(), { width: 1440 }).html;
    const forbidden = ['vital', 'breath', 'heartbeat', 'pulse', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];

    for (const term of forbidden) {
      expect(html.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
