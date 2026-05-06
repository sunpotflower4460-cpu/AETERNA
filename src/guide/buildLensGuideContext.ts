/**
 * buildLensGuideContext.ts
 * v1.9: Lens-aware AI Guide
 *
 * Builds a summarized LensGuideContext from observation data.
 * Does NOT include raw huge fields or semantic nodes.
 *
 * Design principles:
 * - Summarizes, never exposes raw field arrays.
 * - Max items per section to keep context bounded.
 * - No consciousness / emotion / life-proof claims.
 * - All values are observer-side measurements.
 *
 * Reference: docs/lens-aware-ai-guide.md §3
 */

import type { LensContextPacket } from '../ui/lens/lensContextPacket.ts';
import type { CausalTraceResult } from '../types/causalTrace.ts';
import type { LayerCorrelationState } from '../types/layerCorrelation.ts';
import type { ObservationDifferenceState } from '../types/observationDifference.ts';
import type { ObservedRatioInvolvement } from '../observation/buildObservedRatioInvolvement.ts';

// ── LensGuideContext ──────────────────────────────────────────────────────────

export interface LensGuideContext {
  selectedCellSummary: {
    cellIndex: number | null;
    regionLabel?: string | null;
    focusedMetricId?: string | null;
    activeLensId?: string | null;
    metricValue?: unknown;
    valueKind?: string;
    confidence?: number;
  };
  runtimeMode: {
    metricMode?: string;
    fieldRuntimeMode?: string;
    membraneMode?: string;
    weakPlasticityMode?: string;
    externalConstantsMode?: string;
    safetyMode?: string;
  };
  observationFacts: string[];
  causalTraceSummary: string[];
  layerCorrelationSummary: string[];
  differenceSummary: string[];
  ratioInvolvementSummary: string[];
  replaySummary?: {
    isReplayMode: boolean;
    replayTick?: number;
    liveTick?: number;
  };
  warnings: string[];
  limitations: string[];
}

// ── buildLensGuideContext ─────────────────────────────────────────────────────

