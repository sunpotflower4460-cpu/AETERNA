import { describe, expect, it } from 'vitest';
import { renderFlowArrowCard } from '../../../components/observation/FlowArrowCard.ts';
import { renderTransferLedgerPanel } from '../../../components/observation/TransferLedgerPanel.ts';
import type { TransferObservation } from '../../../types/observation.ts';

function makeObservation(overrides: Partial<TransferObservation> = {}): TransferObservation {
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
    ...overrides,
  };
}

describe('transfer observation panels', () => {
  it('renders transfer ledger values for desktop layout', () => {
    const html = renderTransferLedgerPanel(makeObservation(), 'desktop');

    expect(html).toContain('Transfer Pair Ledger');
    expect(html).toContain('Source Out');
    expect(html).toContain('Destination Input');
    expect(html).toContain('1.000000');
    expect(html).toContain('same-index');
    expect(html).toContain('data-layout="desktop"');
    expect(html).toContain('data-status="closed"');
  });

  it('renders an empty transfer ledger placeholder when no observation is attached', () => {
    const html = renderTransferLedgerPanel(undefined, 'mobile');

    expect(html).toContain('No transfer observation attached');
    expect(html).toContain('data-layout="mobile"');
  });

  it('renders mobile-friendly flow arrow card values', () => {
    const html = renderFlowArrowCard(makeObservation());

    expect(html).toContain('Flow');
    expect(html).toContain('ExternalDriveField');
    expect(html).toContain('SpatialWorldMedium');
    expect(html).toContain('↓ 1.000');
    expect(html).toContain('Pair Ledger: closed');
  });

  it('renders open status without hiding residual', () => {
    const html = renderTransferLedgerPanel(makeObservation({
      pairLedgerStatus: 'open',
      matched: false,
      residual: 0.25,
      summaryLine: 'Transfer mismatch: sourceOut=1.000000 destinationInput=0.750000 residual=0.250000',
    }));

    expect(html).toContain('data-status="open"');
    expect(html).toContain('0.250000');
    expect(html).toContain('Transfer mismatch');
  });

  it('escapes transfer observation text for panel safety', () => {
    const html = renderTransferLedgerPanel(makeObservation({
      summaryLine: '<script>alert(1)</script>',
    }));

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
