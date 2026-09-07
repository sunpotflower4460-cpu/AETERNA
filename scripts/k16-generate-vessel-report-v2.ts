/**
 * k16-generate-vessel-report-v2.ts
 *
 * Not physics - writes docs/vessel/vessel-report-v2.json from
 * exportVesselReportV2Json(). Deterministic (no randomness, no
 * filesystem reads beyond its own source), so simply re-running this
 * after editing src/pure/run/exportVesselReportV2.ts keeps the checked-in
 * artifact current; src/tests/pure/vesselReportV2JsonUpToDate.test.ts
 * guards against forgetting to.
 *
 * Usage: tsx scripts/k16-generate-vessel-report-v2.ts
 */

import { writeFileSync } from 'node:fs';
import { exportVesselReportV2Json } from '../src/pure/run/exportVesselReportV2.ts';

const OUT_PATH = new URL('../docs/vessel/vessel-report-v2.json', import.meta.url);

function main(): void {
  const report = exportVesselReportV2Json();
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
  console.log(`wrote ${OUT_PATH.pathname}`);
}

main();
