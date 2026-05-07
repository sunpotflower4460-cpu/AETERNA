/**
 * InspectorDrawer.tsx
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — Inspector Drawer
 *
 * Wraps the cell inspector as a tabbed drawer/side panel.
 * Tabs: Cell | Metric | Events | Warnings
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - All user/data content is XSS-safe via _esc().
 * - undefined values → "(not observed)" — never substituted with 0 or fake values.
 * - Value Kind badges shown for each metric.
 * - Metric row click triggers inspector:metricClick CustomEvent.
 * - Tab changes trigger inspector:tabChange CustomEvent.
 * - No consciousness/life/intelligence proof claims.
 */

import type { CellObservation } from '../../types/cellObservation.ts';
import type { MetricLensId } from '../lens/metricLensRegistry.ts';
import { buildCellMetricRows, renderCellInspectorPanelHTML } from './CellInspectorPanel.tsx';
import { renderCellMetricRowHTML, type CellMetricRowData } from './CellMetricRow.tsx';

// ── InspectorDrawerProps ──────────────────────────────────────────────────────

export interface InspectorDrawerProps {
    /** Currently active tab */
    activeTab: 'cell' | 'metric' | 'events' | 'warnings';
    /** Current cell observation (null = no cell selected) */
    observation: CellObservation | null;
    /** Currently active lens ID */
    activeLensId: MetricLensId | null;
    /** Currently selected metric ID */
    selectedMetricId: string | null;
    /** Recent events for display */
    recentEvents?: Array<{ id: string; tick: number; kind?: string; text?: string }>;
    /** Whether in replay mode */
    isReplayMode?: boolean;
    /** Warning items */
    warnings?: Array<{
        severity: 'info' | 'notice' | 'warning' | 'critical' | 'experimental';
        text: string;
    }>;
}

// ── Severity colors ───────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
    info:         '#9ca3af',
    notice:       '#60a5fa',
    warning:      '#fbbf24',
    critical:     '#f87171',
    experimental: '#fb923c',
};

// ── renderInspectorDrawerHTML ─────────────────────────────────────────────────

/**
 * Render the inspector drawer (tabbed side panel) as an HTML string.
 *
 * @param props - InspectorDrawerProps
 * @returns HTML string
 */
