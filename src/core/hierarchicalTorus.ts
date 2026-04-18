/* eslint-disable @typescript-eslint/no-explicit-any */
import { AeternaNetwork } from './AeternaNetwork.js';
import type { SubTorusSummaryPacket, LayerAggregatePacket } from '../types/packets.js';
import {
  extractSubTorusSummary,
  aggregateSubToriSummaries,
  mapSummariesToUpperInput,
} from './layerBridge.ts';

/**
 * HierarchicalTorus orchestrates a two-layer structure:
 * - Lower layer: 36 sub-tori (12×12 each, arranged 6×6)
 * - Upper layer: 1 upper torus (6×6, one node per sub-torus)
 *
 * Phase E1: Only bottom-up flow is implemented.
 * Top-down flow will be added in Phase E2.
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

  constructor(
    subTorusSize = 12,
    gridWidth = 6,
    gridHeight = 6,
  ) {
    this.subTorusSize = subTorusSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.upperTorusSize = gridWidth * gridHeight;

    this.subTori = [];
    for (let i = 0; i < this.upperTorusSize; i++) {
      this.subTori.push(new AeternaNetwork(subTorusSize));
    }

    this.upperTorus = new AeternaNetwork(gridWidth);

    this.lastSubSummaries = [];
    this.lastAggregatePacket = null;
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
   * Complete hierarchical update:
   * 1. Update all sub-tori
   * 2. Extract representative values
   * 3. Update upper torus
   */
  updateHierarchy(diskNodeIdx: number, activeTouches?: Map<number, any>) {
    this.updateSubTori(diskNodeIdx, activeTouches);
    this.extractRepresentativeValues();
    this.updateUpperTorus(diskNodeIdx);
  }

  /**
   * Get summary statistics for the entire hierarchy.
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
