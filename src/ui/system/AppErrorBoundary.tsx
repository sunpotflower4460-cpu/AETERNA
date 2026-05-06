/**
 * AppErrorBoundary.tsx
 * AETERNA-NATURAL v1.5 — App Error Boundary (headless model)
 *
 * Headless TypeScript model for the application error boundary.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 *
 * When AETERNA-NATURAL fails to load or encounters a runtime error,
 * this model provides:
 * - Error state and messaging
 * - Recovery suggestion (reload or return to Safe Baseline)
 * - No fake fallback results or observation values
 *
 * Principles:
 * - No consciousness / life / intelligence / mystical claims in error messages.
 * - No fake fallback runtime results when the system fails.
 * - No observer values are fabricated during error state.
 *
 * Reference: docs/deployment-readiness.md §8
 */

// ── Error state ────────────────────────────────────────────────────────────────

export interface AppErrorState {
  hasError: boolean;
  errorMessage: string | null;
  errorPhase: AppErrorPhase;
}

/**
 * Phase in which the error occurred.
 *
 * 'unknown'    : error phase could not be determined
 * 'startup'    : error during initial app startup
 * 'runtime'    : error during field simulation runtime
 * 'rendering'  : error during UI rendering
 * 'export'     : error during export action
 */
export type AppErrorPhase =
  | 'unknown'
  | 'startup'
  | 'runtime'
  | 'rendering'
  | 'export';

// ── Error messages ─────────────────────────────────────────────────────────────

export const ERROR_BOUNDARY_TITLE_EN =
  'Something went wrong while loading AETERNA-NATURAL.';

export const ERROR_BOUNDARY_TITLE_JA =
  'AETERNA-NATURAL の読み込み中に問題が起きました。';

export const ERROR_BOUNDARY_SUGGESTION_EN =
  'Try reloading the page or switch to Safe Baseline.';

export const ERROR_BOUNDARY_SUGGESTION_JA =
  '再読み込みするか、Safe Baseline に戻してください。';

export const ERROR_BOUNDARY_NO_FAKE_NOTE_EN =
  'No observation values are generated during error state.';

export const ERROR_BOUNDARY_NO_FAKE_NOTE_JA =
  'エラー状態では観測値は生成されません。';

// ── Error boundary model ───────────────────────────────────────────────────────

/**
 * Creates the initial non-error state.
 */
export function createInitialErrorState(): AppErrorState {
  return {
    hasError: false,
    errorMessage: null,
    errorPhase: 'unknown',
  };
}

/**
 * Creates an error state from a caught error.
 * The error message is sanitized — no stack traces or internal paths in public mode.
 */
export function createErrorState(
  error: unknown,
  phase: AppErrorPhase = 'unknown',
): AppErrorState {
  let message: string | null = null;
  if (error instanceof Error) {
    // Only expose the message, not the stack, in public mode.
    message = error.message ?? null;
  }
  return {
    hasError: true,
    errorMessage: message,
    errorPhase: phase,
  };
}

/**
 * Returns the display lines for the error boundary fallback screen.
 */
export function renderErrorBoundaryText(state: AppErrorState): string[] {
  if (!state.hasError) return [];
  return [
    ERROR_BOUNDARY_TITLE_EN,
    ERROR_BOUNDARY_TITLE_JA,
    '',
    ERROR_BOUNDARY_SUGGESTION_EN,
    ERROR_BOUNDARY_SUGGESTION_JA,
    '',
    ERROR_BOUNDARY_NO_FAKE_NOTE_EN,
    ERROR_BOUNDARY_NO_FAKE_NOTE_JA,
  ];
}
