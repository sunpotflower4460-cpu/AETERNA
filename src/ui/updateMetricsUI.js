import { state } from '../state.js';
import { UI, updateUIRow } from './domCache.js';
import { PHI } from '../constants/aeternaConstants.js';

export function updateMetricsUI(dyn, engineState) {
    const disk = state.disk;
    const tensionLoad = state.tensionLoad;
    const touchMem = state.touchMem;

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
    if(UI['val-rewrite-tendency']) UI['val-rewrite-tendency'].innerText = rewriteTendency;
    if(UI['val-rewrite-pressure']) UI['val-rewrite-pressure'].innerText = rewritePressure;
    if(UI['val-rewrite-load']) UI['val-rewrite-load'].innerText = (dyn.globalRewriteLoad || 0).toFixed(3);
    if(UI['val-prior-bias']) UI['val-prior-bias'].innerText = priorSummary;
    if(UI['val-last-rewrite']) UI['val-last-rewrite'].innerText = lastRewrite;
    
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
