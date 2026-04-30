/**
 * localGuideEngine.ts
 * U6: Guide / Explanation System — Local Guide Engine
 *
 * Manages the lifecycle of guide explanations:
 * - Holds the last generated GuideExplanation
 * - Exposes `generateGuide` to produce a new explanation from a snapshot
 * - Exposes `renderGuideToDOM` to update the explain panel DOM
 *
 * Principles:
 * - No LLM / API dependency.
 * - No runtime dynamics modification.
 * - DOM updates are presentation-only.
 * - All generated text passes through guideClaimGuard.
 *
 * Reference: docs/default-guide-principles.md
 */

import type { GuideExplanation, GuideSuggestion } from '../../types/guideExplanation.ts';
import type { ExplainableObservationSnapshot } from '../explain/explainableObservationSnapshot.ts';
import { deriveGuideExplanation } from './deriveGuideExplanation.ts';
import { sanitizeClaim } from './guideClaimGuard.ts';
import {
    COPY_SECTION_CURRENT,
    COPY_SECTION_LOOK_AT,
    COPY_SECTION_TRY_NEXT,
    COPY_SECTION_GLOSSARY,
    COPY_SECTION_INTEGRITY,
    COPY_NO_SNAPSHOT,
} from './guideCopy.ts';

// ── Engine state ───────────────────────────────────────────────────────────────

let _lastExplanation: GuideExplanation | null = null;

// ── Guide generation ───────────────────────────────────────────────────────────

/**
 * Generate a new GuideExplanation from the current snapshot.
 *
 * @param snapshot     Current ExplainableObservationSnapshot (may be null)
 * @param renderMode   Current render mode (optional)
 * @param viewMode     Current view mode (optional)
 * @returns            Generated GuideExplanation
 */
export function generateGuide(
    snapshot: ExplainableObservationSnapshot | null,
    renderMode?: string,
    viewMode?: string
): GuideExplanation {
    const explanation = deriveGuideExplanation({
        snapshot,
        renderMode,
        viewMode,
        timestamp: Date.now(),
    });
    _lastExplanation = explanation;
    return explanation;
}

/**
 * Return the last generated GuideExplanation, or null if none has been generated.
 */
export function getLastExplanation(): GuideExplanation | null {
    return _lastExplanation;
}

// ── DOM helpers ────────────────────────────────────────────────────────────────

