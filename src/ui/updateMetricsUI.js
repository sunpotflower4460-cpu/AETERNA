import { state } from '../organism/state.js';
import { UI, updateUIRow } from './domCache.js';
import { PHI } from '../constants/aeternaConstants.js';
import { updateStateTrends } from './trendSparkline.js';
import { deriveOverviewState } from './overview/deriveOverviewState.ts';
import { deriveNowSummary } from './summary/deriveNowSummary.ts';
import { deriveAeternaEvents } from './timeline/deriveAeternaEvents.ts';
import { pushOverviewSparklineValues } from './overview/MiniMetricSparkline.ts';
import { buildExplainableSnapshot } from './explain/explainableObservationSnapshot.ts';
import { updateNowSummary, updateEventTimeline } from './layout/layoutControls.js';

// Phase 1: Running ongoingness accumulators for the live observer
let _ong_totalFrames = 0;
let _ong_collapseFrames = 0;
let _ong_saturationFrames = 0;
let _ong_quietBaselineSum = 0;
let _ong_quietBaselineCount = 0;
let _ong_ignitionCount = 0;
let _ong_prevBelowFloor = false;
let _ong_recentMeans = /** @type {number[]} */ ([]);

function formatDormantEvents(events) {
    if (!Array.isArray(events) || events.length === 0) return '—';
    return events.slice(0, 3).map(event => `node:${event.node}@time:${event.timestamp}`).join(' | ');
}

function formatMetricModeLabel(metricMode, curvatureInfluence) {
    if (metricMode === 'curved') {
        return curvatureInfluence > 0 ? 'Curved' : 'Curved (observation only)';
    }

    return 'Flat';
}

function formatComplexModeLabel(fieldRuntimeMode, complexFieldMode, enabled) {
    if (!enabled || complexFieldMode === 'off') return 'scalar (default)';
    if (fieldRuntimeMode === 'complexRuntime' || complexFieldMode === 'runtime') return 'complexRuntime';
    return 'complexObserver';
}

