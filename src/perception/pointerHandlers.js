import { state } from '../organism/state.js';
import { PRESETS } from '../constants/aeternaConstants.js';
import { updateSliderTrack } from '../utils/slider.js';
import { uiStore } from '../app/state/UiStore.ts';
import { shouldStimulateOnTap } from '../app/interaction/interactionPredicates.ts';
import { emitStimulate } from '../app/interaction/stimulationEvents.ts';

// ── Pointer / Touch / Camera Input ──────────────────

export function handlePointerDown(event) {
    // UI elements touch prevention (Robust check)
    if (event.target.closest('#ui-layer') || 
        event.target.closest('#guide-panel') || 
        event.target.closest('#intro-guide') || 
        event.target.closest('.glass-panel') || 
        event.target.tagName === 'INPUT') return;
    
    state.activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (state.activeTouches.size === 1) {
        state.isDragging = false; state.touchStartX = event.clientX; state.touchStartY = event.clientY;
    } else if (state.activeTouches.size === 2) {
        const touches = Array.from(state.activeTouches.values());
        const dx = touches[0].x - touches[1].x; const dy = touches[0].y - touches[1].y;
        state.pinchStartDist = Math.sqrt(dx*dx + dy*dy); state.cameraZBase = state.camera.position.z;
    }
}

export function handlePointerMove(event) {
    if (!state.activeTouches.has(event.pointerId)) {
        if (event.pointerType !== 'touch') {
            state.mouseX = (event.clientX - window.innerWidth/2) * 0.003;
            state.mouseY = (event.clientY - window.innerHeight/2) * 0.003;
        }
        return;
    }
    state.activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (state.activeTouches.size === 1) {
        const dx = event.clientX - state.touchStartX; const dy = event.clientY - state.touchStartY;
        if (Math.sqrt(dx*dx + dy*dy) > 5) state.isDragging = true;
        state.mouseX = (event.clientX - window.innerWidth/2) * 0.003;
        state.mouseY = (event.clientY - window.innerHeight/2) * 0.003;
    } else if (state.activeTouches.size === 2) {
        const touches = Array.from(state.activeTouches.values());
        const dx = touches[0].x - touches[1].x; const dy = touches[0].y - touches[1].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (state.pinchStartDist > 0) { state.camera.position.z = Math.max(5, Math.min(25, state.cameraZBase * (state.pinchStartDist/dist))); }
    }
}

export function handlePointerUp(event) {
    if (state.activeTouches.size === 1 && !state.isDragging && event.target.tagName === 'CANVAS') {
        const normX = event.clientX / window.innerWidth; const normY = event.clientY / window.innerHeight;

        // Visual touch feedback
        showTouchFeedback(event.clientX, event.clientY);

        // Show observation display message
        if (state.observationDisplay) {
            state.observationDisplay.showTouchMessage(normX, normY);
        }

        // Runtime-affecting effects (touchMem.recordTouch calls
        // network.injectSTDPExternal; the raycast branch calls
        // network.injectPredictionError) are gated to 'stimulate' mode —
        // previously unconditional on any tap, with no interaction-mode
        // gate at all (docs/ui-runtime-inventory.md §12 item 9).
        const interactionMode = uiStore.getState().interactionMode;
        if (shouldStimulateOnTap(interactionMode)) {
            if(state.touchMem && state.network) state.touchMem.recordTouch(normX, normY, state.network.simTime, state.network);
            if(state.raycaster && state.mouse && state.camera && state.particleSystem) {
                state.mouse.x = normX * 2 - 1; state.mouse.y = -(normY) * 2 + 1;
                state.raycaster.setFromCamera(state.mouse, state.camera);
                const intersects = state.raycaster.intersectObject(state.particleSystem);
                if (intersects.length > 0 && state.network) {
                    state.network.injectPredictionError(intersects[0].index);
                    emitStimulate();
                }
            }
        } else if (interactionMode === 'inspect') {
            // Cell Inspector (PR8b, master spec §10 Inspect Mode): select a
            // cell for inspection WITHOUT touching Runtime state — no
            // network.injectPredictionError / touchMem.recordTouch call here.
            if (state.raycaster && state.mouse && state.camera && state.particleSystem) {
                state.mouse.x = normX * 2 - 1; state.mouse.y = -(normY) * 2 + 1;
                state.raycaster.setFromCamera(state.mouse, state.camera);
                const intersects = state.raycaster.intersectObject(state.particleSystem);
                if (intersects.length > 0) uiStore.setSelectedCellId(intersects[0].index);
            }
        }
    }
    state.activeTouches.delete(event.pointerId);
    if (state.activeTouches.size < 2) state.pinchStartDist = 0;
}

// ── Visual Touch Feedback ──────────────────
function showTouchFeedback(x, y) {
    const feedback = document.getElementById('touch-feedback');
    if (!feedback) return;

    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';
    feedback.classList.add('active');

    setTimeout(() => {
        feedback.classList.remove('active');
    }, 300);
}

