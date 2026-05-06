/**
 * useObservationCameraControls.ts
 * v1.7: Deep Inspector / Time Replay — Observation Camera Controls
 *
 * Wraps the existing CameraControls instance with observation-aware helpers:
 * - focusCell: focus on a selected cell while preserving free orbit
 * - resetView: return to default camera position
 * - lockToCell / unlockFromCell: optional orbit-lock (user can disable)
 *
 * Design principles:
 * - Camera controls are OBSERVATION AIDS only; they do not imply meaning.
 * - After focusing, free orbit / zoom / pan remain available.
 * - Lock to cell is opt-in and can be released at any time.
 * - No runtime dynamics are modified.
 * - Mobile-safe: all operations degrade gracefully if the renderer is absent.
 *
 * Reference: docs/deep-inspector-time-replay.md §6
 */

import { focusCameraOnCell, type FocusCameraParams } from './focusCameraOnCell.ts';

// ── ObservationCameraState ────────────────────────────────────────────────────

export interface ObservationCameraState {
    /** Whether the camera is currently locked to a specific cell */
    isLockedToCell: boolean;
    /** The cell index the camera is locked to, or null */
    lockedCellIndex: number | null;
}

// ── ObservationCameraControls ─────────────────────────────────────────────────

/**
 * Observation-aware camera control wrapper.
 *
 * Wraps an existing camera controls instance (from utils/cameraControls.js)
 * with observation-specific helpers.
 */
export interface ObservationCameraControls {
    /** Focus on a specific cell (without locking). Free orbit preserved. */
    focusCell(cellIndex: number): void;
    /** Lock camera orbit to the focused cell. Free pan/zoom preserved. */
    lockToCell(cellIndex: number): void;
    /** Release cell lock; restore full free orbit. */
    unlockFromCell(): void;
    /** Reset camera to the default view. */
    resetView(): void;
    /** Return current observation camera state. */
    getState(): ObservationCameraState;
}

// ── createObservationCameraControls ──────────────────────────────────────────

/**
 * Minimal interface expected from the underlying camera controls.
 * Matches the CameraControls class in utils/cameraControls.js.
 */
interface CameraControlsLike {
    resetView(): void;
    setTarget?: (x: number, y: number, z: number) => void;
}

/**
 * Geometry params needed for cell position computation.
 */
export interface ObservationCameraGeometry {
    segments: number;
    R: number;
    r: number;
}

/**
 * Create an ObservationCameraControls wrapper around an existing camera
 * controls instance.
 *
 * @param controls - Underlying CameraControls instance
 * @param geometry - Torus geometry parameters
 * @returns        - ObservationCameraControls wrapper
 */
export function createObservationCameraControls(
    controls: CameraControlsLike,
    geometry: ObservationCameraGeometry,
): ObservationCameraControls {
    let _state: ObservationCameraState = {
        isLockedToCell: false,
        lockedCellIndex: null,
    };

    function _focus(cellIndex: number): void {
        const focusParams: FocusCameraParams = {
            cellIndex,
            segments: geometry.segments,
            R: geometry.R,
            r: geometry.r,
            setCameraTarget: controls.setTarget
                ? (x, y, z) => controls.setTarget!(x, y, z)
                : undefined,
        };
        focusCameraOnCell(focusParams);
    }

    return {
        focusCell(cellIndex: number): void {
            _focus(cellIndex);
            // Focus does not lock — free orbit is preserved
        },

        lockToCell(cellIndex: number): void {
            _focus(cellIndex);
            _state = { isLockedToCell: true, lockedCellIndex: cellIndex };
        },

        unlockFromCell(): void {
            _state = { isLockedToCell: false, lockedCellIndex: null };
        },

        resetView(): void {
            controls.resetView();
            _state = { isLockedToCell: false, lockedCellIndex: null };
        },

        getState(): ObservationCameraState {
            return { ..._state };
        },
    };
}
