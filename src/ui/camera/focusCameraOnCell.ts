/**
 * focusCameraOnCell.ts
 * v1.7: Deep Inspector / Time Replay — Camera Focus Helper
 *
 * Provides a helper to move the camera's look-at target toward the 3D
 * position of a selected torus cell.
 *
 * Design principles:
 * - Camera focus is an OBSERVATION AID only, not a meaning-making animation.
 * - After focusing, the user retains full free orbit / zoom / pan.
 * - No lock-camera-to-cell by default; lockCameraToCell is opt-in.
 * - The camera is never animated to "reveal" a semantic meaning.
 * - Focusing to a missing cell position is a graceful no-op.
 * - Mobile-safe: movement target is set, not forced.
 *
 * Reference: docs/deep-inspector-time-replay.md §6
 */

import { buildCellPositionsFromGeometry, type TorusCellPosition } from '../render/cellPicking.ts';

// ── FocusCameraParams ─────────────────────────────────────────────────────────

export interface FocusCameraParams {
    /** Flat cell index to focus on */
    cellIndex: number;
    /** Number of grid segments per dimension */
    segments: number;
    /** Torus major radius */
    R: number;
    /** Torus minor radius */
    r: number;
    /** Pre-built cell positions (optional) */
    cellPositions?: TorusCellPosition[];
    /**
     * Camera target setter provided by the camera controls instance.
     * Called with the world-space [x, y, z] target.
     */
    setCameraTarget?: (x: number, y: number, z: number) => void;
    /**
     * Desired camera distance from the target after focusing (optional).
     * The camera controls implementation interprets this; null = keep current.
     */
    distance?: number | null;
    /**
     * Animation duration in milliseconds (optional).
     * 0 = snap immediately. null = camera controls default.
     */
    durationMs?: number | null;
}

// ── focusCameraOnCell ─────────────────────────────────────────────────────────

/**
 * Move the camera's look-at target toward the 3D position of a torus cell.
 *
 * The camera focus is an observation aid — after calling this function the
 * user retains full orbit / zoom / pan freedom.  This function does NOT:
 *   - Lock the camera
 *   - Modify runtime dynamics
 *   - Imply semantic meaning
 *
 * @param params - FocusCameraParams
 * @returns      - true if focus was applied, false if cell position unavailable
 */
export function focusCameraOnCell(params: FocusCameraParams): boolean {
    const { cellIndex, segments, R, r, setCameraTarget } = params;

    if (!setCameraTarget) return false;

    const positions = params.cellPositions
        ?? buildCellPositionsFromGeometry(segments, R, r);

    const cell = positions.find((p) => p.cellIndex === cellIndex);
    if (!cell) return false;

    if (!Number.isFinite(cell.x) || !Number.isFinite(cell.y) || !Number.isFinite(cell.z)) {
        return false;
    }

    setCameraTarget(cell.x, cell.y, cell.z);
    return true;
}

// ── computeCellWorldPosition ──────────────────────────────────────────────────

/**
 * Compute the world-space 3D position of a cell given torus geometry params.
 * Returns null when the cellIndex is out of range.
 *
 * @param cellIndex - Flat cell index
 * @param segments  - Grid segments per dimension
 * @param R         - Major radius
 * @param r         - Minor radius
 */
export function computeCellWorldPosition(
    cellIndex: number,
    segments: number,
    R: number,
    r: number,
): { x: number; y: number; z: number } | null {
    if (cellIndex < 0 || cellIndex >= segments * segments) return null;
    const i = Math.floor(cellIndex / segments);
    const j = cellIndex % segments;
    const u = (i / segments) * Math.PI * 2;
    const v = (j / segments) * Math.PI * 2;
    return {
        x: (R + r * Math.cos(v)) * Math.cos(u),
        y: (R + r * Math.cos(v)) * Math.sin(u),
        z: r * Math.sin(v),
    };
}
