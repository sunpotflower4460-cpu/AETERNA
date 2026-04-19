// Truthful color mapping for AETERNA Phase 6
// All colors map to actual internal state, not arbitrary aesthetics

/**
 * Color Palette Meanings (documented for transparency):
 *
 * BLUE-GREEN系 (Coherence / Stability / Restoration):
 * - #22d3ee (cyan): High coherence, stable criticality (sigma ≈ 1.0)
 * - #4ecdc4 (teal): Inhibitory (yin) nodes, restoration-dominant
 * - #34d399 (emerald): Strong prediction match, low error
 *
 * YELLOW-ORANGE系 (Active Prediction / Adaptation / Perturbation):
 * - #fbbf24 (amber): Moderate prediction error, adaptation active
 * - #fb923c (orange): High arousal, perturbation processing
 * - #ff6b35 (coral): Excitatory (yang) nodes, activity-dominant
 *
 * RED-BLACK系 (Overload / Instability / Risk):
 * - #f87171 (red): Overload accumulation, instability warning
 * - #ef4444 (dark red): Critical overload, disintegration risk
 * - Black regions: Dormant / very low activity
 *
 * PURPLE系 (Prediction / Internal Processing):
 * - #a78bfa (purple): Prediction-heavy activity, expectation violations
 * - #c084fc (light purple): Dream/replay mode active
 */

// Get color based on node state (returns THREE.Color or {r,g,b} object)
export function getNodeStateColor(network, nodeIdx, mode = 'default') {
    const activity = Math.abs(network.currentBuffer[nodeIdx]);
    const spikeTrace = network.spikeTrace[nodeIdx];
    const nodeType = network.nodeType[nodeIdx];
    const predError = network.predictionError ? network.predictionError[nodeIdx] : 0;

    if (mode === 'prediction_error') {
        return getPredictionErrorColor(predError);
    } else if (mode === 'coherence') {
        const coherence = network.nodePhaseCoherence ? network.nodePhaseCoherence[nodeIdx] : 0;
        return getCoherenceColor(coherence);
    } else if (mode === 'type_activity') {
        return getTypeActivityColor(nodeType, activity, spikeTrace);
    } else {
        // default: balanced truthful mapping
        return getBalancedStateColor(network, nodeIdx);
    }
}

function getPredictionErrorColor(error) {
    // Low error = cyan-green (matching), high error = yellow-orange-red (mismatch)
    const errorNorm = Math.min(Math.abs(error) / 2.0, 1.0);

    if (errorNorm < 0.3) {
        // Low error: cyan to emerald
        const t = errorNorm / 0.3;
        return lerpColor(
            { r: 0.13, g: 0.83, b: 0.93 }, // cyan
            { r: 0.20, g: 0.83, b: 0.60 }, // emerald
            t
        );
    } else if (errorNorm < 0.7) {
        // Medium error: amber
        const t = (errorNorm - 0.3) / 0.4;
        return lerpColor(
            { r: 0.20, g: 0.83, b: 0.60 }, // emerald
            { r: 0.98, g: 0.75, b: 0.14 }, // amber
            t
        );
    } else {
        // High error: orange to red
        const t = (errorNorm - 0.7) / 0.3;
        return lerpColor(
            { r: 0.98, g: 0.57, b: 0.24 }, // orange
            { r: 0.97, g: 0.44, b: 0.44 }, // red
            t
        );
    }
}

function getCoherenceColor(coherence) {
    // High coherence = cyan, low = purple/fragmented
    const cohNorm = Math.max(0, Math.min(1, coherence));

    return lerpColor(
        { r: 0.66, g: 0.52, b: 0.98 }, // purple (low coherence)
        { r: 0.13, g: 0.83, b: 0.93 }, // cyan (high coherence)
        cohNorm
    );
}

function getTypeActivityColor(nodeType, activity, spikeTrace) {
    // Node type colors weighted by activity
    const baseColor = nodeType === 1
        ? { r: 0.31, g: 0.80, b: 0.77 } // yin/inhibitory: teal
        : { r: 1.00, g: 0.42, b: 0.21 }; // yang/excitatory: coral

    const activityLevel = Math.min(activity / 3.0, 1.0);
    const spike = spikeTrace > 0.5 ? 1.0 : 0.5;

    return {
        r: baseColor.r * activityLevel * spike,
        g: baseColor.g * activityLevel * spike,
        b: baseColor.b * activityLevel * spike
    };
}

