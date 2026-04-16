/**
 * Metric category labels for AETERNA.
 *
 * Each metric is classified as one of:
 *   MEASURED   — value comes directly from an input or raw node count.
 *   DERIVED    — value is computed from other measured values by a formula.
 *   PROXY      — value approximates a theoretical construct; not the real thing.
 *   SPECULATIVE — concept exists but is not yet implemented; placeholder only.
 */
export type MetricCategory = 'MEASURED' | 'DERIVED' | 'PROXY' | 'SPECULATIVE';

export interface MetricMeta {
  category: MetricCategory;
  /** Short human-readable description shown in tooltips. */
  tooltip: string;
}

export type MetricKey =
  | 'omega_t'
  | 'omega_p'
  | 'ratio_rr'
  | 'firing_rate'
  | 'largest_cluster'
  | 'sigma_cascade'
  | 'phi_proxy'
  | 'phase_coherence'
  | 'attractor_id';

export const METRIC_META: Record<MetricKey, MetricMeta> = {
  omega_t: {
    category: 'MEASURED',
    tooltip: '[MEASURED] Toroidal frequency — direct slider input value. Control parameter, not derived.',
  },
  omega_p: {
    category: 'MEASURED',
    tooltip: '[MEASURED] Poloidal frequency — direct slider input value. Control parameter, not derived.',
  },
  ratio_rr: {
    category: 'DERIVED',
    tooltip: '[DERIVED] R/r ratio — geometrically computed from R (fixed = φ) and r (slider). Compared to φ = 1.618.',
  },
  firing_rate: {
    category: 'MEASURED',
    tooltip: '[MEASURED] Fraction of nodes whose buffer crossed the spike threshold this frame. Raw count / total nodes.',
  },
  largest_cluster: {
    category: 'DERIVED',
    tooltip: '[DERIVED] Largest connected component of active nodes (spikeTrace > 0.5), as a fraction of total. Computed via Union-Find.',
  },
  sigma_cascade: {
    category: 'DERIVED',
    tooltip: '[DERIVED] Smoothed branching ratio: EMA of (currGenFiring / prevGenFiring). Near 1 suggests critical-like propagation. Not a direct measurement of criticality.',
  },
  phi_proxy: {
    category: 'PROXY',
    tooltip: '[PROXY] Whole-vs-parts integration proxy. Custom approximation using subgroup mean activity differences (yin/yang, layer, hemisphere). NOT IIT Φ.',
  },
  phase_coherence: {
    category: 'PROXY',
    tooltip: '[PROXY] Kuramoto-like order parameter approximation. Uses weighted node phases; not full oscillator coupling. Approximate phase alignment only.',
  },
  attractor_id: {
    category: 'SPECULATIVE',
    tooltip: '[SPECULATIVE] Attractor identification — not implemented. Always shows NONE. Placeholder for future attractor library matching.',
  },
};
