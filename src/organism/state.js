// Shared mutable state — all modules that need cross-cutting globals import this object.
export const state = {
    // Resolved once at boot by main.ts (see src/release/resolveReleaseEnvironment.ts).
    // null until then; treat as "everything gated off" if still null.
    releaseSafety: null,

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

    // Most recently computed per-frame dynamics/engine state, set by
    // actionLoop.js. Read-only outside the loop — used by
    // src/app/runtime/RuntimeAdapter.ts to build a RuntimeSnapshot without
    // recomputing anything.
    lastDyn: null,
    lastEngineState: null,

    // Most recently computed NowSummaryState, set by updateMetricsUI.js
    // (~every 30 frames, U5 cadence). Used by
    // src/app/runtime/RuntimeAdapter.ts's getNowSummary().
    lastNowSummary: null,

    // Most recently built ExplainableObservationSnapshot (real overview +
    // NowSummary + recent events), set by updateMetricsUI.js alongside
    // lastNowSummary. Used by src/app/runtime/RuntimeAdapter.ts's
    // getExplainableSnapshot() — reading it from `state` (rather than
    // importing updateMetricsUI.js directly) keeps RuntimeAdapter.ts a
    // thin wrapper instead of pulling in the entire legacy UI-update
    // module graph (which touches `window` at import time).
    lastExplainableSnapshot: null,
};
