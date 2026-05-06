/**
 * ObservationMobileTabs.tsx
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — Mobile Tab Bar
 *
 * Renders a mobile-friendly bottom tab bar for the observation workspace.
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - All content is XSS-safe via _esc().
 * - Taps are min 44px for accessibility.
 * - Tab changes dispatch 'observation:tabChange' CustomEvent.
 * - When 'field' tab is active the torus stays visible (トーラス表示を完全に隠さない).
 * - No consciousness/life/intelligence proof claims.
 */

// ── ObservationMobileTabsProps ────────────────────────────────────────────────

export interface ObservationMobileTabsProps {
    /** Currently active tab */
    activeTab: 'field' | 'inspector' | 'lens' | 'replay' | 'trace' | 'guide';
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS: Array<{
    id: ObservationMobileTabsProps['activeTab'];
    label: string;
    icon: string;
    note?: string;
}> = [
    { id: 'field',     label: 'Field',     icon: '🌐', note: 'トーラス表示を完全に隠さない' },
    { id: 'inspector', label: 'Inspector', icon: '🔍' },
    { id: 'lens',      label: 'Lens',      icon: '🔭' },
    { id: 'replay',    label: 'Replay',    icon: '⏮' },
    { id: 'trace',     label: 'Trace',     icon: '🔗' },
    { id: 'guide',     label: 'Guide',     icon: '💬' },
];

// ── renderObservationMobileTabsHTML ───────────────────────────────────────────

/**
 * Render the mobile tab bar as an HTML string.
 *
 * @param props - ObservationMobileTabsProps
 * @returns HTML string
 */
export function renderObservationMobileTabsHTML(props: ObservationMobileTabsProps): string {
    const { activeTab } = props;

    const tabItems = TABS.map(({ id, label, icon }) => {
        const isActive = id === activeTab;
        const activeClass = isActive ? ' observation-mobile-tabs__tab--active' : '';
        return `<button
    class="observation-mobile-tabs__tab${activeClass}"
    role="tab"
    aria-selected="${isActive}"
    aria-label="${_esc(label)}"
    data-tab="${_esc(id)}"
    style="min-height:44px;min-width:44px;"
    onclick="window.dispatchEvent(new CustomEvent('observation:tabChange',{detail:{tab:'${_esc(id)}'}}))">
    <span class="observation-mobile-tabs__tab-icon" aria-hidden="true">${icon}</span>
    <span class="observation-mobile-tabs__tab-label">${_esc(label)}</span>
  </button>`;
    }).join('\n  ');

    return `<nav class="observation-mobile-tabs" role="tablist" aria-label="Observation Panels">
  ${tabItems}
</nav>`;
}

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
