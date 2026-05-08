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
  return Number.isFinite(value) ? value.toFixed(3) : '0.000';
}

export function renderFlowArrowCard(observation: TransferObservation | undefined): string {
  if (!observation) {
    return `
      <section class="obs-flow-arrow-card obs-flow-empty">
        <h3>Flow</h3>
        <p>No transfer flow observation attached.</p>
      </section>
    `;
  }

  return `
    <section class="obs-flow-arrow-card" data-status="${observation.pairLedgerStatus}">
      <h3>Flow</h3>
      <div class="obs-flow-node obs-flow-source">
        <span class="obs-flow-label">${escapeHtml(observation.sourceName)}</span>
        <strong>-${formatNumber(observation.sourceOutEnergy)}</strong>
      </div>
      <div class="obs-flow-arrow" aria-label="transfer amount">↓ ${formatNumber(observation.transferEnergy)}</div>
      <div class="obs-flow-node obs-flow-destination">
        <span class="obs-flow-label">${escapeHtml(observation.destinationName)}</span>
        <strong>+${formatNumber(observation.destinationInputEnergy)}</strong>
      </div>
      <p class="obs-flow-status">Pair Ledger: ${escapeHtml(observation.pairLedgerStatus)} · residual ${formatNumber(observation.residual)}</p>
    </section>
  `;
}