export function updateMetricsUI(dyn, engineState) {
    const disk = state.disk;
    const tensionLoad = state.tensionLoad;
    const touchMem = state.touchMem;
    const formatDirection = (direction) => Array.isArray(direction) && direction.length >= 2
        ? `${direction[0].toFixed(2)}, ${direction[1].toFixed(2)}`
        : '—';

    // Phase 6: Update major state observer
    if (state.majorStateObserver) {
        const majorState = state.majorStateObserver.update(dyn, engineState);
        const indicatorEl = document.getElementById('major-process-indicator');
        const labelEl = document.getElementById('major-process-label');

        if (indicatorEl && labelEl && majorState.type !== 'quiet' && majorState.type !== 'low_drift') {
            indicatorEl.style.display = 'block';
            indicatorEl.style.borderColor = majorState.color;
            indicatorEl.style.color = majorState.color;
            labelEl.textContent = majorState.label;
        } else if (indicatorEl) {
            indicatorEl.style.display = 'none';
        }

        // Update sparklines every 10 frames for performance
        if (state.network && state.network.simTime % 10 === 0) {
            updateStateTrends(state.majorStateObserver);
        }
    }

    const rRatioStr = `${disk.ratioRr.toFixed(3)} [${disk.ratioRr-PHI>=0?'+':''}${(disk.ratioRr-PHI).toFixed(3)}]`;
    updateUIRow(UI['row-omega-t'], UI['val-omega-t'], disk.omega_t.toFixed(2), disk.omega_t > 0);
    updateUIRow(UI['row-omega-p'], UI['val-omega-p'], disk.omega_p.toFixed(2), disk.omega_p > 0);
    updateUIRow(UI['row-ratio'], UI['val-ratio'], rRatioStr, Math.abs(disk.ratioRr - PHI) < 0.05);
    updateUIRow(UI['row-phase-ratio'], UI['val-phase-ratio'], disk.phaseRatio.toFixed(3), disk.torusFormed);
    updateUIRow(UI['row-ergodic'], UI['val-ergodic'], disk.isErgodic?'YES':'NO', disk.isErgodic);
    updateUIRow(UI['row-schumann'], UI['val-schumann'], disk.schumannLock?'YES':'NO', disk.schumannLock);
    updateUIRow(UI['row-torus-formed'], UI['val-torus-formed'], disk.torusFormed?'YES':'NO', disk.torusFormed);
    const irr = disk._irrationalScore(disk.phaseRatio); updateUIRow(UI['row-irrational'], UI['val-irrational'], irr.toFixed(3), irr > 0.7);
    const curvature = dyn.torusCurvatureObservation || null;
    const metricMode = dyn.metricMode || 'flat';
    const metricModeLabel = formatMetricModeLabel(metricMode, dyn.curvatureInfluence);
    updateUIRow(UI['row-metric-mode'], UI['val-metric-mode'], metricModeLabel, metricMode === 'curved');
    updateUIRow(UI['row-major-radius'], UI['val-major-radius'], (dyn.majorRadius ?? 0).toFixed(3), (dyn.majorRadius ?? 0) > 0);
    updateUIRow(UI['row-minor-radius'], UI['val-minor-radius'], (dyn.minorRadius ?? 0).toFixed(3), (dyn.minorRadius ?? 0) > 0);
    updateUIRow(
        UI['row-gaussian-range'],
        UI['val-gaussian-range'],
        curvature ? `${curvature.minGaussianCurvature.toFixed(4)} .. ${curvature.maxGaussianCurvature.toFixed(4)}` : '—',
        !!curvature && (curvature.positiveCurvatureRegionCount > 0 || curvature.negativeCurvatureRegionCount > 0),
    );
    updateUIRow(
        UI['row-mean-range'],
        UI['val-mean-range'],
        curvature ? `${curvature.minMeanCurvature.toFixed(4)} .. ${curvature.maxMeanCurvature.toFixed(4)}` : '—',
        !!curvature,
    );
    updateUIRow(
        UI['row-curvature-asymmetry'],
        UI['val-curvature-asymmetry'],
        curvature ? curvature.curvatureAsymmetry.toFixed(4) : '—',
        !!curvature && Math.abs(curvature.curvatureAsymmetry) > 0.0001,
    );
    updateUIRow(
        UI['row-curvature-regions'],
        UI['val-curvature-regions'],
        curvature
            ? `+${curvature.positiveCurvatureRegionCount} / -${curvature.negativeCurvatureRegionCount} | outer ${curvature.outerRimRegionCount} / inner ${curvature.innerRimRegionCount}`
            : '—',
        !!curvature,
    );
    updateUIRow(
        UI['row-geometry-confidence'],
        UI['val-geometry-confidence'],
        curvature ? curvature.geometryConfidence.toFixed(3) : '—',
        !!curvature && curvature.geometryConfidence >= 0.99,
    );
    if (UI['torus-metric-note']) {
        UI['torus-metric-note'].innerText = metricMode === 'curved'
            ? (dyn.curvatureInfluence > 0
                ? 'Curved metric is enabled with weak geometry coupling.'
                : 'Curved metric is enabled for observation only; dynamics remain unchanged.')
            : 'Flat metric preserves legacy runtime behavior while retaining torus geometry for comparison.';
    }
    const flatMetricBtn = document.getElementById('torus-metric-flat-btn');
    const curvedMetricBtn = document.getElementById('torus-metric-curved-btn');
    if (flatMetricBtn) flatMetricBtn.classList.toggle('cam-mode-active', metricMode === 'flat');
    if (curvedMetricBtn) curvedMetricBtn.classList.toggle('cam-mode-active', metricMode === 'curved');
    
    if(UI['val-firing']) UI['val-firing'].innerText = (dyn.arousal * 100).toFixed(1) + "%";
    if(UI['val-cluster']) UI['val-cluster'].innerText = (dyn.ignitionRatio * 100).toFixed(1) + "%";
    if(UI['val-phi']) UI['val-phi'].innerText = dyn.phiApprox.toFixed(4);
    if(UI['val-coherence']) UI['val-coherence'].innerText = dyn.phaseCoherence.toFixed(3);
    if(UI['val-arousal']) UI['val-arousal'].innerText = dyn.arousal.toFixed(3);
    const complexModeLabel = formatComplexModeLabel(
        dyn.fieldRuntimeMode,
        dyn.complexFieldMode,
        dyn.complexFieldEnabled
    );
    updateUIRow(UI['row-complex-mode'], UI['val-complex-mode'], complexModeLabel, dyn.complexFieldEnabled);
    updateUIRow(
        UI['row-complex-max-amplitude'],
        UI['val-complex-max-amplitude'],
        (dyn.complexFieldMaxAmplitude || 0).toFixed(3),
        (dyn.complexFieldMaxAmplitude || 0) > 0
    );
    updateUIRow(
        UI['row-complex-average-amplitude'],
        UI['val-complex-average-amplitude'],
        (dyn.complexFieldAverageAmplitude || 0).toFixed(3),
        (dyn.complexFieldAverageAmplitude || 0) > 0
    );
    updateUIRow(
        UI['row-complex-phase-coherence'],
        UI['val-complex-phase-coherence'],
        (dyn.complexFieldPhaseCoherence || 0).toFixed(3),
        (dyn.complexFieldPhaseCoherence || 0) > 0
    );
    updateUIRow(
        UI['row-complex-phase-gradient'],
        UI['val-complex-phase-gradient'],
        (dyn.complexFieldAveragePhaseGradient || 0).toFixed(3),
        (dyn.complexFieldAveragePhaseGradient || 0) > 0
    );
    updateUIRow(
        UI['row-complex-vortex-count'],
        UI['val-complex-vortex-count'],
        `${dyn.vortexCandidateCount || 0}`,
        (dyn.vortexCandidateCount || 0) > 0
    );
    updateUIRow(
        UI['row-complex-positive-charge'],
        UI['val-complex-positive-charge'],
        `${dyn.vortexPositiveChargeCount || 0}`,
        (dyn.vortexPositiveChargeCount || 0) > 0
    );
    updateUIRow(
        UI['row-complex-negative-charge'],
        UI['val-complex-negative-charge'],
        `${dyn.vortexNegativeChargeCount || 0}`,
        (dyn.vortexNegativeChargeCount || 0) > 0
    );
    updateUIRow(
        UI['row-complex-total-charge'],
        UI['val-complex-total-charge'],
        `${dyn.vortexTotalTopologicalCharge || 0}`,
        Math.abs(dyn.vortexTotalTopologicalCharge || 0) > 0
    );
    updateUIRow(
        UI['row-complex-average-vortex-confidence'],
        UI['val-complex-average-vortex-confidence'],
        (dyn.vortexAverageConfidence || 0).toFixed(3),
        (dyn.vortexAverageConfidence || 0) > 0
    );
    updateUIRow(
        UI['row-complex-nan'],
        UI['val-complex-nan'],
        `${dyn.complexFieldNanOrInfinityCount || 0}`,
        (dyn.complexFieldNanOrInfinityCount || 0) === 0
    );
    updateUIRow(
        UI['row-complex-amplitude-clamp'],
        UI['val-complex-amplitude-clamp'],
        `${dyn.complexFieldAmplitudeClampCount || 0}`,
        (dyn.complexFieldAmplitudeClampCount || 0) === 0
    );
    updateUIRow(
        UI['row-complex-phase-unwrap'],
        UI['val-complex-phase-unwrap'],
        `${dyn.complexFieldPhaseUnwrapWarningCount || 0}`,
        (dyn.complexFieldPhaseUnwrapWarningCount || 0) === 0
    );
    
    const sig = dyn.sigmaDisplay; updateUIRow(UI['row-branching'], UI['val-branching'], sig.toFixed(3), Math.abs(sig-1.0)<0.05);
    if(UI['val-branching']) UI['val-branching'].style.color = engineState==='WHITE'?'#86efac':engineState==='BLACK'?'#fca5a5':'';
    
    // Performance Optimization: Using transform instead of width to prevent reflow
    if (UI['sigma-bar-fill']) { 
        UI['sigma-bar-fill'].style.transform = `scaleX(${Math.min(sig / 2.0, 1.0)})`; 
        UI['sigma-bar-fill'].style.backgroundColor = sig < 0.85 ? '#f87171' : sig < 1.15 ? '#22d3ee' : '#fb923c'; 
    }
    
    updateUIRow(UI['row-homeo'], UI['val-homeo'], dyn.firingRateError.toFixed(4), Math.abs(dyn.firingRateError)<0.01);
    if(UI['val-tension']) UI['val-tension'].innerText = tensionLoad.toFixed(3); 
    if(UI['val-touch']) UI['val-touch'].innerText = touchMem.touchCount;
    if(UI['val-touch-active'])  UI['val-touch-active'].innerText  = (dyn.activeTouchCount  || 0);
    if(UI['val-raw-touch'])     UI['val-raw-touch'].innerText     = (dyn.meanRawTouch      || 0).toFixed(4);
    if(UI['val-touch-onset'])   UI['val-touch-onset'].innerText   = (dyn.meanTouchOnset    || 0).toFixed(4);
    if(UI['val-touch-offset'])  UI['val-touch-offset'].innerText  = (dyn.meanTouchOffset   || 0).toFixed(4);
    if(UI['val-touch-novelty']) UI['val-touch-novelty'].innerText = (dyn.meanTouchNovelty  || 0).toFixed(4);
    if(UI['val-sound-level']) UI['val-sound-level'].innerText = (dyn.soundLevel || 0).toFixed(4);
    if(UI['val-sound-delta']) UI['val-sound-delta'].innerText = (dyn.soundDelta || 0).toFixed(4);
    if(UI['val-sound-low']) UI['val-sound-low'].innerText = (dyn.soundBandLow || 0).toFixed(4);
    if(UI['val-sound-mid']) UI['val-sound-mid'].innerText = (dyn.soundBandMid || 0).toFixed(4);
    if(UI['val-sound-high']) UI['val-sound-high'].innerText = (dyn.soundBandHigh || 0).toFixed(4);
    if(UI['val-sound-novelty']) UI['val-sound-novelty'].innerText = (dyn.soundNovelty || 0).toFixed(4);
    if(UI['val-sound-persistence']) UI['val-sound-persistence'].innerText = (dyn.soundPersistence || 0).toFixed(4);
    if(UI['val-sound-active']) UI['val-sound-active'].innerText = dyn.soundActive ? 'active' : 'inactive';
    if(UI['val-baseline']) UI['val-baseline'].innerText = (dyn.baselineLevel || 0).toFixed(4);
    if(UI['val-residue'])  UI['val-residue'].innerText  = (dyn.residueLevel  || 0).toFixed(4);
    if(UI['val-local-pred-error']) UI['val-local-pred-error'].innerText = (dyn.meanLocalPredError || 0).toFixed(4);

    // PR7: Touch pattern display
    if(UI['val-touch-duration']) UI['val-touch-duration'].innerText = (dyn.touchDuration || 0);
    if(UI['val-touch-velocity']) UI['val-touch-velocity'].innerText = (dyn.touchVelocity || 0).toFixed(5);
    if(UI['val-touch-repeat'])   UI['val-touch-repeat'].innerText   = (dyn.touchRepeatCount || 0);
    const dom = dyn.dominantPattern || '—';
    if(UI['val-touch-dominant']) UI['val-touch-dominant'].innerText = dom;
    const ps = dyn.touchPatternScores;
    if (ps) {
        if(UI['val-score-tap'])    UI['val-score-tap'].innerText    = ps.tap.toFixed(3);
        if(UI['val-score-repeat']) UI['val-score-repeat'].innerText = ps.repeat.toFixed(3);
        if(UI['val-score-hold'])   UI['val-score-hold'].innerText   = ps.hold.toFixed(3);
        if(UI['val-score-stroke']) UI['val-score-stroke'].innerText = ps.stroke.toFixed(3);
        const scoreColors = { tap: '#fbbf24', repeat: '#f87171', hold: '#a78bfa', stroke: '#34d399' };
        if(UI['val-touch-dominant']) UI['val-touch-dominant'].style.color = dom !== '—' ? (scoreColors[dom] || '') : '';
    }

    const rewriteTendency = dyn.rewriteTendency || 'none';
    const rewritePressure = `${(dyn.rewritePressureMean || 0).toFixed(3)} / ${(dyn.rewritePressureMax || 0).toFixed(3)}`;
    const priorSummary = dyn.priorBiasSummary
        ? Object.entries(dyn.priorBiasSummary)
            .map(([key, value]) => `${key[0]}=${value.toFixed(2)}`)
            .join(' ')
        : 'n=0.00 r=0.00 p=0.00 d=0.00';
    const lastRewrite = dyn.lastRewriteEvent
        ? `${dyn.lastRewriteEvent.rewriteType} @ ${dyn.lastRewriteEvent.node}`
        : '—';
    const dormantEvents = formatDormantEvents(dyn.recentDormantWakeEvents);
    if(UI['val-rewrite-tendency']) UI['val-rewrite-tendency'].innerText = rewriteTendency;
    if(UI['val-rewrite-pressure']) UI['val-rewrite-pressure'].innerText = rewritePressure;
    if(UI['val-rewrite-load']) UI['val-rewrite-load'].innerText = (dyn.globalRewriteLoad || 0).toFixed(3);
    if(UI['val-prior-bias']) UI['val-prior-bias'].innerText = priorSummary;
    if(UI['val-last-rewrite']) UI['val-last-rewrite'].innerText = lastRewrite;
    if(UI['val-noise-path']) UI['val-noise-path'].innerText = dyn.hardwareRandomNoiseActivePath ? `crypto (${dyn.hardwareRandomNoiseSource || 'crypto'})` : (dyn.hardwareRandomNoiseSource || 'fallback');
    if(UI['val-noise-mag']) UI['val-noise-mag'].innerText = (dyn.noiseMagnitude || 0).toFixed(4);
    if(UI['val-dormant-nodes']) UI['val-dormant-nodes'].innerText = `${dyn.dormantNodeCount || 0} (${dyn.activeDormantNodeCount || 0} awake)`;
    if(UI['val-dormant-wakes']) UI['val-dormant-wakes'].innerText = `${dyn.dormantWakeCount || 0}`;
    if(UI['val-dormant-pressure']) UI['val-dormant-pressure'].innerText = `${(dyn.wakePressureMean || 0).toFixed(3)} / ${(dyn.wakePressureMax || 0).toFixed(3)}`;
    if(UI['val-dormant-events']) UI['val-dormant-events'].innerText = dormantEvents;
    if(UI['val-mode-state']) UI['val-mode-state'].innerText = dyn.modeState || 'wake';
    if(UI['val-wake-drive']) UI['val-wake-drive'].innerText = (dyn.wakeDrive || 0).toFixed(3);
    if(UI['val-sleep-pressure']) UI['val-sleep-pressure'].innerText = (dyn.sleepPressure || 0).toFixed(3);
    if(UI['val-dream-pressure']) UI['val-dream-pressure'].innerText = (dyn.dreamPressure || 0).toFixed(3);
    if(UI['val-last-mode-change']) UI['val-last-mode-change'].innerText = `${dyn.lastModeChangeFrames || 0} frames`;
    if(UI['val-dream-replay']) {
        UI['val-dream-replay'].innerText = dyn.dreamReplayActive
            ? `active ${(dyn.dreamReplayStrength || 0).toFixed(3)}`
            : 'inactive';
    }
    if (UI['val-energy']) UI['val-energy'].innerText = (dyn.energy || 0).toFixed(3);
    if (UI['val-stability']) UI['val-stability'].innerText = (dyn.stability || 0).toFixed(3);
    if (UI['val-overload']) UI['val-overload'].innerText = (dyn.overload || 0).toFixed(3);
    if (UI['val-rest-drive']) UI['val-rest-drive'].innerText = (dyn.restDrive || 0).toFixed(3);
    if (UI['val-orienting-drive']) UI['val-orienting-drive'].innerText = (dyn.orientingDrive || 0).toFixed(3);
    if (UI['val-action-state']) UI['val-action-state'].innerText = dyn.actionState || 'idle';
    if (UI['val-action-pulse']) UI['val-action-pulse'].innerText = (dyn.actionPulseLevel || 0).toFixed(3);
    if (UI['val-action-direction']) UI['val-action-direction'].innerText = formatDirection(dyn.actionDirection);
    if (UI['val-last-touch-direction']) UI['val-last-touch-direction'].innerText = formatDirection(dyn.lastTouchDirection);

    // Phase B2: light sensory
    if (UI['val-light-level'])       UI['val-light-level'].innerText       = (dyn.lightLevel       || 0).toFixed(4);
    if (UI['val-light-delta'])       UI['val-light-delta'].innerText       = (dyn.lightDelta       || 0).toFixed(4);
    if (UI['val-light-novelty'])     UI['val-light-novelty'].innerText     = (dyn.lightNovelty     || 0).toFixed(4);
    if (UI['val-light-persistence']) UI['val-light-persistence'].innerText = (dyn.lightPersistence || 0).toFixed(4);
    if (UI['val-light-active'])      UI['val-light-active'].innerText      = dyn.lightActive ? 'active' : 'inactive';

    // Phase B2: motion sensory
    if (UI['val-motion-level'])       UI['val-motion-level'].innerText       = (dyn.motionLevel       || 0).toFixed(4);
    if (UI['val-motion-delta'])       UI['val-motion-delta'].innerText       = (dyn.motionDelta       || 0).toFixed(4);
    if (UI['val-motion-novelty'])     UI['val-motion-novelty'].innerText     = (dyn.motionNovelty     || 0).toFixed(4);
    if (UI['val-motion-persistence']) UI['val-motion-persistence'].innerText = (dyn.motionPersistence || 0).toFixed(4);
    if (UI['val-motion-active'])      UI['val-motion-active'].innerText      = dyn.motionActive ? 'active' : 'inactive';

    // Phase B2: time sensory
    if (UI['val-time-phase'])       UI['val-time-phase'].innerText       = (dyn.timePhase       || 0).toFixed(4);
    if (UI['val-time-level'])       UI['val-time-level'].innerText       = (dyn.timeLevel       || 0).toFixed(4);
    if (UI['val-time-persistence']) UI['val-time-persistence'].innerText = (dyn.timePersistence || 0).toFixed(4);
    if (UI['val-time-active'])      UI['val-time-active'].innerText      = dyn.timeActive ? 'active' : 'inactive';

    // Phase F: Energy flow state
    if (UI['val-energy-reserve'])         UI['val-energy-reserve'].innerText         = (dyn.energyReserve         || 0).toFixed(4);
    if (UI['val-energy-inflow'])          UI['val-energy-inflow'].innerText          = (dyn.energyInflow          || 0).toFixed(4);
    if (UI['val-energy-outflow'])         UI['val-energy-outflow'].innerText         = (dyn.energyOutflow         || 0).toFixed(4);
    if (UI['val-maintenance-cost'])       UI['val-maintenance-cost'].innerText       = (dyn.maintenanceCost       || 0).toFixed(4);
    if (UI['val-activity-cost'])          UI['val-activity-cost'].innerText          = (dyn.activityCost          || 0).toFixed(4);
    if (UI['val-rewrite-cost'])           UI['val-rewrite-cost'].innerText           = (dyn.rewriteCost           || 0).toFixed(4);
    if (UI['val-structural-integrity'])   UI['val-structural-integrity'].innerText   = (dyn.structuralIntegrity   || 1).toFixed(4);
    if (UI['val-low-energy-pressure'])    UI['val-low-energy-pressure'].innerText    = (dyn.lowEnergyPressure     || 0).toFixed(4);
    if (UI['val-recovery-drive'])         UI['val-recovery-drive'].innerText         = (dyn.recoveryDrive         || 0).toFixed(4);
    if (UI['val-energy-dormant'])         UI['val-energy-dormant'].innerText         = dyn.energyIsDormant ? 'dormant' : 'active';

    // Phase E1: hierarchical torus
    if (dyn.hierarchySummary) {
        const h = dyn.hierarchySummary;
        if (UI['val-subtori-count'])      UI['val-subtori-count'].innerText      = h.subTorusCount || '—';
        if (UI['val-subtorus-size'])      UI['val-subtorus-size'].innerText      = `${h.subTorusSize}×${h.subTorusSize}` || '—';
        if (UI['val-upper-size'])         UI['val-upper-size'].innerText         = `${h.gridWidth}×${h.gridHeight}` || '—';
        if (UI['val-sub-mean-activity'])  UI['val-sub-mean-activity'].innerText  = (h.subMeanActivity  || 0).toFixed(4);
        if (UI['val-sub-mean-arousal'])   UI['val-sub-mean-arousal'].innerText   = (h.subMeanArousal   || 0).toFixed(4);
        if (UI['val-sub-mean-sigma'])     UI['val-sub-mean-sigma'].innerText     = (h.subMeanSigma     || 0).toFixed(4);
        if (UI['val-sub-mean-phi'])       UI['val-sub-mean-phi'].innerText       = (h.subMeanPhiProxy  || 0).toFixed(4);
        if (UI['val-upper-mean-activity']) UI['val-upper-mean-activity'].innerText = (h.upperMeanActivity || 0).toFixed(4);
        if (UI['val-upper-arousal'])      UI['val-upper-arousal'].innerText      = (h.upperArousal     || 0).toFixed(4);
        if (UI['val-upper-sigma'])        UI['val-upper-sigma'].innerText        = (h.upperSigma       || 0).toFixed(4);
        if (UI['val-upper-phi'])          UI['val-upper-phi'].innerText          = (h.upperPhiProxy    || 0).toFixed(4);
    }

    const pre = disk.getConsciousnessPrerequisites(); pre.C = dyn.phiApprox>0.002; pre.D = dyn.ignitionRatio>0.05; const preE = engineState==='WHITE';
    updateUIRow(UI['row-pre-a'], UI['val-pre-a'], pre.A?'✓':'–', pre.A); updateUIRow(UI['row-pre-b'], UI['val-pre-b'], pre.B?'✓':'–', pre.B);
    updateUIRow(UI['row-pre-c'], UI['val-pre-c'], pre.C?'✓':'–', pre.C); updateUIRow(UI['row-pre-d'], UI['val-pre-d'], pre.D?'✓':'–', pre.D); updateUIRow(UI['row-pre-e'], UI['val-pre-e'], preE?'✓':'–', preE);
    updateUIRow(UI['row-total'], UI['val-total'], `${(pre.A?1:0)+(pre.B?1:0)+(pre.C?1:0)+(pre.D?1:0)+(preE?1:0)}/5`, (pre.A?1:0)+(pre.B?1:0)+(pre.C?1:0)+(pre.D?1:0)+(preE?1:0)===5);

    // Beautiful Loop L2: Observer packets (minimal display, not intrusive)
    if (UI['val-bl-energy-sense'])      UI['val-bl-energy-sense'].innerText      = (dyn.bl_energySense      || 0).toFixed(3);
    if (UI['val-bl-overload-sense'])    UI['val-bl-overload-sense'].innerText    = (dyn.bl_overloadSense    || 0).toFixed(3);
    if (UI['val-bl-coherence-sense'])   UI['val-bl-coherence-sense'].innerText   = (dyn.bl_coherenceSense   || 0).toFixed(3);
    if (UI['val-bl-boundary-sense'])    UI['val-bl-boundary-sense'].innerText    = (dyn.bl_boundarySense    || 0).toFixed(3);
    if (UI['val-bl-restoration-sense']) UI['val-bl-restoration-sense'].innerText = (dyn.bl_restorationSense || 0).toFixed(3);
    if (UI['val-bl-perturbation-pressure']) UI['val-bl-perturbation-pressure'].innerText = (dyn.bl_perturbationPressure || 0).toFixed(3);
    if (UI['val-bl-self-coherence'])    UI['val-bl-self-coherence'].innerText    = (dyn.bl_selfCoherence    || 0).toFixed(3);
    if (UI['val-bl-self-continuity'])   UI['val-bl-self-continuity'].innerText   = (dyn.bl_selfContinuity   || 0).toFixed(3);
    if (UI['val-bl-world-pressure'])    UI['val-bl-world-pressure'].innerText    = (dyn.bl_worldPressure    || 0).toFixed(3);
    if (UI['val-bl-relation-engagement']) UI['val-bl-relation-engagement'].innerText = (dyn.bl_relationEngagement || 0).toFixed(3);
    if (UI['val-bl-arousal-level'])     UI['val-bl-arousal-level'].innerText     = (dyn.bl_arousalLevel     || 0).toFixed(3);
    if (UI['val-bl-awareness-window'])  UI['val-bl-awareness-window'].innerText  = (dyn.bl_awarenessWindow  || 0).toFixed(3);
    if (UI['val-bl-salience-openness']) UI['val-bl-salience-openness'].innerText = (dyn.bl_salienceOpenness || 0).toFixed(3);
    if (UI['val-bl-foreground-pressure']) UI['val-bl-foreground-pressure'].innerText = (dyn.bl_foregroundPressure || 0).toFixed(3);
    if (UI['val-bl-rest-depth'])        UI['val-bl-rest-depth'].innerText        = (dyn.bl_restDepth        || 0).toFixed(3);
    if (UI['val-bl-hyperreactivity'])   UI['val-bl-hyperreactivity'].innerText   = (dyn.bl_hyperreactivity  || 0).toFixed(3);
    if (UI['val-bl-settling-window'])   UI['val-bl-settling-window'].innerText   = (dyn.bl_settlingWindow   || 0).toFixed(3);
    if (UI['val-trace-strength'])         UI['val-trace-strength'].innerText         = (dyn.traceStrength || 0).toFixed(3);
    if (UI['val-recurrence-weight'])      UI['val-recurrence-weight'].innerText      = (dyn.recurrenceWeight || 0).toFixed(3);
    if (UI['val-salience-residue'])       UI['val-salience-residue'].innerText       = (dyn.salienceResidue || 0).toFixed(3);
    if (UI['val-trace-replay-readiness']) UI['val-trace-replay-readiness'].innerText = (dyn.replayReadiness || 0).toFixed(3);
    if (UI['val-trace-replay-suppression']) UI['val-trace-replay-suppression'].innerText = (dyn.replaySuppression || 0).toFixed(3);
    if (UI['val-recent-pattern-weight'])  UI['val-recent-pattern-weight'].innerText  = (dyn.recentPatternWeight || 0).toFixed(3);
    if (UI['val-settling-residue'])       UI['val-settling-residue'].innerText       = (dyn.settlingResidue || 0).toFixed(3);
    if (UI['val-recovery-linked-residue']) UI['val-recovery-linked-residue'].innerText = (dyn.recoveryLinkedResidue || 0).toFixed(3);
    if (UI['val-recovery-pressure'])      UI['val-recovery-pressure'].innerText      = (dyn.recoveryPressure        || 0).toFixed(3);
    if (UI['val-relaxation-level'])       UI['val-relaxation-level'].innerText       = (dyn.relaxationLevel         || 0).toFixed(3);
    if (UI['val-stabilization-pull'])     UI['val-stabilization-pull'].innerText     = (dyn.stabilizationPull       || 0).toFixed(3);
    if (UI['val-recovery-collapse-risk']) UI['val-recovery-collapse-risk'].innerText = (dyn.collapseRisk            || 0).toFixed(3);
    if (UI['val-boundary-repair-pressure']) UI['val-boundary-repair-pressure'].innerText = (dyn.boundaryRepairPressure || 0).toFixed(3);
    if (UI['val-self-preservation-drive']) UI['val-self-preservation-drive'].innerText = (dyn.selfPreservationDrive   || 0).toFixed(3);
    if (UI['val-overload-drain'])         UI['val-overload-drain'].innerText         = (dyn.overloadDrain           || 0).toFixed(3);
    if (UI['val-recovery-trajectory'])    UI['val-recovery-trajectory'].innerText    = dyn.recoveryTrajectory || 'shift';
    if (UI['val-collapse-mode'])          UI['val-collapse-mode'].innerText          = dyn.collapseMode || 'stable';
    if (UI['val-actuation-channel'])      UI['val-actuation-channel'].innerText      = dyn.actuationPulseChannel || 'none';
    if (UI['val-actuation-intensity'])    UI['val-actuation-intensity'].innerText    = (dyn.actuationPulseIntensity || 0).toFixed(3);
    if (UI['val-actuation-coherence'])    UI['val-actuation-coherence'].innerText    = (dyn.actuationPulseCoherence || 0).toFixed(3);
    if (UI['val-actuation-rhythm'])       UI['val-actuation-rhythm'].innerText       = (dyn.actuationPulseRhythm || 0).toFixed(3);
    if (UI['val-actuation-locality'])     UI['val-actuation-locality'].innerText     = (dyn.actuationPulseLocality || 0).toFixed(3);
    if (UI['val-actuation-recovery-linked']) UI['val-actuation-recovery-linked'].innerText = (dyn.actuationPulseRecoveryLinked || 0).toFixed(3);
    if (UI['val-actuation-boundary-linked']) UI['val-actuation-boundary-linked'].innerText = (dyn.actuationPulseBoundaryLinked || 0).toFixed(3);
    if (UI['val-actuation-trace-linked']) UI['val-actuation-trace-linked'].innerText = (dyn.actuationPulseTraceLinked || 0).toFixed(3);
    if (UI['val-actuation-output-readiness']) UI['val-actuation-output-readiness'].innerText = (dyn.actuationPulseOutputReadiness || 0).toFixed(3);
    if (UI['val-actuation-generated-count']) UI['val-actuation-generated-count'].innerText = `${dyn.actuationPulseGeneratedCount || 0}`;
    if (UI['val-actuation-null-count'])   UI['val-actuation-null-count'].innerText   = `${dyn.actuationPulseNullCount || 0}`;

    // W3+W4+W5: World Medium, Sensory Return, Reafference Comparison
    // Display pre-semantic pulse-return comparison metrics
    if (UI['val-world-ambient-light'])      UI['val-world-ambient-light'].innerText      = (dyn.worldAmbientLight     || 0).toFixed(3);
    if (UI['val-world-medium-stability'])   UI['val-world-medium-stability'].innerText   = (dyn.worldMediumStability  || 0).toFixed(3);
    if (UI['val-world-pulse-impact'])       UI['val-world-pulse-impact'].innerText       = (dyn.worldLastPulseImpact  || 0).toFixed(3);
    if (UI['val-world-turbulence'])         UI['val-world-turbulence'].innerText         = (dyn.worldTurbulence       || 0).toFixed(3);
    if (UI['val-sensory-return-count'])     UI['val-sensory-return-count'].innerText     = `${dyn.sensoryReturnPacketCount || 0}`;
    if (UI['val-reafference-expected-return']) UI['val-reafference-expected-return'].innerText = (dyn.reafferenceExpectedReturn || 0).toFixed(3);
    if (UI['val-reafference-actual-return'])   UI['val-reafference-actual-return'].innerText   = (dyn.reafferenceActualReturn   || 0).toFixed(3);
    if (UI['val-reafference-return-delay'])    UI['val-reafference-return-delay'].innerText    = (dyn.reafferenceReturnDelay    || 0).toFixed(3);
    if (UI['val-reafference-return-mismatch']) UI['val-reafference-return-mismatch'].innerText = (dyn.reafferenceReturnMismatch || 0).toFixed(3);
    if (UI['val-reafference-self-caused'])     UI['val-reafference-self-caused'].innerText     = (dyn.reafferenceSelfCausedMatch || 0).toFixed(3);
    if (UI['val-reafference-world-caused'])    UI['val-reafference-world-caused'].innerText    = (dyn.reafferenceWorldCausedDifference || 0).toFixed(3);
    if (UI['val-reafference-unresolved'])      UI['val-reafference-unresolved'].innerText      = (dyn.reafferenceUnresolvedReturn || 0).toFixed(3);
    if (UI['val-reafference-confidence'])      UI['val-reafference-confidence'].innerText      = (dyn.reafferenceComparisonConfidence || 0).toFixed(3);
    if (UI['val-medium-delay-average'])        UI['val-medium-delay-average'].innerText        = (dyn.mediumDelayAverageReturnDelay || 0).toFixed(3);
    if (UI['val-medium-delay-min'])            UI['val-medium-delay-min'].innerText            = (dyn.mediumDelayMinReturnDelay || 0).toFixed(3);
    if (UI['val-medium-delay-max'])            UI['val-medium-delay-max'].innerText            = (dyn.mediumDelayMaxReturnDelay || 0).toFixed(3);
    if (UI['val-medium-delay-variance'])       UI['val-medium-delay-variance'].innerText       = (dyn.mediumDelayVariance || 0).toFixed(3);
    if (UI['val-medium-delay-stable-window'])  UI['val-medium-delay-stable-window'].innerText  = (dyn.mediumDelayStableWindow || 0).toFixed(3);
    if (UI['val-medium-delay-unstable-score']) UI['val-medium-delay-unstable-score'].innerText = (dyn.mediumDelayUnstableScore || 0).toFixed(3);
    if (UI['val-medium-delay-delayed-echo'])   UI['val-medium-delay-delayed-echo'].innerText   = (dyn.mediumDelayDelayedEchoScore || 0).toFixed(3);
    if (UI['val-medium-echo-strength'])        UI['val-medium-echo-strength'].innerText        = (dyn.mediumEchoStrength || 0).toFixed(3);
    if (UI['val-medium-echo-decay'])           UI['val-medium-echo-decay'].innerText           = (dyn.mediumEchoDecayRate || 0).toFixed(3);
    if (UI['val-medium-echo-persistence'])     UI['val-medium-echo-persistence'].innerText     = (dyn.mediumEchoPersistence || 0).toFixed(3);
    if (UI['val-medium-echo-saturation'])      UI['val-medium-echo-saturation'].innerText      = (dyn.mediumEchoSaturationRisk || 0).toFixed(3);
    if (UI['val-medium-visual-residue'])       UI['val-medium-visual-residue'].innerText       = (dyn.mediumVisualEchoResidue || 0).toFixed(3);
    if (UI['val-medium-force-residue'])        UI['val-medium-force-residue'].innerText        = (dyn.mediumForceEchoResidue || 0).toFixed(3);
    if (UI['val-medium-return-coupling'])      UI['val-medium-return-coupling'].innerText      = (dyn.mediumReturnEchoCoupling || 0).toFixed(3);
    if (UI['val-medium-world-resistance'])     UI['val-medium-world-resistance'].innerText     = (dyn.mediumWorldResistance || 0).toFixed(3);
    if (UI['val-medium-boundary-resistance'])  UI['val-medium-boundary-resistance'].innerText  = (dyn.mediumBoundaryResistance || 0).toFixed(3);
    if (UI['val-medium-return-attenuation'])   UI['val-medium-return-attenuation'].innerText   = (dyn.mediumReturnAttenuation || 0).toFixed(3);
    if (UI['val-medium-absorption'])           UI['val-medium-absorption'].innerText           = (dyn.mediumAbsorption || 0).toFixed(3);
    if (UI['val-medium-transmission-ratio'])   UI['val-medium-transmission-ratio'].innerText   = (dyn.mediumTransmissionRatio || 0).toFixed(3);
    if (UI['val-medium-resistance-balance'])   UI['val-medium-resistance-balance'].innerText   = (dyn.mediumResistanceBalance || 0).toFixed(3);
    if (UI['val-medium-resistance-variance'])  UI['val-medium-resistance-variance'].innerText  = (dyn.mediumResistanceVariance || 0).toFixed(3);
    if (UI['val-medium-profile-confidence'])   UI['val-medium-profile-confidence'].innerText   = (dyn.mediumProfileConfidence || 0).toFixed(3);
    if (UI['val-membrane-mode'])               UI['val-membrane-mode'].innerText               = dyn.membraneMode || 'observerOnly';
    if (UI['val-membrane-average-permeability']) UI['val-membrane-average-permeability'].innerText = (dyn.membraneAveragePermeability || 0).toFixed(3);
    if (UI['val-membrane-average-tension'])    UI['val-membrane-average-tension'].innerText    = (dyn.membraneAverageTension || 0).toFixed(3);
    if (UI['val-membrane-average-deformation']) UI['val-membrane-average-deformation'].innerText = (dyn.membraneAverageDeformation || 0).toFixed(3);
    if (UI['val-membrane-average-two-sidedness']) UI['val-membrane-average-two-sidedness'].innerText = (dyn.membraneAverageTwoSidedness || 0).toFixed(3);
    if (UI['val-membrane-overlap'])            UI['val-membrane-overlap'].innerText            = (dyn.membraneActuationReturnOverlap || 0).toFixed(3);
    if (UI['val-membrane-recovery-balance'])   UI['val-membrane-recovery-balance'].innerText   = (dyn.membraneRecoveryBalance || 0).toFixed(3);
    if (UI['val-membrane-integrity'])          UI['val-membrane-integrity'].innerText          = (dyn.membraneIntegrity || 0).toFixed(3);
    if (UI['val-membrane-high-deformation-count']) UI['val-membrane-high-deformation-count'].innerText = `${dyn.membraneHighDeformationRegionCount || 0}`;
    if (UI['val-membrane-nan'])                UI['val-membrane-nan'].innerText                = `${dyn.membraneNanOrInfinityCount || 0}`;

    // Phase I & M: System State Badge & Robust conditions
    const badge = UI['system-state-badge'];
    if(badge) {
        let stateTxt = 'QUIET', colorClass = 'text-white/50 border-white/50';
        let prevState = badge.innerText;

        if (sig > 1.18 && dyn.arousal > 0.04) {
            stateTxt = 'OVERDRIVE'; colorClass = 'text-orange-400 border-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]';
        } else if (dyn.arousal > 0.03 && dyn.ignitionRatio < 0.02) {
            stateTxt = 'FRAGMENTED'; colorClass = 'text-red-400 border-red-400';
        } else if (Math.abs(sig - 1.0) < 0.04 && dyn.phiApprox > 0.0005) {
            stateTxt = 'CRITICAL'; colorClass = 'text-cyan-300 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
        } else if (Math.abs(dyn.firingRateError) > 0.05 || tensionLoad > 0.25) {
            stateTxt = 'TURBULENT'; colorClass = 'text-yellow-300 border-yellow-300';
        } else if (dyn.arousal > 0.015 && dyn.phaseCoherence > 0.15 && dyn.ignitionRatio > 0.02) {
            stateTxt = 'COHERENT'; colorClass = 'text-emerald-300 border-emerald-300';
        }
        badge.className = `inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${colorClass} tracking-widest`;
        badge.innerText = stateTxt;

        // Update observation display when state changes
        if (state.observationDisplay && prevState !== stateTxt) {
            state.observationDisplay.showStateChange(stateTxt, sig);
        }
    }

    // Update observation display for other important events
    if (state.observationDisplay) {
        // Check for integration change
        state.observationDisplay.showIntegrationChange(dyn.phiApprox);

        // Check for mode change (every 180 frames to avoid spam)
        if (state.network && state.network.simTime % 180 === 0) {
            if (dyn.modeState && state.observationDisplay.lastModeState !== dyn.modeState) {
                state.observationDisplay.showModeChange(dyn.modeState);
                state.observationDisplay.lastModeState = dyn.modeState;
            }
        }

        // Check for action state change (every 120 frames)
        if (state.network && state.network.simTime % 120 === 0) {
            if (dyn.actionState && state.observationDisplay.lastActionState !== dyn.actionState) {
                state.observationDisplay.showActionState(dyn.actionState);
                state.observationDisplay.lastActionState = dyn.actionState;
            }
        }
    }

    // Phase 1: Update ongoingness observer (sec-ongoingness panel)
    const meanAct = dyn.meanActivity || 0;
    _ong_totalFrames++;
    if (meanAct < 0.01) _ong_collapseFrames++;
    // Saturation: use firing ratio (arousal) as UI proxy for high-activity states.
    // Note: this differs from scenario test saturation (maxActivity > 8.0) which requires
    // direct buffer access not available here. Arousal > 20% is a UI-only heuristic.
    if ((dyn.arousal || 0) > 0.20) _ong_saturationFrames++;
    // Quiet baseline: accumulate when no touch active
    const touchCount = dyn.activeTouchCount || 0;
    if (touchCount === 0) {
        _ong_quietBaselineSum += meanAct;
        _ong_quietBaselineCount++;
    }
    // Ignition detection
    const QUIET_FLOOR = 0.05;
    if (_ong_prevBelowFloor && meanAct >= QUIET_FLOOR) _ong_ignitionCount++;
    _ong_prevBelowFloor = meanAct < QUIET_FLOOR;
    // Maintain recent means window (100 frames)
    _ong_recentMeans.push(meanAct);
    if (_ong_recentMeans.length > 100) _ong_recentMeans.shift();

    // Update ongoingness display every 30 frames to limit DOM churn
    if (_ong_totalFrames % 30 === 0) {
        const collapseRate = _ong_totalFrames > 0 ? _ong_collapseFrames / _ong_totalFrames : 0;
        const satRate = _ong_totalFrames > 0 ? _ong_saturationFrames / _ong_totalFrames : 0;
        const quietFloor = _ong_quietBaselineCount > 0 ? _ong_quietBaselineSum / _ong_quietBaselineCount : 0;
        const recentMean = _ong_recentMeans.length > 0
            ? _ong_recentMeans.reduce((a, b) => a + b, 0) / _ong_recentMeans.length : 0;
        // Compute standard deviation of recent means
        const recentVar = _ong_recentMeans.length > 1
            ? _ong_recentMeans.map(x => (x - recentMean) ** 2).reduce((a, b) => a + b, 0) / _ong_recentMeans.length : 0;
        const recentStdDev = Math.sqrt(recentVar);
        if (UI['val-mean-activity'])    UI['val-mean-activity'].innerText    = recentMean.toFixed(4);
        if (UI['val-activity-variance']) UI['val-activity-variance'].innerText = recentStdDev.toFixed(4);
        if (UI['val-collapse-rate'])    UI['val-collapse-rate'].innerText    = collapseRate.toFixed(4);
        if (UI['val-saturation-rate'])  UI['val-saturation-rate'].innerText  = satRate.toFixed(4);
        if (UI['val-quiet-floor'])      UI['val-quiet-floor'].innerText      = quietFloor.toFixed(4);
        if (UI['val-ignition-count'])   UI['val-ignition-count'].innerText   = String(_ong_ignitionCount);
    }

    // U1: Update Observation HUD chips (every frame – cheap string ops)
    _updateHudChips(dyn);

    // U1: Update Overview summary cards (every 10 frames)
    if (_ong_totalFrames % 10 === 0) {
        _updateOverviewCards(dyn);
    }

    // U5: Derive and update Overview / Now Summary / Event Timeline (every 30 frames)
    if (_ong_totalFrames % 30 === 0) {
        _updateU5(dyn);
    }
}

