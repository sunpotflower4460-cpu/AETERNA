/**
 * RatioInvolvementPanel.ts
 *
 * Context Panel Migration item 8/9 (Ratio Involvement). Unlike items 1-7,
 * this one has no real-data path to connect today: `buildObservedRatioInvolvement`
 * (src/observation/buildObservedRatioInvolvement.ts) is a genuinely reusable,
 * already-honest pure function — it needs only an `ObservedRatiosState` and
 * a `cellIndex`, and already handles missing component data gracefully. The
 * gap is upstream: `ObservedRatiosState` itself (src/observer/deriveObservedRatios.ts)
 * requires ComplexFieldState / CurvatureVortexCouplingState /
 * RepeatedFlowPathObservationState / BodyWorldClosureState — none of which
 * are wired into RuntimeAdapter, and `RuntimeSnapshot.observedRatios` is
 * typed as a literal `null` today (src/app/runtime/RuntimeSnapshot.ts).
 *
 * Rather than fabricate a substitute "ratio" from unrelated real per-cell
 * data (which would misrepresent what this feature actually means — cell
 * membership in a globally-detected reference-ratio match), this panel
 * calls the real `buildObservedRatioInvolvement` whenever `ObservedRatiosState`
 * is ever non-null, and otherwise renders an explicit, honest "not yet
 * connected" state. See docs/ui-feature-status.md's PR8h entry.
 *
 * PR9 (Research/Developer Separation): that "not yet connected" message
 * is implementation-status detail, not observation content — it has no
 * value to a general public user and would only confuse them. It is now
 * only rendered when `showRawDiagnostics` (RuntimeCapabilities, false by
 * default and always false in Public builds) is true; Public builds show
 * nothing at all for this panel rather than an internal-wiring caveat.
 */

import {
  buildObservedRatioInvolvement,
  type ObservedRatioInvolvement,
  type ObservedRatiosStateInput,
} from '../../observation/buildObservedRatioInvolvement.js';

export function renderRatioInvolvementPanelHTML(
  observedRatiosState: ObservedRatiosStateInput | null,
  cellId: number | null,
  showRawDiagnostics = false
): string {
  if (cellId === null) {
    return `<div class="ratio-involvement-panel" data-testid="ratio-involvement-panel">
      <p class="ratio-involvement-panel__empty">セルが選択されていません。セル観測でセルを選択してください。</p>
    </div>`;
  }

  if (!observedRatiosState) {
    if (!showRawDiagnostics) return '';
    return `<div class="ratio-involvement-panel" data-testid="ratio-involvement-panel">
      <h3 class="ratio-involvement-panel__title">比率関与 — #${cellId}</h3>
      <p class="ratio-involvement-panel__unavailable" data-testid="ratio-involvement-panel__unavailable">
        観測比率（Observed Ratios）は現在ライブRuntimeに接続されていません。
        Not yet connected to the live Runtime — this panel will populate once
        ObservedRatiosState is wired into RuntimeAdapter.
      </p>
    </div>`;
  }

  const items: ObservedRatioInvolvement[] = buildObservedRatioInvolvement({
    observedRatiosState,
    cellIndex: cellId,
  });

  if (items.length === 0) {
    return `<div class="ratio-involvement-panel" data-testid="ratio-involvement-panel">
      <h3 class="ratio-involvement-panel__title">比率関与 — #${cellId}</h3>
      <p class="ratio-involvement-panel__empty">このセルが関与する観測比率はありません。</p>
    </div>`;
  }

  const rows = items
    .map(
      (item) => `<li class="ratio-involvement-panel__row">
        <span class="ratio-involvement-panel__label">${item.label}</span>
        <span class="ratio-involvement-panel__value">${item.value.toFixed(4)}</span>
        ${
          item.matchStrength !== undefined
            ? `<span class="ratio-involvement-panel__match">match ${item.matchStrength.toFixed(2)}</span>`
            : ''
        }
        <p class="ratio-involvement-panel__caution">${item.caution}</p>
      </li>`
    )
    .join('');

  return `<div class="ratio-involvement-panel" data-testid="ratio-involvement-panel">
    <h3 class="ratio-involvement-panel__title">比率関与 — #${cellId}</h3>
    <ul class="ratio-involvement-panel__rows">${rows}</ul>
  </div>`;
}
