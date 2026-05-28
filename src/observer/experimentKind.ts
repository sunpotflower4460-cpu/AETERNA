export const EXPERIMENT_KINDS = ['observation', 'intervention', 'scout', 'null_check'] as const;

export type ExperimentKind = (typeof EXPERIMENT_KINDS)[number];

export interface NoEmergenceObservation {
  status: 'no_emergence';
  reason: string;
}

export type ObservationResult<T extends Record<string, unknown>> = T | NoEmergenceObservation;

export function createNoEmergenceResult(reason: string): NoEmergenceObservation {
  const trimmed = reason.trim();
  return {
    status: 'no_emergence',
    reason: trimmed.length > 0 ? trimmed : 'No emergence observed under the current conditions.',
  };
}

export function normalizeObservationResult<T extends Record<string, unknown>>(
  result: T | null | undefined,
  fallbackReason: string,
): ObservationResult<T> {
  if (result == null) return createNoEmergenceResult(fallbackReason);

  const candidate = result as Partial<NoEmergenceObservation>;
  if (candidate.status === 'no_emergence') {
    return createNoEmergenceResult(typeof candidate.reason === 'string' ? candidate.reason : fallbackReason);
  }

  return result;
}

export function assertExperimentKind(kind: unknown): asserts kind is ExperimentKind {
  if (typeof kind !== 'string' || !(EXPERIMENT_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`experimentKind is required and must be one of: ${EXPERIMENT_KINDS.join(', ')}`);
  }
}

export function requireExperimentKind(value: { experimentKind?: unknown }): asserts value is { experimentKind: ExperimentKind } {
  assertExperimentKind(value.experimentKind);
}
