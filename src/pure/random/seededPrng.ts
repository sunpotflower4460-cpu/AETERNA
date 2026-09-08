/**
 * PUT-IN: a seed (integer)
 * EMERGED: a deterministic pseudo-random float sequence in [0, 1)
 * claim-tier: C2 (unit-validated - see src/tests/pure/seededPrngDeterminism.test.ts)
 * floors (誠実な床): not a cryptographic RNG. Not analyzed for spectral quality
 *   beyond same-seed reproducibility and basic non-degeneracy.
 *
 * Re-exports the repository's one shared seeded PRNG
 * (src/utils/seededRandom.ts) rather than defining a second
 * implementation inside src/pure/. This is not an organism/legacy
 * dependency - src/utils/seededRandom.ts is a generic, state-free
 * math utility with no organism semantics - so re-using it does not
 * violate docs/pure-physics-implementation-plan.md's "pure core から
 * legacy / organism 層へ import する" prohibition, which is about
 * organism state and tuning, not shared math primitives.
 *
 * pure core は Math.random / Date.now を一切使わない。初期条件は
 * すべてこの createSeededRandom 経由で生成する。
 */
export { createSeededRandom } from '../../utils/seededRandom.ts';
