/**
 * cameraControls.js
 * U2: Torus Camera / Controls
 *
 * Orbit rotation, zoom, pan, double-tap reset, view presets, auto-rotate,
 * and View / Touch mode toggle for the torus observer.
 *
 * Camera motion is an observation aid and does not affect runtime dynamics,
 * field calculation, energy values, trace, or return.
 *
 * enableDamping: gentle lerp toward target values each frame.
 * Auto rotate: presentation control only — not a field dynamics behavior.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** Distance used by the Front preset; also the zoom-ratio baseline in the HUD. */
const DEFAULT_FRONT_DISTANCE = 15;

/** Double-tap / double-click detection window in milliseconds. */
const DOUBLE_TAP_TIME_MS = 350;

/** Double-tap / double-click detection radius in pixels. */
const DOUBLE_TAP_DIST_PX = 60;

/** Maximum pan distance from the torus center on each axis. */
const MAX_PAN_DISTANCE = 10;

// ── View Preset Definitions ──────────────────────────────────────────────────

const TORUS_PRESETS = {
    front:       { azimuth: 0,               elevation: 0.5,           distance: DEFAULT_FRONT_DISTANCE },
    top:         { azimuth: 0,               elevation: Math.PI * 0.4, distance: 18 },
    side:        { azimuth: Math.PI * 0.5,   elevation: 0,             distance: 15 },
    inside_rim:  { azimuth: 0,               elevation: -0.3,          distance: 8  },
    energy_flow: { azimuth: Math.PI * 0.25,  elevation: 0.3,           distance: 14 },
    trace:       { azimuth: Math.PI * 0.75,  elevation: 0.4,           distance: 14 },
    closure:     { azimuth: Math.PI,         elevation: 0.2,           distance: 13 },
    diagnostic:  { azimuth: Math.PI * 0.15,  elevation: 0.6,           distance: 22 },
};

// ── CameraControls ────────────────────────────────────────────────────────────

export class CameraControls {
    constructor(camera, domElement) {
        this.camera     = camera;
        this.domElement = domElement;

        // Target point (where camera looks)
        this.target = new THREE.Vector3(0, 0, 0);

        // Spherical coordinates — current (what the camera is at)
        this.azimuth   = 0;
        this.elevation = 0.5;
        this.distance  = DEFAULT_FRONT_DISTANCE;

        // Spherical coordinates — target (what the camera lerps toward)
        this.targetAzimuth   = 0;
        this.targetElevation = 0.5;
        this.targetDistance  = DEFAULT_FRONT_DISTANCE;

        // Damping: gentle lerp each frame (observation aid, not field dynamics)
        this.dampingFactor = 0.08;

        // Distance limits
        this.minDistance = 5;
        this.maxDistance = 30;

        // Elevation limits (prevent flip at poles)
        this.minElevation = -Math.PI * 0.45;
        this.maxElevation =  Math.PI * 0.45;

        // Sensitivity
        this.orbitSpeed = 0.005;
        this.zoomSpeed  = 0.008;
        this.panSpeed   = 0.003;

        // Auto-rotate (observation aid — camera motion only, not field dynamics)
        this.autoRotate      = false;
        this.autoRotateSpeed = 0.003;

        // View / Touch mode
        //   'view'  -> camera orbit on drag (default)
        //   'touch' -> camera orbit suspended on drag
        this.viewMode = 'view';

        // Current preset name for HUD display; empty string = custom angle
        this.currentPresetName = 'front';

        // Interaction state
        this.isOrbiting = false;
        this.isPanning  = false;

        // Multi-pointer tracking (pointerId -> {x, y})
        this._pointers = new Map();

        // Pinch state
        this._pinchStartDist     = 0;
        this._pinchStartDistance = DEFAULT_FRONT_DISTANCE;

        // Double-tap / double-click detection
        this._lastUpTime = 0;
        this._lastUpX    = 0;
        this._lastUpY    = 0;

        this._bind();
        this.updateCameraPosition();
    }

    // ── Event Binding ─────────────────────────────────────────────────────────

    _bind() {
        this.domElement.addEventListener('pointerdown',   this._onPointerDown.bind(this));
        this.domElement.addEventListener('pointermove',   this._onPointerMove.bind(this));
        this.domElement.addEventListener('pointerup',     this._onPointerUp.bind(this));
        this.domElement.addEventListener('pointercancel', this._onPointerUp.bind(this));
        this.domElement.addEventListener('wheel',         this._onWheel.bind(this), { passive: false });
        this.domElement.addEventListener('contextmenu',   (e) => e.preventDefault());
    }

