import type { ResearchRunMetadata } from './researchRun.ts';
import type { ResearchSnapshot } from './researchSnapshot.ts';

export interface ResearchRunResult {
    metadata: ResearchRunMetadata;
    snapshots: ResearchSnapshot[];
    summary: {
        finalTick: number;
        snapshotCount: number;
        averageFlowContinuity?: number;
        averagePhaseCoherence?: number;
        averageVortexCount?: number;
        averageClosureStability?: number;
        maxPlasticityAccumulation?: number;
        maxSaturationRisk?: number;
        averageObservedRatioMatchStrength?: number;
        maxEmergentResonanceProxy?: number;
        semanticLeakCount: number;
        nanOrInfinityCount: number;
    };
    interpretationNotes: string[];
    limitations: string[];
    generatedAt: number;
}
