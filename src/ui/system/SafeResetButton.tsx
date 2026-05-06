/**
 * SafeResetButton.tsx
 * AETERNA-NATURAL v1.5 — Safe Reset Button (headless model)
 *
 * Headless TypeScript model for the "Return to Safe Baseline" action.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 *
 * When activated, this model produces a safe reset state that:
 * - Sets preset to safeBaseline
 * - Sets scenario to quietBaseline
 * - Disables experimental mode
 * - Disables weakPlasticity resistanceOnly
 * - Disables legacy constants
 * - Enables public interpretation notes
 *
 * Principles:
 * - No consciousness / life / intelligence claims.
 * - No fake reset results — the reset state is the documented safeBaseline.
 * - Runtime dynamics are not changed by this model.
 *
 * Reference: docs/deployment-readiness.md §9
 */

import type { AeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import type { PublicResearchModeConfig } from '../../types/publicResearchMode.js';
import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import { defaultPublicResearchModeConfig } from '../../config/publicResearchModeConfig.js';

// ── Safe reset label ───────────────────────────────────────────────────────────

export const SAFE_RESET_LABEL_EN = 'Return to Safe Baseline';
export const SAFE_RESET_LABEL_JA = 'Safe Baseline に戻す';

export const SAFE_RESET_DESCRIPTION_EN =
  'Resets to safeBaseline preset and quietBaseline scenario. ' +
  'Disables experimental mode, weak plasticity resistance, and legacy constants. ' +
  'Enables interpretation notes.';

export const SAFE_RESET_DESCRIPTION_JA =
  'safeBaseline プリセットと quietBaseline シナリオにリセットします。' +
  '実験モード、弱可塑性抵抗、レガシー定数を無効にします。' +
  'インタープリテーションノートを有効にします。';

// ── Safe reset state ───────────────────────────────────────────────────────────

export interface SafeResetState {
  presetId: string;
  scenarioId: string;
  runtimeConfig: AeternaNaturalRuntimeConfig;
  publicModeConfig: PublicResearchModeConfig;
}

// ── Safe reset factory ─────────────────────────────────────────────────────────

/**
 * Returns the safe reset state.
 *
 * This is the canonical safeBaseline state:
 * - preset: safeBaseline
 * - scenario: quietBaseline
 * - runtimeConfig: defaultAeternaNaturalRuntimeConfig (safetyMode='safe')
 * - publicModeConfig: defaultPublicResearchModeConfig
 */
export function getSafeResetState(): SafeResetState {
  return {
    presetId: 'safeBaseline',
    scenarioId: 'quietBaseline',
    runtimeConfig: { ...defaultAeternaNaturalRuntimeConfig },
    publicModeConfig: { ...defaultPublicResearchModeConfig },
  };
}

/**
 * Returns true if the given runtime config matches the safe reset state.
 * Used to determine whether the reset button should be shown.
 */
export function isAtSafeBaseline(runtimeConfig: AeternaNaturalRuntimeConfig): boolean {
  const safe = defaultAeternaNaturalRuntimeConfig;
  return (
    runtimeConfig.safetyMode === 'safe' &&
    runtimeConfig.fieldRuntimeMode === safe.fieldRuntimeMode &&
    runtimeConfig.weakPlasticityMode === safe.weakPlasticityMode &&
    runtimeConfig.weakPlasticityEnabled === safe.weakPlasticityEnabled &&
    runtimeConfig.externalConstantsMode === safe.externalConstantsMode &&
    runtimeConfig.longRunComparisonEnabled === safe.longRunComparisonEnabled
  );
}

/**
 * Returns display lines for the safe reset button tooltip / description.
 */
export function renderSafeResetDescription(): string[] {
  return [
    SAFE_RESET_LABEL_EN,
    SAFE_RESET_LABEL_JA,
    '',
    SAFE_RESET_DESCRIPTION_EN,
    '',
    'Reset targets:',
    '  • preset: safeBaseline',
    '  • scenario: quietBaseline',
    '  • safetyMode: safe',
    '  • fieldRuntimeMode: scalar',
    '  • weakPlasticityMode: off',
    '  • externalConstantsMode: neutral',
    '  • interpretation notes: enabled',
  ];
}
