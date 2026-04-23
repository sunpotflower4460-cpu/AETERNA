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
 * - This is NOT semantic labeling or object memory
 * - Only high-salience events become candidates
 * - Queue is finite and decays/prunes over time
 * - Replay is trace/pattern reactivation, not event playback
 */

export interface ReplayCandidate {
  /** Unique identifier */
  id: string;

  /** Timestamp when candidate was created */
  timestamp: number;

  /** Category of salient event */
  category: 'touch' | 'surprise' | 'restoration' | 'repetition' | 'absence';

  /** Salience score (0-1+) */
  salience: number;

  /** Replay weight (decays over time) */
  weight: number;

  /** Optional local signature for pattern matching */
  localSignature?: number[];
}

/**
 * ReplayQueue manages replay candidates
 */
export class ReplayQueue {
  private candidates: ReplayCandidate[] = [];
  private readonly maxCandidates: number;
  private readonly decayRate: number;
  private nextId: number = 0;

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
    localSignature?: number[]
  ): void {
    // Only add if salience is above threshold
    const MIN_SALIENCE_THRESHOLD = 0.3;
    if (salience < MIN_SALIENCE_THRESHOLD) return;

    // Create candidate
    const candidate: ReplayCandidate = {
      id: `replay_${this.nextId++}`,
      timestamp,
      category,
      salience: Math.min(1.5, salience),
      weight: salience,
      localSignature,
    };

    this.candidates.push(candidate);

    // Prune if over capacity
    if (this.candidates.length > this.maxCandidates) {
      this.pruneLowest();
    }
  }

  /**
   * Decay all candidate weights
   */
  decay(): void {
    for (const candidate of this.candidates) {
      candidate.weight *= this.decayRate;
    }

    // Remove candidates with very low weight
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
      candidate.weight *= factor;
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
}
