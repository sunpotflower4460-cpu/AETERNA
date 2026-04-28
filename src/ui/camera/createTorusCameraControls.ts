/**
 * createTorusCameraControls.ts
 * U2: Torus Camera / Controls — keyboard shortcut registration
 *
 * Registers keyboard shortcuts for camera control.
 * Camera controls are observation aids; they do not affect runtime dynamics.
 *
 * Shortcuts:
 *   R         = reset view
 *   1–7       = view presets (Front / Top / Side / Inside Rim / Energy Flow / Trace / Closure)
 *   Space     = auto rotate toggle
 */

/** Minimal interface for the camera controls instance (CameraControls from utils/cameraControls.js). */
interface CameraControlsInterface {
    resetView(): void;
    applyViewPreset(name: string): void;
    toggleAutoRotate(): boolean;
}

/**
 * Register keyboard shortcuts that delegate to the provided camera controls instance.
 * Keys are ignored when focus is inside an input / textarea / select element.
 */
export function registerCameraKeyboardShortcuts(controls: CameraControlsInterface): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT'
        ) {
            return;
        }

        switch (e.key) {
            case 'r':
            case 'R':
                controls.resetView();
                break;
            case '1':
                controls.applyViewPreset('front');
                break;
            case '2':
                controls.applyViewPreset('top');
                break;
            case '3':
                controls.applyViewPreset('side');
                break;
            case '4':
                controls.applyViewPreset('inside_rim');
                break;
            case '5':
                controls.applyViewPreset('energy_flow');
                break;
            case '6':
                controls.applyViewPreset('trace');
                break;
            case '7':
                controls.applyViewPreset('closure');
                break;
            case ' ': {
                e.preventDefault();
                const active = controls.toggleAutoRotate();
                _syncAutoRotateButton(active);
                break;
            }
        }
    });
}

/** Sync the Auto Rotate button text/style after toggle. */
function _syncAutoRotateButton(active: boolean): void {
    const btn = document.getElementById('btn-auto-rotate');
    if (!btn) return;
    btn.textContent = active ? 'Auto: On' : 'Auto: Off';
    btn.classList.toggle('active', active);
}
