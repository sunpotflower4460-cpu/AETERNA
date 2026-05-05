export interface ResearchRunMetadata {
    id: string;
    title: string;
    createdAt: number;
    appVersion?: string;
    gitCommitSha?: string;
    seed: number;
    scenarioId: string;
    ticks: number;
    sampleEveryTicks: number;
    runtimeConfig: unknown;
    presetId?: string;
    safetyMode: 'safe' | 'research' | 'experimental';
    externalConstantsMode: 'legacy' | 'neutral';
    notes?: string[];
    semanticLeakCount: number;
    nanOrInfinityCount: number;
}
