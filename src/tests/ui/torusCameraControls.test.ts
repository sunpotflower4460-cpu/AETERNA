/**
 * torusCameraControls.test.ts
 * U2: Torus Camera / Controls — smoke tests
 *
 * Verifies that:
 * - View presets are correctly defined
 * - Camera controls interface contracts are present
 * - No fake visual / fake energy functions were introduced
 * - No semantic / consciousness / emotion claims exist in camera files
 * - index.html contains the required camera UI elements
 *
 * These are static tests (no browser / DOM environment required).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

const html = readFileSync(resolve(ROOT, 'index.html'), 'utf-8');

const cameraControlsSrc = readFileSync(
    resolve(ROOT, 'src/utils/cameraControls.js'),
    'utf-8'
);
const presetsSrc = readFileSync(
    resolve(ROOT, 'src/ui/camera/torusViewPresets.ts'),
    'utf-8'
);
const createSrc = readFileSync(
    resolve(ROOT, 'src/ui/camera/createTorusCameraControls.ts'),
    'utf-8'
);
const useSrc = readFileSync(
    resolve(ROOT, 'src/ui/camera/useTorusCameraControls.ts'),
    'utf-8'
);

// ── View Preset Definitions ────────────────────────────────────────────────

describe('U2: View Preset Definitions', () => {
    const requiredPresets = ['front', 'top', 'side', 'inside_rim', 'energy_flow', 'trace', 'closure', 'diagnostic'];

    it('torusViewPresets.ts exports TORUS_VIEW_PRESETS', () => {
        expect(presetsSrc).toContain('TORUS_VIEW_PRESETS');
    });

    it('torusViewPresets.ts exports TorusViewPreset interface', () => {
        expect(presetsSrc).toContain('TorusViewPreset');
    });

    for (const preset of requiredPresets) {
        it(`preset "${preset}" is defined`, () => {
            expect(presetsSrc).toContain(`'${preset}'`);
        });
    }

    it('each preset has azimuth, elevation, distance', () => {
        expect(presetsSrc).toContain('azimuth');
        expect(presetsSrc).toContain('elevation');
        expect(presetsSrc).toContain('distance');
    });

    it('presets include keyboard shortcut hints for 1-7', () => {
        expect(presetsSrc).toContain("shortcut: '1'");
        expect(presetsSrc).toContain("shortcut: '7'");
    });
});

// ── CameraControls ─────────────────────────────────────────────────────────

describe('U2: CameraControls', () => {
    it('TORUS_PRESETS is defined in cameraControls.js', () => {
        expect(cameraControlsSrc).toContain('TORUS_PRESETS');
    });

    it('all 8 presets are present in cameraControls.js', () => {
        for (const preset of ['front', 'top', 'side', 'inside_rim', 'energy_flow', 'trace', 'closure', 'diagnostic']) {
            expect(cameraControlsSrc).toContain(`${preset}:`);
        }
    });

    it('applyViewPreset method exists', () => {
        expect(cameraControlsSrc).toContain('applyViewPreset(');
    });

    it('resetView method exists', () => {
        expect(cameraControlsSrc).toContain('resetView()');
    });

    it('toggleAutoRotate method exists', () => {
        expect(cameraControlsSrc).toContain('toggleAutoRotate()');
    });

    it('autoRotate flag exists (defaults to false)', () => {
        expect(cameraControlsSrc).toContain('this.autoRotate');
        expect(cameraControlsSrc).toContain('= false');
    });

    it('setViewMode method exists', () => {
        expect(cameraControlsSrc).toContain('setViewMode(');
    });

    it('viewMode property exists', () => {
        expect(cameraControlsSrc).toContain("this.viewMode = 'view'");
    });

    it('currentPresetName property exists', () => {
        expect(cameraControlsSrc).toContain('currentPresetName');
    });

    it('dampingFactor is defined', () => {
        expect(cameraControlsSrc).toContain('dampingFactor');
    });

    it('minDistance and maxDistance are defined', () => {
        expect(cameraControlsSrc).toContain('minDistance');
        expect(cameraControlsSrc).toContain('maxDistance');
    });

    it('double-tap reset logic exists', () => {
        expect(cameraControlsSrc).toContain('_lastUpTime');
    });

    it('pan support exists', () => {
        expect(cameraControlsSrc).toContain('_applyPan');
    });

    it('pinch zoom support exists', () => {
        expect(cameraControlsSrc).toContain('_pinchStartDist');
    });

    it('camera motion note is present in source', () => {
        expect(cameraControlsSrc).toContain('observation aid');
    });

    it('auto-rotate note clarifies it is not field dynamics', () => {
        expect(cameraControlsSrc).toContain('not field dynamics');
    });
});

// ── Keyboard Shortcuts ─────────────────────────────────────────────────────

describe('U2: Keyboard Shortcuts (createTorusCameraControls)', () => {
    it('registerCameraKeyboardShortcuts is exported', () => {
        expect(createSrc).toContain('registerCameraKeyboardShortcuts');
    });

    it('R key maps to resetView', () => {
        expect(createSrc).toContain("case 'R':");
        expect(createSrc).toContain('controls.resetView()');
    });

    it('keys 1-7 map to presets', () => {
        for (const key of ['1', '2', '3', '4', '5', '6', '7']) {
            expect(createSrc).toContain(`case '${key}':`);
        }
    });

    it('Space toggles auto-rotate', () => {
        expect(createSrc).toContain("case ' ':");
        expect(createSrc).toContain('toggleAutoRotate');
    });

    it('input fields are excluded from key capture', () => {
        expect(createSrc).toContain("tagName === 'INPUT'");
    });
});

// ── Camera UI State ────────────────────────────────────────────────────────

describe('U2: Camera UI State (useTorusCameraControls)', () => {
    it('CameraViewMode type is exported', () => {
        expect(useSrc).toContain('CameraViewMode');
    });

    it('getCameraUIState is exported', () => {
        expect(useSrc).toContain('getCameraUIState');
    });

    it('syncCameraHUD is exported', () => {
        expect(useSrc).toContain('syncCameraHUD');
    });

    it('syncViewModeUI is exported', () => {
        expect(useSrc).toContain('syncViewModeUI');
    });
});

// ── HTML: Camera HUD ───────────────────────────────────────────────────────

describe('U2: Camera HUD in HTML', () => {
    it('camera-hud element exists', () => {
        expect(html).toContain('id="camera-hud"');
    });

    it('camera-hud-info element exists', () => {
        expect(html).toContain('id="camera-hud-info"');
    });

    it('camera-hud-info has initial content', () => {
        expect(html).toContain('Front');
        expect(html).toContain('Auto: Off');
    });
});

// ── HTML: Camera Viewpoints (Scenarios tab) ───────────────────────────────

describe('U2: Camera Viewpoints in HTML', () => {
    const presetBtns = ['front', 'top', 'side', 'inside_rim', 'energy_flow', 'trace', 'closure', 'diagnostic'];

    for (const p of presetBtns) {
        it(`cam-preset-${p} button exists`, () => {
            expect(html).toContain(`id="cam-preset-${p}"`);
        });
    }

    it('Reset View button calls cameraResetView()', () => {
        expect(html).toContain('cameraResetView()');
    });

    it('Auto Rotate button exists with id btn-auto-rotate', () => {
        expect(html).toContain('id="btn-auto-rotate"');
        expect(html).toContain('toggleAutoRotate()');
    });

    it('keyboard shortcut hint is present', () => {
        expect(html).toContain('R=reset');
        expect(html).toContain('1–7=presets');
    });
});

// ── HTML: View / Touch Mode ────────────────────────────────────────────────

describe('U2: View / Touch Mode in HTML', () => {
    it('cam-mode-view button exists', () => {
        expect(html).toContain('id="cam-mode-view"');
    });

    it('cam-mode-touch button exists', () => {
        expect(html).toContain('id="cam-mode-touch"');
    });

    it('setCameraViewMode is called from HTML', () => {
        expect(html).toContain('setCameraViewMode(');
    });

    it('View mode is active by default', () => {
        expect(html).toContain('id="cam-mode-view"');
        expect(html).toContain('cam-mode-active');
    });
});

// ── Safety: No Fake Visuals ────────────────────────────────────────────────

describe('U2: Safety checks — no fake visuals', () => {
    const allSrcs = [cameraControlsSrc, presetsSrc, createSrc, useSrc];

    it('no fakeEnergy in camera files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('fakeEnergy'));
    });

    it('no fakeFlow in camera files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('fakeFlow'));
    });

    it('no fakeTrace in camera files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('fakeTrace'));
    });

    it('no artificialFluctuation in camera files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('artificialFluctuation'));
    });
});

// ── Safety: No Semantic / Consciousness / Emotion Claims ──────────────────

describe('U2: Safety checks — no semantic/consciousness/emotion claims', () => {
    const allSrcs = [cameraControlsSrc, presetsSrc, createSrc, useSrc];

    it('no consciousness claim in camera files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('consciousness'));
    });

    it('no self-awareness claim in camera files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('self-awareness'));
    });

    it('no emotion claim in camera files', () => {
        allSrcs.forEach((src) => {
            const matches = (src.match(/\bemotion\b/g) ?? []).length;
            expect(matches).toBe(0);
        });
    });

    it('no semantic node in camera files', () => {
        allSrcs.forEach((src) => expect(src).not.toContain('semanticNode'));
    });
});

// ── Safety: Runtime Not Modified ──────────────────────────────────────────

describe('U2: Safety checks — runtime not modified', () => {
    it('cameraControls.js does not touch network/organism state', () => {
        expect(cameraControlsSrc).not.toContain('AeternaNetwork');
        expect(cameraControlsSrc).not.toContain('updateDynamics');
        expect(cameraControlsSrc).not.toContain('organism');
    });

    it('cameraControls.js does not modify energy/trace/return values', () => {
        expect(cameraControlsSrc).not.toContain('currentBuffer');
        expect(cameraControlsSrc).not.toContain('traceMap');
        expect(cameraControlsSrc).not.toContain('returnBuffer');
    });
});
