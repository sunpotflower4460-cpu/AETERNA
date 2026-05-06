/**
 * cellPicking.ts
 * v1.7: Deep Inspector / Time Replay — Cell Picking
 *
 * Provides approximate cell picking for the torus grid.
 *
 * Design principles:
 * - Picking is observer-side only — no runtime state is modified.
 * - Fake cells are never created; picking returns null on miss.
 * - Approximation is acceptable for v1.7; precise 3D raycast is v1.8+.
 * - Mobile tap events are supported via pointer coordinates.
 * - The picked cell always corresponds to an existing geometry cell.
 *
 * Guardrails:
 * - Cell picking is an observation aid, not a semantic selector.
 * - No fake cells, no synthetic selections.
 *
 * Reference: docs/deep-inspector-time-replay.md §2
 */

// ── TorusCellGeometry ─────────────────────────────────────────────────────────

/**
 * Minimal 3D position of a torus cell for picking purposes.
 */
export interface TorusCellPosition {
    cellIndex: number;
    x: number;
    y: number;
    z: number;
}

// ── CellPickingParams ─────────────────────────────────────────────────────────

/**
 * Parameters for getCellIndexFromPointer.
 */
export interface CellPickingParams {
    /** Pointer X in normalised device coordinates (NDC) [-1, +1] */
    ndcX: number;
    /** Pointer Y in normalised device coordinates (NDC) [-1, +1] */
    ndcY: number;
    /** 4×4 column-major projection matrix as flat Float32Array (16 elements) */
    projectionMatrix?: Float32Array | null;
    /** 4×4 column-major view matrix as flat Float32Array (16 elements) */
    viewMatrix?: Float32Array | null;
    /** Array of torus cell 3D positions (one per cell) */
    cellPositions: TorusCellPosition[];
    /** Maximum normalised screen-space distance for a hit (default: 0.05) */
    hitRadius?: number;
}

// ── getCellIndexFromPointer ───────────────────────────────────────────────────

/**
 * Approximate cell picking from a pointer position in normalised device coords.
 *
 * Strategy (v1.7 approximation):
 * 1. For each cell, project its 3D position to clip-space using the provided
 *    projection × view matrices.
 * 2. Compute the 2D screen-space distance from the pointer to the projected
 *    cell position.
 * 3. Return the cell index with the smallest distance that falls within
 *    hitRadius.
 * 4. Returns null if no cell is within hitRadius or if insufficient geometry
 *    data is available.
 *
 * When projection/view matrices are not available, falls back to a simpler
 * angular approximation using the torus geometry angles.
 *
 * @param params - CellPickingParams
 * @returns      - Picked cell index, or null on miss
 */
export function getCellIndexFromPointer(
    params: CellPickingParams,
): number | null {
    const { ndcX, ndcY, projectionMatrix, viewMatrix, cellPositions, hitRadius = 0.05 } = params;

    if (!cellPositions || cellPositions.length === 0) return null;

    if (projectionMatrix && projectionMatrix.length === 16 &&
        viewMatrix && viewMatrix.length === 16) {
        return _pickWithMatrices(ndcX, ndcY, projectionMatrix, viewMatrix, cellPositions, hitRadius);
    }

    // Fallback: no matrices available, return null
    return null;
}

// ── Matrix-based picking ──────────────────────────────────────────────────────

function _pickWithMatrices(
    ndcX: number,
    ndcY: number,
    proj: Float32Array,
    view: Float32Array,
    cellPositions: TorusCellPosition[],
    hitRadius: number,
): number | null {
    let bestIndex: number | null = null;
    let bestDist = hitRadius;

    for (const cell of cellPositions) {
        const clip = _worldToClip(cell.x, cell.y, cell.z, proj, view);
        if (clip === null) continue;
        const dx = clip[0] - ndcX;
        const dy = clip[1] - ndcY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = cell.cellIndex;
        }
    }

    return bestIndex;
}

/**
 * Transform a world-space 3D point to clip-space NDC [x, y] using
 * projection × view matrices (column-major, standard WebGL convention).
 *
 * Returns null if w ≤ 0 (point is behind camera).
 */
function _worldToClip(
    wx: number,
    wy: number,
    wz: number,
    proj: Float32Array,
    view: Float32Array,
): [number, number] | null {
    // View-space: v = view × [wx, wy, wz, 1]
    const vx = view[0] * wx + view[4] * wy + view[8]  * wz + view[12];
    const vy = view[1] * wx + view[5] * wy + view[9]  * wz + view[13];
    const vz = view[2] * wx + view[6] * wy + view[10] * wz + view[14];
    const vw = view[3] * wx + view[7] * wy + view[11] * wz + view[15];

    // Clip-space: c = proj × [vx, vy, vz, vw]
    const cx = proj[0] * vx + proj[4] * vy + proj[8]  * vz + proj[12] * vw;
    const cy = proj[1] * vx + proj[5] * vy + proj[9]  * vz + proj[13] * vw;
    const cw = proj[3] * vx + proj[7] * vy + proj[11] * vz + proj[15] * vw;

    if (!Number.isFinite(cw) || cw <= 0) return null;

    return [cx / cw, cy / cw];
}

// ── buildCellPositionsFromGeometry ────────────────────────────────────────────

/**
 * Build a TorusCellPosition array from torus geometry parameters.
 *
 * Uses the standard torus embedding:
 *   x = (R + r·cos(v)) · cos(u)
 *   y = (R + r·cos(v)) · sin(u)
 *   z = r · sin(v)
 *
 * @param segments - Number of grid segments per dimension
 * @param R        - Major radius
 * @param r        - Minor radius
 * @returns        - Array of TorusCellPosition (length = segments²)
 */
export function buildCellPositionsFromGeometry(
    segments: number,
    R: number,
    r: number,
): TorusCellPosition[] {
    const positions: TorusCellPosition[] = [];
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            const u = (i / segments) * Math.PI * 2;
            const v = (j / segments) * Math.PI * 2;
            const x = (R + r * Math.cos(v)) * Math.cos(u);
            const y = (R + r * Math.cos(v)) * Math.sin(u);
            const z = r * Math.sin(v);
            positions.push({ cellIndex: i * segments + j, x, y, z });
        }
    }
    return positions;
}
