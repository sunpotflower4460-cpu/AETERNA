/**
 * CellInspectorPanel.tsx
 * v1.7: Deep Inspector / Time Replay — Cell Inspector Panel
 *
 * Renders the full Cell Inspector panel for a selected cell.
 * Connected to CellObservation via buildCellObservation / deriveCellObservation.
 *
 * Design principles:
 * - Shows real CellObservation data only.
 * - undefined values → "(not observed)" — never substituted with 0 or fake values.
 * - Value Kind badges are shown for each metric group.
 * - Metric row click triggers focusMetric + activateLens.
 * - Warnings are shown in small text.
 * - Recent events are shown from actual event data.
 * - No semantic labels, no consciousness claims.
 *
 * Reference: docs/deep-inspector-time-replay.md §4
 */

import type { CellObservation } from '../../types/cellObservation.ts';
import type { MetricLensId } from '../lens/metricLensRegistry.ts';
import { findLensForMetric } from '../lens/metricLensRegistry.ts';
import { formatMetricValue, renderCellMetricRowHTML, type CellMetricRowData } from './CellMetricRow.tsx';

// ── CellInspectorPanelProps ───────────────────────────────────────────────────

export interface CellInspectorPanelProps {
    /** Current cell observation (null = no cell selected) */
    observation: CellObservation | null;
    /** Currently active lens ID */
    activeLensId: MetricLensId | null;
    /** Currently selected metric ID */
    selectedMetricId: string | null;
    /** Called when a metric row is clicked */
    onMetricClick: (metricId: string, lensId: MetricLensId | null) => void;
    /** Recent event objects for this cell */
    recentEvents?: Array<{ id: string; tick: number; kind?: string; text?: string }>;
    /** Called when an event row is clicked (for replay navigation) */
    onEventClick?: (eventId: string, tick: number) => void;
    /** Whether the panel is in replay mode */
    isReplayMode?: boolean;
}

// ── buildCellMetricRows ───────────────────────────────────────────────────────

/**
 * Build CellMetricRowData entries from a CellObservation.
 */
export function buildCellMetricRows(obs: CellObservation): CellMetricRowData[] {
    const rows: CellMetricRowData[] = [];
    const { geometry, field, vortex, membrane, plasticity, ratios, diagnostics } = obs;

    function addRow(
        metricId: string,
        label: string,
        value: number | undefined | null,
        unit: string,
        groupKind: CellObservation['diagnostics']['valueKinds'][keyof CellObservation['diagnostics']['valueKinds']],
    ): void {
        const lensId = findLensForMetric(metricId)?.id ?? null;
        rows.push({
            metricId,
            label,
            value,
            unit,
            valueKind: value === undefined || value === null ? 'unavailable' : groupKind,
            lensId,
        });
    }

    // Geometry
    addRow('geometry.gaussianCurvature', 'Gaussian Curvature', geometry.gaussianCurvature, 'm⁻²', diagnostics.valueKinds.geometry);
    addRow('geometry.areaElement',       'Area Element',       geometry.areaElement,       'norm', diagnostics.valueKinds.geometry);
    addRow('geometry.innerOuterBias',    'Inner–Outer Bias',   geometry.innerOuterBias,    'norm', diagnostics.valueKinds.geometry);
    addRow('geometry.majorAngle',        'Major Angle (u)',    geometry.majorAngle,        'rad',  diagnostics.valueKinds.geometry);
    addRow('geometry.minorAngle',        'Minor Angle (v)',    geometry.minorAngle,        'rad',  diagnostics.valueKinds.geometry);
    addRow('geometry.meanCurvature',     'Mean Curvature',     geometry.meanCurvature,     'm⁻¹', diagnostics.valueKinds.geometry);

    // Field
    addRow('field.amplitude',           'Field Amplitude',       field.amplitude,           'raw',  diagnostics.valueKinds.field);
    addRow('field.phase',               'Field Phase',           field.phase,               'rad',  diagnostics.valueKinds.field);
    addRow('field.phaseCoherenceLocal', 'Local Phase Coherence', field.phaseCoherenceLocal, 'norm', diagnostics.valueKinds.field);
    addRow('field.flowContinuityLocal', 'Local Flow Continuity', field.flowContinuityLocal, 'norm', diagnostics.valueKinds.field);
    addRow('field.energyThroughputLocal','Local Energy Throughput',field.energyThroughputLocal,'raw',diagnostics.valueKinds.field);

    // Vortex
    addRow('vortex.candidateConfidence', 'Vortex Candidate Confidence', vortex.candidateConfidence, 'norm', diagnostics.valueKinds.vortex);
    addRow('vortex.topologicalCharge',   'Topological Charge',          vortex.topologicalCharge,   'int',  diagnostics.valueKinds.vortex);
    addRow('vortex.phaseWinding',        'Phase Winding',               vortex.phaseWinding,        'rad',  diagnostics.valueKinds.vortex);

    // Membrane
    addRow('membrane.deformation',      'Membrane Deformation',   membrane.deformation,      'norm', diagnostics.valueKinds.membrane);
    addRow('membrane.tension',          'Membrane Tension',       membrane.tension,          'norm', diagnostics.valueKinds.membrane);
    addRow('membrane.permeability',     'Membrane Permeability',  membrane.permeability,     'norm', diagnostics.valueKinds.membrane);
    addRow('membrane.returnImprint',    'Return Imprint',         membrane.returnImprint,    'norm', diagnostics.valueKinds.membrane);
    addRow('membrane.twoSidedness',     'Two-Sidedness',          membrane.twoSidedness,     'norm', diagnostics.valueKinds.membrane);

    // Plasticity
    addRow('plasticity.accumulatedTrace',   'Plasticity Trace',       plasticity.accumulatedTrace,        'norm', diagnostics.valueKinds.plasticity);
    addRow('plasticity.resistanceScale',    'Resistance Scale',       plasticity.resistanceScale,         'ratio',diagnostics.valueKinds.plasticity);

    // Ratios
    addRow('ratios.strongestMatchStrength', 'Observed Ratio Match', ratios.strongestMatchStrength ?? undefined, 'norm', diagnostics.valueKinds.ratios);

    return rows;
}

