/**
 * useTorusCameraControls.ts
 * U2: Torus Camera / Controls — UI state management
 *
 * Tracks view mode, current preset name, and auto-rotate state.
 * Provides helpers to sync the Camera HUD and mode-toggle buttons.
 *
 * No runtime dynamics are modified here.
 * Camera state is purely an observation / presentation concern.
 */

/** View mode: 'view' = camera orbit on drag; 'touch' = torus input on drag. */
export type CameraViewMode = 'view' | 'touch';

export interface CameraUIState {
    viewMode: CameraViewMode;
    currentPreset: string;
    autoRotate: boolean;
}

const _state: CameraUIState = {
    viewMode: 'view',
    currentPreset: 'front',
    autoRotate: false,
};

/** Return a snapshot of the current camera UI state. */
export function getCameraUIState(): Readonly<CameraUIState> {
    return { ..._state };
}

/** Default distance used by the Front preset; zoom ratio is relative to this. */
const DEFAULT_FRONT_DISTANCE = 15;

/**
 * Sync the Camera HUD element with the current preset name, auto-rotate flag,
 * and target distance (used to compute a zoom ratio display).
 */
export function syncCameraHUD(
    presetName: string,
    autoRotate: boolean,
    targetDistance: number
): void {
    _state.currentPreset = presetName;
    _state.autoRotate = autoRotate;

    const el = document.getElementById('camera-hud-info');
    if (!el) return;

    const label = presetName
        ? presetName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Custom';
    // Zoom ratio relative to DEFAULT_FRONT_DISTANCE (matches cameraControls.js HUD logic)
    const zoom = (DEFAULT_FRONT_DISTANCE / Math.max(0.1, targetDistance)).toFixed(1) + 'x';
    const auto = autoRotate ? 'On' : 'Off';

    el.textContent = `${label}  ·  ${zoom}  ·  Auto: ${auto}`;
}

/** Sync the View / Touch mode toggle buttons in the UI. */
export function syncViewModeUI(mode: CameraViewMode): void {
    _state.viewMode = mode;
    const viewBtn  = document.getElementById('cam-mode-view');
    const touchBtn = document.getElementById('cam-mode-touch');
    if (viewBtn)  viewBtn.classList.toggle('cam-mode-active', mode === 'view');
    if (touchBtn) touchBtn.classList.toggle('cam-mode-active', mode === 'touch');
}
