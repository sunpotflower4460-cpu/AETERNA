/**
 * PUT-IN: k independent DelayLineConfig (delayTicks, dampingFactor -
 *   measured empirically from a real chi, per docs/vessel/K13-world-
 *   constitution-adr.md Choice 5's corrected floor, never invented),
 *   psi's boundary cell indices, a shared lambda (same as the real
 *   distributed coupling), dt
 * EMERGED: the delay-line null-hypothesis control for K13's distributed
 *   exchange - k independent FIFO buffers, one per boundary pair, that
 *   replace chi's own physics entirely while keeping the SAME coupling
 *   LAW (K5's exact Rabi rotation, coupling.ts, unmodified) psi
 *   experiences at its boundary
 * claim-tier: C2 (implemented per the ADR's corrected Choice 5; see
 *   src/tests/pure/delayLineControl.test.ts for the round-trip-timing
 *   and no-internal-chi-dynamics checks)
 * floors (誠実な床): the ADR's own text ("固定のdelayTicks・dampingFactor
 *   を持つ単純なバッファ...psi側から来た値を最新値としてキューへ積む")
 *   under-specifies exactly how the returned value interacts with psi.
 *   This module resolves that by reusing coupling.ts's applyExchangeCoupling
 *   Rabi-rotation formula UNMODIFIED, with the delay buffer's stored
 *   (delayed) value substituted for "chi's current port value," and
 *   pushing the coupling's own chi-side rotated output (not psi's raw
 *   value) as the new buffer entry - so the SAME mixing law governs
 *   both the real-chi and delay-line configurations, and only chi's own
 *   internal dynamics (a full 2D field vs a memoryless delay) differs.
 *   This is a deliberate design choice for a fair comparison, not a
 *   claim the ADR's text uniquely specifies it.
 *   Each of the k buffers is fully independent - no coupling between
 *   them - so this control cannot express any cross-boundary-cell
 *   correlation a real dispersive/nonlinear chi might create (already
 *   flagged in the ADR as this control's own floor).
 */

import type { ComplexField } from '../geometry/torus.ts';
import { applyExchangeCoupling } from '../exchange/coupling.ts';
import type { ExchangeCouplingConfig } from '../exchange/boundary.ts';
import type { DistributedBoundaryPair } from './distributedBoundary.ts';
import type { WorldField } from './worldField.ts';
import { runDissipationTick } from '../ledger/energy.ts';
import { applyMediumHistoryStep } from '../medium/history.ts';

export interface DelayLineConfig {
  /** Ticks between a value entering the buffer and it being returned (scaled by dampingFactor). Measured from a real chi - see module doc. */
  delayTicks: number;
  /** Amplitude ratio applied to a value on its way out of the buffer. Measured from a real chi. */
  dampingFactor: number;
}

interface ComplexValue {
  real: number;
  imag: number;
}

export interface DelayLineBuffer {
  readonly config: DelayLineConfig;
  /** FIFO of complex values, oldest at index 0. Always has exactly config.delayTicks entries. */
  queue: ComplexValue[];
}

/** Builds a fresh buffer at rest: delayTicks entries of zero, so the first delayTicks ticks return nothing (matching chi starting at rest, the same convention createPureFieldState uses for a small-amplitude start). */
export function createDelayLineBuffer(config: DelayLineConfig): DelayLineBuffer {
  if (!Number.isInteger(config.delayTicks) || config.delayTicks < 1) {
    throw new Error(`createDelayLineBuffer: delayTicks must be a positive integer, got ${config.delayTicks}`);
  }
  if (!Number.isFinite(config.dampingFactor) || config.dampingFactor < 0) {
    throw new Error(`createDelayLineBuffer: dampingFactor must be a finite non-negative number, got ${config.dampingFactor}`);
  }
  const queue: ComplexValue[] = [];
  for (let i = 0; i < config.delayTicks; i++) queue.push({ real: 0, imag: 0 });
  return { config, queue };
}

