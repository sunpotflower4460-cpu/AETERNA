import type { OverviewState } from '../types/overviewState.ts';
import type { ComplexFieldState } from '../types/complexField.ts';
import type { VortexObservationState } from '../types/vortexCandidate.ts';
import type { CurvatureVortexCouplingState } from '../types/curvatureVortexCoupling.ts';
import type { MembraneObservationState } from '../types/membraneObservation.ts';
import type { WeakPlasticityObservationState } from '../types/weakPlasticityObservation.ts';
import type { ObservedRatiosState } from '../types/observedRatios.ts';
import type { NaturalDiagnosticState } from '../types/naturalDiagnosticState.ts';
import type { ResearchSnapshot } from '../types/researchSnapshot.ts';

export interface CreateResearchSnapshotParams {
    tick: number;
    timestamp: number;
    runtimeConfig: unknown;
    overview?: OverviewState | unknown;
    complexField?: ComplexFieldState | unknown;
    vortexObservation?: VortexObservationState | unknown;
    curvatureVortexCoupling?: CurvatureVortexCouplingState | unknown;
    membraneObservation?: MembraneObservationState | unknown;
    weakPlasticityObservation?: WeakPlasticityObservationState | unknown;
    observedRatios?: ObservedRatiosState | unknown;
    diagnostics?: NaturalDiagnosticState | unknown;
}

type MetricMap = Record<string, number | string>;

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function safeNumber(value: unknown, nanCounter: { count: number }): number | undefined {
    if (typeof value !== 'number') return undefined;
    if (!Number.isFinite(value)) {
        nanCounter.count += 1;
        return undefined;
    }
    return value;
}

function safeString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function getRuntimeModeValue(runtimeConfig: unknown, key: string, fallback = 'unknown'): string {
    const record = asRecord(runtimeConfig);
    return safeString(record?.[key]) ?? fallback;
}

function getOverviewMetricMap(overview: unknown, nanCounter: { count: number }): MetricMap {
    const record = asRecord(overview);
    const metrics = Array.isArray(record?.metrics) ? record.metrics : [];
    return metrics.reduce<MetricMap>((accumulator, metric) => {
        const metricRecord = asRecord(metric);
        const id = safeString(metricRecord?.id);
        if (!id) return accumulator;
        const value = metricRecord?.value;
        if (typeof value === 'number') {
            const safeValue = safeNumber(value, nanCounter);
            if (safeValue !== undefined) {
                accumulator[id] = safeValue;
            }
            return accumulator;
        }
        const safeValue = safeString(value);
        if (safeValue !== undefined) {
            accumulator[id] = safeValue;
        }
        return accumulator;
    }, {});
}

function collectWarnings(diagnostics: unknown): string[] | undefined {
    const record = asRecord(diagnostics);
    if (!record) return undefined;
    const warningKeys = [
        'geometryWarnings',
        'complexFieldWarnings',
        'vortexWarnings',
        'membraneWarnings',
        'plasticityWarnings',
        'observedRatioWarnings',
        'comparisonWarnings',
        'safetyWarnings',
    ] as const;
    const warnings = warningKeys.flatMap((key) => {
        const value = record[key];
        return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
    });
    return warnings.length > 0 ? warnings : undefined;
}

