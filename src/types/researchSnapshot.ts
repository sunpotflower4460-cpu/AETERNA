export interface ResearchSnapshot {
    tick: number;
    timestamp: number;
    runtimeMode: {
        metricMode: string;
        fieldRuntimeMode: string;
        membraneMode: string;
        weakPlasticityMode: string;
        externalConstantsMode: string;
        safetyMode: string;
    };
    field: {
        flowContinuity?: number;
        energyThroughput?: number;
        phaseCoherence?: number;
        maxAmplitude?: number;
        averageAmplitude?: number;
    };
    vortex: {
        candidateCount?: number;
        positiveChargeCount?: number;
        negativeChargeCount?: number;
        signedTotalCharge?: number;
        averageConfidence?: number;
    };
    geometry: {
        curvatureAsymmetry?: number;
        curvatureVortexCorrelation?: number;
        curvatureBiasStrength?: number;
    };
    membrane: {
        averageTwoSidedness?: number;
        actuationReturnOverlap?: number;
        membraneIntegrity?: number;
    };
    plasticity: {
        totalAccumulation?: number;
        affectedRegionCount?: number;
        averageResistanceScale?: number;
        saturationRisk?: number;
    };
    ratios: {
        averageMatchStrength?: number;
        emergentResonanceProxy?: number;
        strongestReferenceMatchLabel?: string;
    };
    diagnostics: {
        semanticLeakCount: number;
        nanOrInfinityCount: number;
        clampEventCount?: number;
        warnings?: string[];
    };
}
