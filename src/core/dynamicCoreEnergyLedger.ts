/**
 * dynamicCoreEnergyLedger.ts
 *
 * v4.3-a shadow ledger for dynamicCore.
 *
 * This module is **observer-only**. It does NOT modify dynamicCore. It
 * inspects before/after snapshots of dynamicCore-like state and infers what
 * the implicit energy transfers would be IF the existing patterns
 * (`x *= k`, `x += d`, `x = f(...)`) were rewritten as named-destination
 * transfers.
 *
 * Why this exists:
 * - dynamicCore.ts contains patterns that violate the energy-realness
 *   principles (decay without a named destination; central-buffer direct
 *   injection; sin-driven baseline overwrite).
 * - v4.3-a captures the implied transfers as a shadow ledger so we have a
 *   regression baseline before refactoring (v4.3-b).
 * - When v4.3-b lands and replaces `*= k` with `delta = before * (1-k);
 *   x -= delta; sink += delta`, the numeric trajectory of dynamicCore is
 *   unchanged, but the shadow residual drops to ~0.
 *
 * The principles guard naming: this module does not use biological metaphors
 * for the sinks/sources. Each name reflects the dynamicCore variable it
 * observes (e.g., spikeDecaySink, weightDecaySink, residueDecaySink).
 */

export type ShadowLedgerRuleKind =
    | 'multiplicative-decay'
    | 'additive-injection'
    | 'overwrite';

export type ShadowLedgerStatus = 'closed' | 'open' | 'insufficient';

/**
 * Single observation of one dynamicCore rule.
 *
 * - multiplicative-decay: `x[i] *= k`. Inferred sink absorbs `(1 - k) * before[i]`.
 * - additive-injection: `x[i] += d[i]`. Inferred source provides `after[i] - before[i]`.
 * - overwrite: `x[i] = f(t, i)`. Inferred source provides `after[i]`; previous `before[i]` is discarded into a "previous" sink.
 */
export interface ShadowLedgerEntry {
    ruleName: string;
    ruleKind: ShadowLedgerRuleKind;
    /** Inferred sink name (where energy would go if the rule were a named transfer). */
    inferredSinkName: string | null;
    /** Inferred source name (where energy would come from if the rule were a named transfer). */
    inferredSourceName: string | null;
    /** Sum of the inferred absolute transfer amount over all cells. */
    inferredAmount: number;
    /**
     * Whether the snapshot pair could be compared at all (lengths match, no NaN,
     * and a prediction was available).
     *
     * - true: the comparison ran. `residual` reflects how close the actual
     *   after-state was to the predicted after-state.
     * - false: comparison could not run. `residual` is Infinity. The rule has
     *   insufficient data to be verified.
     */
    snapshotComparable: boolean;
    /**
     * Whether the rule was obeyed within tolerance.
     *
     * Only meaningful when `snapshotComparable` is true. true means
     * `residual <= tolerance`. false means the rule was violated.
     */
    ruleObeyed: boolean;
    /** Sum of |after - expected_after| over all cells; 0 means rule perfectly obeyed. */
    residual: number;
    /** Tolerance used for verification. */
    tolerance: number;
}

export interface DynamicCoreShadowLedger {
    timestamp: number;
    entries: ShadowLedgerEntry[];
    totalInferredSinkAmount: number;
    totalInferredSourceAmount: number;
    totalResidual: number;
    status: ShadowLedgerStatus;
    warnings: string[];
    /** Names of any rules whose snapshots could not be verified (e.g., size mismatch). */
    unverifiedRuleNames: string[];
}

function isFiniteArray(arr: ArrayLike<number>): boolean {
    for (let i = 0; i < arr.length; i++) {
        if (!Number.isFinite(arr[i])) return false;
    }
    return true;
}

function safeTolerance(tolerance: number | undefined): number {
    return Number.isFinite(tolerance) && (tolerance as number) > 0 ? (tolerance as number) : 1e-9;
}

/**
 * Observe a multiplicative-decay rule `x[i] *= k`.
 *
 * Expected: after[i] == k * before[i] for all i.
 * Inferred sink amount (the named destination implied by the rule):
 *   sum_i (1 - k) * before[i]  when before[i] >= 0
 *
 * If after[i] differs from k * before[i] within tolerance, the entry is
 * verifiedFromSnapshots = true. Otherwise the residual captures the
 * inconsistency.
 */
