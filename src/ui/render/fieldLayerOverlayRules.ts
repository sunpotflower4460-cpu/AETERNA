/**
 * fieldLayerOverlayRules.ts
 * U4: Field Layer Visualization — overlay composition rules
 *
 * When multiple field layers are visible simultaneously, naive additive blending
 * can make the display unreadable (overbright, semantically confusing).
 * These rules constrain how layers compose on screen.
 *
 * Principles:
 * - Layers translate observations; overlay rules control legibility only.
 * - No fake visual is introduced by overlay rules.
 * - Overlay rules do NOT change field values; they only affect presentation.
 * - 'additive' blend must be used sparingly to avoid overbright artefacts.
 * - Diagnostic mode bypasses opacity limits so raw structure is visible.
 *
 * Reference: docs/visualization-integrity-principles.md §2.2
 */

import type { FieldLayerId } from './fieldLayerRegistry.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Supported CSS/WebGL blend modes for layer composition. */
export type LayerBlendMode = 'normal' | 'additive' | 'screen' | 'multiply';

/** Overlay rule for a single layer. */
export interface LayerOverlayRule {
    /** Layer this rule applies to */
    layerId: FieldLayerId;

    /**
     * Maximum opacity (0–1) in overlay mode.
     * Prevents any single layer from dominating the display.
     * In diagnostic mode this cap is relaxed to 1.0.
     */
    maxOpacity: number;

    /**
     * Z-priority for stacking.  Higher = drawn on top.
     * Risk Overlay should have the highest priority so warnings are visible.
     */
    priority: number;

    /**
     * Default blend mode for this layer when composited with others.
     * 'additive' is allowed only for layers where brightness encodes magnitude
     * (e.g. energy / actuation pulse).  Do NOT use additive for
     * trace / residue layers to avoid overbright artefacts.
     */
    defaultBlendMode: LayerBlendMode;

    /**
     * Maximum number of simultaneously active layers that include this one.
     * When exceeded, this layer's opacity is further reduced.
     * Undefined = no additional cap.
     */
    maxSimultaneousLayers?: number;
}

// ── Overlay Rules ─────────────────────────────────────────────────────────────

/**
 * Canonical overlay rules for all field layers.
 *
 * Design notes:
 * - Energy / Activity:         normal blend, moderate opacity — base layer
 * - Trace / Residue:           multiply to show where energy AND trace co-exist
 * - Actuation Pulse:           additive brief wave, keep opacity low
 * - Sensory Return:            normal, clearly visible on top of energy
 * - Closure Match:             screen, faint arcs over return
 * - Medium Echo / Delay:       normal, outer ring at low opacity
 * - Local Excitability:        additive subtle highlights only
 * - Repeated Flow Path:        normal thin lines, faint
 * - Proto-Network Candidate:   multiply very faint — must not dominate
 * - Risk Overlay:              normal, top priority, visible only when risk > threshold
 */
export const FIELD_LAYER_OVERLAY_RULES: Record<FieldLayerId, LayerOverlayRule> = {

    energyActivity: {
        layerId: 'energyActivity',
        maxOpacity: 0.85,
        priority: 10,
        defaultBlendMode: 'normal',
        maxSimultaneousLayers: 6,
    },

    traceResidue: {
        layerId: 'traceResidue',
        maxOpacity: 0.60,
        priority: 20,
        defaultBlendMode: 'multiply',
        maxSimultaneousLayers: 5,
    },

    actuationPulse: {
        layerId: 'actuationPulse',
        maxOpacity: 0.55,
        priority: 40,
        defaultBlendMode: 'additive',
        maxSimultaneousLayers: 4,
    },

    sensoryReturn: {
        layerId: 'sensoryReturn',
        maxOpacity: 0.65,
        priority: 50,
        defaultBlendMode: 'normal',
        maxSimultaneousLayers: 5,
    },

    closureMatch: {
        layerId: 'closureMatch',
        maxOpacity: 0.45,
        priority: 60,
        defaultBlendMode: 'screen',
        maxSimultaneousLayers: 4,
    },

    mediumEchoDelay: {
        layerId: 'mediumEchoDelay',
        maxOpacity: 0.40,
        priority: 30,
        defaultBlendMode: 'normal',
        maxSimultaneousLayers: 5,
    },

    localExcitability: {
        layerId: 'localExcitability',
        maxOpacity: 0.55,
        priority: 35,
        defaultBlendMode: 'additive',
        maxSimultaneousLayers: 4,
    },

    repeatedFlowPath: {
        layerId: 'repeatedFlowPath',
        maxOpacity: 0.50,
        priority: 70,
        defaultBlendMode: 'normal',
        maxSimultaneousLayers: 4,
    },

    protoNetworkCandidate: {
        layerId: 'protoNetworkCandidate',
        maxOpacity: 0.30,
        priority: 65,
        defaultBlendMode: 'multiply',
        maxSimultaneousLayers: 3,
    },

    riskOverlay: {
        layerId: 'riskOverlay',
        maxOpacity: 0.70,
        priority: 100,
        defaultBlendMode: 'normal',
        maxSimultaneousLayers: 6,
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Return the overlay rule for a layer, falling back to safe defaults.
 */
export function getLayerOverlayRule(id: FieldLayerId): LayerOverlayRule {
    return FIELD_LAYER_OVERLAY_RULES[id] ?? {
        layerId: id,
        maxOpacity: 0.5,
        priority: 0,
        defaultBlendMode: 'normal',
    };
}

/**
 * Return all layers sorted by ascending priority (background → foreground).
 */
export function getLayersSortedByPriority(): LayerOverlayRule[] {
    return Object.values(FIELD_LAYER_OVERLAY_RULES)
        .slice()
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Compute the effective opacity for a layer given how many layers are
 * currently active.  When more layers are active than maxSimultaneousLayers,
 * opacity is scaled down proportionally to reduce overbright artefacts.
 *
 * In diagnostic mode, opacity is not reduced (returns rule.maxOpacity).
 */
export function computeEffectiveOpacity(
    rule: LayerOverlayRule,
    activeLayerCount: number,
    diagnosticMode = false
): number {
    if (diagnosticMode) return rule.maxOpacity;
    const maxSim = rule.maxSimultaneousLayers ?? 6;
    if (activeLayerCount <= maxSim) return rule.maxOpacity;
    // Scale down proportionally beyond the cap
    const scale = maxSim / activeLayerCount;
    return rule.maxOpacity * Math.max(0.2, scale);
}

/**
 * Recommended maximum number of simultaneously active overlay layers.
 * Exceeding this will trigger reduced opacities for all layers.
 */
export const RECOMMENDED_MAX_ACTIVE_LAYERS = 4;

/**
 * Check whether overbright conditions are likely given the active layer set.
 * Returns true when multiple additive-blend layers are active simultaneously.
 */
export function detectOverbright(activeLayerIds: FieldLayerId[]): boolean {
    let additiveCount = 0;
    for (const id of activeLayerIds) {
        if (FIELD_LAYER_OVERLAY_RULES[id]?.defaultBlendMode === 'additive') {
            additiveCount++;
        }
    }
    return additiveCount >= 2;
}