// ── U1 helpers: HUD chips ─────────────────────────────────────────────────────

function _hudLevel(value, lowThresh, highThresh) {
    if (value >= highThresh) return 'critical';
    if (value >= lowThresh)  return 'high';
    return 'normal';
}

// ── U1 helpers: shared risk computation ──────────────────────────────────────

/**
 * Compute risk label and CSS level from collapse risk and saturation fraction.
 * @returns {{ label: string, level: string }}
 */
function _computeRisk(collapseRisk, satFrac) {
    const isHigh = collapseRisk > 0.6 || satFrac > 0.1;
    const isMod  = collapseRisk > 0.3;
    return {
        label: isHigh ? 'high' : isMod ? 'moderate' : 'low',
        level: isHigh ? 'critical' : isMod ? 'high' : 'low',
    };
}

function _setHudChip(id, text, level) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.dataset.level = level;
}

function _updateHudChips(dyn) {
    const sig = dyn.sigmaDisplay || 0;
    // Flow: label based on σ cascade
    const flowLabel = sig > 1.15 ? 'high' : sig > 0.9 ? 'moderate' : 'low';
    const flowLevel = sig > 1.15 ? 'high' : sig < 0.5 ? 'critical' : 'normal';
    _setHudChip('hud-chip-flow', `Flow ${flowLabel}`, flowLevel);

    // Return: recovery pressure
    const rp = dyn.recoveryPressure || 0;
    const returnLabel = rp > 0.6 ? 'strong' : rp > 0.25 ? 'delayed' : 'weak';
    const returnLevel = rp > 0.6 ? 'high' : 'normal';
    _setHudChip('hud-chip-return', `Return ${returnLabel}`, returnLevel);

    // Echo: medium echo persistence
    const ep = dyn.mediumEchoPersistence || 0;
    const echoLabel = ep > 0.5 ? 'strong' : ep > 0.2 ? 'medium' : 'faint';
    _setHudChip('hud-chip-echo', `Echo ${echoLabel}`, 'normal');

    // Risk: combined collapse + saturation
    const satFrac = _ong_totalFrames > 0 ? _ong_saturationFrames / _ong_totalFrames : 0;
    const risk = _computeRisk(dyn.collapseRisk || 0, satFrac);
    _setHudChip('hud-chip-risk', `Risk ${risk.label}`, risk.level);
}