// ── Action Handlers (button / preset) ──────────────────

export function applyPreset(name) {
    const p = PRESETS[name];
    if (!p) return;
    state.disk.omega_t = p.omega_t;
    state.disk.omega_p = p.omega_p;
    state.disk.r_disk  = p.r;

    const sliderT = document.getElementById('slider-omega-t');
    const sliderP = document.getElementById('slider-omega-p');
    const sliderR = document.getElementById('slider-r');
    if(sliderT) {
        sliderT.value = p.omega_t;
        updateSliderTrack(sliderT, 1.0, 20.0);
        document.getElementById('slider-val-omega-t').innerText = p.omega_t.toFixed(2) + ' Hz';
    }
    if(sliderP) {
        sliderP.value = p.omega_p;
        updateSliderTrack(sliderP, 0.0, 5.0);
        document.getElementById('slider-val-omega-p').innerText = p.omega_p.toFixed(2) + ' Hz';
    }
    if(sliderR) {
        sliderR.value = p.r;
        updateSliderTrack(sliderR, 0.5, 3.0);
        document.getElementById('slider-val-r').innerText = p.r.toFixed(2);
        if (state.network) state.network.updateRadius(p.r);
    }

    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`preset-${name}`)?.classList.add('active');

    // Show observation display message
    if (state.observationDisplay) {
        state.observationDisplay.showPresetMessage(name);
    }
}

export function resetTouchMemory() {
    if (typeof state.touchMem !== 'undefined' && state.touchMem) {
        state.touchMem.traceMap.fill(0);
        state.touchMem.touchCount = 0;
        state.touchMem.lastTouchNode = -1;
        state.touchMem.lastTouchTime = -Infinity;
    }
    // Clear accumulated notification/observer history so stale entries
    // don't survive a reset (docs/ui-runtime-inventory.md §12 item 10).
    if (state.guidePanel) state.guidePanel.resetHistory();
    if (state.majorStateObserver) state.majorStateObserver.resetHistory();
    if (state.observationDisplay) state.observationDisplay.resetHistory();
    // Show observation display message
    if (state.observationDisplay) {
        state.observationDisplay.showResetMessage();
    }
}

export function injectMassiveError() {
    if (!state.network) return;
    const randomIdx = Math.floor(Math.random() * state.network.numNodes);
    state.network.injectPredictionError(randomIdx);
    // Show observation display message
    if (state.observationDisplay) {
        state.observationDisplay.showInjectionMessage();
    }
}

export function toggleVisualLayer() {
    if(state.realityVisualLayer) {
        state.realityVisualLayer.toggle();
        const btn = document.getElementById('btn-visual-layer');
        if(state.realityVisualLayer.visible) { btn.innerText = 'ON'; btn.classList.add('active'); }
        else { btn.innerText = 'OFF'; btn.classList.remove('active'); }
    }
}

export function toggleDebugLabels() {
    if (!state.realityVisualLayer) return;
    state.realityVisualLayer.showHubLabels = !state.realityVisualLayer.showHubLabels;

    const btn = document.getElementById('btn-debug-labels');
    if (!btn) return;

    if (state.realityVisualLayer.showHubLabels) {
        btn.innerText = 'ON';
        btn.classList.add('active');
    } else {
        btn.innerText = 'OFF';
        btn.classList.remove('active');
        state.realityVisualLayer.hubLabels.forEach(h => h.el.style.display = 'none');
    }
}

export async function testAPIConnection() {
    const statusEl = document.getElementById('api-status');
    if (!state.releaseSafety?.externalApiEnabled) {
        if (statusEl) statusEl.innerText = "External API is disabled in this build.";
        return;
    }
    const provider = document.getElementById('api-provider')?.value;
    const key = document.getElementById('api-key')?.value;

    if (!provider || !statusEl) return;
    if (provider === 'none') {
        statusEl.innerText = "Please select a provider.";
        if(state.guidePanel) state.guidePanel.updateConfig(provider, "");
        return;
    }
    if (!key) {
        statusEl.innerText = "Please enter API Key.";
        return;
    }
    statusEl.innerText = "Testing connection...";
    if(state.guidePanel) state.guidePanel.updateConfig(provider, key);
    
    try {
        if (provider.startsWith('gemini')) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider}:generateContent?key=${key}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Reply 'OK' if you receive this." }] }] })
            });
            if (res.ok) statusEl.innerText = `Connected: ${provider}`;
            else statusEl.innerText = "Error: Invalid Key or Quota";
        } else if (provider === 'openai') {
            const url = `https://api.openai.com/v1/chat/completions`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "Reply 'OK'" }] })
            });
            if (res.ok) statusEl.innerText = "Connected: OpenAI API";
            else statusEl.innerText = "Error: Invalid Key or Quota";
        }
    } catch(e) {
        statusEl.innerText = "Connection Failed.";
        console.error(e);
    }
}
