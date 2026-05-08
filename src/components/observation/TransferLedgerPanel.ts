import type { TransferObservation } from '../../types/observation.ts';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(6) : '0.000000';
}

export function renderTransferLedgerPanel(
  observation: TransferObservation | undefined,
  mode: 'mobile' | 'desktop' = 'desktop',
): string {
  if (!observation) {
    return `
      <section class="obs-transfer-ledger-panel obs-transfer-empty" data-layout="${mode}">
        <h3>Transfer Ledger</h3>
        <p>No transfer observation attached.</p>
      </section>
    `;
  }

  return `
    <section class="obs-transfer-ledger-panel" data-layout="${mode}" data-status="${observation.pairLedgerStatus}">
      <header class="obs-panel-heading">
        <h3>Transfer Pair Ledger</h3>
        <span class="obs-status" data-status="${observation.pairLedgerStatus}">${escapeHtml(observation.pairLedgerStatus)}</span>
      </header>
      <dl class="obs-ledger-grid">
        <div><dt>Source Out</dt><dd>${formatNumber(observation.sourceOutEnergy)}</dd></div>
        <div><dt>Destination Input</dt><dd>${formatNumber(observation.destinationInputEnergy)}</dd></div>
        <div><dt>Residual</dt><dd>${formatNumber(observation.residual)}</dd></div>
        <div><dt>Mapping</dt><dd>${escapeHtml(observation.mapping)}</dd></div>
      </dl>
      <p class="obs-ledger-summary">${escapeHtml(observation.summaryLine)}</p>
    </section>
  `;
}
