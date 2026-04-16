// Shared mutable state — all modules that need cross-cutting globals import this object.
export const state = {
    scene: null,
    camera: null,
    renderer: null,
    particleSystem: null,
    network: null,
    touchMem: null,
    realityVisualLayer: null,
    guidePanel: null,
    raycaster: null,
    mouse: null,
    disk: null,

    tensionLoad: 0,
    tensionDuration: 0,
    lastHeartbeatTime: 0,
    lastPhiApprox: 0,
    lastClusterTrend: 0,
    lastSigma: 1.0,
    mouseX: 0,
    mouseY: 0,

    pinchStartDist: 0,
    cameraZBase: 14,
    activeTouches: new Map(),
    isDragging: false,
    touchStartX: 0,
    touchStartY: 0,

    lastUIRenderTime: 0,
    lastGuideTime: 0,
    lastBridgeTime: 0,
};
