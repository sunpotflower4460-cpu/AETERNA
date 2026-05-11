/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * dynamicCoreNamedDestinations.ts
 *
 * v4.3-b helpers.
 *
 * Provides lazily-initialized Float64Array sink/budget fields on the
 * dynamicCore-style `network: any` object. Each field is created on first
 * access with the network's `numNodes` length, and reused across ticks.
 *
 * Pure structural helper. Does NOT change numeric trajectories — it only
 * gives lost / injected energy a named place to be tracked.
 *
 * Naming policy: every field exposed here is named after the dynamicCore
 * variable it tracks. No life metaphors.
 */

/**
 * Ensure a named Float64Array sink exists on the network object with the
 * given size. If the field is missing or the wrong length, it is (re)created
 * filled with zeros. Returns the resolved array.
 */
export function ensureSinkField(network: any, fieldName: string, size: number): Float64Array {
    const existing = network[fieldName];
    if (existing instanceof Float64Array && existing.length === size) {
        return existing;
    }
    const created = new Float64Array(size);
    network[fieldName] = created;
    return created;
}

/**
 * Same as ensureSinkField but for a scalar accumulator. Stores on the network
 * object under the given name; initializes to 0 if missing or non-finite.
 */
export function ensureScalarSink(network: any, fieldName: string): number {
    const v = network[fieldName];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    network[fieldName] = 0;
    return 0;
}

/**
 * Read the current scalar value of a sink (initializes if needed).
 */
export function readScalarSink(network: any, fieldName: string): number {
    return ensureScalarSink(network, fieldName);
}

/**
 * Add delta to a scalar sink field, initializing it if needed.
 */
export function addToScalarSink(network: any, fieldName: string, delta: number): void {
    const current = ensureScalarSink(network, fieldName);
    if (Number.isFinite(delta)) {
        network[fieldName] = current + delta;
    }
}

/**
 * decayWithSink
 *
 * Apply a multiplicative decay to a single cell of a typed array, and route
 * the implied loss into a named sink array at the same index. The actual
 * mutation is `field[i] = field[i] * multiplier`, which preserves bit-exact
 * IEEE 754 behaviour. The sink accumulates `before * (1 - multiplier)`.
 *
 * Wrapping `*= k` in this helper removes the bare literal from call sites,
 * making it possible to lint-grep against `\*=\s*0\.\d` in dynamicCore /
 * relationalState while preserving the exact numeric trajectory.
 */
export function decayWithSink(
    field: Float64Array | Float32Array,
    index: number,
    multiplier: number,
    sink: Float64Array,
): void {
    const before = field[index];
    const loss = before * (1 - multiplier);
    field[index] = before * multiplier;
    sink[index] += loss;
}

/**
 * decayScalarWithSink
 *
 * Scalar-variant of decayWithSink. Applies `before * multiplier` to the
 * provided value and returns the result; additionally adds the implied loss
 * to a named scalar sink on the network object.
 */
export function decayScalarWithSink(
    value: number,
    multiplier: number,
    network: any,
    sinkFieldName: string,
): number {
    const result = value * multiplier;
    const loss = value - result;
    addToScalarSink(network, sinkFieldName, loss);
    return result;
}

/**
 * decayPlainArrayWithSink
 *
 * Like decayWithSink, but for plain `number[]` arrays (e.g.
 * partnerTouchStyleSignature in relationalState). Applies
 * `arr[i] = arr[i] * multiplier` (bit-exact prior trajectory) and adds
 * the per-cell `before * (1 - multiplier)` loss to a scalar sink on the
 * network. (Plain arrays do not have a per-cell sink target available in
 * the same shape; aggregating into a scalar accumulator is the cheapest
 * way to give the loss a name.)
 */
export function decayPlainArrayWithSink(
    arr: number[],
    multiplier: number,
    network: any,
    sinkFieldName: string,
): void {
    if (!Array.isArray(arr)) return;
    let totalLoss = 0;
    for (let i = 0; i < arr.length; i++) {
        const before = arr[i];
        if (!Number.isFinite(before)) continue;
        const result = before * multiplier;
        totalLoss += before - result;
        arr[i] = result;
    }
    addToScalarSink(network, sinkFieldName, totalLoss);
}

/**
 * decayAllFourWeightsWithSink
 *
 * Convenience for the dynamicCore four-edge weight decay loop. Applies
 * `*= multiplier` to w_up[i], w_down[i], w_left[i], w_right[i] and records
 * the combined four-edge loss into sink[i].
 */
export function decayAllFourWeightsWithSink(
    wUp: Float64Array | Float32Array,
    wDown: Float64Array | Float32Array,
    wLeft: Float64Array | Float32Array,
    wRight: Float64Array | Float32Array,
    index: number,
    multiplier: number,
    sink: Float64Array,
): void {
    const upBefore = wUp[index];
    const downBefore = wDown[index];
    const leftBefore = wLeft[index];
    const rightBefore = wRight[index];
    const loss =
        upBefore * (1 - multiplier) +
        downBefore * (1 - multiplier) +
        leftBefore * (1 - multiplier) +
        rightBefore * (1 - multiplier);
    wUp[index] = upBefore * multiplier;
    wDown[index] = downBefore * multiplier;
    wLeft[index] = leftBefore * multiplier;
    wRight[index] = rightBefore * multiplier;
    sink[index] += loss;
}
