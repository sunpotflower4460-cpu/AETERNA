import type { ResearchRunMetadata } from '../../types/researchRun.ts';
import { createRunConfigFromMetadata } from '../../research/createRunConfigFromMetadata.ts';
import { hashResearchConfig } from '../../research/hashResearchConfig.ts';

export interface ReproducibilityPanelItem {
    label: string;
    value: string;
}

export interface ReproducibilityPanelState {
    title: string;
    items: ReproducibilityPanelItem[];
    configHash: string;
    rerunStatus: string;
    preparedRunConfig: ReturnType<typeof createRunConfigFromMetadata>;
}

export function createReproducibilityPanelState(metadata: ResearchRunMetadata): ReproducibilityPanelState {
    const runtimeConfig = metadata.runtimeConfig && typeof metadata.runtimeConfig === 'object'
        ? metadata.runtimeConfig as Record<string, unknown>
        : {};
    const configHash = hashResearchConfig(metadata.runtimeConfig);

    return {
        title: 'Reproducibility',
        items: [
            { label: 'Seed', value: String(metadata.seed) },
            { label: 'Scenario', value: metadata.scenarioId },
            { label: 'Ticks', value: String(metadata.ticks) },
            { label: 'Sample every', value: String(metadata.sampleEveryTicks) },
            { label: 'Runtime preset', value: metadata.presetId ?? 'custom' },
            { label: 'Safety mode', value: metadata.safetyMode },
            { label: 'Metric mode', value: String(runtimeConfig.metricMode ?? 'unknown') },
            { label: 'Field mode', value: String(runtimeConfig.fieldRuntimeMode ?? 'unknown') },
            { label: 'Membrane mode', value: String(runtimeConfig.membraneMode ?? 'unknown') },
            { label: 'Plasticity mode', value: String(runtimeConfig.weakPlasticityMode ?? 'unknown') },
            { label: 'External constants mode', value: metadata.externalConstantsMode },
            { label: 'Config hash', value: configHash },
        ],
        configHash,
        rerunStatus: 'Re-run config prepared',
        preparedRunConfig: createRunConfigFromMetadata(metadata),
    };
}
