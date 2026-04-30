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

/**
 * Current ExplainableObservationSnapshot holder.
 * Updated by setExplainSnapshot() — does NOT modify any runtime state.
 */
let _currentExplainSnapshot = null;
let _currentRenderMode = null;
let _currentViewMode = null;

/**
 * Set the latest ExplainableObservationSnapshot so the guide can use it.
 * Called from the main frame loop — does NOT modify any runtime state.
 *
 * @param {object|null} snapshot  ExplainableObservationSnapshot or null
 * @param {string} [renderMode]   Current render mode
 * @param {string} [viewMode]     Current view mode
 */
export function setExplainSnapshot(snapshot, renderMode, viewMode) {
    _currentExplainSnapshot = snapshot;
    if (renderMode !== undefined) _currentRenderMode = renderMode;
    if (viewMode !== undefined) _currentViewMode = viewMode;
}

export function toggleExplain() {
    _explainOpen = !_explainOpen;
    const panel = document.getElementById('explain-panel');
    if (panel) panel.classList.toggle('explain-visible', _explainOpen);

    // When opening, generate and render the guide explanation
    if (_explainOpen) {
        _renderGuide();
    }
}

/**
 * Generate and render the current guide explanation into the panel DOM.
 * Uses localGuideEngine — no LLM / API calls.
 */
function _renderGuide() {
    import('../guide/localGuideEngine.ts').then(({ generateGuide, renderGuideToDOM }) => {
        const guide = generateGuide(
            _currentExplainSnapshot,
            _currentRenderMode,
            _currentViewMode
        );
        renderGuideToDOM(guide);
    }).catch(() => {
        const el = document.getElementById('guide-current-explanation');
        if (el) el.textContent = 'Guide unavailable. Check the Overview panel.';
    });
}

// ── Event Strip ────────────────────────────────────────────────────────────

export function addEventStripEntry(text, severity = 'info') {
    const now = Date.now();
    _eventEntries.unshift({ text, time: now, severity });
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
        const sev = e.severity ?? 'info';
        return `<span class="event-strip-item" data-severity="${sev}" style="opacity:${opacity.toFixed(2)}">${e.text}</span>`;
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

// ── Event Timeline (U5) ───────────────────────────────────────────────────

let _allEventRecords = [];       // Full event history (AeternaEvent-like objects)
let _eventTimelineFilter = 'all';

/**
 * Update the Event Timeline panel with new events.
 * Renders up to 10 most recent events, filtered by kind if a filter is set.
 *
 * @param {Array} events  Array of AeternaEvent-like objects (newest first)
 */
export function updateEventTimeline(events) {
    _allEventRecords = events;
    _renderEventTimeline();
    // Also sync newest events to the Event Strip
    const recent = events.slice(0, EVENT_STRIP_MAX);
    recent.reverse().forEach(ev => {
        // Only push if not already in strip
        const alreadyIn = _eventEntries.some(e => e.id === ev.id);
        if (!alreadyIn) {
            _eventEntries.unshift({ id: ev.id, text: `tick ${ev.tick}: ${ev.text}`, time: ev.timestamp, severity: ev.severity });
        }
    });
    if (_eventEntries.length > EVENT_STRIP_MAX) _eventEntries.length = EVENT_STRIP_MAX;
    _renderEventStrip();
}

function _renderEventTimeline() {
    const container = document.getElementById('event-timeline-list');
    if (!container) return;

    let filtered = _allEventRecords;
    if (_eventTimelineFilter !== 'all') {
        filtered = _allEventRecords.filter(ev => ev.kind === _eventTimelineFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="event-tl-empty text-[8px] text-white/25 font-mono py-1">No events match filter.</div>';
        return;
    }

    container.innerHTML = filtered.slice(0, 20).map(ev => {
        const sev = ev.severity ?? 'info';
        const kind = ev.kind ?? '';
        const kindShort = kind.replace(/([A-Z])/g, ' $1').trim().toLowerCase().slice(0, 12);
        return `<div class="event-tl-row" data-severity="${sev}">
            <span class="event-tl-tick">t${ev.tick}</span>
            <span class="event-tl-text">${_escapeHtml(ev.text)}</span>
            <span class="event-tl-kind">${kindShort}</span>
        </div>`;
    }).join('');
}

function _escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Filter the event timeline by kind.
 * Called by the filter <select> in the Overview tab.
 */
export function filterEventTimeline(kind) {
    _eventTimelineFilter = kind || 'all';
    _renderEventTimeline();
}

// ── Now Summary (U5) ──────────────────────────────────────────────────────

/**
 * Update the Now Summary section with NowSummaryState data.
 *
 * @param {Object} nowSummaryState  NowSummaryState-like object
 */
export function updateNowSummary(nowSummaryState) {
    if (!nowSummaryState) return;

    const container = document.getElementById('now-summary-lines');
    const confEl = document.getElementById('now-summary-confidence');
    const statusEl = document.getElementById('now-summary-status');

    if (container && nowSummaryState.lines) {
        container.innerHTML = nowSummaryState.lines.map(line => {
            const kind = line.valueKind ? `<span class="now-summary-kind">[${line.valueKind}]</span>` : '';
            return `<div class="now-summary-line" data-priority="${line.priority}">${_escapeHtml(line.text)}${kind}</div>`;
        }).join('');
    }

    if (confEl) {
        const conf = nowSummaryState.confidence ?? 0;
        confEl.textContent = `conf ${(conf * 100).toFixed(0)}%`;
    }

    if (statusEl && nowSummaryState.lines && nowSummaryState.lines.length > 0) {
        const hasWarning = nowSummaryState.lines.some(l => l.priority <= 2);
        statusEl.textContent = hasWarning ? '⚠ notice' : '● live';
        statusEl.style.color = hasWarning ? 'rgba(251,191,36,0.7)' : 'rgba(52,211,153,0.6)';
    }
}

// ── Expose to window ───────────────────────────────────────────────────────

window.toggleResearchPanel  = toggleResearchPanel;
window.selectResearchTab    = selectResearchTab;
window.openMobileSheet      = openMobileSheet;
window.closeMobileSheet     = closeMobileSheet;
window.setMobileSheetFull   = setMobileSheetFull;
window.onSheetDragStart     = onSheetDragStart;
window.toggleExplain        = toggleExplain;
window.addEventStripEntry   = addEventStripEntry;
window.toggleEventStrip     = toggleEventStrip;
window.filterEventTimeline  = filterEventTimeline;
window.updateNowSummary     = updateNowSummary;
window.updateEventTimeline  = updateEventTimeline;
window.setExplainSnapshot   = setExplainSnapshot;
