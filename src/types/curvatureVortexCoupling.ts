/**
 * Curvature × Vortex Coupling Types
 *
 * N3: Curvature × Vortex Coupling
 *
 * These types describe observer-side statistics that relate torus geometry
 * (curvature distribution from N1) to phase-defect vortex candidates
 * (from N2).  They do NOT establish causality between curvature and vortex
 * formation.  They do NOT connect vortices to runtime feedback, weak
 * plasticity, or semantic nodes.
 *
 * Guardrails:
 * - curvatureVortexCoupling is an observation, not a causal claim.
 * - vortex candidates are observer-side phase-defect candidates only.
 * - signedTotalCharge is a topological check, not a mystical indicator.
 * - inner / outer rim are geometric regions, not meaningful centers.
 * - No semantic / consciousness / emotion claims are made here.
 */

// ── Curvature band vortex statistics ─────────────────────────────────────────

/**
 * Per-curvature-band statistics over vortex candidates.
 *
 * Gaussian curvature is divided into five bands.  For each band we record
 * how many torus cells fall inside it and how many vortex candidates were
 * detected in those cells.
 *
 * Note: a higher vortexDensity in one band does NOT imply that curvature
 * "causes" vortices.  It is an observational relationship only.
 */
export interface CurvatureBandVortexStats {
  /** Canonical band identifier, e.g. 'negativeHigh'. */
  bandId: string;
  /** Human-readable label for display. */
  label: string;
  /** Minimum Gaussian curvature value in this band (inclusive). */
  minGaussianCurvature: number;
  /** Maximum Gaussian curvature value in this band (inclusive). */
  maxGaussianCurvature: number;
  /** Number of torus cells whose Gaussian curvature falls in this band. */
  regionCount: number;
  /** Number of vortex candidates whose cell falls in this band. */
  vortexCount: number;
  /** Count of vortex candidates with topologicalCharge > 0. */
  positiveChargeCount: number;
  /** Count of vortex candidates with topologicalCharge < 0. */
  negativeChargeCount: number;
  /** Mean confidence of vortex candidates in this band. */
  averageVortexConfidence: number;
  /** Mean amplitudeMinimum at detected vortex sites in this band. */
  averageAmplitudeMinimum: number;
  /** Mean lifetimeTicks of vortex candidates in this band. */
  averageVortexLifetime: number;
  /** vortexCount / max(1, regionCount) */
  vortexDensity: number;
}

// ── Region-based vortex statistics ───────────────────────────────────────────

/**
 * Geometric region identifier.
 *
 * Regions are defined by the minor-angle position on the torus:
 *   outerRim  — cos(v) strongly positive (v ≈ 0)
 *   innerRim  — cos(v) strongly negative (v ≈ π)
 *   upperRim  — sin(v) strongly positive (v ≈ π/2)
 *   lowerRim  — sin(v) strongly negative (v ≈ −π/2)
 *   neutral   — cells that do not meet any strong threshold
 *
 * These are purely geometric labels, not semantic or meaningful categories.
 * inner rim is NOT a mystical center.  outer rim is NOT superior to inner.
 */
export type TorusRegionId =
  | 'outerRim'
  | 'innerRim'
  | 'upperRim'
  | 'lowerRim'
  | 'neutral';

/**
 * Vortex candidate statistics broken down by geometric torus region.
 */
export interface CurvatureRegionVortexStats {
  regionId: TorusRegionId;
  /** Total number of vortex candidates in this region. */
  vortexCount: number;
  /** Count of candidates with topologicalCharge > 0. */
  positiveChargeCount: number;
  /** Count of candidates with topologicalCharge < 0. */
  negativeChargeCount: number;
  /** Mean confidence of candidates in this region. */
  averageConfidence: number;
  /** Mean lifetimeTicks of candidates in this region. */
  averageLifetime: number;
  /** vortexCount / max(1, cellCount_in_region) */
  density: number;
}

// ── Top-level coupling observation ───────────────────────────────────────────

/**
 * Top-level observer-side state for the Curvature × Vortex Coupling
 * observation (N3).
 *
 * This is derived from TorusGeometry (N1) and VortexObservationState (N2).
 * It does NOT feed back into runtime dynamics.
 * It is NOT connected to weak plasticity (that is N5).
 * It does NOT represent consciousness, emotion, or meaning.
 */
export interface CurvatureVortexCouplingState {
  /** Unix-style timestamp of this observation. */
  timestamp: number;

  // ── Totals ──────────────────────────────────────────────────────────────────

  /** Total number of vortex candidates observed. */
  totalVortexCount: number;
  /** Candidates with topologicalCharge > 0. */
  positiveChargeCount: number;
  /** Candidates with topologicalCharge < 0. */
  negativeChargeCount: number;

  // ── Topological charge check ────────────────────────────────────────────────

  /**
   * Signed sum of topologicalCharge across all candidates.
   *
   * On a torus (Euler characteristic = 0) the signed sum of topological
   * defects is expected to balance near 0 in idealized settings.  Deviations
   * arise from discretisation, threshold artefacts, and boundary sampling.
   * This is an observational check — NOT a consciousness or meaning indicator.
   */
  signedTotalCharge: number;
  /** Expected signed total charge on a torus: always 0. */
  expectedSignedCharge: 0;
  /** |signedTotalCharge − expectedSignedCharge| */
  chargeDeviation: number;

  // ── Curvature-stratified vortex densities ────────────────────────────────────

  /**
   * Per-curvature-band vortex statistics.
   * Five bands: negativeHigh, negativeLow, nearZero, positiveLow, positiveHigh.
   */
  vortexDensityByCurvature: CurvatureBandVortexStats[];

  // ── Region-based vortex statistics ──────────────────────────────────────────

  /** Vortex statistics broken down by geometric torus region. */
  vortexStatsByRegion: CurvatureRegionVortexStats[];

  // ── Correlation / coupling strength ─────────────────────────────────────────

  /**
   * Pearson-style correlation between Gaussian curvature at a vortex site
   * and vortex candidate confidence.  Range [−1, 1].
   *
   * Correlation ≠ causation.  A non-zero value does NOT mean curvature
   * "produces" vortices or consciousness.
   */
  curvatureVortexCorrelation: number;

  /**
   * Proxy measure of how unevenly vortex candidates are distributed across
   * curvature bands relative to region count.  Range [0, 1].
   *
   * 0 = uniform distribution (no curvature bias visible).
   * 1 = all vortices concentrated in a single curvature band.
   */
  curvatureBiasStrength: number;

  // ── Lifetime statistics ──────────────────────────────────────────────────────

  /** Mean lifetimeTicks across all vortex candidates. */
  averageVortexLifetime: number;

  // ── Vortex pair observation ──────────────────────────────────────────────────

  /** Number of observed ±-charge vortex pairs. */
  vortexPairCount: number;
  /** Mean estimated lifetime of observed vortex pairs. */
  averageVortexPairLifetime: number;

  // ── Flat vs curved comparison ────────────────────────────────────────────────

  /**
   * True when both flat and curved coupling observations are available for
   * side-by-side comparison.  Full long-run comparison is deferred to N7.
   */
  flatVsCurvedComparisonAvailable: boolean;

  // ── Quality / integrity ──────────────────────────────────────────────────────

  /** Overall confidence of this coupling observation [0, 1]. */
  observationConfidence: number;
  /** Count of NaN / Infinity values encountered during derivation. */
  nanOrInfinityCount: number;
}
