/**
 * referenceRatios.ts
 * N6: External Constants Removal / Observed Ratios
 *
 * Observer-side reference ratios for comparison with observed dynamics.
 *
 * Design principles:
 * - These constants are OBSERVER-SIDE REFERENCE only.
 * - They are NOT imported by core dynamics (dynamicCore.ts, etc.).
 * - They are NOT used as causal ingredients in runtime updates.
 * - They are used solely to compare observed ratios against known reference values.
 * - A match between an observed ratio and a reference ratio is an observational fact only.
 *   It does NOT prove meaning, life, consciousness, or mystical resonance.
 *
 * Reference: docs/external-constants-removal.md
 * Reference: docs/observed-ratios.md
 */

export interface ReferenceRatio {
    /** Unique identifier for this reference ratio */
    id: string;
    /** Human-readable label */
    label: string;
    /** Numeric value of the reference ratio */
    value: number;
    /** Category of the reference ratio */
    category: 'mathematical' | 'geophysical' | 'musical' | 'custom';
    /** Neutral description of the reference ratio */
    description: string;
    /** Mandatory caution note — must appear in any UI that displays this ratio */
    caution: string;
}

/**
 * Observer-side reference ratios.
 *
 * These are comparison values for observed ratios derived from field dynamics.
 * None of them are used as causal ingredients in core dynamics.
 * None of them "prove" anything when matched by an observed ratio.
 */
export const REFERENCE_RATIOS: ReferenceRatio[] = [
    {
        id: 'goldenRatio',
        label: 'Golden Ratio φ',
        value: 1.6180339887498949,
        category: 'mathematical',
        description: 'A mathematical constant: (1 + √5) / 2. Common in geometry and number theory.',
        caution: 'Reference only. Not used as a causal ingredient in core dynamics. A match does not prove meaning, life, or consciousness.',
    },
    {
        id: 'phiInverse',
        label: 'φ inverse (1/φ)',
        value: 0.6180339887498948,
        category: 'mathematical',
        description: 'Multiplicative inverse of the golden ratio: 1/φ = φ − 1.',
        caution: 'Reference only. Not used as a causal ingredient in core dynamics. A match does not prove meaning, life, or consciousness.',
    },
    {
        id: 'sqrt2',
        label: '√2',
        value: 1.4142135623730951,
        category: 'mathematical',
        description: 'Square root of 2. Common in geometry.',
        caution: 'Reference only. Not a causal ingredient.',
    },
    {
        id: 'schumannFundamental',
        label: 'Schumann fundamental (7.83)',
        value: 7.83,
        category: 'geophysical',
        description: 'Reference value for the approximate fundamental Schumann resonance frequency (Hz). A geophysical measurement.',
        caution: 'Reference only. Not used as a causal ingredient in core dynamics. A match does not prove consciousness, healing, or resonance with nature.',
    },
    {
        id: 'schumannSecond',
        label: 'Schumann 2nd harmonic (14.3)',
        value: 14.3,
        category: 'geophysical',
        description: 'Reference value for the approximate second Schumann resonance harmonic (Hz).',
        caution: 'Reference only. Not a causal ingredient.',
    },
    {
        id: 'hz432',
        label: '432 Hz',
        value: 432,
        category: 'musical',
        description: 'A musical tuning reference. Sometimes proposed as an alternative to A=440 Hz.',
        caution: 'Reference only. Not used as a causal ingredient. A match does not prove healing or cosmic meaning.',
    },
    {
        id: 'hz528',
        label: '528 Hz',
        value: 528,
        category: 'musical',
        description: 'A musical frequency sometimes called a "solfeggio frequency". Reference value only.',
        caution: 'Reference only. Not a causal ingredient. A match does not prove healing or transformation.',
    },
    {
        id: 'hz440',
        label: '440 Hz (concert A)',
        value: 440,
        category: 'musical',
        description: 'Standard concert pitch A4 = 440 Hz.',
        caution: 'Reference only. Not a causal ingredient.',
    },
    {
        id: 'octave',
        label: 'Octave ratio (2:1)',
        value: 2.0,
        category: 'musical',
        description: 'Frequency ratio for a perfect octave.',
        caution: 'Reference only. Not a causal ingredient.',
    },
    {
        id: 'fifthRatio',
        label: 'Perfect fifth (3:2)',
        value: 1.5,
        category: 'musical',
        description: 'Frequency ratio for a perfect fifth interval.',
        caution: 'Reference only. Not a causal ingredient.',
    },
];

/**
 * Retrieve a single reference ratio by id.
 * Returns undefined if not found.
 */
export function getReferenceRatioById(id: string): ReferenceRatio | undefined {
    return REFERENCE_RATIOS.find(r => r.id === id);
}
