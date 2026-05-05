import type { ResearchRunMetadata } from '../types/researchRun.ts';

export interface PreparedResearchRunConfig {
    runId: string;
    title: string;
    seed: number;
    scenarioId: string;
    ticks: number;
    sampleEveryTicks: number;
    runtimeConfig: unknown;
    presetId?: string;
    safetyMode: ResearchRunMetadata['safetyMode'];
    externalConstantsMode: ResearchRunMetadata['externalConstantsMode'];
}

export function createRunConfigFromMetadata(metadata: ResearchRunMetadata): PreparedResearchRunConfig {
    return {
        runId: metadata.id,
        title: metadata.title,
        seed: metadata.seed,
        scenarioId: metadata.scenarioId,
        ticks: metadata.ticks,
        sampleEveryTicks: metadata.sampleEveryTicks,
        runtimeConfig: metadata.runtimeConfig,
        presetId: metadata.presetId,
        safetyMode: metadata.safetyMode,
        externalConstantsMode: metadata.externalConstantsMode,
    };
}
