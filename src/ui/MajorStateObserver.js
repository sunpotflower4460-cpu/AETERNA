// Major State Observer - shows "what's happening right now" in truthful, understandable way
// Phase 6: Truthful observability without演出

export class MajorStateObserver {
    constructor() {
        this.currentDominantProcess = 'quiet';
        this.stateHistory = [];
        this.maxHistory = 200; // ~3.3 seconds at 60fps
    }

    // Analyze dynamics and determine current dominant process
    analyzeDominantProcess(dyn, _engineState) {
        const processes = [];

        // Check for different dominant processes with scores
        if (dyn.overload > 0.6) {
            processes.push({ type: 'overload_rising', score: dyn.overload, label: 'OVERLOAD RISING' });
        }

        if (dyn.sigmaDisplay > 1.15 && dyn.arousal > 0.04) {
            processes.push({ type: 'cascade_active', score: dyn.sigmaDisplay - 1.0, label: 'CASCADE ACTIVE' });
        }

        if (Math.abs(dyn.sigmaDisplay - 1.0) < 0.05 && dyn.phiApprox > 0.0008) {
            processes.push({ type: 'critical_emergence', score: dyn.phiApprox * 1000, label: 'CRITICAL EMERGENCE' });
        }

        if (dyn.arousal > 0.03 && dyn.phaseCoherence > 0.15) {
            processes.push({ type: 'coherent_activity', score: dyn.phaseCoherence, label: 'COHERENT ACTIVITY' });
        }

        if (Math.abs(dyn.firingRateError) > 0.05) {
            const tendency = dyn.sigmaDisplay > 1.0 ? 'restoring_down' : 'restoring_up';
            processes.push({ type: 'homeostasis_correcting', score: Math.abs(dyn.firingRateError), label: tendency === 'restoring_down' ? 'RESTORING DOWN' : 'RESTORING UP' });
        }

        if (dyn.meanTouchNovelty > 0.3) {
            processes.push({ type: 'touch_surprise', score: dyn.meanTouchNovelty, label: 'TOUCH SURPRISE' });
        }

        if (dyn.meanLocalPredError > 0.4) {
            processes.push({ type: 'prediction_heavy', score: dyn.meanLocalPredError, label: 'PREDICTION HEAVY' });
        }

        if (dyn.rewritePressureMean > 0.3) {
            processes.push({ type: 'rewrite_pressure', score: dyn.rewritePressureMean, label: 'REWRITE PRESSURE' });
        }

        if (dyn.modeState === 'dream' || dyn.dreamReplayActive) {
            processes.push({ type: 'dream_replay', score: dyn.dreamReplayStrength ?? 0.5, label: 'DREAM REPLAY' });
        }

        if (dyn.actionState && dyn.actionState !== 'idle') {
            const actionLabel = `ACTION: ${dyn.actionState.toUpperCase()}`;
            processes.push({ type: 'action_active', score: dyn.actionPulseLevel ?? 0.5, label: actionLabel });
        }

        if (dyn.energy < 0.3) {
            processes.push({ type: 'low_energy_drift', score: 1.0 - dyn.energy, label: 'LOW ENERGY DRIFT' });
        }

        if (dyn.activeTouchCount > 0 && dyn.touchRepeatCount > 3) {
            processes.push({ type: 'repeated_touch_habituation', score: Math.min(dyn.touchRepeatCount / 10, 1.0), label: 'REPEATED TOUCH' });
        }

        if (dyn.collapseMode === 'runaway') {
            processes.push({ type: 'recovery_runaway', score: Math.max(dyn.collapseRisk || 0, 0.8), label: 'RUNAWAY RISK' });
        } else if (dyn.collapseMode === 'hard_collapse') {
            processes.push({ type: 'recovery_hard_collapse', score: Math.max(dyn.collapseRisk || 0, 0.75), label: 'HARD COLLAPSE' });
        } else if (dyn.collapseMode === 'soft_collapse') {
            processes.push({ type: 'recovery_soft_collapse', score: Math.max(dyn.collapseRisk || 0, 0.55), label: 'SOFT COLLAPSE' });
        }

        if (dyn.recoveryTrajectory === 'recover' && dyn.recoveryPressure > 0.55) {
            processes.push({ type: 'recovery_returning', score: dyn.recoveryPressure, label: 'RETURNING' });
        } else if (dyn.recoveryTrajectory === 'partial_repair' && dyn.boundaryRepairPressure > 0.45) {
            processes.push({ type: 'recovery_partial_repair', score: dyn.boundaryRepairPressure, label: 'PARTIAL REPAIR' });
        } else if (dyn.recoveryTrajectory === 'degrade') {
            processes.push({ type: 'recovery_degrading', score: dyn.collapseRisk ?? 0.5, label: 'DEGRADING' });
        }

        if ((dyn.activeTouchCount || 0) === 0 && (dyn.traceStrength || 0) > 0.28 && (dyn.replaySuppression ?? 1) < 0.6) {
            processes.push({
                type: 'trace_echo_ready',
                score: (dyn.traceStrength || 0) * Math.max(0.2, 1 - (dyn.replaySuppression || 0)),
                label: 'TRACE ECHO'
            });
        }

        if (processes.length === 0) {
            if (dyn.arousal < 0.01) {
                return { type: 'quiet', label: 'QUIET', color: '#6b7280' };
            } else if (dyn.arousal < 0.02) {
                return { type: 'low_drift', label: 'LOW DRIFT', color: '#9ca3af' };
            }
            // No candidate process crossed a scoring threshold, but arousal
            // is above the "low drift" cutoff — still a real, nameable
            // state, not an absence of one. Must not fall through to
            // processes[0], which would be undefined here.
            return { type: 'ambient_activity', label: 'AMBIENT ACTIVITY', color: this.getProcessColor('ambient_activity') };
        }

        // Pick highest-score process
        processes.sort((a, b) => b.score - a.score);
        const dominant = processes[0];

        return {
            type: dominant.type,
            label: dominant.label,
            color: this.getProcessColor(dominant.type),
            score: dominant.score
        };
    }

