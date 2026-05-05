import type { LongRunComparisonResult } from '../../types/longRunComparison.ts';
import type { ResearchRunResult } from '../../types/researchRunResult.ts';
import { exportResearchRunJson } from '../../research/exportResearchRunJson.ts';
import { exportResearchRunMarkdown } from '../../research/exportResearchRunMarkdown.ts';
import { exportLongRunComparisonJson, exportLongRunComparisonMarkdown } from '../../comparison/exportLongRunComparison.ts';
import { sanitizeResearchTextLines } from '../../research/researchGuardrails.ts';
import { createExportButtonModel, type ExportButtonModel } from './ExportButton.tsx';
import { renderResearchRunSummaryCardText, renderResearchRunSummaryOneLiner } from './ResearchRunSummaryCard.tsx';

export interface ResearchExportPanelState {
    title: string;
    scopeNote: string;
    warningLines: string[];
    buttons: ExportButtonModel[];
    mobileButtons: ExportButtonModel[];
    summaryLines: string[];
    copySummaryText: string;
    researchRunJson: string;
    researchRunMarkdown: string;
    comparisonJson: string | null;
    comparisonMarkdown: string | null;
}

function buildWarningLines(result: ResearchRunResult): string[] {
    const lines = [
        'Summary export only — raw field arrays are not included.',
    ];
    if (result.summary.semanticLeakCount > 0) {
        lines.push(`Semantic leak warnings: ${result.summary.semanticLeakCount}`);
    }
    if (result.summary.nanOrInfinityCount > 0) {
        lines.push(`NaN / Infinity warnings: ${result.summary.nanOrInfinityCount}`);
    }
    return lines;
}

export function createResearchExportPanelState(params: {
    result: ResearchRunResult;
    comparisonResult?: LongRunComparisonResult | null;
}): ResearchExportPanelState {
    const { result, comparisonResult = null } = params;
    const copySummaryText = sanitizeResearchTextLines([
        renderResearchRunSummaryOneLiner(result),
        ...result.interpretationNotes,
    ]).join('\n');

    return {
        title: 'Research Export',
        scopeNote: 'Exports use lightweight snapshots and summary metrics only.',
        warningLines: buildWarningLines(result),
        buttons: [
            createExportButtonModel({ id: 'json', label: 'Export JSON', compactLabel: 'Export', description: 'Machine-readable research run export.', format: 'json' }),
            createExportButtonModel({ id: 'markdown', label: 'Export Markdown', compactLabel: 'Export', description: 'Human-readable research log export.', format: 'markdown' }),
            createExportButtonModel({ id: 'copy', label: 'Copy Summary', compactLabel: 'Copy', description: 'Copy an observation-only summary.', format: 'copy' }),
            createExportButtonModel({ id: 'download', label: 'Download Research Run', compactLabel: 'Share text', description: 'Download lightweight research run export.', format: 'download' }),
        ],
        mobileButtons: [
            createExportButtonModel({ id: 'mobile-export', label: 'Export', compactLabel: 'Export', description: 'Quick export actions for compact screens.', format: 'download' }),
            createExportButtonModel({ id: 'mobile-copy', label: 'Copy', compactLabel: 'Copy', description: 'Copy summary text for compact screens.', format: 'copy' }),
            createExportButtonModel({ id: 'mobile-share', label: 'Share text', compactLabel: 'Share text', description: 'Share summary text only.', format: 'share' }),
        ],
        summaryLines: renderResearchRunSummaryCardText(result),
        copySummaryText,
        researchRunJson: exportResearchRunJson(result),
        researchRunMarkdown: exportResearchRunMarkdown(result),
        comparisonJson: comparisonResult ? exportLongRunComparisonJson(comparisonResult) : null,
        comparisonMarkdown: comparisonResult ? exportLongRunComparisonMarkdown(comparisonResult) : null,
    };
}
