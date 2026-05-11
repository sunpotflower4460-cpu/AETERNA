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
