// ── Active app wiring: connect current src modules without changing runtime behavior ──
import { state } from './organism/state.js';
import { resolveReleaseEnvironment } from './release/resolveReleaseEnvironment.js';
import { PhysicalDisk } from './core/PhysicalDisk.js';
import { TouchMemory } from './perception/TouchMemory.js';
import { AeternaNetwork } from './core/AeternaNetwork.js';
import { UI, initDOMCache } from './ui/domCache.js';
import { toggleAccordion } from './ui/accordion.js';
import { updateSliderTrack } from './utils/slider.js';
import {
    handlePointerDown, handlePointerMove, handlePointerUp,
    testAPIConnection,
} from './perception/pointerHandlers.js';
import { dispatchRuntimeCommand } from './app/runtime/RuntimeAdapter.js';
import { uiStore } from './app/state/UiStore.js';
import type { InteractionMode } from './app/state/UiState.js';
import { mountAppShell } from './app/AppShell.js';
import { isNewShellEnabled } from './app/shellFeatureFlag.js';
import { RealityVisualLayer } from './render/RealityVisualLayer.js';
import { GuidePanel } from './ui/GuidePanel.js';
import { actionLoop } from './organism/actionLoop.js';
import { CameraControls } from './utils/cameraControls.js';
import { MajorStateObserver } from './ui/MajorStateObserver.js';
import { ObservationDisplay } from './ui/ObservationDisplay.js';
import { registerCameraKeyboardShortcuts } from './ui/camera/createTorusCameraControls.js';

// ── Assign globals required by HTML onclick attributes ──
// Command-shaped globals route through RuntimeAdapter's typed dispatcher
// (src/app/runtime/RuntimeCommand.ts) rather than calling
// pointerHandlers.js directly — same behavior, single seam for future
// callers (master spec §8.1).
window.toggleAccordion  = toggleAccordion;
window.applyPreset      = (name: string) => dispatchRuntimeCommand({ type: 'APPLY_PRESET', name });
window.injectMassiveError = () => dispatchRuntimeCommand({ type: 'INJECT_MASSIVE_ERROR' });
window.resetTouchMemory = () => dispatchRuntimeCommand({ type: 'RESET_TOUCH_MEMORY' });
window.toggleVisualLayer  = () => dispatchRuntimeCommand({ type: 'TOGGLE_VISUAL_LAYER' });
window.toggleDebugLabels  = () => dispatchRuntimeCommand({ type: 'TOGGLE_DEBUG_LABELS' });
window.testAPIConnection  = testAPIConnection;
window.cameraResetView = () => state.cameraControls?.resetView();
window.cameraTopView = () => state.cameraControls?.topView();
window.cameraSideView = () => state.cameraControls?.sideView();
window.cameraFocusTorus = () => state.cameraControls?.focusTorus();
window.cameraViewPreset = (name: string) => state.cameraControls?.applyViewPreset(name);
window.toggleAutoRotate = () => {
    const active = state.cameraControls?.toggleAutoRotate();
    const btn = document.getElementById('btn-auto-rotate');
    if (btn) {
        btn.textContent = active ? 'Auto: On' : 'Auto: Off';
        btn.classList.toggle('active', !!active);
    }
};
window.setCameraViewMode = (mode: string) => state.cameraControls?.setViewMode(mode);
window.setTorusMetricMode = (mode: string) => state.network?.setTorusMetricMode(mode);
// No mode-switcher UI exists yet (no ObservatoryShell/Context Pane —
// docs/ui-migration-boundary.md) — reachable for now the same way other
// not-yet-shell-wired controls are (setCameraViewMode above).
window.setInteractionMode = (mode: string) => uiStore.setInteractionMode(mode as InteractionMode);
window.toggleMobileHelp = () => {
    const overlay = document.getElementById('mobile-help-overlay');
    if (overlay) {
        overlay.classList.toggle('visible');
    }
};

// ── Release safety: resolve once, before any user interaction is possible ──
state.releaseSafety = resolveReleaseEnvironment();

// ── DOM-ready setup ──
document.addEventListener('DOMContentLoaded', () => {
    initDOMCache();
    ['icon-network', 'icon-nature', 'icon-prereq', 'icon-organism-state', 'icon-actuation-pulse'].forEach(id => {
        const icon = document.getElementById(id);
        if(icon) icon.style.transform = 'rotate(-180deg)';
    });
    setTimeout(() => { if(UI['intro-guide']) UI['intro-guide'].style.opacity = '0'; }, 5000);

    // Public safety: the API key input must not even be present in the DOM
    // when external API calls aren't allowed (docs/current-public-runtime-map.md).
    if (!state.releaseSafety?.externalApiEnabled) {
        const guideApiSection = document.getElementById('guide-api-config-section');
        if (guideApiSection) {
            const notice = document.createElement('div');
            notice.className = 'text-[7.5px] text-white/35';
            notice.textContent = '外部APIはこのビルドでは無効です。';
            guideApiSection.replaceWith(notice);
        }
    }

    // Observatory Shell: opt-in only, mounted alongside the legacy UI —
    // see src/app/shellFeatureFlag.ts and docs/ui-migration-boundary.md.
    if (isNewShellEnabled()) {
        const shellRoot = document.createElement('div');
        shellRoot.id = 'observatory-shell';
        document.body.appendChild(shellRoot);
        mountAppShell(shellRoot, uiStore);
    }
});

