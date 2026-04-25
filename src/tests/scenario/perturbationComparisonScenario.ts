import { runScenario } from '../../experiments/runScenario.ts';
import { derivePerturbationEvent } from '../../perception/derivePerturbationEvent.ts';
import { derivePredictionMismatch } from '../../prediction/derivePredictionMismatch.ts';
import type { PerturbationEvent } from '../../types/perturbationEvent.ts';
import type { PredictionMismatchState } from '../../types/predictionMismatchState.ts';

export interface PerturbationComparisonResult {
    scenarioName: string;
    touchFrame: number;
    preTouchMeanActivity: number;
    postTouchPeakActivity: number;
    perturbationEvent: PerturbationEvent;
    mismatchState: PredictionMismatchState;
}

export interface PerturbationComparisonSummary {
    scenarios: PerturbationComparisonResult[];
    stableMismatchLevel: number;
    overloadMismatchLevel: number;
    familiarMismatchLevel: number;
    stateEffectVisible: boolean;
}

interface ScenarioDef {
    name: string;
    totalFrames: number;
    touches: Array<{ frame: number; x: number; y: number; pressure: number; duration: number }>;
    comparisonTouchFrame: number;
}

const SCENARIO_DEFS: ScenarioDef[] = [
    {
        name: 'stable-state-single-touch',
        totalFrames: 500,
        touches: [{ frame: 300, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 }],
        comparisonTouchFrame: 300,
    },
    {
        name: 'overload-state-single-touch',
        totalFrames: 300,
        touches: [
            { frame: 50, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 70, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 90, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 110, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 130, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 250, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        ],
        comparisonTouchFrame: 250,
    },
    {
        name: 'familiar-repeated-touch',
        totalFrames: 600,
        touches: [
            { frame: 100, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
            { frame: 150, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
            { frame: 200, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
            { frame: 250, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
            { frame: 300, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
            { frame: 450, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        ],
        comparisonTouchFrame: 450,
    },
    {
        name: 'no-input-then-perturbation',
        totalFrames: 400,
        touches: [{ frame: 350, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 }],
        comparisonTouchFrame: 350,
    },
    {
        name: 'perturbation-after-recovery',
        totalFrames: 600,
        touches: [
            { frame: 100, x: 0.5, y: 0.5, pressure: 1.5, duration: 50 },
            { frame: 450, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        ],
        comparisonTouchFrame: 450,
    },
    {
        name: 'perturbation-weak-boundary',
        totalFrames: 400,
        touches: [
            { frame: 50, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 55, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 60, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 65, x: 0.5, y: 0.5, pressure: 1.5, duration: 1 },
            { frame: 200, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        ],
        comparisonTouchFrame: 200,
    },
];

export async function runPerturbationComparisonScenarios(): Promise<PerturbationComparisonSummary> {
    const results: PerturbationComparisonResult[] = [];

    for (const def of SCENARIO_DEFS) {
        const result = await runScenario({
            name: def.name,
            totalFrames: def.totalFrames,
            touchEvents: def.touches,
            metricsInterval: 10,
        });

        const metrics = result.metrics;
        const touchFrame = def.comparisonTouchFrame;

        // Find snapshot with state just BEFORE the comparison touch (pre-touch organism state).
        // Using pre-touch state captures state-dependent differences: overload/familiarity
        // that existed before the touch arrived, which is what determines mismatch quality.
        const preTouchWindow = metrics.filter(m => m.frame >= touchFrame - 30 && m.frame < touchFrame);
        const closest = preTouchWindow.length > 0
            ? preTouchWindow.reduce((best, m) =>
                Math.abs(m.frame - touchFrame) < Math.abs(best.frame - touchFrame) ? m : best,
            )
            : metrics.reduce((best, m) =>
                Math.abs(m.frame - touchFrame) < Math.abs(best.frame - touchFrame) ? m : best,
                metrics[0],
            );

        // Pre-touch mean activity (50 frames before)
        const preTouchMetrics = metrics.filter(
            m => m.frame >= touchFrame - 50 && m.frame < touchFrame,
        );
        const preTouchMeanActivity =
            preTouchMetrics.length > 0
                ? preTouchMetrics.reduce((sum, m) => sum + (m.meanActivity ?? 0), 0) / preTouchMetrics.length
                : 0;

        // Post-touch peak activity (50 frames after)
        const postTouchMetrics = metrics.filter(
            m => m.frame > touchFrame && m.frame <= touchFrame + 50,
        );
        const postTouchPeakActivity =
            postTouchMetrics.length > 0
                ? Math.max(...postTouchMetrics.map(m => m.meanActivity ?? 0))
                : 0;

        // Derive PerturbationEvent
        const rawMagnitude = (closest.meanRawTouch ?? 0) || 0.5;
        const familiarity = closest.meanTouchHabituation ?? 0;
        const perturbationEvent = derivePerturbationEvent('touch', rawMagnitude, {
            overload: closest.overload ?? 0,
            boundaryIntegrity: closest.boundaryIntegrity ?? 0.8,
            openness: closest.felt_openness ?? 0.5,
            familiarity,
            repetitionCount: familiarity * 10,
            baselineLevel: closest.baselineLevel ?? 0,
        });

        // Derive PredictionMismatchState
        // Use rawMagnitude as a floor for baselinePredictionError so that active touch always
        // produces detectable mismatch even when the prediction error hasn't yet propagated.
        const baselinePredictionError = Math.max(closest.meanPredictionError ?? 0, rawMagnitude * 0.2);
        const mismatchState = derivePredictionMismatch(
            perturbationEvent,
            {
                overload: closest.overload ?? 0,
                boundaryIntegrity: closest.boundaryIntegrity ?? 0.8,
                restorationBias: closest.restorationBias ?? 0.5,
                coherenceMemory: closest.coherenceMemory ?? 0.5,
                stability: closest.stability ?? 0.5,
            },
            baselinePredictionError,
        );

        results.push({
            scenarioName: def.name,
            touchFrame,
            preTouchMeanActivity,
            postTouchPeakActivity,
            perturbationEvent,
            mismatchState,
        });
    }

    const stableResult = results.find(r => r.scenarioName === 'stable-state-single-touch')!;
    const overloadResult = results.find(r => r.scenarioName === 'overload-state-single-touch')!;
    const familiarResult = results.find(r => r.scenarioName === 'familiar-repeated-touch')!;

    const stableMismatchLevel = stableResult.mismatchState.mismatchLevel;
    const overloadMismatchLevel = overloadResult.mismatchState.mismatchLevel;
    const familiarMismatchLevel = familiarResult.mismatchState.mismatchLevel;

    return {
        scenarios: results,
        stableMismatchLevel,
        overloadMismatchLevel,
        familiarMismatchLevel,
        stateEffectVisible: overloadMismatchLevel > stableMismatchLevel * 1.05,
    };
}
