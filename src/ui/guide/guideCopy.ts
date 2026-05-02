/**
 * guideCopy.ts
 * U6: Guide / Explanation System — Static copy / labels
 *
 * Contains all human-readable text used by the Guide / Explanation System.
 * Centralising copy here makes it easier to audit for forbidden claims and
 * to add a simple i18n layer in the future if needed.
 *
 * Principles:
 * - All copy is observation-based and neutral.
 * - No consciousness / emotion / intent claims.
 * - "AETERNA thinks / wants / feels" style expressions are FORBIDDEN.
 * - No LLM / API dependency.
 *
 * Reference: docs/default-guide-principles.md §5.3
 */

// ── Section titles ─────────────────────────────────────────────────────────────

export const COPY_SECTION_CURRENT   = 'Current state';
export const COPY_SECTION_LOOK_AT   = 'What to look at';
export const COPY_SECTION_TRY_NEXT  = 'Try next';
export const COPY_SECTION_GLOSSARY  = 'Glossary';
export const COPY_SECTION_INTEGRITY = 'Integrity notes';

// ── Fallback / error messages ──────────────────────────────────────────────────

export const COPY_NO_SNAPSHOT =
    'Observation data is not yet available. Allow the simulation to run for a few seconds.';

export const COPY_LOW_CONFIDENCE =
    'Some observation metrics are missing. Explanation confidence is low.';

export const COPY_NAN_INFINITY =
    'NaN or Infinity values detected in metrics. Open Raw / Diagnostics tab to investigate.';

// ── Integrity notes (always shown) ────────────────────────────────────────────

export const INTEGRITY_NOTES: readonly string[] = [
    'This guide explains observation metrics only.',
    'Smooth rendering is presentation-only and does not reflect raw field values.',
    'Proto-network candidates are pre-semantic observations, not knowledge graphs.',
    'External LLM guide is inactive. All explanations are rule-based and local.',
    'Raw / Derived / Proxy / Presentation-smoothed values are distinct. Check valueKind labels.',
    'Phase is mathematical phase, not an affective or semantic signal.',
    'Weak plasticity trace is a small resistance-history proxy, not stored knowledge.',
    'Reference-ratio proximity is a comparison result only, not a causal proof.',
] as const;

// ── Full glossary ──────────────────────────────────────────────────────────────

import type { GuideGlossaryHint } from '../../types/guideExplanation.ts';