// ── Initialisation ──
function init() {
    try {
        state.scene = new THREE.Scene(); state.scene.fog = new THREE.FogExp2(0x010205, 0.025);
        state.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100); state.camera.position.set(3, 6, 12); state.camera.lookAt(0, 0, 0);
        state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); state.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('canvas-container').appendChild(state.renderer.domElement);
        
        state.network = new AeternaNetwork(72); state.touchMem = new TouchMemory(72);
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(state.network.vertexPositions, 3)); geo.setAttribute('color', new THREE.BufferAttribute(state.network.colors, 3));
        
        const texCanvas = document.createElement('canvas'); texCanvas.width = 64; texCanvas.height = 64; const tCtx = texCanvas.getContext('2d');
        const grad = tCtx.createRadialGradient(32,32,0,32,32,32); grad.addColorStop(0,'rgba(255,255,255,1)'); grad.addColorStop(0.2,'rgba(255,255,255,0.8)'); grad.addColorStop(1,'rgba(0,0,0,0)');
        tCtx.fillStyle = grad; tCtx.fillRect(0,0,64,64); const tex = new THREE.CanvasTexture(texCanvas);
        
        state.particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.22, map: tex, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
        state.particleSystem.rotation.x = Math.PI / 5; state.scene.add(state.particleSystem);
        
        state.raycaster = new THREE.Raycaster(); state.raycaster.params.Points.threshold = 0.5; state.mouse = new THREE.Vector2(-10, -10);
        
        document.addEventListener('pointermove', handlePointerMove, false); document.addEventListener('pointerdown', handlePointerDown, false); document.addEventListener('pointerup', handlePointerUp, false); document.addEventListener('pointercancel', handlePointerUp, false);
        window.addEventListener('resize', () => { state.camera.aspect = window.innerWidth / window.innerHeight; state.camera.updateProjectionMatrix(); state.renderer.setSize(window.innerWidth, window.innerHeight); }, false);

        state.disk = new PhysicalDisk();
        state.network.currentBuffer[0] = +8.0; state.network.currentBuffer[Math.floor(state.network.numNodes/2)] = -8.0;
        state.realityVisualLayer = new RealityVisualLayer(state.scene, state.network, state.particleSystem); state.guidePanel = new GuidePanel(state.network);
        state.cameraControls = new CameraControls(state.camera, state.renderer.domElement);
        registerCameraKeyboardShortcuts(state.cameraControls);
        state.majorStateObserver = new MajorStateObserver();
        state.observationDisplay = new ObservationDisplay();

        ['omega-t', 'omega-p', 'r'].forEach(k => {
            const el = document.getElementById(`slider-${k}`);
            if(el) {
                el.addEventListener('input', function() {
                    const val = parseFloat(this.value);
                    if(k==='omega-t') {
                        state.disk.omega_t = val;
                        document.getElementById(`slider-val-${k}`).innerText = val.toFixed(2) + ' Hz';
                    } else if(k==='omega-p') {
                        state.disk.omega_p = val;
                        document.getElementById(`slider-val-${k}`).innerText = val.toFixed(2) + ' Hz';
                    } else {
                        state.disk.r_disk = val;
                        if (state.network) state.network.updateRadius(state.disk.r_disk);
                        document.getElementById(`slider-val-${k}`).innerText = val.toFixed(2);
                    }
                    updateSliderTrack(this, k==='omega-p'?0:k==='omega-t'?1.0:0.5, k==='omega-p'?5:k==='omega-t'?20:3);
                });
            }
        });
        requestAnimationFrame(actionLoop);
    } catch (e) {
        console.error('AETERNA init failed:', e);
        showBootFailureFallback(e);
    }
}

// Public safety / basic usability: a failed boot must not leave the user
// staring at a silent black screen with only a console error (see
// docs/ui-runtime-inventory.md §12 item 12).
function showBootFailureFallback(error: unknown) {
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'alert');
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99999',
        'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
        'gap:12px', 'padding:24px', 'text-align:center',
        'background:rgba(1,2,5,0.96)', 'color:rgba(255,255,255,0.92)',
        'font-family:system-ui,sans-serif',
    ].join(';');

    const title = document.createElement('div');
    title.style.cssText = 'font-size:16px;font-weight:600;';
    title.textContent = '観測を開始できませんでした';

    const detail = document.createElement('div');
    detail.style.cssText = 'font-size:13px;color:rgba(255,255,255,0.6);max-width:480px;';
    detail.textContent = 'このブラウザ・環境ではAETERNAを起動できませんでした（WebGL非対応の可能性があります）。';

    const reload = document.createElement('button');
    reload.style.cssText = [
        'margin-top:8px', 'padding:8px 20px', 'border-radius:8px',
        'border:1px solid rgba(34,211,238,0.4)', 'background:rgba(34,211,238,0.12)',
        'color:rgba(34,211,238,0.95)', 'font-size:13px', 'cursor:pointer',
    ].join(';');
    reload.textContent = '再読み込み';
    reload.addEventListener('click', () => window.location.reload());

    overlay.appendChild(title);
    overlay.appendChild(detail);
    overlay.appendChild(reload);
    document.body.appendChild(overlay);
    void error; // already logged via console.error above
}

init();
