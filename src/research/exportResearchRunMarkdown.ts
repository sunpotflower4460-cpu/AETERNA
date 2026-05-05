import type { ResearchRunResult } from '../types/researchRunResult.ts';
import { hashResearchConfig } from './hashResearchConfig.ts';
import {
    RESEARCH_INTERPRETATION_GUARDRAILS_EN,
    RESEARCH_INTERPRETATION_GUARDRAILS_JA,
    sanitizeResearchTextLines,
} from './researchGuardrails.ts';

function fmtNumber(value: number | undefined, decimals = 3): string {
    return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(decimals) : 'N/A';
}

function renderKeyValueTable(rows: Array<[string, string]>): string {
    return [
        '| Field | Value |',
        '|---|---|',
        ...rows.map(([label, value]) => `| ${label} | ${value} |`),
    ].join('\n');
}

function summarizeRuntimeConfig(runtimeConfig: unknown): Array<[string, string]> {
    const record = runtimeConfig && typeof runtimeConfig === 'object'
        ? runtimeConfig as Record<string, unknown>
        : {};
    return Object.entries(record)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => [
            key,
            typeof value === 'object'
                ? JSON.stringify(value) ?? 'null'
                : String(value),
        ]);
}

function summarizeSnapshots(result: ResearchRunResult): string {
    const selected = result.snapshots.filter((_, index, snapshots) => (
        index === 0 || index === snapshots.length - 1 || index === Math.floor(snapshots.length / 2)
    ));
    if (selected.length === 0) {
        return '_No lightweight snapshots recorded._';
    }

    return [
        '| Tick | Flow continuity | Phase coherence | Vortex count | Ratio match | NaN/Infinity |',
        '|---|---|---|---|---|---|',
        ...selected.map((snapshot) => (
            `| ${snapshot.tick} | ${fmtNumber(snapshot.field.flowContinuity)} | ${fmtNumber(snapshot.field.phaseCoherence)} | ${fmtNumber(snapshot.vortex.candidateCount, 1)} | ${fmtNumber(snapshot.ratios.averageMatchStrength)} | ${snapshot.diagnostics.nanOrInfinityCount} |`
        )),
    ].join('\n');
}

export function exportResearchRunMarkdown(result: ResearchRunResult): string {
    const runtimeConfigRows = summarizeRuntimeConfig(result.metadata.runtimeConfig);
    const configHash = hashResearchConfig(result.metadata.runtimeConfig);
    const interpretationNotes = sanitizeResearchTextLines(result.interpretationNotes);
    const limitations = sanitizeResearchTextLines(result.limitations);
    const diagnosticWarnings = result.snapshots.flatMap((snapshot) => snapshot.diagnostics.warnings ?? []);

    return [
        '# AETERNA-NATURAL Research Run',
        '',
        '## Metadata',
        '',
        renderKeyValueTable([
            ['Run ID', result.metadata.id],
            ['Created at', new Date(result.metadata.createdAt).toISOString()],
            ['Seed', String(result.metadata.seed)],
            ['Scenario', result.metadata.scenarioId],
            ['Ticks', String(result.metadata.ticks)],
            ['Sample every', String(result.metadata.sampleEveryTicks)],
            ['Safety mode', result.metadata.safetyMode],
            ['External constants mode', result.metadata.externalConstantsMode],
            ['Config hash', configHash],
        ]),
        '',
        '## Runtime Config',
        '',
        runtimeConfigRows.length > 0 ? renderKeyValueTable(runtimeConfigRows) : '_No runtime config fields recorded._',
        '',
        '## Summary Metrics',
        '',
        renderKeyValueTable([
            ['Final tick', String(result.summary.finalTick)],
            ['Snapshot count', String(result.summary.snapshotCount)],
            ['Average flow continuity', fmtNumber(result.summary.averageFlowContinuity)],
            ['Average phase coherence', fmtNumber(result.summary.averagePhaseCoherence)],
            ['Average vortex count', fmtNumber(result.summary.averageVortexCount, 1)],
            ['Max plasticity accumulation', fmtNumber(result.summary.maxPlasticityAccumulation)],
            ['Max saturation risk', fmtNumber(result.summary.maxSaturationRisk)],
            ['Average observed ratio match strength', fmtNumber(result.summary.averageObservedRatioMatchStrength)],
            ['Max emergent resonance proxy', fmtNumber(result.summary.maxEmergentResonanceProxy)],
        ]),
        '',
        '## Snapshot Overview',
        '',
        summarizeSnapshots(result),
        '',
        '## Interpretation Notes',
        '',
        ...(interpretationNotes.length > 0 ? interpretationNotes.map((note) => `- ${note}`) : ['- Observation-based notes were not added.']),
        '',
        '## Limitations',
        '',
        ...limitations.map((limitation) => `- ${limitation}`),
        '',
        '## Interpretation guardrails',
        '',
        ...RESEARCH_INTERPRETATION_GUARDRAILS_EN.map((line) => `- ${line}`),
        '',
        '## 解釈ガード',
        '',
        ...RESEARCH_INTERPRETATION_GUARDRAILS_JA.map((line) => `- ${line}`),
        '',
        '## Diagnostics',
        '',
        `- Semantic leak count: ${result.summary.semanticLeakCount}`,
        `- NaN / Infinity count: ${result.summary.nanOrInfinityCount}`,
        ...(diagnosticWarnings.length > 0
            ? [`- Warnings: ${sanitizeResearchTextLines(diagnosticWarnings).join(' / ')}`]
            : ['- Warnings: none recorded in lightweight snapshots.']),
    ].join('\n');
}