export function buildLensGuideContext(params: {
  lensContext: LensContextPacket;
  causalTrace?: CausalTraceResult | null;
  layerCorrelation?: LayerCorrelationState | null;
  difference?: ObservationDifferenceState | null;
  ratioInvolvement?: ObservedRatioInvolvement[] | null;
}): LensGuideContext {
  const { lensContext, causalTrace, layerCorrelation, difference, ratioInvolvement } = params;
  const { cellObservation, activeLens, highlightedMetricValue, isReplayMode, replayTick, liveTick } = lensContext;

  // ── Selected cell summary ─────────────────────────────────────────────────

  const cellIndex = cellObservation?.cellIndex ?? null;
  const regionLabel = cellObservation?.geometry?.regionLabel ?? null;
  const activeLensId = activeLens?.id ?? null;

  const selectedCellSummary: LensGuideContext['selectedCellSummary'] = {
    cellIndex,
    regionLabel,
    focusedMetricId: activeLens?.observationPath ?? null,
    activeLensId,
    metricValue: highlightedMetricValue,
    valueKind: activeLens?.valueKind ?? undefined,
  };

  // ── Observation facts (max 10) ────────────────────────────────────────────

  const observationFacts: string[] = [];

  if (cellObservation) {
    const { field, vortex, membrane, plasticity, ratios, geometry } = cellObservation;

    if (field?.amplitude !== undefined && field.amplitude !== null) {
      observationFacts.push(`Field amplitude: ${field.amplitude.toFixed(4)}`);
    }
    if (field?.phaseCoherenceLocal !== undefined && field.phaseCoherenceLocal !== null) {
      observationFacts.push(`Phase coherence (local): ${field.phaseCoherenceLocal.toFixed(4)}`);
    }
    if (vortex?.candidateConfidence !== undefined && vortex.candidateConfidence !== null) {
      observationFacts.push(`Vortex candidate confidence: ${vortex.candidateConfidence.toFixed(4)}`);
    }
    if (vortex?.topologicalCharge !== undefined && vortex.topologicalCharge !== null) {
      observationFacts.push(`Topological charge: ${vortex.topologicalCharge}`);
    }
    if (membrane?.deformation !== undefined && membrane.deformation !== null) {
      observationFacts.push(`Membrane deformation: ${membrane.deformation.toFixed(4)}`);
    }
    if (plasticity?.accumulatedTrace !== undefined && plasticity.accumulatedTrace !== null) {
      observationFacts.push(`Plasticity trace: ${plasticity.accumulatedTrace.toFixed(4)}`);
    }
    if (ratios?.strongestMatchStrength !== undefined && ratios.strongestMatchStrength !== null) {
      observationFacts.push(`Strongest ratio match: ${ratios.strongestMatchStrength.toFixed(4)}`);
    }
    if (geometry?.gaussianCurvature !== undefined && geometry.gaussianCurvature !== null) {
      observationFacts.push(`Gaussian curvature: ${geometry.gaussianCurvature.toFixed(6)}`);
    }
    if (geometry?.regionLabel) {
      observationFacts.push(`Region: ${geometry.regionLabel}`);
    }
  }

  if (activeLens) {
    observationFacts.push(`Active lens: ${activeLens.label} (${activeLens.valueKind})`);
  }

  // Trim to max 10
  const trimmedFacts = observationFacts.slice(0, 10);

  // ── Causal trace summary (max 5) ──────────────────────────────────────────

  let causalTraceSummary: string[] = [];
  if (causalTrace) {
    const lines = causalTrace.summary ?? [];
    causalTraceSummary.push(...lines.slice(0, 4));
    if (causalTrace.strongestSignals?.length > 0) {
      const top = causalTrace.strongestSignals[0];
      causalTraceSummary.push(`Strongest signal: ${top.label} [${top.relationKind}] confidence=${top.confidence}`);
    }
    // Trim to max 5
    causalTraceSummary = causalTraceSummary.slice(0, 5);
  }

  // ── Layer correlation summary (max 5) ─────────────────────────────────────

  const layerCorrelationSummary: string[] = [];
  if (layerCorrelation?.pairs) {
    const sorted = [...layerCorrelation.pairs]
      .filter((p) => p.correlation !== null)
      .sort((a, b) => Math.abs(b.correlation!) - Math.abs(a.correlation!))
      .slice(0, 5);
    for (const pair of sorted) {
      layerCorrelationSummary.push(
        `${pair.labelA} × ${pair.labelB}: r=${pair.correlation!.toFixed(3)} (${pair.confidence})`,
      );
    }
  }

  // ── Difference summary (max 5) ────────────────────────────────────────────

  const differenceSummary: string[] = [];
  if (difference?.largestChanges) {
    for (const item of difference.largestChanges.slice(0, 5)) {
      const delta = item.delta !== null ? ` Δ${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(4)}` : '';
      differenceSummary.push(`${item.label}:${delta} (${item.valueKind})`);
    }
  }

  // ── Ratio involvement summary (max 3) ─────────────────────────────────────

  const ratioInvolvementSummary: string[] = [];
  if (ratioInvolvement) {
    for (const inv of ratioInvolvement.slice(0, 3)) {
      const ref = inv.closestReferenceLabel ? ` ~ ${inv.closestReferenceLabel}` : '';
      ratioInvolvementSummary.push(`${inv.observedRatioId}: value=${inv.value.toFixed(4)}${ref}`);
    }
  }

  // ── Replay summary ────────────────────────────────────────────────────────

  const replaySummary: LensGuideContext['replaySummary'] = isReplayMode
    ? { isReplayMode: true, replayTick, liveTick }
    : { isReplayMode: false };

  // ── Warnings ──────────────────────────────────────────────────────────────

  const warnings: string[] = [];
  if (cellObservation?.diagnostics?.hasUnavailableSource) {
    warnings.push(`Some observer data unavailable (${cellObservation.diagnostics.missingFieldCount} fields).`);
  }
  if (causalTrace && causalTrace.confidence === 'insufficient') {
    warnings.push('Causal trace confidence: insufficient data.');
  }
  if (layerCorrelation && !layerCorrelation.sufficientData) {
    warnings.push('Layer correlation: insufficient data for meaningful results.');
  }

  // ── Limitations (always present) ─────────────────────────────────────────

  const limitations: string[] = [
    'All values are observer-side measurements.',
    'Correlation is not causation.',
    'Proxy values are not direct proof.',
  ];

  return {
    selectedCellSummary,
    runtimeMode: {},
    observationFacts: trimmedFacts,
    causalTraceSummary,
    layerCorrelationSummary,
    differenceSummary,
    ratioInvolvementSummary,
    replaySummary,
    warnings,
    limitations,
  };
}
