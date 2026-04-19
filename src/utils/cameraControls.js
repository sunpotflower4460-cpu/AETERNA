// Camera controls for truthful observation
// Enables orbit-like rotation, zoom, pan without modifying organism state

export class CameraControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Target point (where camera looks)
        this.target = new THREE.Vector3(0, 0, 0);

        // Spherical coordinates for orbit
        this.distance = 15;
        this.azimuth = 0;  // horizontal angle
        this.elevation = 0.5; // vertical angle (0 = equator, π/2 = north pole)

        // Interaction state
        this.isOrbiting = false;
        this.isPanning = false;
        this.isZooming = false;
        this.lastPointerX = 0;
        this.lastPointerY = 0;
        this.pointerCount = 0;
        this.initialPinchDistance = 0;
        this.initialDistance = this.distance;

        // Limits
        this.minDistance = 5;
        this.maxDistance = 30;
        this.minElevation = -Math.PI * 0.45;
        this.maxElevation = Math.PI * 0.45;

        // Sensitivity
        this.orbitSpeed = 0.005;
        this.zoomSpeed = 0.01;
        this.panSpeed = 0.005;

        // Auto-rotation when idle
        this.autoRotate = true;
        this.autoRotateSpeed = 0.001;
        this.idleTime = 0;
        this.idleThreshold = 120; // frames

        this.bind();
        this.updateCameraPosition();
    }

    bind() {
        this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
        this.domElement.addEventListener('pointercancel', this.onPointerUp.bind(this));
        this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    }

    onPointerDown(e) {
        this.pointerCount++;
        this.idleTime = 0;

        if (this.pointerCount === 1) {
            this.isOrbiting = true;
            this.lastPointerX = e.clientX;
            this.lastPointerY = e.clientY;
        } else if (this.pointerCount === 2) {
            // Switch to pinch zoom
            this.isOrbiting = false;
            this.isZooming = true;
        }
    }

    onPointerMove(e) {
        if (this.isOrbiting && this.pointerCount === 1) {
            const dx = e.clientX - this.lastPointerX;
            const dy = e.clientY - this.lastPointerY;

            this.azimuth -= dx * this.orbitSpeed;
            this.elevation = Math.max(this.minElevation, Math.min(this.maxElevation, this.elevation - dy * this.orbitSpeed));

            this.lastPointerX = e.clientX;
            this.lastPointerY = e.clientY;
            this.idleTime = 0;
        }
    }

    onPointerUp(e) {
        this.pointerCount = Math.max(0, this.pointerCount - 1);

        if (this.pointerCount === 0) {
            this.isOrbiting = false;
            this.isPanning = false;
            this.isZooming = false;
        } else if (this.pointerCount === 1) {
            this.isZooming = false;
            this.isOrbiting = true;
        }
    }

    onWheel(e) {
        e.preventDefault();
        this.idleTime = 0;

        const delta = e.deltaY;
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + delta * this.zoomSpeed));
    }

    update() {
        // Auto-rotate when idle
        if (this.autoRotate && !this.isOrbiting && !this.isPanning && !this.isZooming) {
            this.idleTime++;
            if (this.idleTime > this.idleThreshold) {
                this.azimuth += this.autoRotateSpeed;
            }
        }

        this.updateCameraPosition();
    }

    updateCameraPosition() {
        // Convert spherical to Cartesian
        const x = this.target.x + this.distance * Math.cos(this.elevation) * Math.sin(this.azimuth);
        const y = this.target.y + this.distance * Math.sin(this.elevation);
        const z = this.target.z + this.distance * Math.cos(this.elevation) * Math.cos(this.azimuth);

        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.target);
    }

    // Preset views
    resetView() {
        this.azimuth = 0;
        this.elevation = 0.5;
        this.distance = 15;
        this.target.set(0, 0, 0);
        this.idleTime = 0;
        this.updateCameraPosition();
    }

    topView() {
        this.elevation = Math.PI * 0.4;
        this.distance = 18;
        this.updateCameraPosition();
    }

    sideView() {
        this.azimuth = Math.PI * 0.5;
        this.elevation = 0;
        this.distance = 15;
        this.updateCameraPosition();
    }

    focusTorus() {
        this.distance = 12;
        this.elevation = 0.3;
        this.updateCameraPosition();
    }
}
