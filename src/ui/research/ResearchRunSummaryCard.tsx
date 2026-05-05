import type { ResearchRunResult } from '../../types/researchRunResult.ts';

function fmt(value: number | undefined, decimals = 3): string {
    return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(decimals) : 'N/A';
}

export function renderResearchRunSummaryCardText(result: ResearchRunResult): string[] {
    return [
        `Run: ${result.metadata.title}`,
        `Run ID: ${result.metadata.id}`,
        `Seed / Scenario / Ticks: ${result.metadata.seed} / ${result.metadata.scenarioId} / ${result.metadata.ticks}`,
        `Sample every: ${result.metadata.sampleEveryTicks}`,
        `Snapshots: ${result.summary.snapshotCount}`,
        `Final tick: ${result.summary.finalTick}`,
        `Flow avg: ${fmt(result.summary.averageFlowContinuity)}`,
        `Phase avg: ${fmt(result.summary.averagePhaseCoherence)}`,
        `Vortex avg: ${fmt(result.summary.averageVortexCount, 1)}`,
        `Ratio avg: ${fmt(result.summary.averageObservedRatioMatchStrength)}`,
        `Max plasticity: ${fmt(result.summary.maxPlasticityAccumulation)}`,
        `NaN / Infinity: ${result.summary.nanOrInfinityCount}`,
    ];
}

export function renderResearchRunSummaryOneLiner(result: ResearchRunResult): string {
    return [
        `seed=${result.metadata.seed}`,
        `scenario=${result.metadata.scenarioId}`,
        `ticks=${result.metadata.ticks}`,
        `snapshots=${result.summary.snapshotCount}`,
        `nan=${result.summary.nanOrInfinityCount}`,
    ].join(' ');
}
