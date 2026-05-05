import type { ResearchRunMetadata } from '../types/researchRun.ts';
import type { ResearchSnapshot } from '../types/researchSnapshot.ts';
import type { ResearchRunResult } from '../types/researchRunResult.ts';
import {
    DEFAULT_RESEARCH_LIMITATIONS,
    sanitizeResearchTextLines,
} from './researchGuardrails.ts';

export interface BuildResearchRunResultParams {
    metadata: ResearchRunMetadata;
    snapshots: ResearchSnapshot[];
    interpretationNotes?: string[];
    limitations?: string[];
}

function averageOf(values: Array<number | undefined>): number | undefined {
    const finiteValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (finiteValues.length === 0) return undefined;
    return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
}

function maxOf(values: Array<number | undefined>): number | undefined {
    const finiteValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (finiteValues.length === 0) return undefined;
    return Math.max(...finiteValues);
}

export function buildResearchRunResult(params: BuildResearchRunResultParams): ResearchRunResult {
    const snapshots = [...params.snapshots].sort((left, right) => left.tick - right.tick);
    const finalSnapshot = snapshots[snapshots.length - 1];

    return {
        metadata: params.metadata,
        snapshots,
        summary: {
            finalTick: Math.max(params.metadata.ticks, finalSnapshot?.tick ?? 0),
            snapshotCount: snapshots.length,
            averageFlowContinuity: averageOf(snapshots.map((snapshot) => snapshot.field.flowContinuity)),
            averagePhaseCoherence: averageOf(snapshots.map((snapshot) => snapshot.field.phaseCoherence)),
            averageVortexCount: averageOf(snapshots.map((snapshot) => snapshot.vortex.candidateCount)),
            averageClosureStability: undefined,
            maxPlasticityAccumulation: maxOf(snapshots.map((snapshot) => snapshot.plasticity.totalAccumulation)),
            maxSaturationRisk: maxOf(snapshots.map((snapshot) => snapshot.plasticity.saturationRisk)),
            averageObservedRatioMatchStrength: averageOf(snapshots.map((snapshot) => snapshot.ratios.averageMatchStrength)),
            maxEmergentResonanceProxy: maxOf(snapshots.map((snapshot) => snapshot.ratios.emergentResonanceProxy)),
            semanticLeakCount: snapshots.reduce((sum, snapshot) => sum + snapshot.diagnostics.semanticLeakCount, 0),
            nanOrInfinityCount: snapshots.reduce((sum, snapshot) => sum + snapshot.diagnostics.nanOrInfinityCount, 0),
        },
        interpretationNotes: sanitizeResearchTextLines(params.interpretationNotes),
        limitations: sanitizeResearchTextLines([
            ...DEFAULT_RESEARCH_LIMITATIONS,
            ...(params.limitations ?? []),
        ]),
        generatedAt: Date.now(),
    };
}