    // Keep backward compatibility with existing code that calls bind()
    bind() {
        // Already called from constructor via _bind(); no-op here.
    }

    // ── Pointer Handlers ─────────────────────────────────────────────────────

    _onPointerDown(e) {
        this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const count = this._pointers.size;

        if (this.viewMode === 'touch') return;

        if (count === 1) {
            if (e.button === 2 || e.button === 1) {
                // Right-click / middle-click -> pan
                this.isPanning  = true;
                this.isOrbiting = false;
            } else {
                // Left-click / single touch -> orbit
                this.isOrbiting = true;
                this.isPanning  = false;
            }
        } else if (count === 2) {
            // Two fingers -> prepare for pinch zoom
            this.isOrbiting = false;
            this.isPanning  = false;
            const pts = Array.from(this._pointers.values());
            this._pinchStartDist     = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            this._pinchStartDistance = this.targetDistance;
        }
    }

    _onPointerMove(e) {
        if (!this._pointers.has(e.pointerId)) return;

        const prev = this._pointers.get(e.pointerId);
        this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.viewMode === 'touch') return;

        const count = this._pointers.size;

        if (count === 1) {
            const dx = e.clientX - prev.x;
            const dy = e.clientY - prev.y;

            if (this.isOrbiting) {
                this.targetAzimuth -= dx * this.orbitSpeed;
                this.targetElevation = Math.max(
                    this.minElevation,
                    Math.min(this.maxElevation, this.targetElevation - dy * this.orbitSpeed)
                );
                this.currentPresetName = '';
            } else if (this.isPanning) {
                this._applyPan(dx, dy);
            }
        } else if (count === 2) {
            // Pinch zoom
            const pts = Array.from(this._pointers.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (this._pinchStartDist > 0) {
                const ratio = this._pinchStartDist / dist;
                this.targetDistance = Math.max(
                    this.minDistance,
                    Math.min(this.maxDistance, this._pinchStartDistance * ratio)
                );
                this.currentPresetName = '';
            }
        }
    }

    _onPointerUp(e) {
        const prev = this._pointers.get(e.pointerId);
        this._pointers.delete(e.pointerId);
        const count = this._pointers.size;

        // Double-tap / double-click detection -> reset view
        if (prev && count === 0) {
            const now  = Date.now();
            const dt   = now - this._lastUpTime;
            const dx   = prev.x - this._lastUpX;
            const dy   = prev.y - this._lastUpY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dt < DOUBLE_TAP_TIME_MS && dist < DOUBLE_TAP_DIST_PX) {
                this.resetView();
            } else {
                this._lastUpTime = now;
                this._lastUpX    = prev.x;
                this._lastUpY    = prev.y;
            }
        }

