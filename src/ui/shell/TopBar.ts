/**
 * TopBar.ts
 *
 * Observatory Shell top bar (master spec §5.1): title + LIVE/REPLAY
 * badge. Pure render function returning an HTML string, matching this
 * codebase's existing convention (no React — see docs/ui-runtime-inventory.md §1).
 */

export interface TopBarProps {
  title: string;
  isLive: boolean;
}

export function renderTopBarHTML(props: TopBarProps): string {
  const { title, isLive } = props;
  const badgeText = isLive ? 'LIVE' : 'REPLAY';
  const badgeClass = isLive ? 'observatory-topbar__badge--live' : 'observatory-topbar__badge--replay';
  return `
    <div class="observatory-topbar">
      <span class="observatory-topbar__title">${escapeHtml(title)}</span>
      <span class="observatory-topbar__badge ${badgeClass}">${badgeText}</span>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