export function deriveMultiplicativeDecayShadow(
    ruleName: string,
    before: ArrayLike<number>,
    after: ArrayLike<number>,
    expectedDecayMultiplier: number,
    sinkName: string,
    tolerance?: number,
): ShadowLedgerEntry {
    const tol = safeTolerance(tolerance);
    if (before.length !== after.length || !isFiniteArray(before) || !isFiniteArray(after)) {
        return {
            ruleName,
            ruleKind: 'multiplicative-decay',
            inferredSinkName: sinkName,
            inferredSourceName: null,
            inferredAmount: 0,
            snapshotComparable: false,
            ruleObeyed: false,
            residual: Number.POSITIVE_INFINITY,
            tolerance: tol,
        };
    }
    const k = Number.isFinite(expectedDecayMultiplier) ? expectedDecayMultiplier : 1;
    let inferred = 0;
    let residual = 0;
    for (let i = 0; i < before.length; i++) {
        const expected = before[i] * k;
        residual += Math.abs(after[i] - expected);
        const decayAmount = before[i] * (1 - k);
        // Sink absorbs the magnitude that "left" the field. Use absolute value to
        // remain stable under negative-valued fields (weights/spikeTraces are
        // generally non-negative, but be safe).
        inferred += Math.abs(decayAmount);
    }
    return {
        ruleName,
        ruleKind: 'multiplicative-decay',
        inferredSinkName: sinkName,
        inferredSourceName: null,
        inferredAmount: inferred,
        snapshotComparable: true,
        ruleObeyed: residual <= tol,
        residual,
        tolerance: tol,
    };
}

/**
 * Observe a scalar multiplicative-decay rule `x *= k` (one number, not an array).
 * Useful for state like `partnerAbsenceDrift`.
 */
export function deriveScalarMultiplicativeDecayShadow(
    ruleName: string,
    before: number,
    after: number,
    expectedDecayMultiplier: number,
    sinkName: string,
    tolerance?: number,
): ShadowLedgerEntry {
    const tol = safeTolerance(tolerance);
    if (!Number.isFinite(before) || !Number.isFinite(after)) {
        return {
            ruleName,
            ruleKind: 'multiplicative-decay',
            inferredSinkName: sinkName,
            inferredSourceName: null,
            inferredAmount: 0,
            snapshotComparable: false,
            ruleObeyed: false,
            residual: Number.POSITIVE_INFINITY,
            tolerance: tol,
        };
    }
    const k = Number.isFinite(expectedDecayMultiplier) ? expectedDecayMultiplier : 1;
    const expected = before * k;
    const residual = Math.abs(after - expected);
    const inferred = Math.abs(before * (1 - k));
    return {
        ruleName,
        ruleKind: 'multiplicative-decay',
        inferredSinkName: sinkName,
        inferredSourceName: null,
        inferredAmount: inferred,
        snapshotComparable: true,
        ruleObeyed: residual <= tol,
        residual,
        tolerance: tol,
    };
}

/**
 * Observe an additive-injection rule `x[i] += d` where the injection enters
 * the field from outside dynamicCore's tracked state.
 *
 * Expected: after[i] == before[i] + injectedPerCell[i] (or scalar amount).
 * Inferred source amount: sum of injected magnitudes.
 *
 * If `injectedPerCell` is omitted, the inferred amount is computed from
 * `after - before` directly (this is "what was added" without an
 * independent prediction).
 */
export function deriveAdditiveInjectionShadow(
    ruleName: string,
    before: ArrayLike<number>,
    after: ArrayLike<number>,
    sourceName: string,
    options: {
        expectedInjectionPerCell?: ArrayLike<number>;
        tolerance?: number;
    } = {},
): ShadowLedgerEntry {
    const tol = safeTolerance(options.tolerance);
    const expectedPerCell = options.expectedInjectionPerCell;
    if (
        before.length !== after.length ||
        !isFiniteArray(before) ||
        !isFiniteArray(after) ||
        (expectedPerCell !== undefined && (expectedPerCell.length !== before.length || !isFiniteArray(expectedPerCell)))
    ) {
        return {
            ruleName,
            ruleKind: 'additive-injection',
            inferredSinkName: null,
            inferredSourceName: sourceName,
            inferredAmount: 0,
            snapshotComparable: false,
            ruleObeyed: false,
            residual: Number.POSITIVE_INFINITY,
            tolerance: tol,
        };
    }
    let inferred = 0;
    let residual = 0;
    for (let i = 0; i < before.length; i++) {
        const observedDelta = after[i] - before[i];
        inferred += Math.abs(observedDelta);
        if (expectedPerCell !== undefined) {
            residual += Math.abs(observedDelta - expectedPerCell[i]);
        }
    }
    // When no expected predictions are provided, residual is 0 by construction
    // (we are not asserting anything specific; just reporting what was observed).
    return {
        ruleName,
        ruleKind: 'additive-injection',
        inferredSinkName: null,
        inferredSourceName: sourceName,
        inferredAmount: inferred,
        snapshotComparable: true,
        ruleObeyed: expectedPerCell === undefined ? true : residual <= tol,
        residual,
        tolerance: tol,
    };
}

