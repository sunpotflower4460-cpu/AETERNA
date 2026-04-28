/**
 * layoutControls.js
 * U1: Layout 再設計 – panel toggle / tab switching / mobile sheet / event strip / explain
 *
 * No runtime dynamics are touched here.
 * This file only manages DOM structure, CSS classes, and display state.
 */

// ── State ──────────────────────────────────────────────────────────────────

let _researchPanelOpen = false;
let _currentResearchTab = 'overview';
let _mobileSheetState = 'collapsed'; // 'collapsed' | 'half' | 'full'
let _explainOpen = false;
let _eventStripOpen = false;
let _eventEntries = [];
const EVENT_STRIP_MAX = 7;
const EVENT_STRIP_FADE_DURATION = 30000; // ms — time over which entries fade

// ── Research Panel (PC sidebar) ─────────────────────────────────────────────

export function toggleResearchPanel() {
    _researchPanelOpen = !_researchPanelOpen;
    const panel = document.getElementById('research-panel');
    const toggle = document.getElementById('research-panel-toggle');
    if (!panel) return;
    if (_researchPanelOpen) {
        panel.classList.add('rp-open');
        panel.classList.remove('rp-closed');
        if (toggle) toggle.textContent = '▷';
    } else {
        panel.classList.remove('rp-open');
        panel.classList.add('rp-closed');
        if (toggle) toggle.textContent = '◁';
    }
}

// ── Research Tabs ──────────────────────────────────────────────────────────

export function selectResearchTab(tabName) {
    _currentResearchTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.rtab').forEach(btn => {
        btn.classList.toggle('rtab-active', btn.dataset.tab === tabName);
    });

    // Update tab content panels
    document.querySelectorAll('.rtab-content').forEach(pane => {
        pane.classList.toggle('rtab-visible', pane.id === `tab-${tabName}`);
    });
}

// ── Mobile Bottom Sheet ────────────────────────────────────────────────────

export function openMobileSheet(tabName) {
    const sheet = document.getElementById('mobile-bottom-sheet');
    if (!sheet) return;

    if (tabName) selectResearchTab(tabName);

    _mobileSheetState = 'half';
    sheet.dataset.state = 'half';
}

export function closeMobileSheet() {
    const sheet = document.getElementById('mobile-bottom-sheet');
    if (!sheet) return;
    _mobileSheetState = 'collapsed';
    sheet.dataset.state = 'collapsed';
}

export function setMobileSheetFull() {
    const sheet = document.getElementById('mobile-bottom-sheet');
    if (!sheet) return;
    _mobileSheetState = 'full';
    sheet.dataset.state = 'full';
}

// Drag-handle interaction for mobile sheet
let _sheetDragStartY = 0;
let _sheetDragStartState = 'collapsed';

function _getClientY(e) {
    if (typeof e.clientY === 'number') return e.clientY;
    if (e.touches && e.touches.length > 0) return e.touches[0].clientY;
    return 0;
}

export function onSheetDragStart(e) {
    _sheetDragStartY = _getClientY(e);
    _sheetDragStartState = _mobileSheetState;
    document.addEventListener('pointermove', _onSheetDragMove, { passive: true });
    document.addEventListener('pointerup', _onSheetDragEnd, { once: true });
}

function _onSheetDragMove(e) {
    const dy = _sheetDragStartY - _getClientY(e);
    const sheet = document.getElementById('mobile-bottom-sheet');
    if (!sheet) return;
    if (dy > 60 && _sheetDragStartState === 'collapsed') {
        _mobileSheetState = 'half';
        sheet.dataset.state = 'half';
    } else if (dy > 60 && _sheetDragStartState === 'half') {
        _mobileSheetState = 'full';
        sheet.dataset.state = 'full';
    } else if (dy < -60 && _sheetDragStartState === 'full') {
        _mobileSheetState = 'half';
        sheet.dataset.state = 'half';
    } else if (dy < -60 && _sheetDragStartState === 'half') {
        _mobileSheetState = 'collapsed';
        sheet.dataset.state = 'collapsed';
    }
}

function _onSheetDragEnd() {
    document.removeEventListener('pointermove', _onSheetDragMove);
}

// ── Explain Panel ──────────────────────────────────────────────────────────

export function toggleExplain() {
    _explainOpen = !_explainOpen;
    const panel = document.getElementById('explain-panel');
    if (panel) panel.classList.toggle('explain-visible', _explainOpen);
}

// ── Event Strip ────────────────────────────────────────────────────────────

export function addEventStripEntry(text) {
    const now = Date.now();
    _eventEntries.unshift({ text, time: now });
    if (_eventEntries.length > EVENT_STRIP_MAX) {
        _eventEntries.splice(EVENT_STRIP_MAX);
    }
    _renderEventStrip();
}

function _renderEventStrip() {
    const inner = document.getElementById('event-strip-list');
    if (!inner) return;
    const now = Date.now();
    inner.innerHTML = _eventEntries.map((e) => {
        const age = now - e.time;
        const opacity = Math.max(0.3, 1 - (age / EVENT_STRIP_FADE_DURATION));
        return `<span class="event-strip-item" style="opacity:${opacity.toFixed(2)}">${e.text}</span>`;
    }).join('');
}

export function toggleEventStrip() {
    _eventStripOpen = !_eventStripOpen;
    const strip = document.getElementById('event-strip');
    if (strip) strip.classList.toggle('es-open', _eventStripOpen);
}

// ── HUD chip helpers ───────────────────────────────────────────────────────

/**
 * Update the compact status chips in the Observation HUD.
 * Called each frame from updateMetricsUI.
 *
 * @param {{flow:string, return:string, echo:string, risk:string}} chips
 */
export function updateHudChips(chips) {
    _setChip('hud-chip-flow',   `Flow ${chips.flow}`,   chips.flowLevel);
    _setChip('hud-chip-return', `Return ${chips.return}`, chips.returnLevel);
    _setChip('hud-chip-echo',   `Echo ${chips.echo}`,   chips.echoLevel);
    _setChip('hud-chip-risk',   `Risk ${chips.risk}`,   chips.riskLevel);
}

function _setChip(id, text, level) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.dataset.level = level ?? 'normal'; // 'low' | 'normal' | 'high' | 'critical'
}

// ── Expose to window ───────────────────────────────────────────────────────

window.toggleResearchPanel = toggleResearchPanel;
window.selectResearchTab   = selectResearchTab;
window.openMobileSheet     = openMobileSheet;
window.closeMobileSheet    = closeMobileSheet;
window.setMobileSheetFull  = setMobileSheetFull;
window.onSheetDragStart    = onSheetDragStart;
window.toggleExplain       = toggleExplain;
window.addEventStripEntry  = addEventStripEntry;
window.toggleEventStrip    = toggleEventStrip;
