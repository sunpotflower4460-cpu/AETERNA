/**
 * PUT-IN: psi's and chi's current ComplexField/nu/geometry, the current
 *   tick, and a plain numeric ledger summary the tick loop already
 *   computed (never recomputed here)
 * EMERGED: a read-only, JSON-serializable ObservationSnapshot - density
 *   |psi|^2/|chi|^2, phase, nu(x), the ledger summary, and a small set
 *   of K11 measurements (vortex candidate count, largest-blob contrast)
 *   - suitable for broadcasting over observationApi.ts's WebSocket
 * claim-tier: C2 (see src/tests/pure/observationState.test.ts: density/
 *   phase match a hand-computed reference for a small planted field;
 *   buildObservationSnapshot never mutates its inputs)
 * floors (誠実な床): this module and observationApi.ts together ARE
 *   K15's "観測API" - the decisive falsifier
 *   (docs/vessel/K15-runtime-design.md's completion condition) requires
 *   that neither has any path back into ψ. Enforced here by import
 *   restriction, checked by src/tests/pure/observationImportBoundary.test.ts:
 *   this file imports ONLY from ../geometry/torus.ts (types + the plain
 *   ComplexField/TorusGeometry shapes) and ../observe/ (read-only
 *   measurement functions, already proven non-interfering by K11's own
 *   observerNonInterference tests). It does NOT import ../run/,
 *   ../field/step*.ts, ../drive/, ../ledger/, ../medium/,
 *   ../world/worldTick.ts, ../world/worldField.ts,
 *   ../world/distributedBoundary.ts, ../world/delayLineControl.ts,
 *   ../world/foreignFieldControl.ts, ../runtime/transducer.ts,
 *   ../runtime/inputLog.ts, or ../persist/ - none of which this module
 *   needs, since the ledger summary is handed in as plain numbers by
 *   the caller (the tick loop already computed it as part of
 *   runWorldTick's own return value) rather than recomputed here.
 *   relativeDeviation for findDensityBlobs is fixed at a placeholder
 *   value (0.3, K11's own frozen sample value) - a properly pre-
 *   registered observation-instrument config is left for whoever first
 *   uses this snapshot's structureIndicatorLargestBlob for a real claim
 *   (K15 itself makes no claim from it - it is exposed only as a
 *   read-only convenience for a connected client).
 */

import type { ComplexField, TorusGeometry } from '../geometry/torus.ts';
import { detectVortexCandidates } from '../observe/vortexCandidates.ts';
import { findDensityBlobs, evaluateContrast } from '../observe/densityContrast.ts';

const STRUCTURE_INDICATOR_RELATIVE_DEVIATION = 0.3;

export interface WorldLedgerSummary {
  nBeforeExchangePsi: number;
  nAfterExchangePsi: number;
  hBeforeExchangePsi: number;
  hAfterExchangePsi: number;
  nBeforeExchangeChi: number;
  nAfterExchangeChi: number;
  hBeforeExchangeChi: number;
  hAfterExchangeChi: number;
  exchangeWorkNPsi: number;
  exchangeWorkHPsi: number;
  exchangeWorkNChi: number;
  exchangeWorkHChi: number;
}

export interface ObservationSnapshot {
  tick: number;
  psiDensity: number[];
  psiPhase: number[];
  psiNu: number[];
  chiDensity: number[];
  chiPhase: number[];
  chiNu: number[];
  ledger: WorldLedgerSummary;
  vortexCandidateCount: number;
  structureIndicatorLargestBlob: number;
}

function computeDensity(field: ComplexField): number[] {
  const size = field.real.length;
  const density = new Array<number>(size);
  for (let i = 0; i < size; i++) {
    density[i] = field.real[i] * field.real[i] + field.imag[i] * field.imag[i];
  }
  return density;
}

function computePhase(field: ComplexField): number[] {
  const size = field.real.length;
  const phase = new Array<number>(size);
  for (let i = 0; i < size; i++) {
    phase[i] = Math.atan2(field.imag[i], field.real[i]);
  }
  return phase;
}

function computeStructureIndicator(psi: ComplexField, geometry: TorusGeometry): number {
  const blobs = findDensityBlobs(psi, geometry, STRUCTURE_INDICATOR_RELATIVE_DEVIATION);
  if (blobs.length === 0) return 0;
  const largest = blobs.reduce((a, b) => (b.cellIndices.length > a.cellIndices.length ? b : a));
  return evaluateContrast(largest, blobs, psi, geometry, 0).contrastRatio;
}

export interface BuildObservationSnapshotInput {
  tick: number;
  psi: ComplexField;
  psiNu: Float64Array;
  psiGeometry: TorusGeometry;
  chi: ComplexField;
  chiNu: Float64Array;
  chiGeometry: TorusGeometry;
  ledger: WorldLedgerSummary;
}

export function buildObservationSnapshot(input: BuildObservationSnapshotInput): ObservationSnapshot {
  return {
    tick: input.tick,
    psiDensity: computeDensity(input.psi),
    psiPhase: computePhase(input.psi),
    psiNu: Array.from(input.psiNu),
    chiDensity: computeDensity(input.chi),
    chiPhase: computePhase(input.chi),
    chiNu: Array.from(input.chiNu),
    ledger: { ...input.ledger },
    vortexCandidateCount: detectVortexCandidates(input.psi, input.psiGeometry).length,
    structureIndicatorLargestBlob: computeStructureIndicator(input.psi, input.psiGeometry),
  };
}