    getProcessColor(processType) {
        const colorMap = {
            'overload_rising': '#ef4444',        // red
            'cascade_active': '#fb923c',         // orange
            'critical_emergence': '#22d3ee',     // cyan
            'coherent_activity': '#34d399',      // emerald
            'homeostasis_correcting': '#fbbf24', // amber
            'touch_surprise': '#f472b6',         // pink
            'prediction_heavy': '#a78bfa',       // purple
            'rewrite_pressure': '#818cf8',       // indigo
            'dream_replay': '#c084fc',           // light purple
            'action_active': '#60a5fa',          // blue
            'low_energy_drift': '#9ca3af',       // gray
            'repeated_touch_habituation': '#86efac', // light green
            'recovery_returning': '#22c55e',     // green
            'recovery_partial_repair': '#2dd4bf', // teal
            'recovery_degrading': '#f97316',     // orange
            'recovery_soft_collapse': '#fb7185', // rose
            'recovery_hard_collapse': '#ef4444', // red
            'recovery_runaway': '#f43f5e',       // strong red
            'trace_echo_ready': '#38bdf8',       // sky
            'quiet': '#6b7280',                  // gray
            'low_drift': '#9ca3af',              // light gray
            'ambient_activity': '#9ca3af'        // light gray
        };

        return colorMap[processType] || '#9ca3af';
    }

    update(dyn, engineState) {
        const state = this.analyzeDominantProcess(dyn, engineState);
        this.currentDominantProcess = state;

        // Track history for sparklines/trends
        this.stateHistory.push({
            time: Date.now(),
            process: state.type,
            arousal: dyn.arousal,
            sigma: dyn.sigmaDisplay,
            phi: dyn.phiApprox,
            overload: dyn.overload || 0,
            energy: dyn.energy ?? 1.0,
            arousalLevel: dyn.bl_arousalLevel || 0,
            awarenessWindow: dyn.bl_awarenessWindow || 0,
            salienceOpenness: dyn.bl_salienceOpenness || 0,
            foregroundPressure: dyn.bl_foregroundPressure || 0,
            traceStrength: dyn.traceStrength || 0,
            recurrenceWeight: dyn.recurrenceWeight || 0,
            replaySuppression: dyn.replaySuppression || 0,
            recoveryPressure: dyn.recoveryPressure || 0,
            collapseRisk: dyn.collapseRisk || 0,
            stabilizationPull: dyn.stabilizationPull || 0
        });

        if (this.stateHistory.length > this.maxHistory) {
            this.stateHistory.shift();
        }

        return state;
    }

    getRecentTrend(metric, windowFrames = 60) {
        if (this.stateHistory.length < 2) return [];

        const recent = this.stateHistory.slice(-windowFrames);
        return recent.map(s => s[metric] || 0);
    }

    getCurrentState() {
        return this.currentDominantProcess;
    }

    getHistory() {
        return this.stateHistory;
    }

    resetHistory() {
        this.stateHistory = [];
        this.currentDominantProcess = 'quiet';
    }
}
