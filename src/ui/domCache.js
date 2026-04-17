export const UI = {};

export function initDOMCache() {
    const ids = [
        'val-omega-t', 'val-omega-p', 'val-ratio', 'val-phase-ratio', 'val-ergodic', 'val-schumann',
        'row-omega-t', 'row-omega-p', 'row-ratio', 'row-phase-ratio', 'row-ergodic', 'row-schumann',
        'val-torus-formed', 'val-irrational', 'row-torus-formed', 'row-irrational',
        'val-firing', 'val-cluster', 'val-phi', 'val-coherence', 'val-attractor-id', 'val-attractor-sim', 'val-arousal',
        'row-firing', 'row-cluster', 'row-phi', 'row-coherence', 'row-attractor-id', 'row-attractor-sim', 'row-arousal',
        'val-branching', 'row-branching', 'sigma-bar-fill', 'val-homeo', 'row-homeo', 'val-tension', 'row-tension', 'val-touch', 'row-touch',
        'val-touch-active', 'row-touch-active', 'val-raw-touch', 'row-raw-touch',
        'val-touch-onset', 'row-touch-onset', 'val-touch-offset', 'row-touch-offset', 'val-touch-novelty', 'row-touch-novelty',
        'val-sound-level', 'row-sound-level',
        'val-sound-delta', 'row-sound-delta',
        'val-sound-low', 'row-sound-low',
        'val-sound-mid', 'row-sound-mid',
        'val-sound-high', 'row-sound-high',
        'val-sound-novelty', 'row-sound-novelty',
        'val-sound-persistence', 'row-sound-persistence',
        'val-sound-active', 'row-sound-active',
        'val-baseline', 'row-baseline', 'val-residue', 'row-residue',
        'val-local-pred-error', 'row-local-pred-error',
        'val-pre-a', 'row-pre-a', 'val-pre-b', 'row-pre-b', 'val-pre-c', 'row-pre-c', 'val-pre-d', 'row-pre-d', 'val-pre-e', 'row-pre-e', 'val-total', 'row-total',
        'system-state-badge', 'intro-guide',
        // PR7: Touch pattern
        'val-touch-duration', 'row-touch-duration',
        'val-touch-velocity', 'row-touch-velocity',
        'val-touch-repeat',   'row-touch-repeat',
        'val-touch-dominant', 'row-touch-dominant',
        'val-score-tap',      'row-score-tap',
        'val-score-repeat',   'row-score-repeat',
        'val-score-hold',     'row-score-hold',
        'val-score-stroke',   'row-score-stroke',
        'val-rewrite-tendency', 'row-rewrite-tendency',
        'val-rewrite-pressure', 'row-rewrite-pressure',
        'val-rewrite-load',     'row-rewrite-load',
        'val-prior-bias',       'row-prior-bias',
        'val-last-rewrite',     'row-last-rewrite',
        'val-mode-state',       'row-mode-state',
        'val-wake-drive',       'row-wake-drive',
        'val-sleep-pressure',   'row-sleep-pressure',
        'val-dream-pressure',   'row-dream-pressure',
        'val-last-mode-change', 'row-last-mode-change',
        'val-dream-replay',     'row-dream-replay',
        'val-energy',           'row-energy',
        'val-stability',        'row-stability',
        'val-overload',         'row-overload',
        'val-rest-drive',       'row-rest-drive',
        'val-orienting-drive',  'row-orienting-drive',
        'val-action-state',     'row-action-state',
        'val-action-pulse',     'row-action-pulse',
        'val-action-direction', 'row-action-direction',
        'val-last-touch-direction', 'row-last-touch-direction',
        // Phase B2: light sensory
        'val-light-level',       'row-light-level',
        'val-light-delta',       'row-light-delta',
        'val-light-novelty',     'row-light-novelty',
        'val-light-persistence', 'row-light-persistence',
        'val-light-active',      'row-light-active',
        // Phase B2: motion sensory
        'val-motion-level',       'row-motion-level',
        'val-motion-delta',       'row-motion-delta',
        'val-motion-novelty',     'row-motion-novelty',
        'val-motion-persistence', 'row-motion-persistence',
        'val-motion-active',      'row-motion-active',
        // Phase B2: time sensory
        'val-time-phase',        'row-time-phase',
        'val-time-level',        'row-time-level',
        'val-time-persistence',  'row-time-persistence',
        'val-time-active',       'row-time-active',
    ];
    ids.forEach(id => { UI[id] = document.getElementById(id); });
}

export function updateUIRow(rowEl, valEl, value, isMet) {
    if(!rowEl || !valEl) return;
    valEl.innerText = value;
    if (isMet) { rowEl.classList.remove('text-white/70'); rowEl.classList.add('text-cyan-300'); }
    else       { rowEl.classList.remove('text-cyan-300'); rowEl.classList.add('text-white/70'); }
}
