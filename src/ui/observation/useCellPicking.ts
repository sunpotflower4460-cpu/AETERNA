/**
 * useCellPicking.ts
 * v1.7: Deep Inspector / Time Replay — Cell Picking Hook
 *
 * Provides a pointer-event handler that maps torus canvas interactions to
 * cell index selections.  On a successful pick, the provided onPick callback
 * is called with the cell index.  On a miss, onPick is called with null.
 *
 * Design principles:
 * - Observer-side only — no runtime state is modified.
 * - Works with both mouse and touch events (mobile tap support).
 * - Falls back gracefully when camera matrices are unavailable.
 * - No fake cell selections; null is returned on miss.
 *
 * Reference: docs/deep-inspector-time-replay.md §2
 */

import {
    getCellIndexFromPointer,
    buildCellPositionsFromGeometry,
    type TorusCellPosition,
} from '../render/cellPicking.ts';

// ── CellPickingOptions ────────────────────────────────────────────────────────

export interface CellPickingOptions {
    /** Number of grid segments per dimension */
    segments: number;
    /** Torus major radius */
    R: number;
    /** Torus minor radius */
    r: number;
    /** Pre-built cell positions (optional; computed from segments/R/r if absent) */
    cellPositions?: TorusCellPosition[];
    /** Canvas element used for coordinate normalisation */
    canvas: HTMLCanvasElement;
    /** Projection matrix getter (returns null when unavailable) */
    getProjectionMatrix?: () => Float32Array | null;
    /** View matrix getter (returns null when unavailable) */
    getViewMatrix?: () => Float32Array | null;
    /** Hit radius in NDC (default: 0.07) */
    hitRadius?: number;
    /** Callback invoked with the picked cell index (or null on miss) */
    onPick: (cellIndex: number | null) => void;
}

// ── useCellPicking ────────────────────────────────────────────────────────────

/**
 * Register pointer picking handlers on a canvas element.
 *
 * Returns a cleanup function that removes the registered listeners.
 *
 * Usage (vanilla JS / non-React):
 *   const cleanup = useCellPicking({ canvas, segments, R, r, onPick });
 *   // later:
 *   cleanup();
 *
 * @param opts - CellPickingOptions
 * @returns    - Cleanup function
 */
export function useCellPicking(opts: CellPickingOptions): () => void {
    const {
        segments,
        R,
        r,
        canvas,
        getProjectionMatrix,
        getViewMatrix,
        hitRadius = 0.07,
        onPick,
    } = opts;

    // Build cell positions once (or reuse provided)
    const positions = opts.cellPositions ?? buildCellPositionsFromGeometry(segments, R, r);

    function _pointerToNdc(clientX: number, clientY: number): { ndcX: number; ndcY: number } {
        const rect = canvas.getBoundingClientRect();
        const px = (clientX - rect.left) / rect.width;
        const py = (clientY - rect.top) / rect.height;
        return {
            ndcX: px * 2 - 1,
            ndcY: -(py * 2 - 1),
        };
    }

    function _handlePointerUp(e: PointerEvent): void {
        const { ndcX, ndcY } = _pointerToNdc(e.clientX, e.clientY);
        const projMatrix = getProjectionMatrix ? getProjectionMatrix() : null;
        const viewMatrix = getViewMatrix ? getViewMatrix() : null;

        const picked = getCellIndexFromPointer({
            ndcX,
            ndcY,
            projectionMatrix: projMatrix ?? undefined,
            viewMatrix: viewMatrix ?? undefined,
            cellPositions: positions,
            hitRadius,
        });

        onPick(picked);
    }

    canvas.addEventListener('pointerup', _handlePointerUp);

    // Return cleanup function
    return () => {
        canvas.removeEventListener('pointerup', _handlePointerUp);
    };
}
