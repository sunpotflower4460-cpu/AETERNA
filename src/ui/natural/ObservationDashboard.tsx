import type { RuntimeModeBadge } from './RuntimeModeBadge.tsx';
import { formatValueKindLabel } from './ValueKindBadge.tsx';
import type { ValueKind } from './ValueKindBadge.tsx';
import type { NaturalWarningItem } from './NaturalWarningList.tsx';

export interface ObservationDashboardItem {
    label: string;
    value: string;
    kind?: ValueKind;
    subdued?: boolean;
}

export interface ObservationDashboardSection {
    id: string;
    title: string;
    note?: string;
    items?: ObservationDashboardItem[];
    runtimeBadges?: RuntimeModeBadge[];
    warnings?: NaturalWarningItem[];
}

export interface ObservationDashboardState {
    sections: ObservationDashboardSection[];
}

export interface ObservationDashboardInputs {
    runtimeBadges: RuntimeModeBadge[];
    sections: ObservationDashboardSection[];
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

export function createObservationDashboardState(
    inputs: ObservationDashboardInputs,
): ObservationDashboardState {
    return {
        sections: [
            {
                id: 'runtime-mode',
                title: 'Current Runtime Mode',
                runtimeBadges: inputs.runtimeBadges,
            },
            ...inputs.sections,
        ],
    };
}

export function renderObservationDashboardHtml(
    state: ObservationDashboardState,
): string {
    return state.sections.map((section) => {
        const badgeHtml = (section.runtimeBadges ?? []).map((badge) => (
            `<span class="runtime-mode-badge" data-tone="${badge.tone}" title="${escapeHtml(badge.note ?? badge.value)}">`
            + `<span class="runtime-mode-badge-label">${escapeHtml(badge.label)}</span>`
            + `<span class="runtime-mode-badge-value">${escapeHtml(badge.value)}</span>`
            + `${badge.isDefault ? '<span class="runtime-mode-badge-default">default</span>' : ''}`
            + `</span>`
        )).join('');

        const itemHtml = (section.items ?? []).map((item) => (
            (() => {
                const kindLabel = item.kind ? formatValueKindLabel(item.kind) : '';
                return (
            `<div class="obd-row${item.subdued ? ' is-subdued' : ''}">`
            + `<div class="obd-row-label">`
            + `${escapeHtml(item.label)}`
            + `${item.kind ? `<span class="value-kind-badge" data-kind="${item.kind}" title="${escapeHtml(kindLabel)}">${escapeHtml(kindLabel)}</span>` : ''}`
            + `</div>`
            + `<div class="obd-row-value">${escapeHtml(item.value || '—')}</div>`
            + `</div>`
                );
            })()
        )).join('');

        const warningHtml = (section.warnings ?? []).map((warning) => (
            `<div class="natural-warning-item" data-severity="${warning.severity}">`
            + `<div class="natural-warning-title">${escapeHtml(warning.title)}</div>`
            + `<div class="natural-warning-detail">${escapeHtml(warning.detail)}</div>`
            + `</div>`
        )).join('');

        return (
            `<section class="obd-section" data-section="${escapeHtml(section.id)}">`
            + `<div class="obd-section-title">${escapeHtml(section.title)}</div>`
            + `${section.note ? `<div class="obd-section-note">${escapeHtml(section.note)}</div>` : ''}`
            + `${badgeHtml ? `<div class="obd-badge-list">${badgeHtml}</div>` : ''}`
            + `${itemHtml ? `<div class="obd-rows">${itemHtml}</div>` : ''}`
            + `${warningHtml ? `<div class="natural-warning-list">${warningHtml}</div>` : ''}`
            + `</section>`
        );
    }).join('');
}
