// ── Active app wiring: connect current src modules without changing runtime behavior ──
import { state } from './organism/state.js';
import { PhysicalDisk } from './core/PhysicalDisk.js';
import { TouchMemory } from './perception/TouchMemory.js';
import { AeternaNetwork } from './core/AeternaNetwork.js';
import { UI, initDOMCache } from './ui/domCache.js';
import { toggleAccordion } from './ui/accordion.js';
import { updateSliderTrack } from './utils/slider.js';
import {
    handlePointerDown, handlePointerMove, handlePointerUp,
    applyPreset, resetTouchMemory, injectMassiveError,
    toggleVisualLayer, toggleDebugLabels, testAPIConnection,
} from './perception/pointerHandlers.js';
import { RealityVisualLayer } from './render/RealityVisualLayer.js';
import { GuidePanel } from './ui/GuidePanel.js';
import { actionLoop } from './organism/actionLoop.js';
import { CameraControls } from './utils/cameraControls.js';
import { MajorStateObserver } from './ui/MajorStateObserver.js';

// ── Assign globals required by HTML onclick attributes ──
window.toggleAccordion  = toggleAccordion;
window.applyPreset      = applyPreset;
window.injectMassiveError = injectMassiveError;
window.resetTouchMemory = resetTouchMemory;
window.toggleVisualLayer  = toggleVisualLayer;
window.toggleDebugLabels  = toggleDebugLabels;
window.testAPIConnection  = testAPIConnection;
window.cameraResetView = () => state.cameraControls?.resetView();
window.cameraTopView = () => state.cameraControls?.topView();
window.cameraSideView = () => state.cameraControls?.sideView();
window.cameraFocusTorus = () => state.cameraControls?.focusTorus();
window.toggleMobileHelp = () => {
    const overlay = document.getElementById('mobile-help-overlay');
    if (overlay) {
        overlay.classList.toggle('visible');
    }
};

// ── DOM-ready setup ──
document.addEventListener('DOMContentLoaded', () => {
    initDOMCache();
    ['icon-network', 'icon-nature', 'icon-prereq', 'icon-organism-state'].forEach(id => {
        const icon = document.getElementById(id);
        if(icon) icon.style.transform = 'rotate(-180deg)';
    });
    setTimeout(() => { if(UI['intro-guide']) UI['intro-guide'].style.opacity = '0'; }, 5000);
});

// ── Initialisation ──
function init() {
    try {
        state.scene = new THREE.Scene(); state.scene.fog = new THREE.FogExp2(0x010205, 0.025);
        state.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100); state.camera.position.set(3, 6, 12); state.camera.lookAt(0, 0, 0);
        state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); state.renderer.setPixelRatio(window.devicePixelRatio); state.renderer.setSize(window.innerWidth, window.innerHeight);
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
        state.majorStateObserver = new MajorStateObserver();

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
    }
}

init();