// ── U1 helpers: Overview cards ────────────────────────────────────────────────

function _setCard(id, value, level) {
    const card = document.getElementById(id);
    if (!card) return;
    const valEl = card.querySelector('.ov-card-value');
    if (valEl) valEl.textContent = value;
    card.dataset.level = level || 'normal';
}

function _updateOverviewCards(dyn) {
    const sig = dyn.sigmaDisplay || 0;
    _setCard('ov-card-flow',
        sig.toFixed(3),
        sig > 1.15 ? 'high' : sig < 0.5 ? 'critical' : 'normal');

    const rp = dyn.recoveryPressure || 0;
    _setCard('ov-card-return',
        rp.toFixed(3),
        rp > 0.6 ? 'high' : 'normal');

    const energy = dyn.energy || 0;
    _setCard('ov-card-energy',
        energy.toFixed(3),
        energy < 0.2 ? 'critical' : energy < 0.4 ? 'high' : 'normal');

    const ep = dyn.mediumEchoPersistence || 0;
    _setCard('ov-card-echo', ep.toFixed(3), 'normal');

    const satFrac = _ong_totalFrames > 0 ? _ong_saturationFrames / _ong_totalFrames : 0;
    const satLabel = satFrac > 0.1 ? 'High' : satFrac > 0.03 ? 'Moderate' : 'Low';
    const satRisk = _computeRisk(0, satFrac); // saturation-only risk for card level
    _setCard('ov-card-saturation', satLabel, satRisk.level);

    const cr = dyn.collapseRisk || 0;
    const collapseRisk = _computeRisk(cr, 0);
    _setCard('ov-card-collapse', cr.toFixed(3), collapseRisk.level);

    const mode = dyn.modeState || 'wake';
    const action = dyn.actionState || 'idle';
    _setCard('ov-card-mode', `${mode} / ${action}`, 'normal');

    // U5: Boundary Exchange and Closure Stability cards
    const be = dyn.boundaryExchange || 0;
    _setCard('ov-card-boundary', be.toFixed(3), 'normal');
    const cs = dyn.closureStability || 0;
    _setCard('ov-card-closure', cs.toFixed(3), cs < 0.2 ? 'critical' : 'normal');
}

