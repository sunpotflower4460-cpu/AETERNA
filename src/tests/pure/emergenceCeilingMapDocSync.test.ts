import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderGeneratedBlock } from '../../../scripts/k16-generate-ceiling-map-docs.ts';

const BEGIN_MARKER = '<!-- BEGIN GENERATED: emergence-ceiling-map -->';
const END_MARKER = '<!-- END GENERATED: emergence-ceiling-map -->';

/**
 * K16's decisive check (docs/vessel/K16-report-v2-design.md): if
 * src/pure/run/emergenceCeilingMap.ts changes without regenerating
 * docs/vessel/white-ceilings.md (via `tsx scripts/k16-generate-ceiling-
 * map-docs.ts`), this test fails - the drift between the single source
 * of truth and the doc it generates cannot go unnoticed.
 */
describe('pure core K16 emergenceCeilingMapDocSync: white-ceilings.md matches the canonical source exactly', () => {
  it('the committed GENERATED block in white-ceilings.md equals what emergenceCeilingMap.ts would produce right now', () => {
    const docPath = fileURLToPath(new URL('../../../docs/vessel/white-ceilings.md', import.meta.url));
    const content = readFileSync(docPath, 'utf-8');

    const beginIdx = content.indexOf(BEGIN_MARKER);
    const endIdx = content.indexOf(END_MARKER);
    expect(beginIdx, 'BEGIN marker not found in white-ceilings.md').toBeGreaterThanOrEqual(0);
    expect(endIdx, 'END marker not found in white-ceilings.md').toBeGreaterThanOrEqual(0);

    const committedBlock = content.slice(beginIdx, endIdx + END_MARKER.length);
    const freshBlock = renderGeneratedBlock();

    expect(committedBlock).toBe(freshBlock);
  });
});