export interface DelayLineExchangeResult {
  psi: ComplexField;
  buffers: DelayLineBuffer[];
}

/**
 * Applies the delay-line control's exchange for one tick, across all k
 * pairs. Does NOT mutate the input buffers (returns new ones, matching
 * this codebase's non-mutation convention for field steps).
 */
export function applyDelayLineExchange(
  psi: ComplexField,
  buffers: readonly DelayLineBuffer[],
  pairs: readonly DistributedBoundaryPair[],
  lambda: number,
  dt: number,
): DelayLineExchangeResult {
  if (buffers.length !== pairs.length) {
    throw new Error(`applyDelayLineExchange: buffers.length (${buffers.length}) must match pairs.length (${pairs.length})`);
  }

  let currentPsi = psi;
  const nextBuffers: DelayLineBuffer[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const buffer = buffers[i];
    const returning = buffer.queue[0]; // oldest entry - "chi's port value" this tick, per the ADR's corrected Choice 5.

    const chiLike: ComplexField = { real: Float64Array.from([returning.real]), imag: Float64Array.from([returning.imag]) };
    const config: ExchangeCouplingConfig = { lambda, boundaryCellIndex: pair.psiCellIndex, portCellIndex: 0 };
    const result = applyExchangeCoupling(currentPsi, chiLike, config, dt);
    currentPsi = result.psi;

    const rotatedChiLike = { real: result.chi.real[0] * buffer.config.dampingFactor, imag: result.chi.imag[0] * buffer.config.dampingFactor };
    const nextQueue = buffer.queue.slice(1);
    nextQueue.push(rotatedChiLike);
    nextBuffers.push({ config: buffer.config, queue: nextQueue });
  }

  return { psi: currentPsi, buffers: nextBuffers };
}

export interface WorldTickWithDelayLineResult {
  psi: ComplexField;
  psiNu: Float64Array;
  buffers: DelayLineBuffer[];
}

/**
 * The delay-line null-hypothesis's own full psi tick, mirroring
 * worldTick.ts's runWorldTick structure exactly on the psi side (own
 * conservative+dissipation, no drive - runDissipationTick's signature
 * has no drive parameter, same structural guarantee as runWorldTick)
 * but with the distributed exchange replaced by applyDelayLineExchange.
 *
 * PUT-IN nowhere receives a DriveSpec at all: chi's own drive J is
 * physically defined as a spatial profile OVER CHI'S FIELD (see
 * drive.ts / K13's own runWorldTick, where J is threaded into chi's
 * own runDriveTick) - a delay line with no internal field has nowhere
 * for J to act on. This is not an oversight: it is the honest
 * consequence of removing chi's field-ness, and it is exactly what
 * makes this control test what "being a spatially extended field with
 * its own energy uptake" buys beyond a passive boundary echo - see
 * docs/vessel/vessel-roadmap.md's K13 section for the recorded result.
 */
export function runWorldTickWithDelayLine(
  psi: ComplexField,
  psiNu: Float64Array,
  psiWorld: WorldField,
  buffers: readonly DelayLineBuffer[],
  pairs: readonly DistributedBoundaryPair[],
  lambda: number,
  dt: number,
): WorldTickWithDelayLineResult {
  const { psi: psiAfterOwnTick } = runDissipationTick(psi, psiWorld.stepper, psiWorld.geometry, psiWorld.params.alpha, psiWorld.params.g, psiNu, dt);
  const { psi: psiAfterExchange, buffers: nextBuffers } = applyDelayLineExchange(psiAfterOwnTick, buffers, pairs, lambda, dt);
  const psiNuNext = applyMediumHistoryStep(psiAfterExchange, psiNu, psiWorld.mediumParams, dt);
  return { psi: psiAfterExchange, psiNu: psiNuNext, buffers: nextBuffers };
}