function _escapeHtml(str: string): string {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function _renderLines(lines: string[]): string {
    if (lines.length === 0) return '<span class="guide-empty">—</span>';
    return lines.map(l => `<div class="guide-line">${_escapeHtml(sanitizeClaim(l))}</div>`).join('');
}

function _renderSuggestions(suggestions: GuideSuggestion[]): string {
    if (suggestions.length === 0) return '<span class="guide-empty">—</span>';
    return suggestions.map(s => {
        const actionAttr = s.action ? ` data-action="${_escapeHtml(s.action)}"` : '';
        const panelAttr  = s.targetPanel  ? ` data-panel="${_escapeHtml(s.targetPanel)}"` : '';
        const layerAttr  = s.targetLayer  ? ` data-layer="${_escapeHtml(s.targetLayer)}"` : '';
        const reason = _escapeHtml(sanitizeClaim(s.reason));
        const label  = _escapeHtml(sanitizeClaim(s.label));
        return `<div class="guide-suggestion" ${actionAttr}${panelAttr}${layerAttr}>
            <span class="guide-suggestion-label">${label}</span>
            <span class="guide-suggestion-reason">${reason}</span>
        </div>`;
    }).join('');
}

// ── renderGuideToDOM ───────────────────────────────────────────────────────────

/**
 * Render a GuideExplanation into the explain panel DOM elements.
 *
 * Targets the following element IDs (matching index.html):
 *   #guide-current-explanation
 *   #guide-what-to-look-at
 *   #guide-try-next
 *   #guide-glossary
 *   #guide-integrity-notes
 *   #guide-confidence
 *
 * Safe to call when elements are absent (no-ops).
 *
 * @param explanation  GuideExplanation to render (or null for "no data" state)
 */
export function renderGuideToDOM(explanation: GuideExplanation | null): void {
    // Helper: set element html if it exists
    function _set(id: string, html: string): void {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }
    function _setText(id: string, text: string): void {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    if (!explanation) {
        _set('guide-current-explanation', `<span class="guide-empty">${_escapeHtml(COPY_NO_SNAPSHOT)}</span>`);
        _set('guide-what-to-look-at', '');
        _set('guide-try-next', '');
        _set('guide-glossary', '');
        _set('guide-integrity-notes', '');
        _setText('guide-confidence', '');
        _updateSectionTitles();
        return;
    }

    _set('guide-current-explanation', _renderLines(explanation.currentExplanation));

    _set('guide-what-to-look-at', _renderSuggestions(explanation.whatToLookAt));

    _set('guide-try-next', _renderSuggestions(explanation.tryNext));

    if (explanation.glossaryHints.length > 0) {
        const html = explanation.glossaryHints.map(h => {
            const kind = h.valueKind ? ` <span class="guide-glossary-kind">[${_escapeHtml(h.valueKind)}]</span>` : '';
            return `<div class="guide-glossary-entry">
                <span class="guide-glossary-term">${_escapeHtml(h.term)}</span>${kind}
                <span class="guide-glossary-def">${_escapeHtml(sanitizeClaim(h.shortDefinition))}</span>
            </div>`;
        }).join('');
        _set('guide-glossary', html);
    } else {
        _set('guide-glossary', '');
    }

    if (explanation.integrityNotes.length > 0) {
        const html = explanation.integrityNotes.map(n =>
            `<div class="guide-integrity-note">${_escapeHtml(sanitizeClaim(n))}</div>`
        ).join('');
        _set('guide-integrity-notes', html);
    }

    const confPct = (explanation.confidence * 100).toFixed(0);
    _setText('guide-confidence', `conf ${confPct}%`);

    _updateSectionTitles();

    // Attach action handlers
    _attachActionHandlers();
}

// ── Section title sync ─────────────────────────────────────────────────────────

function _updateSectionTitles(): void {
    const map: Record<string, string> = {
        'guide-title-current':   COPY_SECTION_CURRENT,
        'guide-title-look-at':   COPY_SECTION_LOOK_AT,
        'guide-title-try-next':  COPY_SECTION_TRY_NEXT,
        'guide-title-glossary':  COPY_SECTION_GLOSSARY,
        'guide-title-integrity': COPY_SECTION_INTEGRITY,
    };
    for (const [id, text] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
}

// ── Guide action handlers ──────────────────────────────────────────────────────

/**
 * Attach click handlers to guide suggestion elements.
 * Handlers perform UI-only operations (panel open, layer toggle, view reset).
 * Runtime dynamics are never modified.
 */
function _attachActionHandlers(): void {
    const suggestions = document.querySelectorAll('.guide-suggestion[data-action]');
    suggestions.forEach(el => {
        // Remove existing handler to avoid double-binding
        const clone = el.cloneNode(true) as HTMLElement;
        el.parentNode?.replaceChild(clone, el);
        clone.addEventListener('click', _handleSuggestionClick);
        clone.style.cursor = 'pointer';
    });
}

function _handleSuggestionClick(this: HTMLElement): void {
    const action = this.dataset['action'] as string | undefined;
    const panel  = this.dataset['panel'];
    const layer  = this.dataset['layer'];

    if (!action) return;

    switch (action) {
        case 'openPanel':
            if (panel && typeof window !== 'undefined') {
                // Open research panel and switch to tab — UI-only
                if (typeof (window as Record<string, unknown>)['selectResearchTab'] === 'function') {
                    (window as Record<string, unknown>)['selectResearchTab'](panel);
                }
                const rp = document.getElementById('research-panel');
                if (rp && !rp.classList.contains('rp-open')) {
                    if (typeof (window as Record<string, unknown>)['toggleResearchPanel'] === 'function') {
                        (window as Record<string, unknown>)['toggleResearchPanel']();
                    }
                }
            }
            break;

        case 'toggleLayer':
            // Layer toggle: fire a custom event; actual layer state managed elsewhere
            if (layer && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('guide:toggleLayer', { detail: { layerId: layer } }));
            }
            break;

        case 'resetView':
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('guide:resetView'));
            }
            break;

        case 'switchViewMode':
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('guide:switchViewMode'));
            }
            break;

        case 'runScenario':
            // Scenario execution deferred to U7
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('guide:runScenario', { detail: { panel } }));
            }
            break;

        default:
            break;
    }
}