/**
 * Observe an overwrite rule `x[i] = f(t, i)` where the new value is generated
 * from outside dynamicCore's tracked state (e.g., `Math.sin`-driven baseline).
 *
 * Inferred source amount: sum |after[i]| (the "external generator" output).
 * The previous `before[i]` is discarded into an inferred "previous-discard"
 * sink (the `inferredSinkName`).
 *
 * No residual prediction; this is pure observation.
 */
export function deriveOverwriteShadow(
    ruleName: string,
    before: ArrayLike<number>,
    after: ArrayLike<number>,
    sourceName: string,
    sinkName: string,
    tolerance?: number,
): ShadowLedgerEntry {
    const tol = safeTolerance(tolerance);
    if (before.length !== after.length || !isFiniteArray(before) || !isFiniteArray(after)) {
        return {
            ruleName,
            ruleKind: 'overwrite',
            inferredSinkName: sinkName,
            inferredSourceName: sourceName,
            inferredAmount: 0,
            snapshotComparable: false,
            ruleObeyed: false,
            residual: Number.POSITIVE_INFINITY,
            tolerance: tol,
        };
    }
    let inferredSource = 0;
    for (let i = 0; i < before.length; i++) {
        inferredSource += Math.abs(after[i]);
    }
    return {
        ruleName,
        ruleKind: 'overwrite',
        inferredSinkName: sinkName,
        inferredSourceName: sourceName,
        // Reported amount is the magnitude of the new external input. The
        // previous discarded amount is surfaced as a warning by the aggregator.
        inferredAmount: inferredSource,
        snapshotComparable: true,
        ruleObeyed: true,
        residual: 0,
        tolerance: tol,
    };
}

/**
 * Combine multiple ShadowLedgerEntry into one DynamicCoreShadowLedger.
 *
 * Status:
 * - 'closed' if every entry is verifiedFromSnapshots and residual < tolerance.
 * - 'open' if any entry has residual > tolerance.
 * - 'insufficient' if any entry has verifiedFromSnapshots = false (e.g., size
 *   mismatch, NaN, missing prediction).
 */
export function aggregateDynamicCoreShadowLedger(
    timestamp: number,
    entries: ShadowLedgerEntry[],
    tolerance?: number,
): DynamicCoreShadowLedger {
    const tol = safeTolerance(tolerance);
    let totalInferredSink = 0;
    let totalInferredSource = 0;
    let totalResidual = 0;
    const warnings: string[] = [];
    const unverifiedRuleNames: string[] = [];
    let anyOpen = false;
    let anyUnverified = false;

    for (const e of entries) {
        if (e.inferredSinkName !== null && e.ruleKind === 'multiplicative-decay') {
            totalInferredSink += e.inferredAmount;
        }
        if (e.inferredSourceName !== null && e.ruleKind === 'additive-injection') {
            totalInferredSource += e.inferredAmount;
        }
        if (e.ruleKind === 'overwrite') {
            // Overwrite contributes both source (new value) and an unaccounted
            // discard (previous value). The aggregator accounts the source side
            // here and warns about the implicit discard.
            totalInferredSource += e.inferredAmount;
            warnings.push(
                `Rule '${e.ruleName}' is overwrite-shaped; previous values are implicitly discarded and require a named "previous-state-discard" destination once refactored.`,
            );
        }
        if (!e.snapshotComparable) {
            anyUnverified = true;
            unverifiedRuleNames.push(e.ruleName);
            continue;
        }
        if (Number.isFinite(e.residual)) {
            totalResidual += e.residual;
        }
        if (!e.ruleObeyed) {
            anyOpen = true;
        }
    }

    let status: ShadowLedgerStatus = 'closed';
    if (anyUnverified) status = 'insufficient';
    else if (anyOpen) status = 'open';

    if (status === 'open') {
        warnings.push(
            'Shadow ledger is open. dynamicCore patterns deviate from the expected rule shapes; v4.3-b refactor should drive residual to zero.',
        );
    }
    if (status === 'insufficient') {
        warnings.push(
            'Shadow ledger is insufficient. Some rules could not be verified from snapshots (size mismatch, NaN, or missing prediction).',
        );
    }

    return {
        timestamp,
        entries,
        totalInferredSinkAmount: totalInferredSink,
        totalInferredSourceAmount: totalInferredSource,
        totalResidual,
        status,
        warnings,
        unverifiedRuleNames,
    };
}
