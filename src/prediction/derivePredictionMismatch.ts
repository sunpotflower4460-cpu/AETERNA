import type { PerturbationEvent } from '../types/perturbationEvent.ts';
import type { PredictionMismatchState } from '../types/predictionMismatchState.ts';

interface MismatchInputState {
    overload: number;
    boundaryIntegrity: number;
    restorationBias: number;
    coherenceMemory: number;
    stability: number;
}

function clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
}

export function derivePredictionMismatch(
    event: PerturbationEvent,
    state: MismatchInputState,
    baselinePredictionError: number,
): PredictionMismatchState {
    const { overload, boundaryIntegrity, restorationBias, coherenceMemory, stability } = state;

    const mismatchLevel = clamp(
        baselinePredictionError
        * (1 + event.novelty * 0.5)
        * (1 + overload * 0.3)
        * (1 - event.expectedness * 0.25)
        + event.novelty * overload * 0.2,
    );

    const surprisePressure = clamp(
        event.novelty * (1 + overload * 0.4) * (1 - coherenceMemory * 0.3),
    );

    const boundaryStress = clamp(
        (event.boundaryContact ?? 0) * (1 + (1 - boundaryIntegrity) * 0.5),
    );

    const recoveryPull = clamp(
        restorationBias * (1 - overload * 0.5) * stability,
    );

    const continuityDisruption = clamp(mismatchLevel * (1 - stability * 0.4));

    const localInstability = clamp(event.locality * (1 - coherenceMemory * 0.3));

    return {
        timestamp: Date.now(),
        mismatchLevel,
        surprisePressure,
        boundaryStress,
        recoveryPull,
        continuityDisruption,
        localInstability,
    };
}
