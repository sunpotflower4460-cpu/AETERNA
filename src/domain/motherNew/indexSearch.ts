import type { MotherNewIndexEntry, MotherNewIndexEntityType, MotherNewIndexField } from './motherNewBaseTypes';
import { loadMotherNewIndexState } from './motherNewRepository';

export type IndexSearchResult = {
  entry: MotherNewIndexEntry;
  score: number;
  matchedFields: MotherNewIndexField[];
  reasons: { field: MotherNewIndexField; note: string; score: number }[];
};

export function searchMotherNewIndex(
  query: string,
  options: {
    entityTypes?: MotherNewIndexEntityType[];
    maxResults?: number;
  } = {}
): IndexSearchResult[] {
  if (!query.trim()) return [];

  const { entries } = loadMotherNewIndexState();
  const queryLower = query.toLowerCase();
  const terms = queryLower.split(/\s+/).filter(Boolean);

  const results: IndexSearchResult[] = [];

  for (const entry of entries) {
    if (options.entityTypes && !options.entityTypes.includes(entry.entityType)) {
      continue;
    }

    const matchedFields: MotherNewIndexField[] = [];
    const reasons: { field: MotherNewIndexField; note: string; score: number }[] = [];
    let score = 0;

    const fieldWeights: Partial<Record<MotherNewIndexField, number>> = {
      label: 3,
      proposedLabel: 3,
      name: 3,
      aliases: 2.5,
      tags: 2,
      description: 1.5,
      contextSummary: 1,
      evidenceSummary: 1,
      rawExcerpt: 0.5,
    };

    for (const [field, value] of Object.entries(entry.fields) as [MotherNewIndexField, string][]) {
      if (!value) continue;
      const valueLower = value.toLowerCase();
      const weight = fieldWeights[field] ?? 1;

      for (const term of terms) {
        if (valueLower.includes(term)) {
          const termScore = weight * (valueLower === term ? 2 : 1);
          score += termScore;
          if (!matchedFields.includes(field)) {
            matchedFields.push(field);
            reasons.push({ field, note: `Matched "${term}" in ${field}`, score: termScore });
          }
        }
      }
    }

    // Also check tags
    for (const tag of entry.tags) {
      for (const term of terms) {
        if (tag.toLowerCase().includes(term)) {
          const fieldKey: MotherNewIndexField = 'tags';
          score += 2;
          if (!matchedFields.includes(fieldKey)) {
            matchedFields.push(fieldKey);
            reasons.push({ field: fieldKey, note: `Tag matched "${term}"`, score: 2 });
          }
        }
      }
    }

    if (score > 0) {
      results.push({ entry, score, matchedFields, reasons });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, options.maxResults ?? 50);
}
