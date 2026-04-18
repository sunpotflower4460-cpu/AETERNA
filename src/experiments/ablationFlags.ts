/**
 * Ablation flags for experimental comparison
 *
 * These flags allow toggling major mechanisms on/off to measure their effect.
 * Use with runScenario to compare behavioral outcomes.
 */

export interface AblationFlags {
    // Core dynamics
    baselineEnabled: boolean;           // Ongoing baseline activity
    predictionEnabled: boolean;         // Local prediction mechanism
    touchPredictionEnabled: boolean;    // Touch-specific prediction (future)

    // Plasticity
    rewriteEnabled: boolean;            // Weight rewriting / STDP-like plasticity

    // Organism state
    modeEnabled: boolean;               // Mode controller (quiet/active/dream)
    actionLoopEnabled: boolean;         // Action decision loop
    dreamReplayEnabled: boolean;        // Dream replay mechanism

    // Hierarchical structure
    hierarchyEnabled: boolean;          // Hierarchical torus layers

    // Energy system
    energyFlowEnabled: boolean;         // Energy flow tracking
}

/**
 * Default: all mechanisms enabled
 */
export const DEFAULT_ABLATION_FLAGS: AblationFlags = {
    baselineEnabled: true,
    predictionEnabled: true,
    touchPredictionEnabled: true,
    rewriteEnabled: true,
    modeEnabled: true,
    actionLoopEnabled: true,
    dreamReplayEnabled: true,
    hierarchyEnabled: true,
    energyFlowEnabled: true,
};

/**
 * Baseline-only: disable all higher mechanisms
 */
export const BASELINE_ONLY_FLAGS: AblationFlags = {
    baselineEnabled: true,
    predictionEnabled: false,
    touchPredictionEnabled: false,
    rewriteEnabled: false,
    modeEnabled: false,
    actionLoopEnabled: false,
    dreamReplayEnabled: false,
    hierarchyEnabled: false,
    energyFlowEnabled: false,
};

/**
 * No plasticity: disable rewrite but keep other mechanisms
 */
export const NO_PLASTICITY_FLAGS: AblationFlags = {
    baselineEnabled: true,
    predictionEnabled: true,
    touchPredictionEnabled: true,
    rewriteEnabled: false,
    modeEnabled: true,
    actionLoopEnabled: true,
    dreamReplayEnabled: true,
    hierarchyEnabled: true,
    energyFlowEnabled: true,
};

/**
 * No prediction: disable prediction but keep plasticity
 */
export const NO_PREDICTION_FLAGS: AblationFlags = {
    baselineEnabled: true,
    predictionEnabled: false,
    touchPredictionEnabled: false,
    rewriteEnabled: true,
    modeEnabled: true,
    actionLoopEnabled: true,
    dreamReplayEnabled: true,
    hierarchyEnabled: true,
    energyFlowEnabled: true,
};

/**
 * No mode/action: disable organism-level control
 */
export const NO_MODE_ACTION_FLAGS: AblationFlags = {
    baselineEnabled: true,
    predictionEnabled: true,
    touchPredictionEnabled: true,
    rewriteEnabled: true,
    modeEnabled: false,
    actionLoopEnabled: false,
    dreamReplayEnabled: false,
    hierarchyEnabled: true,
    energyFlowEnabled: true,
};

/**
 * Global ablation flags instance (for now, not actively used in core)
 * Future: integrate with AeternaNetwork to actually disable mechanisms
 */
export let currentAblationFlags: AblationFlags = { ...DEFAULT_ABLATION_FLAGS };

/**
 * Set global ablation flags
 */
export function setAblationFlags(flags: Partial<AblationFlags>): void {
    currentAblationFlags = { ...currentAblationFlags, ...flags };
}

/**
 * Reset to default flags
 */
export function resetAblationFlags(): void {
    currentAblationFlags = { ...DEFAULT_ABLATION_FLAGS };
}

/**
 * Get current flags
 */
export function getAblationFlags(): Readonly<AblationFlags> {
    return currentAblationFlags;
}