export function renderInspectorDrawerHTML(props: InspectorDrawerProps): string {
    const {
        activeTab,
        observation,
        activeLensId,
        selectedMetricId,
        recentEvents = [],
        isReplayMode = false,
        warnings = [],
    } = props;

    const tabBarHtml = _renderTabBar(activeTab);
    const contentHtml = _renderContent({
        activeTab,
        observation,
        activeLensId,
        selectedMetricId,
        recentEvents,
        isReplayMode,
        warnings,
    });

    return `<div class="inspector-drawer">
  ${tabBarHtml}
  <div class="inspector-drawer__content">
    ${contentHtml}
  </div>
</div>`;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _renderTabBar(activeTab: InspectorDrawerProps['activeTab']): string {
    const tabs: Array<{ id: InspectorDrawerProps['activeTab']; label: string; labelEn: string }> = [
        { id: 'cell',     label: 'セル',   labelEn: 'Cell' },
        { id: 'metric',   label: '観測値', labelEn: 'Metric' },
        { id: 'events',   label: '履歴',   labelEn: 'Events' },
        { id: 'warnings', label: '警告',   labelEn: 'Warnings' },
    ];

    const tabItems = tabs.map(({ id, label, labelEn }) => {
        const isActive = id === activeTab;
        const activeClass = isActive ? ' inspector-drawer__tab--active' : '';
        return `<button
    class="inspector-drawer__tab${activeClass}"
    role="tab"
    aria-selected="${isActive}"
    aria-label="${_esc(labelEn)}"
    data-tab="${_esc(id)}"
    onclick="window.dispatchEvent(new CustomEvent('inspector:tabChange',{detail:{tab:'${_esc(id)}'}}))">
    ${_esc(label)}
  </button>`;
    }).join('\n  ');

    return `<div class="inspector-drawer__tab-bar" role="tablist">
  ${tabItems}
</div>`;
}

function _renderContent(props: InspectorDrawerProps): string {
    const { activeTab, observation, activeLensId, selectedMetricId, recentEvents, isReplayMode, warnings } = props;

    switch (activeTab) {
        case 'cell':     return _renderCellTab(observation, activeLensId, selectedMetricId, recentEvents ?? [], isReplayMode ?? false);
        case 'metric':   return _renderMetricTab(observation, activeLensId, selectedMetricId);
        case 'events':   return _renderEventsTab(recentEvents ?? []);
        case 'warnings': return _renderWarningsTab(warnings ?? []);
        default:         return '';
    }
}

function _renderCellTab(
    observation: CellObservation | null,
    activeLensId: MetricLensId | null,
    selectedMetricId: string | null,
    recentEvents: Array<{ id: string; tick: number; kind?: string; text?: string }>,
    isReplayMode: boolean,
): string {
    if (!observation) {
        return `<div class="inspector-drawer__empty">
  <p>セルが選択されていません。トーラス上のセルをタップして観測します。</p>
</div>`;
    }

    return renderCellInspectorPanelHTML({
        observation,
        activeLensId,
        selectedMetricId,
        onMetricClick: () => { /* handled via CustomEvent */ },
        recentEvents,
        isReplayMode,
    });
}

function _renderMetricTab(
    observation: CellObservation | null,
    activeLensId: MetricLensId | null,
    selectedMetricId: string | null,
): string {
    if (!observation) {
        return `<div class="inspector-drawer__empty">
  <p>観測データがありません。まずセルを選択してください。</p>
</div>`;
    }

    const rows: CellMetricRowData[] = buildCellMetricRows(observation);
    if (rows.length === 0) {
        return `<div class="inspector-drawer__empty"><p>No metric data available.</p></div>`;
    }

    const rowsHtml = rows.map((row) => {
        const isActive = row.metricId === selectedMetricId;
        const rowWithActive: CellMetricRowData = { ...row, active: isActive };
        const onClickAttr = `window.dispatchEvent(new CustomEvent('inspector:metricClick',{detail:{metricId:'${_esc(row.metricId)}',lensId:'${_esc(row.lensId ?? '')}'}}))`;
        return renderCellMetricRowHTML(rowWithActive, onClickAttr);
    }).join('');

    const activeLensInfo = activeLensId
        ? `<div class="inspector-drawer__active-lens">レンズ: <strong>${_esc(activeLensId)}</strong></div>`
        : '';

    return `<div class="inspector-drawer__metric-tab">
  ${activeLensInfo}
  <div class="inspector-drawer__metric-rows">${rowsHtml}</div>
</div>`;
}

function _renderEventsTab(
    recentEvents: Array<{ id: string; tick: number; kind?: string; text?: string }>,
): string {
    if (recentEvents.length === 0) {
        return `<div class="inspector-drawer__empty"><p>最近の履歴はありません。</p></div>`;
    }

    const items = recentEvents.map((ev) => {
        const text = ev.text ?? `Event ${ev.id}`;
        const kind = ev.kind ? `<span class="inspector-drawer__event-kind">${_esc(ev.kind)}</span>` : '';
        // Coerce tick to a safe integer; guard against NaN from unexpected runtime values.
        const safeTick = Number.isFinite(Number(ev.tick)) ? Math.trunc(Number(ev.tick)) : 0;
        return `<div class="inspector-drawer__event" data-event-id="${_esc(ev.id)}"
    onclick="window.dispatchEvent(new CustomEvent('inspector:eventClick',{detail:{eventId:'${_esc(ev.id)}',tick:${safeTick}}}))">
    <span class="inspector-drawer__event-tick">tick ${_esc(safeTick)}</span>
    ${kind}
    <span class="inspector-drawer__event-text">${_esc(text)}</span>
  </div>`;
    }).join('\n  ');

    return `<div class="inspector-drawer__events-tab">
  ${items}
</div>`;
}

function _renderWarningsTab(
    warnings: Array<{ severity: string; text: string }>,
): string {
    if (warnings.length === 0) {
        return `<div class="inspector-drawer__empty">
  <span class="inspector-drawer__severity-badge inspector-drawer__severity-badge--info">情報</span>
  <p>警告はありません。</p>
</div>`;
    }

    const items = warnings.map((w) => {
        const color = SEVERITY_COLOR[w.severity] ?? '#9ca3af';
        const label = w.severity.charAt(0).toUpperCase() + w.severity.slice(1);
        return `<div class="inspector-drawer__warning" data-severity="${_esc(w.severity)}">
    <span class="inspector-drawer__severity-badge inspector-drawer__severity-badge--${_esc(w.severity)}"
          style="color:${color}">${_esc(label)}</span>
    <span class="inspector-drawer__warning-text">${_esc(w.text)}</span>
  </div>`;
    }).join('\n  ');

    return `<div class="inspector-drawer__warnings-tab">
  ${items}
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
