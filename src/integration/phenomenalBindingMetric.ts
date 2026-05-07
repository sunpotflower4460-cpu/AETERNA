/**
 * PhenomenalBindingMetric (Phase A)
 *
 * Read-only metric over a single GlobalIntegrationField tick. Produces four
 * numeric proxies that survey "how much of what is happening this tick is
 * organized as a single coalition vs. a scattered collection".
 *
 * The four proxies intentionally cover different theoretical traditions so the
 * AETERNA器 does not commit to one consciousness hypothesis prematurely:
 *
 *   - bindingStrength       : crude unification proxy (signals + coherence)
 *   - coalitionEntropy      : Shannon-style spread of signal activations
 *   - integrationPhiProxy   : IIT-flavored gap between unified vs. fragmented
 *   - dominantCoalitionWidth: GWT-flavored width of the dominant coalition
 *
 * Phase A constraint: this module **does not** modify any runtime state and
 * is **not** wired into dynamicCore. It only reads a frozen
 * GlobalIntegrationField and returns numbers. No semantic labels, no claims
 * of consciousness, no language output.
 */
import type { GlobalIntegrationField } from './globalIntegrationField.ts';
import type { Signal, SignalActivationKind } from '../signal/types.ts';

export interface PhenomenalBindingMetric {
  /** Tick timestamp this metric was computed against. */
  timestamp: number;
  /**
   * 0..1. Crude unification proxy: combines mean binding weight, signal
   * coherence, and self-coherence into a single bounded score. High values
   * mean "the inputs this tick agree more than they disagree". Not a claim
   * about consciousness.
   */
  bindingStrength: number;
  /**
   * 0..1. Normalized Shannon entropy over signal activation distribution.
   * 1 = activations spread evenly across all signals (no dominant coalition).
   * 0 = one signal dominates entirely. Computed only when signals are present.
   */
  coalitionEntropy: number;
  /**
   * 0..1. IIT-flavored proxy: difference between local pairwise coherence
   * (mean binding weight) and global dispersion (1 - mean activation gap).
   * Higher values suggest the system is more integrated than the sum of its
   * parts; lower values suggest fragmentation. This is a proxy, not Φ.
   */
  integrationPhiProxy: number;
  /**
   * 0..1. GWT-flavored proxy: fraction of signals whose activation kind is
   * 'dominant' or 'coactive' (i.e. participating in the broadcast coalition).
   * 0 = no coalition; 1 = every signal is in the broadcast.
   */
  dominantCoalitionWidth: number;
  /** Number of signals contributing to this metric (0 if none). */
  signalCount: number;
  /** Number of bindings contributing to this metric (0 if none). */
  bindingCount: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function shannonEntropyOverSignals(signals: ReadonlyArray<Signal>): number {
  if (signals.length === 0) return 0;
  let total = 0;
  for (const s of signals) total += Math.max(0, s.activation);
  if (total <= 0) return 0;
  let entropy = 0;
  for (const s of signals) {
    const p = Math.max(0, s.activation) / total;
    if (p > 0) entropy -= p * Math.log(p);
  }
  // Normalize by max entropy (uniform distribution) so the result is 0..1.
  const maxEntropy = Math.log(signals.length);
  if (maxEntropy <= 0) return 0;
  return clamp01(entropy / maxEntropy);
}

function activationGap(signals: ReadonlyArray<Signal>): number {
  if (signals.length === 0) return 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const s of signals) {
    const a = Math.max(0, s.activation);
    if (a < min) min = a;
    if (a > max) max = a;
  }
  if (!Number.isFinite(min)) return 0;
  return clamp01(max - min);
}

const COALITION_KINDS: ReadonlySet<SignalActivationKind> = new Set([
  'dominant',
  'coactive',
]);

function dominantCoalitionWidth(signals: ReadonlyArray<Signal>): number {
  if (signals.length === 0) return 0;
  let count = 0;
  for (const s of signals) if (COALITION_KINDS.has(s.kind)) count++;
  return count / signals.length;
}

/**
 * Compute the binding metric for a single tick.
 *
 * If the field has no signals **and** no self/world packet **and** no
 * interoception, the result is all-zero. Callers should treat all-zero as
 * "no observation available this tick" rather than as evidence of
 * disintegration.
 */
export function derivePhenomenalBindingMetric(
  field: GlobalIntegrationField,
): PhenomenalBindingMetric {
  const features = field.features;
  const signals = field.signal?.signals ?? [];

  const bindingMeanWeight = clamp01(features.bindingMeanWeight);
  const coherenceUnion = clamp01(
    (features.selfCoherence + features.coherenceSense) * 0.5,
  );
  const meanActivation = clamp01(features.signalMeanActivation);

  // bindingStrength: weighted mix of three already-bounded inputs. Coefficients
  // sum to 1 so the result stays in 0..1 without an extra clamp.
  const bindingStrength = clamp01(
    bindingMeanWeight * 0.45 + coherenceUnion * 0.35 + meanActivation * 0.20,
  );

  const coalitionEntropy = shannonEntropyOverSignals(signals);

  // integrationPhiProxy: pairwise local coherence minus global dispersion.
  // We treat bindingMeanWeight as local pairwise agreement and the activation
  // gap as a crude proxy of "how unevenly the field is firing".
  const localPair = bindingMeanWeight;
  const globalDispersion = activationGap(signals);
  const integrationPhiProxy = clamp01(localPair - globalDispersion * 0.5 + 0.5 * 0);
  // The constant 0 term is a placeholder for a future global-coherence input
  // (Phase B may add hierarchical predictor agreement).

  const coalitionWidth = dominantCoalitionWidth(signals);

  return {
    timestamp: field.timestamp,
    bindingStrength,
    coalitionEntropy,
    integrationPhiProxy,
    dominantCoalitionWidth: coalitionWidth,
    signalCount: signals.length,
    bindingCount: features.bindingCount,
  };
}

export function createZeroPhenomenalBindingMetric(timestamp = 0): PhenomenalBindingMetric {
  return {
    timestamp,
    bindingStrength: 0,
    coalitionEntropy: 0,
    integrationPhiProxy: 0,
    dominantCoalitionWidth: 0,
    signalCount: 0,
    bindingCount: 0,
  };
}