export function createResearchSnapshot(params: CreateResearchSnapshotParams): ResearchSnapshot {
    const nanCounter = { count: 0 };
    const overviewMetrics = getOverviewMetricMap(params.overview, nanCounter);
    const diagnosticsRecord = asRecord(params.diagnostics);
    const complexFieldRecord = asRecord(params.complexField);
    const vortexRecord = asRecord(params.vortexObservation);
    const geometryRecord = asRecord(params.curvatureVortexCoupling);
    const membraneRecord = asRecord(params.membraneObservation);
    const plasticityRecord = asRecord(params.weakPlasticityObservation);
    const ratioRecord = asRecord(params.observedRatios);
    const strongestMatch = asRecord(ratioRecord?.strongestMatch);

    const semanticLeakCount = safeNumber(diagnosticsRecord?.semanticLeakCount, nanCounter)
        ?? safeNumber(diagnosticsRecord?.totalSemanticLeakCount, nanCounter)
        ?? 0;
    const diagnosticsNanCount = safeNumber(diagnosticsRecord?.nanOrInfinityCount, nanCounter)
        ?? safeNumber(diagnosticsRecord?.totalNanOrInfinityCount, nanCounter)
        ?? 0;

    return {
        tick: params.tick,
        timestamp: params.timestamp,
        runtimeMode: {
            metricMode: getRuntimeModeValue(params.runtimeConfig, 'metricMode'),
            fieldRuntimeMode: getRuntimeModeValue(params.runtimeConfig, 'fieldRuntimeMode'),
            membraneMode: getRuntimeModeValue(params.runtimeConfig, 'membraneMode'),
            weakPlasticityMode: getRuntimeModeValue(params.runtimeConfig, 'weakPlasticityMode'),
            externalConstantsMode: getRuntimeModeValue(params.runtimeConfig, 'externalConstantsMode'),
            safetyMode: getRuntimeModeValue(params.runtimeConfig, 'safetyMode'),
        },
        field: {
            flowContinuity: typeof overviewMetrics.flowContinuity === 'number' ? overviewMetrics.flowContinuity : undefined,
            energyThroughput: typeof overviewMetrics.energyThroughput === 'number' ? overviewMetrics.energyThroughput : undefined,
            phaseCoherence: safeNumber(complexFieldRecord?.phaseCoherence, nanCounter),
            maxAmplitude: safeNumber(complexFieldRecord?.maxAmplitude, nanCounter),
            averageAmplitude: safeNumber(complexFieldRecord?.averageAmplitude, nanCounter),
        },
        vortex: {
            candidateCount: safeNumber(vortexRecord?.candidateCount, nanCounter)
                ?? safeNumber(geometryRecord?.totalVortexCount, nanCounter),
            positiveChargeCount: safeNumber(vortexRecord?.positiveChargeCount, nanCounter)
                ?? safeNumber(geometryRecord?.positiveChargeCount, nanCounter),
            negativeChargeCount: safeNumber(vortexRecord?.negativeChargeCount, nanCounter)
                ?? safeNumber(geometryRecord?.negativeChargeCount, nanCounter),
            signedTotalCharge: safeNumber(vortexRecord?.totalTopologicalCharge, nanCounter)
                ?? safeNumber(geometryRecord?.signedTotalCharge, nanCounter),
            averageConfidence: safeNumber(vortexRecord?.averageConfidence, nanCounter)
                ?? safeNumber(geometryRecord?.observationConfidence, nanCounter),
        },
        geometry: {
            curvatureAsymmetry: safeNumber(geometryRecord?.chargeDeviation, nanCounter),
            curvatureVortexCorrelation: safeNumber(geometryRecord?.curvatureVortexCorrelation, nanCounter),
            curvatureBiasStrength: safeNumber(geometryRecord?.curvatureBiasStrength, nanCounter),
        },
        membrane: {
            averageTwoSidedness: safeNumber(membraneRecord?.averageTwoSidedness, nanCounter),
            actuationReturnOverlap: safeNumber(membraneRecord?.actuationReturnOverlap, nanCounter),
            membraneIntegrity: safeNumber(membraneRecord?.membraneIntegrity, nanCounter),
        },
        plasticity: {
            totalAccumulation: safeNumber(plasticityRecord?.totalAccumulation, nanCounter),
            affectedRegionCount: safeNumber(plasticityRecord?.affectedRegionCount, nanCounter),
            averageResistanceScale: safeNumber(plasticityRecord?.averageResistanceScale, nanCounter),
            saturationRisk: safeNumber(plasticityRecord?.plasticitySaturationRisk, nanCounter)
                ?? (typeof overviewMetrics.saturationRisk === 'number' ? overviewMetrics.saturationRisk : undefined),
        },
        ratios: {
            averageMatchStrength: safeNumber(ratioRecord?.averageMatchStrength, nanCounter),
            emergentResonanceProxy: safeNumber(ratioRecord?.emergentResonanceProxy, nanCounter),
            strongestReferenceMatchLabel: safeString(strongestMatch?.referenceRatioId) ?? safeString(strongestMatch?.observedRatioId),
        },
        diagnostics: {
            semanticLeakCount,
            nanOrInfinityCount: diagnosticsNanCount + nanCounter.count,
            clampEventCount: safeNumber(diagnosticsRecord?.clampEventCount, nanCounter),
            warnings: collectWarnings(params.diagnostics),
        },
    };
}
