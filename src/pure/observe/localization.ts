/**
 * PUT-IN: a list of VortexCandidate (from detectVortexCandidates), the
 *   TorusGeometry, and maxFraction
 * EMERGED: whether the candidates count as "localized" per docs/vessel/
 *   K7-natural-emergence-preregistration.md's operationalization of
 *   Aeterna-Genesis/docs/EMERGENCE_LEVELS.md's L2 "localized_components
 *   > 0" ingredient
 * claim-tier: C2 (implemented exactly per the frozen pre-registration;
 *   unit-validated with hand-constructed candidate lists in
 *   src/tests/pure/localization.test.ts)
 * floors (誠実な床): this is a deliberately simple, non-adaptive proxy
 *   (candidate count as a fraction of total plaquettes) chosen BEFORE
 *   any run existed, not a general-purpose connected-component analysis
 *   - a field with many SEPARATE, spatially spread-out single-plaquette
 *   defects covering a large fraction of the grid would fail this check
 *   even though each defect is individually "localized" in the everyday
 *   sense. It answers the specific, narrower, pre-registered question
 *   "is winding confined to a minority of the grid, or does it fill
 *   most of it (turbulent-looking)?", not "how many distinct clusters
 *   are there?".
 */

import type { VortexCandidate } from './vortexCandidates.ts';
import type { TorusGeometry } from '../geometry/torus.ts';

export interface LocalizationCheck {
  candidateCount: number;
  totalPlaquettes: number;
  fraction: number;
  localized: boolean;
}

export function checkLocalization(candidates: readonly VortexCandidate[], geometry: TorusGeometry, maxFraction: number): LocalizationCheck {
  const totalPlaquettes = geometry.N * geometry.N;
  const candidateCount = candidates.length;
  const fraction = candidateCount / totalPlaquettes;
  return {
    candidateCount,
    totalPlaquettes,
    fraction,
    localized: candidateCount > 0 && fraction < maxFraction,
  };
}
