// ── Signal Runtime UI bridge ──
// This file is plain ES module JavaScript so it can be loaded directly by the
// browser without a build step, while the TypeScript sources are compiled for
// the bundled build.

// Dynamic import so that Vite can tree-shake and bundle correctly.
async function getRuntime() {
    const mod = await import('./runSignalRuntime');
    return mod.runSignalRuntime;
}

// ── Experience Mode toggle ──
window.onExperienceModeChange = function(mode) {
    const inputArea = document.getElementById('signal-input-area');
    const observePanel = document.getElementById('signal-observe-panel');
    if (mode === 'signal_runtime') {
        if (inputArea) inputArea.style.display = 'block';
        if (observePanel) observePanel.classList.add('visible');
    } else {
        if (inputArea) inputArea.style.display = 'none';
        if (observePanel) observePanel.classList.remove('visible');
    }
};

// ── Run Signal Mode ──
window.runSignalMode = async function() {
    const input = document.getElementById('signal-stimulus-input');
    const statusEl = document.getElementById('signal-status');
    if (!input || !statusEl) return;

    const text = input.value.trim();
    if (!text) {
        statusEl.textContent = 'Please enter stimulus text.';
        return;
    }

    statusEl.textContent = 'Running…';

    try {
        const runSignalRuntime = await getRuntime();
        const result = runSignalRuntime(text);
        updateObservePanel(result);

        // Also display utterance in the guide panel
        const latestEl = document.getElementById('guide-latest');
        const providerEl = document.getElementById('guide-provider');
        if (latestEl) latestEl.textContent = result.utterance;
        if (providerEl) providerEl.textContent = 'SIGNAL RUNTIME';

        statusEl.textContent = `Done (${result.debugNotes.length} steps)`;
    } catch (e) {
        console.error('[SignalRuntime] error:', e);
        statusEl.textContent = 'Error — see console';
    }
};

function fmt(v) {
    return typeof v === 'number' ? v.toFixed(2) : String(v);
}

function updateObservePanel(result) {
    const s = result.stimulus;
    setText('obs-salience', fmt(s.salience));
    setText('obs-novelty', fmt(s.novelty));
    setText('obs-emotional', fmt(s.emotionalCharge));
    setText('obs-question', s.explicitQuestion ? 'true' : 'false');

    // Signals list
    const signalsEl = document.getElementById('obs-signals');
    if (signalsEl) {
        signalsEl.innerHTML = result.signals.map(sig => {
            const kindClass = `signal-kind-${sig.kind}`;
            return `<div class="signal-row"><span class="${kindClass}">[${sig.kind.slice(0,3).toUpperCase()}] ${sig.id}</span><span class="signal-row-val">${fmt(sig.activation)}</span></div>`;
        }).join('');
    }

    // Boundary
    const b = result.boundary;
    setText('obs-permeability', fmt(b.permeability));
    setText('obs-separation', fmt(b.selfOuterSeparation));
    setText('obs-shock', fmt(b.shockAbsorption));
    setText('obs-pressure', fmt(b.externalPressure));

    // Field
    const f = result.field;
    setText('obs-closeness', fmt(f.closeness));
    setText('obs-fragility', fmt(f.fragility));
    setText('obs-urgency', fmt(f.urgency));
    setText('obs-answer-pressure', fmt(f.answerPressure));
    setText('obs-unfinished', fmt(f.unfinishedness));

    // Proto Meanings
    const pmEl = document.getElementById('obs-proto-meanings');
    if (pmEl) {
        pmEl.innerHTML = result.protoMeanings.map(pm =>
            `<div class="signal-row"><span>${pm.glossJa}</span><span class="signal-row-val">${fmt(pm.strength)}</span></div>`
        ).join('');
    }

    // Decision
    const d = result.decision;
    setText('obs-stance', d.stance);
    setText('obs-intent', d.replyIntent);
    setText('obs-should-answer', d.shouldAnswerQuestion ? 'true' : 'false');
    setText('obs-stay-open', d.shouldStayOpen ? 'true' : 'false');

    // Sentence Plan
    const sp = result.sentencePlan;
    setText('obs-reaction', sp.reaction ?? '—');
    setText('obs-core', sp.core ?? '—');
    setText('obs-answer', sp.answer ?? '—');
    setText('obs-next-step', sp.nextStep ?? '—');

    // Utterance
    setText('obs-utterance', result.utterance);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
