/**
 * RuntimeCommand.ts
 *
 * The only way UI code should trigger a change in the live Runtime
 * (master spec §8.1). Scoped to what the legacy app actually implements
 * today (see src/perception/pointerHandlers.js) rather than the full
 * target command set — SELECT_CELL and SET_SCENARIO have no live
 * implementation yet and are intentionally not listed here; adding them
 * to the type without a real handler would make this RENDERABLE, not
 * CONNECTED (see docs/ui-feature-status.md).
 */
export type RuntimeCommand =
  | { type: 'APPLY_PRESET'; name: string }
  | { type: 'RESET_TOUCH_MEMORY' }
  | { type: 'INJECT_MASSIVE_ERROR' }
  | { type: 'TOGGLE_VISUAL_LAYER' }
  | { type: 'TOGGLE_DEBUG_LABELS' };
