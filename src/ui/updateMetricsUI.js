import { state } from '../organism/state.js';
import { UI, updateUIRow } from './domCache.js';
import { PHI } from '../constants/aeternaConstants.js';

function formatDormantEvents(events) {
    if (!Array.isArray(events) || events.length === 0) return '—';
    return events.slice(0, 3).map(event => `node:${event.node}@time:${event.timestamp}`).join(' | ');
}

export function updateMetricsUI(dyn, engineState) {
    const disk = state.disk;
    const tensionLoad = state.tensionLoad;
    const touchMem = state.touchMem;
    const formatDirection = (direction) => Array.isArray(direction) && direction.length >= 2
        ? `${direction[0].toFixed(2)}, ${direction[1].toFixed(2)}`
        : '—';

    const rRatioStr = `${disk.ratioRr.toFixed(3)} [${disk.ratioRr-PHI>=0?'+':''}${(disk.ratioRr-PHI).toFixed(3)}]`;
    updateUIRow(UI['row-omega-t'], UI['val-omega-t'], disk.omega_t.toFixed(2), disk.omega_t > 0);
    updateUIRow(UI['row-omega-p'], UI['val-omega-p'], disk.omega_p.toFixed(2), disk.omega_p > 0);
    updateUIRow(UI['row-ratio'], UI['val-ratio'], rRatioStr, Math.abs(disk.ratioRr - PHI) < 0.05);
    updateUIRow(UI['row-phase-ratio'], UI['val-phase-ratio'], disk.phaseRatio.toFixed(3), disk.torusFormed);
    updateUIRow(UI['row-ergodic'], UI['val-ergodic'], disk.isErgodic?'YES':'NO', disk.isErgodic);
    updateUIRow(UI['row-schumann'], UI['val-schumann'], disk.schumannLock?'YES':'NO', disk.schumannLock);
    updateUIRow(UI['row-torus-formed'], UI['val-torus-formed'], disk.torusFormed?'YES':'NO', disk.torusFormed);
    const irr = disk._irrationalScore(disk.phaseRatio); updateUIRow(UI['row-irrational'], UI['val-irrational'], irr.toFixed(3), irr > 0.7);
    
    if(UI['val-firing']) UI['val-firing'].innerText = (dyn.arousal * 100).toFixed(1) + "%";
    if(UI['val-cluster']) UI['val-cluster'].innerText = (dyn.ignitionRatio * 100).toFixed(1) + "%";
    if(UI['val-phi']) UI['val-phi'].innerText = dyn.phiApprox.toFixed(4);
    if(UI['val-coherence']) UI['val-coherence'].innerText = dyn.phaseCoherence.toFixed(3);
    if(UI['val-arousal']) UI['val-arousal'].innerText = dyn.arousal.toFixed(3);
    
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

    // Phase I & M: System State Badge & Robust conditions
    const badge = UI['system-state-badge'];
    if(badge) {
        let stateTxt = 'QUIET', colorClass = 'text-white/50 border-white/50';
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
        badge.className = `inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${colorClass} tracking-widest`; badge.innerText = stateTxt;
    }
}