// ── renderCellInspectorPanelHTML ──────────────────────────────────────────────

/**
 * Render the Cell Inspector panel as an HTML string.
 *
 * @param props - CellInspectorPanelProps
 * @returns     - HTML string for the panel
 */
export function renderCellInspectorPanelHTML(props: CellInspectorPanelProps): string {
    const { observation, activeLensId, selectedMetricId, recentEvents = [], isReplayMode = false } = props;

    if (!observation) {
        return `<div class="cell-inspector-panel cell-inspector-panel--empty">
  <p class="cell-inspector-panel__empty-msg">Select a cell on the torus to inspect it.</p>
</div>`;
    }

    const { cellIndex, geometry, events, diagnostics } = observation;

    const cellLabel = geometry.i !== undefined && geometry.j !== undefined
        ? `Cell i=${geometry.i}, j=${geometry.j} (index ${cellIndex})`
        : `Cell index ${cellIndex}`;

    const regionLabel = geometry.regionLabel ?? '—';
    const replayBadge = isReplayMode
        ? `<span class="cell-inspector-panel__replay-badge">Replay</span>`
        : '';

    const rows = buildCellMetricRows(observation);
    const rowsHtml = rows.map((row) => {
        const isActive = row.metricId === selectedMetricId;
        const rowWithActive: CellMetricRowData = { ...row, active: isActive };
        const onClickAttr = `window.dispatchEvent(new CustomEvent('inspector:metricClick',{detail:{metricId:'${row.metricId}',lensId:'${row.lensId ?? ''}'}}))`;
        return renderCellMetricRowHTML(rowWithActive, onClickAttr);
    }).join('');

    // Recent events for this cell
    const eventsToShow = recentEvents.length > 0
        ? recentEvents
        : (events.recentEventIds.length > 0
            ? events.recentEventIds.map((id) => ({ id, tick: events.lastEventTick ?? 0 }))
            : []);

    const eventsHtml = eventsToShow.length > 0
        ? eventsToShow.map((ev) => {
            const text = 'text' in ev && ev.text ? ev.text : `Event ${ev.id}`;
            const tick = ev.tick;
            return `<div class="cell-inspector-panel__event"
  data-event-id="${_esc(ev.id)}"
  data-tick="${tick}"
  onclick="window.dispatchEvent(new CustomEvent('inspector:eventClick',{detail:{eventId:'${_esc(ev.id)}',tick:${tick}}}))"
  role="button" tabindex="0">
  <span class="cell-inspector-panel__event-tick">tick ${tick}</span>
  <span class="cell-inspector-panel__event-text">${_esc(text)}</span>
</div>`;
        }).join('')
        : '<span class="cell-inspector-panel__no-events">No recent events for this cell.</span>';

    const missingNote = diagnostics.hasUnavailableSource
        ? `<p class="cell-inspector-panel__missing-note">Some observer data unavailable (${diagnostics.missingFieldCount} fields not observed).</p>`
        : '';

    const activeLensInfo = activeLensId
        ? `<span class="cell-inspector-panel__active-lens">Active lens: ${_esc(activeLensId)}</span>`
        : '';

    return `<div class="cell-inspector-panel">
  <div class="cell-inspector-panel__header">
    <span class="cell-inspector-panel__title">${_esc(cellLabel)}</span>
    ${replayBadge}
    ${activeLensInfo}
  </div>
  <div class="cell-inspector-panel__region">
    Region: <strong>${_esc(regionLabel)}</strong>
    &nbsp;|&nbsp;
    u=${_esc(formatMetricValue(geometry.majorAngle, 'rad'))}
    &nbsp;
    v=${_esc(formatMetricValue(geometry.minorAngle, 'rad'))}
  </div>
  ${missingNote}
  <div class="cell-inspector-panel__metrics">
    ${rowsHtml}
  </div>
  <div class="cell-inspector-panel__events-section">
    <div class="cell-inspector-panel__events-title">Recent Events</div>
    ${eventsHtml}
  </div>
</div>`;
}

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