        if (count === 0) {
            this.isOrbiting      = false;
            this.isPanning       = false;
            this._pinchStartDist = 0;
        } else if (count === 1) {
            // Went from 2 -> 1 pointer; resume orbit if in view mode
            this._pinchStartDist = 0;
            if (this.viewMode !== 'touch') {
                this.isOrbiting = true;
            }
        }
    }

    _onWheel(e) {
        e.preventDefault();
        this.targetDistance = Math.max(
            this.minDistance,
            Math.min(this.maxDistance, this.targetDistance + e.deltaY * this.zoomSpeed)
        );
        this.currentPresetName = '';
        this._updateHUD();
    }

    // ── Pan Helper ────────────────────────────────────────────────────────────

    _applyPan(dx, dy) {
        const pos = new THREE.Vector3(
            this.target.x + this.distance * Math.cos(this.elevation) * Math.sin(this.azimuth),
            this.target.y + this.distance * Math.sin(this.elevation),
            this.target.z + this.distance * Math.cos(this.elevation) * Math.cos(this.azimuth)
        );
        const dir   = new THREE.Vector3().subVectors(this.target, pos).normalize();
        const up    = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(dir, up).normalize();
        const upLocal = new THREE.Vector3().crossVectors(right, dir).normalize();

        const scale = this.panSpeed * this.distance;
        this.target.addScaledVector(right,   -dx * scale);
        this.target.addScaledVector(upLocal,  dy * scale);

        // Clamp pan to prevent flying away from the torus
        this.target.x = Math.max(-MAX_PAN_DISTANCE, Math.min(MAX_PAN_DISTANCE, this.target.x));
        this.target.y = Math.max(-MAX_PAN_DISTANCE, Math.min(MAX_PAN_DISTANCE, this.target.y));
        this.target.z = Math.max(-MAX_PAN_DISTANCE, Math.min(MAX_PAN_DISTANCE, this.target.z));
    }

    // ── Update Loop ───────────────────────────────────────────────────────────

    update() {
        // Damping: lerp current spherical coordinates toward target each frame
        this.azimuth   += (this.targetAzimuth   - this.azimuth)   * this.dampingFactor;
        this.elevation += (this.targetElevation - this.elevation) * this.dampingFactor;
        this.distance  += (this.targetDistance  - this.distance)  * this.dampingFactor;

        // Auto-rotate (observation aid — camera motion only, not field dynamics)
        if (this.autoRotate && !this.isOrbiting && !this.isPanning) {
            this.targetAzimuth += this.autoRotateSpeed;
        }

        this.updateCameraPosition();
    }

    updateCameraPosition() {
        const x = this.target.x + this.distance * Math.cos(this.elevation) * Math.sin(this.azimuth);
        const y = this.target.y + this.distance * Math.sin(this.elevation);
        const z = this.target.z + this.distance * Math.cos(this.elevation) * Math.cos(this.azimuth);
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.target);
    }

    // ── View Presets ──────────────────────────────────────────────────────────

    /**
     * Apply a named view preset.
     * Presets are observation positions only; field values are not changed.
     */
    applyViewPreset(name) {
        const preset = TORUS_PRESETS[name];
        if (!preset) return;
        this.targetAzimuth     = preset.azimuth;
        this.targetElevation   = preset.elevation;
        this.targetDistance    = preset.distance;
        this.currentPresetName = name;
        this._updateHUD();
        this._highlightPresetButton(name);
    }

    /** Reset to the Front view and re-center the target. */
    resetView() {
        this.target.set(0, 0, 0);
        this.applyViewPreset('front');
    }

    // Backward-compatible aliases used by existing window globals in main.ts
    topView()    { this.applyViewPreset('top'); }
    sideView()   { this.applyViewPreset('side'); }
    focusTorus() { this.applyViewPreset('front'); }

    // ── Auto Rotate ───────────────────────────────────────────────────────────

    /**
     * Toggle auto-rotate on/off.
     * Auto-rotate is a camera-motion observation aid; it is NOT a field dynamics behavior.
     * Returns the new state.
     */
    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        this._updateHUD();
        return this.autoRotate;
    }

    setAutoRotate(value) {
        this.autoRotate = !!value;
        this._updateHUD();
    }

    // ── View / Touch Mode ─────────────────────────────────────────────────────

    /**
     * Set the interaction mode.
     *   'view'  -> camera orbit on drag (default)
     *   'touch' -> camera orbit suspended on drag
     * Tap-based torus perturbation input is unaffected in both modes.
     */
    setViewMode(mode) {
        this.viewMode = mode;
        if (mode !== 'view') {
            this.isOrbiting = false;
            this.isPanning  = false;
        }
        this._updateModeUI(mode);
    }

    // ── HUD Helpers ───────────────────────────────────────────────────────────

    _updateHUD() {
        const el = document.getElementById('camera-hud-info');
        if (!el) return;
        const label = this.currentPresetName
            ? this.currentPresetName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : 'Custom';
        // Zoom ratio relative to the default Front distance
        const zoom = (DEFAULT_FRONT_DISTANCE / Math.max(0.1, this.targetDistance)).toFixed(1) + 'x';
        const auto = this.autoRotate ? 'On' : 'Off';
        el.textContent = `${label}  ·  ${zoom}  ·  Auto: ${auto}`;
    }

    _updateModeUI(mode) {
        const viewBtn  = document.getElementById('cam-mode-view');
        const touchBtn = document.getElementById('cam-mode-touch');
        if (viewBtn)  viewBtn.classList.toggle('cam-mode-active', mode === 'view');
        if (touchBtn) touchBtn.classList.toggle('cam-mode-active', mode === 'touch');
    }

    _highlightPresetButton(name) {
        document.querySelectorAll('.cam-preset-btn').forEach((btn) => {
            btn.classList.remove('active');
        });
        const btn = document.getElementById(`cam-preset-${name}`);
        if (btn) btn.classList.add('active');
    }
}
