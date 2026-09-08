/**
 * k16-generate-ceiling-map-docs.ts
 *
 * Not physics - regenerates the "K7 天井の地図" table in
 * docs/vessel/white-ceilings.md from the single canonical source
 * src/pure/run/emergenceCeilingMap.ts (docs/vessel/K16-report-v2-
 * design.md Choice 2). Replaces ONLY the content between the
 * `<!-- BEGIN GENERATED: emergence-ceiling-map -->` /
 * `<!-- END GENERATED: emergence-ceiling-map -->` markers - everything
 * else in the file (hypotheses, corrections, honest-limits prose) stays
 * hand-written and untouched.
 *
 * Usage: tsx scripts/k16-generate-ceiling-map-docs.ts [--check]
 *   (no flag)  writes the regenerated block into the file
 *   --check    exits with code 1 if the file's current block differs
 *              from what would be generated, without writing anything
 *              (this is what src/tests/pure/emergenceCeilingMapDocSync.
 *              test.ts effectively re-checks in-process)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { EMERGENCE_CEILING_MAP } from '../src/pure/run/emergenceCeilingMap.ts';

const BEGIN_MARKER = '<!-- BEGIN GENERATED: emergence-ceiling-map -->';
const END_MARKER = '<!-- END GENERATED: emergence-ceiling-map -->';
const TARGET_PATH = new URL('../docs/vessel/white-ceilings.md', import.meta.url);

export function renderCeilingMapTable(): string {
  const header = '| 白 | 到達レベル（実測） | 停止理由（機構） | 次に足りない原因 |';
  const separator = '|---|---|---|---|';
  const rows = EMERGENCE_CEILING_MAP.map((entry) => `| ${entry.white} | ${entry.reachedLevel} | ${entry.stopReason} | ${entry.nextMissingCause} |`);
  return [header, separator, ...rows].join('\n');
}

export function renderGeneratedBlock(): string {
  return [BEGIN_MARKER, renderCeilingMapTable(), END_MARKER].join('\n');
}

function replaceBlock(fileContent: string, newBlock: string): string {
  const beginIdx = fileContent.indexOf(BEGIN_MARKER);
  const endIdx = fileContent.indexOf(END_MARKER);
  if (beginIdx < 0 || endIdx < 0 || endIdx < beginIdx) {
    throw new Error(`replaceBlock: could not find both markers in the target file (BEGIN at ${beginIdx}, END at ${endIdx})`);
  }
  const before = fileContent.slice(0, beginIdx);
  const after = fileContent.slice(endIdx + END_MARKER.length);
  return before + newBlock + after;
}

function main(): void {
  const checkOnly = process.argv.includes('--check');
  const current = readFileSync(TARGET_PATH, 'utf-8');
  const beginIdx = current.indexOf(BEGIN_MARKER);
  const endIdx = current.indexOf(END_MARKER);
  if (beginIdx < 0 || endIdx < 0) {
    throw new Error('markers not found in docs/vessel/white-ceilings.md - has the file been prepared with BEGIN/END GENERATED markers?');
  }
  const currentBlock = current.slice(beginIdx, endIdx + END_MARKER.length);
  const freshBlock = renderGeneratedBlock();

  if (currentBlock === freshBlock) {
    console.log('white-ceilings.md ceiling-map block is up to date.');
    return;
  }

  if (checkOnly) {
    console.error('DRIFT DETECTED: white-ceilings.md ceiling-map block does not match src/pure/run/emergenceCeilingMap.ts. Run without --check to regenerate.');
    process.exitCode = 1;
    return;
  }

  writeFileSync(TARGET_PATH, replaceBlock(current, freshBlock));
  console.log('white-ceilings.md ceiling-map block regenerated.');
}

// Only run as a side effect when executed directly (`tsx scripts/k16-generate-ceiling-map-docs.ts`),
// never when another module imports renderGeneratedBlock/renderCeilingMapTable
// (e.g. src/tests/pure/emergenceCeilingMapDocSync.test.ts) - importing this
// file must not itself read or write docs/vessel/white-ceilings.md.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
