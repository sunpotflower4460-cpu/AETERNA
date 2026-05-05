import type { ResearchRunResult } from '../types/researchRunResult.ts';

export function exportResearchRunJson(result: ResearchRunResult): string {
    return JSON.stringify(result, null, 2);
}
