import { describe, expect, it } from 'vitest';
import { runTraceReplayScenarioSuite } from '../scenario/traceReplayScenario.ts';

describe('Phase 4 Trace / Replay purification', () => {
  it('keeps replay as weak trace reactivation with quiet gating and suppression', async () => {
    const outcomes = await runTraceReplayScenarioSuite();

    const byName = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.result.summary]));

    const quietSingle = byName['quiet-replay-after-single-perturbation'];
    const repeatedQuiet = byName['repeated-perturbation-then-quiet'];
    const recoveryLinked = byName['recovery-linked-replay'];
    const highInput = byName['high-input-replay-suppression'];
    const weakBoundary = byName['weak-boundary-residue-persistence'];
    const sameOverTime = byName['same-perturbation-repeated-over-time'];

    expect(quietSingle.avgTraceStrength ?? 0).toBeGreaterThan(0.05);
    expect(quietSingle.totalReplayCount ?? 0).toBeGreaterThan(0);

    expect(repeatedQuiet.avgRecurrenceWeight ?? 0)
      .toBeGreaterThan((quietSingle.avgRecurrenceWeight ?? 0) * 1.02);

    expect(recoveryLinked.avgRecoveryLinkedResidue ?? 0)
      .toBeGreaterThan((quietSingle.avgRecoveryLinkedResidue ?? 0) * 1.02);
    expect(recoveryLinked.avgReplayContributionToStabilization ?? 0).toBeGreaterThan(0);

    expect(highInput.avgReplayReadiness ?? 0).toBeLessThan(quietSingle.avgReplayReadiness ?? 1);
    expect(highInput.avgReplayPressure ?? 0).toBeLessThanOrEqual((quietSingle.avgReplayPressure ?? 0) + 0.15);
    expect(highInput.totalReplayCount ?? 0).toBeLessThanOrEqual(quietSingle.totalReplayCount ?? 0);

    expect(weakBoundary.avgSalienceResidue ?? 0)
      .toBeGreaterThan((quietSingle.avgSalienceResidue ?? 0) * 0.95);

    expect(sameOverTime.avgWeakConsolidationDelta ?? 0)
      .toBeGreaterThan((quietSingle.avgWeakConsolidationDelta ?? 0) * 0.9);
    expect(sameOverTime.avgRecentPatternWeight ?? 0)
      .toBeGreaterThan((quietSingle.avgRecentPatternWeight ?? 0) * 1.02);
  }, 120000);
});
