export const UI = {};

export function initDOMCache() {
    const ids = [
        'val-omega-t', 'val-omega-p', 'val-ratio', 'val-phase-ratio', 'val-ergodic', 'val-schumann',
        'row-omega-t', 'row-omega-p', 'row-ratio', 'row-phase-ratio', 'row-ergodic', 'row-schumann',
        'val-torus-formed', 'val-irrational', 'row-torus-formed', 'row-irrational',
        'val-firing', 'val-cluster', 'val-phi', 'val-coherence', 'val-attractor-id', 'val-attractor-sim', 'val-arousal',
        'row-firing', 'row-cluster', 'row-phi', 'row-coherence', 'row-attractor-id', 'row-attractor-sim', 'row-arousal',
        'val-branching', 'row-branching', 'sigma-bar-fill', 'val-homeo', 'row-homeo', 'val-tension', 'row-tension', 'val-touch', 'row-touch',
        'val-baseline', 'row-baseline', 'val-residue', 'row-residue',
        'val-pre-a', 'row-pre-a', 'val-pre-b', 'row-pre-b', 'val-pre-c', 'row-pre-c', 'val-pre-d', 'row-pre-d', 'val-pre-e', 'row-pre-e', 'val-total', 'row-total',
        'system-state-badge', 'intro-guide'
    ];
    ids.forEach(id => { UI[id] = document.getElementById(id); });
}

export function updateUIRow(rowEl, valEl, value, isMet) {
    if(!rowEl || !valEl) return;
    valEl.innerText = value;
    if (isMet) { rowEl.classList.remove('text-white/70'); rowEl.classList.add('text-cyan-300'); }
    else       { rowEl.classList.remove('text-cyan-300'); rowEl.classList.add('text-white/70'); }
}
