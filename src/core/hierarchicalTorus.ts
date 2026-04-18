/* eslint-disable @typescript-eslint/no-explicit-any */
import { AeternaNetwork } from './AeternaNetwork.js';
import type { SubTorusSummaryPacket, LayerAggregatePacket, HierarchicalFeedbackPacket } from '../types/packets.js';
import {
  aggregateSubToriSummaries,
  mapSummariesToUpperInput,
  generateTopDownModulation,
} from './layerBridge.ts';

/**
 * HierarchicalTorus orchestrates a two-layer structure:
 * - Lower layer: 36 sub-tori (12×12 each, arranged 6×6)
 * - Upper layer: 1 upper torus (6×6, one node per sub-torus)
 *
 * Phase E1: Bottom-up flow is implemented.
 * Phase E2: Top-down flow added for bidirectional strange loop.
 *
 * Time scale separation:
 * - Sub-tori: Fast updates (every frame)
 * - Upper torus: Slow updates (every N frames, default 10:1 ratio)
 */
export class HierarchicalTorus {
  subTori: AeternaNetwork[];
  upperTorus: AeternaNetwork;
  gridWidth: number;
  gridHeight: number;
  subTorusSize: number;
  upperTorusSize: number;

  lastSubSummaries: SubTorusSummaryPacket[];
  lastAggregatePacket: LayerAggregatePacket | null;
  lastFeedbackPacket: HierarchicalFeedbackPacket | null;

  // Phase E2: Time scale separation
  frameCount: number;
  upperUpdateInterval: number; // How many frames between upper torus updates

  constructor(
    subTorusSize = 12,
    gridWidth = 6,
    gridHeight = 6,
    upperUpdateInterval = 10 // Default 10:1 time scale ratio
  ) {
    this.subTorusSize = subTorusSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.upperTorusSize = gridWidth * gridHeight;
    this.upperUpdateInterval = upperUpdateInterval;

    this.subTori = [];
    for (let i = 0; i < this.upperTorusSize; i++) {
      this.subTori.push(new AeternaNetwork(subTorusSize));
    }

    this.upperTorus = new AeternaNetwork(gridWidth);

    this.lastSubSummaries = [];
    this.lastAggregatePacket = null;
    this.lastFeedbackPacket = null;
    this.frameCount = 0;
  }

  /**
   * Update all sub-tori independently.
   */
  updateSubTori(diskNodeIdx: number, activeTouches?: Map<number, any>) {
    for (let i = 0; i < this.subTori.length; i++) {
      this.subTori[i].updateDynamics(diskNodeIdx, activeTouches);
    }
  }

  /**
   * Extract representative values from all sub-tori.
   */
  extractRepresentativeValues(): LayerAggregatePacket {
    const aggregate = aggregateSubToriSummaries(
      this.subTori,
      this.gridWidth,
      this.gridHeight
    );
    this.lastAggregatePacket = aggregate;
    this.lastSubSummaries = aggregate.summaries;
    return aggregate;
  }

  /**
   * Update the upper torus based on aggregated sub-torus summaries.
   * Phase E2: Only updates at specified interval (time scale separation).
   */
  updateUpperTorus(diskNodeIdx: number) {
    if (!this.lastAggregatePacket) {
      this.lastAggregatePacket = this.extractRepresentativeValues();
    }

    const upperInput = mapSummariesToUpperInput(
      this.lastAggregatePacket,
      this.upperTorus.numNodes
    );

    for (let i = 0; i < this.upperTorus.numNodes; i++) {
      this.upperTorus.touchProjection[i] = upperInput[i];
    }

    this.upperTorus.updateDynamics(diskNodeIdx, undefined);
  }

  /**
   * Phase E2: Generate top-down modulation from upper torus state.
   * Creates weak feedback packets that will influence sub-tori reactivity.
   */
  generateTopDownFeedback(): HierarchicalFeedbackPacket {
    const feedback = generateTopDownModulation(this.upperTorus, this.subTori.length);
    this.lastFeedbackPacket = feedback;
    return feedback;
  }

  /**
   * Phase E2: Apply top-down modulation to sub-tori.
   * This does NOT directly change sub-torus state, but sets modulation
   * parameters that will affect subsequent dynamics.
   */
  applyTopDownModulation() {
    if (!this.lastFeedbackPacket) {
      return;
    }

    for (let i = 0; i < this.subTori.length; i++) {
      const modulation = this.lastFeedbackPacket.perSubTorus[i];
      if (!modulation) continue;

      const subTorus = this.subTori[i];

      // Apply modulation deltas to sub-torus parameters
      // These affect future behavior, not immediate state
      if (!subTorus.topDownModulation) {
        subTorus.topDownModulation = {
          baselineGainDelta: 0,
          rewriteGainDelta: 0,
          thresholdDelta: 0,
        };
      }

      // Smooth application with temporal filtering
      const smoothing = 0.3;
      subTorus.topDownModulation.baselineGainDelta =
        subTorus.topDownModulation.baselineGainDelta * (1 - smoothing) +
        modulation.baselineGainDelta * smoothing;

      subTorus.topDownModulation.rewriteGainDelta =
        subTorus.topDownModulation.rewriteGainDelta * (1 - smoothing) +
        modulation.rewriteGainDelta * smoothing;

      subTorus.topDownModulation.thresholdDelta =
        subTorus.topDownModulation.thresholdDelta * (1 - smoothing) +
        modulation.thresholdDelta * smoothing;

      // NaN guard
      if (!Number.isFinite(subTorus.topDownModulation.baselineGainDelta)) {
        subTorus.topDownModulation.baselineGainDelta = 0;
      }
      if (!Number.isFinite(subTorus.topDownModulation.rewriteGainDelta)) {
        subTorus.topDownModulation.rewriteGainDelta = 0;
      }
      if (!Number.isFinite(subTorus.topDownModulation.thresholdDelta)) {
        subTorus.topDownModulation.thresholdDelta = 0;
      }
    }
  }

