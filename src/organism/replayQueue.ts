/**
 * Replay Queue - Minimal Offline Replay Candidate Management
 *
 * AETERNA v0.5 / A3: Offline Replay / Rest Consolidation
 *
 * This module manages a lightweight queue of replay candidates.
 * Candidates represent salient traces that may be reactivated during quiet/rest.
 *
 * Important:
 * - This is NOT episodic memory or autobiographical memory
 * - Only high-salience events become candidates
 * - Queue is finite and decays/prunes over time
 * - Replay is trace/pattern reactivation, not event playback
 */

export interface ReplayCandidate {
  /** Unique identifier */
  id: string;

  /** Timestamp when candidate was created */
  timestamp: number;

  /** Category of trace/pattern pressure */
  category: 'mismatch' | 'recurrence' | 'recovery' | 'boundary' | 'settling';

  /** Salience score (0-1+) */
  salience: number;

  /** Replay weight (decays over time) */
  weight: number;

  /** Current trace-pressure support for this candidate */
  traceStrength: number;

  /** Repetition-linked support for this candidate */
  recurrenceWeight: number;

  /** Optional local signature for pattern matching */
  localSignature?: number[];
}

import { decayScalarWithSink } from '../core/dynamicCoreNamedDestinations.ts';

/**
 * ReplayQueue manages replay candidates
 */
export class ReplayQueue {
  private candidates: ReplayCandidate[] = [];
  private readonly maxCandidates: number;
  private readonly decayRate: number;
  private nextId: number = 0;

  // Named destinations for decay losses (F5).
  // Cumulative magnitude of weight / traceStrength / recurrenceWeight that
  // has been removed by decay() so far, summed across all candidates and ticks.
  public weightDecayAccumulator: number = 0;
  public traceStrengthDecayAccumulator: number = 0;
  public recurrenceWeightDecayAccumulator: number = 0;

  constructor(maxCandidates = 50, decayRate = 0.998) {
    this.maxCandidates = maxCandidates;
    this.decayRate = decayRate;
  }

  /**
   * Add a new replay candidate if salience is high enough
   */
  addCandidate(
    category: ReplayCandidate['category'],
    salience: number,
    timestamp: number,
    localSignature?: number[],
    traceStrength = 0,
    recurrenceWeight = 0
  ): void {
    const MIN_SALIENCE_THRESHOLD = 0.22;
    if (salience < MIN_SALIENCE_THRESHOLD) return;

    const mergedCandidate = this.findMergeTarget(category, localSignature);
    if (mergedCandidate) {
      mergedCandidate.timestamp = timestamp;
      mergedCandidate.salience = Math.min(1.5, Math.max(mergedCandidate.salience, salience));
      mergedCandidate.traceStrength = Math.min(1.5, Math.max(mergedCandidate.traceStrength, traceStrength));
      mergedCandidate.recurrenceWeight = Math.min(1.2, Math.max(mergedCandidate.recurrenceWeight, recurrenceWeight));
      mergedCandidate.weight = Math.min(
        1.5,
        mergedCandidate.weight * 0.78 +
        salience * 0.16 +
        traceStrength * 0.04 +
        recurrenceWeight * 0.02,
      );
      return;
    }

    const candidate: ReplayCandidate = {
      id: `replay_${this.nextId++}`,
      timestamp,
      category,
      salience: Math.min(1.5, salience),
      weight: Math.min(1.5, salience * 0.72 + traceStrength * 0.2 + recurrenceWeight * 0.08),
      traceStrength: Math.min(1.5, traceStrength),
      recurrenceWeight: Math.min(1.2, recurrenceWeight),
      localSignature,
    };

    this.candidates.push(candidate);

    if (this.candidates.length > this.maxCandidates) {
      this.pruneLowest();
    }
  }

  /**
   * Decay all candidate weights
   */
  decay(): void {
    for (const candidate of this.candidates) {
      candidate.weight = decayScalarWithSink(candidate.weight, this.decayRate, this, 'weightDecayAccumulator');
      candidate.traceStrength = decayScalarWithSink(candidate.traceStrength, 0.999, this, 'traceStrengthDecayAccumulator');
      candidate.recurrenceWeight = decayScalarWithSink(candidate.recurrenceWeight, 0.9995, this, 'recurrenceWeightDecayAccumulator');
    }

    this.candidates = this.candidates.filter(c => c.weight > 0.01);
  }

  /**
   * Get candidates for replay, sorted by weight
   */
  getCandidatesForReplay(maxCount: number): ReplayCandidate[] {
    // Sort by weight descending
    const sorted = [...this.candidates].sort((a, b) => b.weight - a.weight);
    return sorted.slice(0, maxCount);
  }

  /**
   * Remove a candidate after it has been replayed
   */
  removeCandidate(id: string): void {
    this.candidates = this.candidates.filter(c => c.id !== id);
  }

  /**
   * Reduce weight of a candidate after partial replay
   */
  reduceWeight(id: string, factor: number): void {
    const candidate = this.candidates.find(c => c.id === id);
    if (candidate) {
      candidate.weight = decayScalarWithSink(candidate.weight, factor, this, 'weightDecayAccumulator');
      candidate.traceStrength = decayScalarWithSink(candidate.traceStrength, Math.min(1, factor + 0.08), this, 'traceStrengthDecayAccumulator');
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.candidates.length;
  }

  /**
   * Get total salience in queue
   */
  totalSalience(): number {
    return this.candidates.reduce((sum, c) => sum + c.weight, 0);
  }

  /**
   * Get average salience in queue
   */
  averageSalience(): number {
    if (this.candidates.length === 0) return 0;
    return this.totalSalience() / this.candidates.length;
  }

  /**
   * Clear all candidates
   */
  clear(): void {
    this.candidates = [];
  }

  /**
   * Prune lowest-weight candidate
   */
  private pruneLowest(): void {
    if (this.candidates.length === 0) return;

    let lowestIndex = 0;
    let lowestWeight = this.candidates[0].weight;

    for (let i = 1; i < this.candidates.length; i++) {
      if (this.candidates[i].weight < lowestWeight) {
        lowestWeight = this.candidates[i].weight;
        lowestIndex = i;
      }
    }

    this.candidates.splice(lowestIndex, 1);
  }

  private findMergeTarget(
    category: ReplayCandidate['category'],
    localSignature?: number[],
  ): ReplayCandidate | undefined {
    return this.candidates.find(candidate =>
      candidate.category === category &&
      this.isSimilarSignature(candidate.localSignature, localSignature),
    );
  }

  private isSimilarSignature(a?: number[], b?: number[]): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    let totalDiff = 0;
    for (let i = 0; i < a.length; i++) {
      totalDiff += Math.abs(a[i] - b[i]);
    }
    return totalDiff / a.length < 0.12;
  }
}
