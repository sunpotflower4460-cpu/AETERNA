/**
 * longRunExecutionProfiles.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Lightweight execution profiles for the N7 Long-Run Comparison Suite.
 * Controls how many ticks are run and how often snapshots are taken,
 * so that CI stays fast while full research runs remain possible.
 *
 * Design principles:
 * - CI / test profile: 20–100 ticks — always fast.
 * - Default profile: 1000–5000 ticks — suitable for routine research.
 * - Full profile: manual only — not run automatically.
 * - Profile selection is config-level; it does not change runtime dynamics.
 * - No fake results, no fake events.
 *
 * Reference: docs/aeterna-natural-v1-stabilization.md §9
 */

// ── Profile ID ─────────────────────────────────────────────────────────────────

export type LongRunProfileId = 'test' | 'default' | 'full';

// ── Profile type ───────────────────────────────────────────────────────────────

/**
 * Execution profile for one long-run comparison run.
 *
 * The profile controls the number of ticks, snapshot frequency, and whether
 * the profile is allowed to run in CI.
 */
export interface LongRunExecutionProfile {
    /** Stable identifier for this profile. */
    id: LongRunProfileId;

    /** Human-readable label. */
    label: string;

    /** Total number of ticks to run per variant. */
    ticks: number;

    /** Take a snapshot every N ticks. */
    sampleEveryTicks: number;

    /** Hard limit on stored snapshots per variant. */
    maxSnapshotsPerVariant: number;

    /** Whether this profile is run in CI. Only 'test' should be true. */
    runInCi: boolean;

    /** Description of the intended use for this profile. */
    description: string;
}

// ── Profile definitions ────────────────────────────────────────────────────────

/**
 * test profile
 *
 * 20–100 ticks, fast enough for unit tests and CI.
 * Only this profile is run in CI.
 */
export const testLongRunProfile: LongRunExecutionProfile = {
    id: 'test',
    label: 'Test (CI)',
    ticks: 50,
    sampleEveryTicks: 10,
    maxSnapshotsPerVariant: 5,
    runInCi: true,
    description:
        'Minimal tick count for unit tests and CI. '
        + '50 ticks, snapshot every 10, max 5 snapshots per variant. '
        + 'Results are not suitable for research interpretation.',
};

/**
 * default profile
 *
 * 1000 ticks, suitable for routine research observation.
 * Not run in CI.
 */
export const defaultLongRunProfile: LongRunExecutionProfile = {
    id: 'default',
    label: 'Default (Research)',
    ticks: 1000,
    sampleEveryTicks: 50,
    maxSnapshotsPerVariant: 20,
    runInCi: false,
    description:
        'Standard research profile. '
        + '1000 ticks, snapshot every 50, max 20 snapshots per variant. '
        + 'Suitable for routine comparative observation.',
};

/**
 * full profile
 *
 * 5000 ticks, manual only.
 * Not run in CI. Must be explicitly selected.
 */
export const fullLongRunProfile: LongRunExecutionProfile = {
    id: 'full',
    label: 'Full (Manual)',
    ticks: 5000,
    sampleEveryTicks: 100,
    maxSnapshotsPerVariant: 50,
    runInCi: false,
    description:
        'Full-length research profile. '
        + '5000 ticks, snapshot every 100, max 50 snapshots per variant. '
        + 'Manual only — do not run in CI. '
        + 'Results may be slow to generate.',
};

// ── Registry ───────────────────────────────────────────────────────────────────

export const LONG_RUN_EXECUTION_PROFILES: LongRunExecutionProfile[] = [
    testLongRunProfile,
    defaultLongRunProfile,
    fullLongRunProfile,
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/** Returns the execution profile for the given ID. */
export function getLongRunProfile(id: LongRunProfileId): LongRunExecutionProfile {
    const profile = LONG_RUN_EXECUTION_PROFILES.find(p => p.id === id);
    if (!profile) {
        // Fallback to test profile to avoid undefined access.
        return testLongRunProfile;
    }
    return profile;
}

/** Returns the profile that should be used in CI (always 'test'). */
export function getCiLongRunProfile(): LongRunExecutionProfile {
    return testLongRunProfile;
}

/** Returns all profiles that are marked for CI use. */
export function getCiProfiles(): LongRunExecutionProfile[] {
    return LONG_RUN_EXECUTION_PROFILES.filter(p => p.runInCi);
}
