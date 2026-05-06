/**
 * ReplaySnapshotSummary.tsx
 * v1.7: Deep Inspector / Time Replay — Replay Snapshot Summary
 *
 * Renders a compact summary of a single TimeReplaySnapshot, displaying the
 * global field summary values and event IDs at that tick.
 *
 * Design principles:
 * - Shows real snapshot values only; undefined → "(not observed)".
 * - No consciousness/emotion claims in display text.
 * - Event IDs are listed as identifiers, not interpreted narratively.
 *
 * Reference: docs/deep-inspector-time-replay.md §8
 */

import type { TimeReplaySnapshot } from '../../types/timeReplay.ts';

// ── renderReplaySnapshotSummaryHTML ───────────────────────────────────────────

/**
 * Render a TimeReplaySnapshot summary as HTML.
 *
 * @param snapshot - Snapshot to display, or null if unavailable
 */
export function renderReplaySnapshotSummaryHTML(
    snapshot: TimeReplaySnapshot | null,
): string {
    if (!snapshot) {
        return `<div class="replay-snapshot-summary replay-snapshot-summary--empty">
  <p class="replay-snapshot-summary__msg">No snapshot available for this tick.</p>
</div>`;
    }

    const { tick, globalSummary, eventIds, activeLensId, focusedMetricId } = snapshot;
    const { phaseCoherence, vortexCandidateCount, membraneOverlap, plasticityAccumulation,
            observedRatioMatchStrength, nanOrInfinityCount } = globalSummary;

    function _val(v: number | undefined, digits = 4): string {
        if (v === undefined || v === null) return '(not observed)';
        if (!Number.isFinite(v)) return '(non-finite)';
        return v.toFixed(digits);
    }

    const lensInfo = activeLensId
        ? `<span class="replay-snapshot-summary__lens">Lens: ${_esc(activeLensId)}</span>`
        : '';
    const metricInfo = focusedMetricId
        ? `<span class="replay-snapshot-summary__metric">Metric: ${_esc(focusedMetricId)}</span>`
        : '';

    const eventsHtml = eventIds.length > 0
        ? eventIds.map((id) => `<span class="replay-snapshot-summary__event-id">${_esc(id)}</span>`).join('')
        : '<span class="replay-snapshot-summary__no-events">—</span>';

    return `<div class="replay-snapshot-summary">
  <div class="replay-snapshot-summary__header">
    <span class="replay-snapshot-summary__tick">tick ${tick}</span>
    ${lensInfo}
    ${metricInfo}
  </div>
  <table class="replay-snapshot-summary__table">
    <tbody>
      <tr>
        <td>Phase Coherence</td>
        <td>${_val(phaseCoherence)}</td>
      </tr>
      <tr>
        <td>Vortex Candidates</td>
        <td>${vortexCandidateCount !== undefined ? vortexCandidateCount : '(not observed)'}</td>
      </tr>
      <tr>
        <td>Membrane Overlap</td>
        <td>${_val(membraneOverlap)}</td>
      </tr>
      <tr>
        <td>Plasticity Accum.</td>
        <td>${_val(plasticityAccumulation)}</td>
      </tr>
      <tr>
        <td>Ratio Match Strength</td>
        <td>${_val(observedRatioMatchStrength)}</td>
      </tr>
      <tr>
        <td>NaN/Inf Count</td>
        <td>${nanOrInfinityCount !== undefined ? nanOrInfinityCount : '(not observed)'}</td>
      </tr>
    </tbody>
  </table>
  <div class="replay-snapshot-summary__events">
    <span class="replay-snapshot-summary__events-label">Event IDs:</span>
    ${eventsHtml}
  </div>
</div>`;
}

function _esc(s: string | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