function getBalancedStateColor(network, nodeIdx) {
    // Combines type, activity, and prediction error
    const activity = Math.abs(network.currentBuffer[nodeIdx]);
    const nodeType = network.nodeType[nodeIdx];
    const spikeTrace = network.spikeTrace[nodeIdx];
    const predError = network.predictionError ? Math.abs(network.predictionError[nodeIdx]) : 0;

    // Base color from type
    const baseColor = nodeType === 1
        ? { r: 0.31, g: 0.80, b: 0.77 } // teal for yin
        : { r: 1.00, g: 0.42, b: 0.21 }; // coral for yang

    // Modulate by activity
    const activityFactor = Math.min(activity / 3.0, 1.0) * (spikeTrace > 0.5 ? 1.0 : 0.4);

    // Add prediction error hue shift (toward amber/orange if high error)
    const errorShift = Math.min(predError / 1.5, 0.5);

    return {
        r: baseColor.r * activityFactor * (1.0 + errorShift * 0.3),
        g: baseColor.g * activityFactor * (1.0 - errorShift * 0.2),
        b: baseColor.b * activityFactor * (1.0 - errorShift * 0.5)
    };
}

function lerpColor(c1, c2, t) {
    return {
        r: c1.r + (c2.r - c1.r) * t,
        g: c1.g + (c2.g - c1.g) * t,
        b: c1.b + (c2.b - c1.b) * t
    };
}

// Get overlay color for graphics mode overlays
export function getOverlayColor(value, type) {
    if (type === 'heatmap') {
        // Value 0-1 mapped to blue-cyan-yellow-red
        if (value < 0.33) {
            const t = value / 0.33;
            return lerpColor(
                { r: 0.0, g: 0.0, b: 0.3 }, // dark blue
                { r: 0.13, g: 0.83, b: 0.93 }, // cyan
                t
            );
        } else if (value < 0.67) {
            const t = (value - 0.33) / 0.34;
            return lerpColor(
                { r: 0.13, g: 0.83, b: 0.93 }, // cyan
                { r: 0.98, g: 0.75, b: 0.14 }, // amber
                t
            );
        } else {
            const t = (value - 0.67) / 0.33;
            return lerpColor(
                { r: 0.98, g: 0.75, b: 0.14 }, // amber
                { r: 0.97, g: 0.44, b: 0.44 }, // red
                t
            );
        }
    } else if (type === 'binary') {
        // Simple on/off
        return value > 0.5
            ? { r: 0.13, g: 0.83, b: 0.93 } // cyan (active)
            : { r: 0.1, g: 0.1, b: 0.15 }; // dark (inactive)
    }

    return { r: 0.5, g: 0.5, b: 0.5 };
}

// System state colors for the badge and major indicators
export function getSystemStateColor(sigmaDisplay, arousal, phiProxy, overload) {
    if (overload > 0.7) {
        return { color: '#ef4444', label: 'OVERLOAD' }; // red
    } else if (sigmaDisplay > 1.18 && arousal > 0.04) {
        return { color: '#fb923c', label: 'OVERDRIVE' }; // orange
    } else if (Math.abs(sigmaDisplay - 1.0) < 0.04 && phiProxy > 0.0005) {
        return { color: '#22d3ee', label: 'CRITICAL' }; // cyan
    } else if (arousal > 0.03 && arousal < 0.15) {
        return { color: '#34d399', label: 'COHERENT' }; // emerald
    } else if (arousal < 0.01) {
        return { color: '#6b7280', label: 'QUIET' }; // gray
    } else {
        return { color: '#a78bfa', label: 'ACTIVE' }; // purple
    }
}

// Export all color meanings for documentation
export const COLOR_MEANINGS = {
    '#22d3ee': 'High coherence, stable criticality',
    '#4ecdc4': 'Inhibitory nodes, restoration-dominant',
    '#34d399': 'Strong prediction match, low error',
    '#fbbf24': 'Moderate prediction error, adaptation',
    '#fb923c': 'High arousal, perturbation processing',
    '#ff6b35': 'Excitatory nodes, activity-dominant',
    '#f87171': 'Overload accumulation, instability warning',
    '#ef4444': 'Critical overload, disintegration risk',
    '#a78bfa': 'Prediction-heavy, expectation violations',
    '#c084fc': 'Dream/replay mode active',
    '#000000': 'Dormant / very low activity'
};