// ── U5: Overview / Now Summary / Event Timeline update ───────────────────────

/** Cached observation snapshot for ExplainButton (U6 will read this). */
export let currentExplainableSnapshot = null;

/** Simulation tick counter (approximated from frame count). */
let _u5_tick = 0;

function _updateU5(dyn) {
    _u5_tick += 30; // approximate tick (updated every 30 frames)

    // ── Gather available observation states ──────────────────────────────────
    // These are on state.network; null if not yet computed
    const network = state.network;
    const closure   = network?.lastBodyWorldClosureState ?? null;
    const mediumProfile = network?.lastMediumProfileState ?? null;
    const membraneObservation = network?.lastMembraneObservationState ?? null;
    // localField, repeatedFlowPaths, protoNetwork are not currently computed
    // in the main loop — pass null and derive functions degrade gracefully
    const localField = null;
    const repeatedFlowPaths = null;
    const protoNetwork = null;

    // Build a lightweight viability proxy from the dyn values already available.
    // This is NOT a full DynamicViabilityState — it's a presentation-smoothed proxy.
    const sig = dyn.sigmaDisplay || 0;
    const viability = {
        timestamp: Date.now(),
        flowContinuity:      Math.min(1, Math.max(0, sig > 1.15 ? 0.85 : sig > 0.9 ? 0.55 : 0.2)),
        energyThroughput:    Math.min(1, Math.max(0, dyn.energy || 0)),
        dissipationBalance:  Math.min(1, Math.max(0, 1 - (dyn.mediumEchoPersistence || 0))),
        resistanceBalance:   0.5,
        delayCoherence:      0.5,
        boundaryExchange:    Math.min(1, Math.max(0, dyn.boundaryExchange || 0)),
        underCouplingRisk:   0,
        overCouplingRisk:    0,
        saturationRisk:      Math.min(1, Math.max(0, _ong_totalFrames > 0 ? _ong_saturationFrames / _ong_totalFrames : 0)),
        extinctionRisk:      Math.min(1, Math.max(0, dyn.collapseRisk || 0)),
        viabilityConfidence: 0.5,
    };

    const timestamp = Date.now();
    const tick = _u5_tick;

    // ── Derive OverviewState ─────────────────────────────────────────────────
    const overviewState = deriveOverviewState({
        viability, closure, membraneObservation, localField, repeatedFlowPaths, protoNetwork,
        semanticLeakCount: 0,
        nanOrInfinityCount: 0,
        timestamp,
    });

    // ── Update Overview integrity cards ─────────────────────────────────────
    _updateIntegrityCards(overviewState);

    // ── Push sparkline values ────────────────────────────────────────────────
    const findMetric = (id) => overviewState.metrics.find(m => m.id === id);
    pushOverviewSparklineValues({
        flowContinuity:   Number(findMetric('flowContinuity')?.value   ?? 0),
        energyThroughput: Number(findMetric('energyThroughput')?.value ?? 0),
        returnStrength:   Number(findMetric('returnStrength')?.value   ?? 0),
        echoPersistence:  Number(findMetric('echoPersistence')?.value  ?? 0),
        closureStability: Number(findMetric('closureStability')?.value ?? 0),
        saturationRisk:   Number(findMetric('saturationRisk')?.value   ?? 0),
        extinctionRisk:   Number(findMetric('extinctionRisk')?.value   ?? 0),
    });

    // ── Update system state badge ────────────────────────────────────────────
    _updateSystemStateBadge(overviewState.overallStatus);

    // ── Derive and update Now Summary ────────────────────────────────────────
    const nowSummaryState = deriveNowSummary({
        overview: overviewState, viability, closure, membraneObservation, mediumProfile,
        localField, repeatedFlowPaths, protoNetwork,
        semanticLeakCount: 0, nanOrInfinityCount: 0,
        timestamp,
    });
    updateNowSummary(nowSummaryState);

    // ── Derive and update Event Timeline ─────────────────────────────────────
    const recentEvents = deriveAeternaEvents({
        viability, closure, membraneObservation, localField, repeatedFlowPaths, protoNetwork,
        semanticLeakCount: 0, nanOrInfinityCount: 0,
        tick, timestamp,
    });
    updateEventTimeline(recentEvents);

    // ── Build ExplainableObservationSnapshot for U6 ──────────────────────────
    currentExplainableSnapshot = buildExplainableSnapshot(
        overviewState, nowSummaryState, recentEvents.slice(0, 10)
    );
}

function _updateIntegrityCards(overviewState) {
    const findMetric = (id) => overviewState.metrics.find(m => m.id === id);

    const leak = findMetric('semanticLeak');
    const nanM = findMetric('nanOrInfinity');

    const leakEl = document.getElementById('ov-semantic-val');
    if (leakEl && leak) {
        leakEl.textContent = String(leak.value);
        leakEl.dataset.level = leak.status;
    }

    const nanEl = document.getElementById('ov-nan-val');
    if (nanEl && nanM) {
        nanEl.textContent = String(nanM.value);
        nanEl.dataset.level = nanM.status;
    }
}

const _STATUS_LABELS = {
    'quiet':           'QUIET',
    'active':          'ACTIVE',
    'unstable':        'UNSTABLE',
    'saturated-risk':  'SAT-RISK',
    'extinction-risk': 'EXT-RISK',
    'unknown':         'UNKNOWN',
};

function _updateSystemStateBadge(overallStatus) {
    const badge = document.getElementById('system-state-badge');
    if (!badge) return;
    badge.textContent = _STATUS_LABELS[overallStatus] ?? overallStatus;
}