  /**
   * Complete hierarchical update with Phase E2 bidirectional flow:
   * 1. Update all sub-tori (every frame)
   * 2. Extract representative values
   * 3. Update upper torus (every N frames)
   * 4. Generate top-down modulation (every N frames)
   * 5. Apply modulation to sub-tori (every N frames)
   */
  updateHierarchy(diskNodeIdx: number, activeTouches?: Map<number, any>) {
    this.frameCount++;

    // Step 1: Sub-tori update (fast, every frame)
    this.updateSubTori(diskNodeIdx, activeTouches);

    // Step 2: Extract representative values
    this.extractRepresentativeValues();

    // Step 3-5: Upper torus and top-down flow (slow, every N frames)
    if (this.frameCount % this.upperUpdateInterval === 0) {
      this.updateUpperTorus(diskNodeIdx);
      this.generateTopDownFeedback();
      this.applyTopDownModulation();
    }
  }

  /**
   * Get summary statistics for the entire hierarchy.
   * Phase E2: Includes top-down modulation metrics.
   */
  getHierarchySummary() {
    const subMeanActivity = this.lastSubSummaries.length > 0
      ? this.lastSubSummaries.reduce((sum, s) => sum + s.meanActivity, 0) / this.lastSubSummaries.length
      : 0;

    const subMeanArousal = this.lastSubSummaries.length > 0
      ? this.lastSubSummaries.reduce((sum, s) => sum + s.arousal, 0) / this.lastSubSummaries.length
      : 0;

    const subMeanSigma = this.lastSubSummaries.length > 0
      ? this.lastSubSummaries.reduce((sum, s) => sum + s.sigma, 0) / this.lastSubSummaries.length
      : 0;

    const subMeanPhiProxy = this.lastSubSummaries.length > 0
      ? this.lastSubSummaries.reduce((sum, s) => sum + s.phiProxy, 0) / this.lastSubSummaries.length
      : 0;

    let upperActivity = 0;
    for (let i = 0; i < this.upperTorus.numNodes; i++) {
      upperActivity += this.upperTorus.spikeTrace[i];
    }
    const upperMeanActivity = upperActivity / this.upperTorus.numNodes;

    // Phase E2: Top-down modulation statistics
    let modulationPresent = false;
    let meanBaselineGainDelta = 0;
    let meanRewriteGainDelta = 0;
    let meanThresholdDelta = 0;
    let modulationCount = 0;

    for (const subTorus of this.subTori) {
      if (subTorus.topDownModulation) {
        modulationPresent = true;
        meanBaselineGainDelta += subTorus.topDownModulation.baselineGainDelta;
        meanRewriteGainDelta += subTorus.topDownModulation.rewriteGainDelta;
        meanThresholdDelta += subTorus.topDownModulation.thresholdDelta;
        modulationCount++;
      }
    }

    if (modulationCount > 0) {
      meanBaselineGainDelta /= modulationCount;
      meanRewriteGainDelta /= modulationCount;
      meanThresholdDelta /= modulationCount;
    }

    return {
      subTorusCount: this.subTori.length,
      subTorusSize: this.subTorusSize,
      upperTorusSize: this.upperTorusSize,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      subMeanActivity,
      subMeanArousal,
      subMeanSigma,
      subMeanPhiProxy,
      upperMeanActivity,
      upperSigma: this.upperTorus.sigmaDisplay,
      upperPhiProxy: this.upperTorus.cachedPhiApprox,
      upperArousal: this.upperTorus.currGenFiring / this.upperTorus.numNodes,
      // Phase E2: Bidirectional flow metrics
      frameCount: this.frameCount,
      upperUpdateInterval: this.upperUpdateInterval,
      topDownModulationPresent: modulationPresent,
      meanBaselineGainDelta,
      meanRewriteGainDelta,
      meanThresholdDelta,
      lastFeedbackTimestamp: this.lastFeedbackPacket ? this.frameCount : null,
    };
  }

  /**
   * Get a specific sub-torus by grid coordinates.
   */
  getSubTorus(gridX: number, gridY: number): AeternaNetwork | null {
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return null;
    }
    const index = gridY * this.gridWidth + gridX;
    return this.subTori[index];
  }

  /**
   * Get summary for a specific sub-torus.
   */
  getSubTorusSummary(gridX: number, gridY: number): SubTorusSummaryPacket | null {
    const index = gridY * this.gridWidth + gridX;
    if (index < 0 || index >= this.lastSubSummaries.length) {
      return null;
    }
    return this.lastSubSummaries[index];
  }
}
