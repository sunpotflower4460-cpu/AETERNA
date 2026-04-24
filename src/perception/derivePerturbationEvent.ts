import type { PerturbationEvent } from '../types/perturbationEvent.ts';

interface PerturbationInputState {
    overload: number;
    boundaryIntegrity: number;
    openness: number;
    familiarity: number;
    repetitionCount: number;
    baselineLevel: number;
}

function clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
}

export function derivePerturbationEvent(
    source: PerturbationEvent['source'],
    rawMagnitude: number,
    state: PerturbationInputState,
): PerturbationEvent {
    const { overload, boundaryIntegrity, openness, familiarity, repetitionCount } = state;

    const novelty = clamp(rawMagnitude * (1 - familiarity * 0.4) * (1 + overload * 0.2));
    const expectedness = clamp(familiarity * 0.7 + (1 - overload) * 0.2);
    const locality = clamp(rawMagnitude * (1 - openness * 0.3));
    const boundaryContact = clamp(rawMagnitude * (1 - boundaryIntegrity * 0.5));

    return {
        timestamp: Date.now(),
        source,
        magnitude: clamp(rawMagnitude),
        novelty,
        expectedness,
        locality,
        repetitionHint: repetitionCount,
        boundaryContact,
    };
}