export const FULL_GLOSSARY: readonly GuideGlossaryHint[] = [
    {
        term: 'Flow Continuity',
        shortDefinition: 'Degree to which energy propagation continues uninterrupted through the torus field.',
        valueKind: 'derived',
    },
    {
        term: 'Energy Throughput',
        shortDefinition: 'Rate at which energy moves through the torus system over observed time.',
        valueKind: 'derived',
    },
    {
        term: 'Boundary Exchange',
        shortDefinition: 'Exchange of energy or signals at the boundary between the organism and the world medium.',
        valueKind: 'derived',
    },
    {
        term: 'Return Strength',
        shortDefinition: 'Strength of the sensory return signal that comes back from the world medium.',
        valueKind: 'derived',
    },
    {
        term: 'Echo Persistence',
        shortDefinition: 'How long echo from the world medium remains detectable after a perturbation.',
        valueKind: 'derived',
    },
    {
        term: 'Closure Stability',
        shortDefinition: 'Stability of the body–world closure loop. A proxy for how well the loop is maintained.',
        valueKind: 'proxy',
    },
    {
        term: 'Membrane Layer',
        shortDefinition: 'Observer-visible mediating layer between BodySurface and WorldMedium where permeability, tension, deformation, and imprint overlap are tracked.',
        valueKind: 'proxy',
    },
    {
        term: 'Boundary Mediation',
        shortDefinition: 'How the membrane layer links outward actuation traces and incoming return traces without replacing body-side or world-side state.',
        valueKind: 'proxy',
    },
    {
        term: 'Two-sidedness',
        shortDefinition: 'Proxy for coexisting actuation and return imprints on the same membrane regions. It is not self-recognition.',
        valueKind: 'proxy',
    },
    {
        term: 'Trace / Residue',
        shortDefinition: 'Residual activity left in field regions after propagation has passed.',
        valueKind: 'derived',
    },
    {
        term: 'Local Excitability',
        shortDefinition: 'Indirect measure of how close local field regions are to a firing threshold. A proxy — not a neuron or meaning node.',
        valueKind: 'proxy',
    },
    {
        term: 'Repeated Flow Path Candidate',
        shortDefinition: 'A field path that has been activated repeatedly. An observer-side candidate for repeated propagation, not a semantic route.',
        valueKind: 'proxy',
    },
    {
        term: 'Proto-Network Candidate',
        shortDefinition: 'Cluster of repeated flow paths and co-activation patterns observed to form a loose structure. Pre-semantic observation candidate — NOT a knowledge graph or meaning network.',
        valueKind: 'proxy',
    },
    {
        term: 'Semantic Leak',
        shortDefinition: 'A check that detects whether semantic / meaning-layer constructs have been accidentally introduced into the runtime. Should always be 0.',
        valueKind: 'check',
    },
    {
        term: 'Measured',
        shortDefinition: 'Directly observed value read from a current buffer or observer state.',
        valueKind: 'measured',
    },
    {
        term: 'Raw',
        shortDefinition: 'Values read directly from field buffers without transformation.',
        valueKind: 'measured',
    },
    {
        term: 'Derived',
        shortDefinition: 'Values calculated from one or more raw measurements.',
        valueKind: 'derived',
    },
    {
        term: 'Proxy',
        shortDefinition: 'Indirect estimates inferred from correlated signals when direct measurement is not available.',
        valueKind: 'proxy',
    },
    {
        term: 'Check',
        shortDefinition: 'Integrity or consistency check used to catch NaN / Infinity, charge balance drift, or inactive guards.',
        valueKind: 'check',
    },
    {
        term: 'Presentation-smoothed',
        shortDefinition: 'Values that have been temporally smoothed for display legibility. Labelled [S] in the UI. Does not affect underlying field values.',
        valueKind: 'presentation-smoothed',
    },
    {
        term: 'Reference',
        shortDefinition: 'Comparison-only value used to contextualize observed ratios. It is not a causal ingredient in runtime dynamics.',
        valueKind: 'check',
    },
    {
        term: 'Vortex Candidate',
        shortDefinition: 'Observer-side phase-defect candidate derived from complex-field phase winding. It is not a memory object or consciousness marker.',
        valueKind: 'proxy',
    },
    {
        term: 'Signed Total Charge',
        shortDefinition: 'Topological check over observed vortex charges. It is used to monitor consistency, not to infer meaning.',
        valueKind: 'check',
    },
    {
        term: 'Observed Ratio',
        shortDefinition: 'Derived ratio from current observation states such as amplitude, closure timing, or phase coherence.',
        valueKind: 'derived',
    },
    {
        term: 'Reference Ratio',
        shortDefinition: 'Comparison-only ratio drawn from a static reference set. It does not enter core dynamics.',
        valueKind: 'check',
    },
    {
        term: 'Match Strength',
        shortDefinition: 'Proxy score describing how close an observed ratio is to a reference ratio within a tolerance band.',
        valueKind: 'proxy',
    },
    {
        term: 'Emergent Resonance Proxy',
        shortDefinition: 'Observer-side similarity proxy over top reference matches. It is not proof of meaning, life, consciousness, or healing.',
        valueKind: 'proxy',
    },
] as const;

// ── Glossary lookup ────────────────────────────────────────────────────────────

/**
 * Look up a glossary hint by term name (case-insensitive).
 *
 * @param term  Term to look up
 * @returns     GuideGlossaryHint or undefined if not found
 */
export function lookupGlossaryHint(term: string): GuideGlossaryHint | undefined {
    const lower = term.toLowerCase();
    return FULL_GLOSSARY.find(h => h.term.toLowerCase() === lower);
}

/**
 * Return a subset of the glossary matching the given term names.
 *
 * @param terms  Array of term names to include
 * @returns      Array of matching GuideGlossaryHint entries
 */
export function selectGlossaryHints(terms: string[]): GuideGlossaryHint[] {
    return terms
        .map(lookupGlossaryHint)
        .filter((h): h is GuideGlossaryHint => h !== undefined);
}
