/**
 * run-release-checks.ts
 * AETERNA-NATURAL v1.5 — Release Check Script
 *
 * Static pre-deployment checks that do not require a full build or test run.
 *
 * Checks:
 * 1. Release environment config default safety
 * 2. Public mode config default safety
 * 3. Runtime config default safety
 * 4. Cross-config release safety validator
 * 5. No forbidden claim patterns in key source files
 * 6. No external API / Node bridge imports in config files
 * 7. No referenceRatios imported in dynamicCore
 * 8. No observedRatio runtime feedback imports in dynamicCore
 * 9. Key docs exist
 *
 * Usage:
 *   npx tsx scripts/run-release-checks.ts
 *   or via:
 *   npm run check:release
 *
 * Reference: docs/deployment-readiness.md §6
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

// ── Helpers ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failMessages: string[] = [];

function check(label: string, result: boolean, detail?: string): void {
  if (result) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    failed++;
    failMessages.push(label + (detail ? ': ' + detail : ''));
  }
}

function fileContains(filePath: string, pattern: string | RegExp): boolean {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, 'utf-8');
  if (typeof pattern === 'string') return content.includes(pattern);
  return pattern.test(content);
}

function fileNotContains(filePath: string, pattern: string | RegExp): boolean {
  return !fileContains(filePath, pattern);
}

// ── Forbidden claim patterns ───────────────────────────────────────────────────

const FORBIDDEN_CLAIMS = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'healing proof',
  'soul resonance',
  'ai became alive',
  'aeterna is conscious',
  'aeterna wants',
  'aeterna feels',
  'aeterna is alive',
  'aeterna understands',
  '意識が証明',
  '生命が証明',
  '知性が証明',
  '癒しの証明',
  '神秘の証明',
  '魂の共鳴',
];

function checkNoForbiddenClaims(filePath: string): void {
  const shortPath = filePath.replace(ROOT + '/', '');
  if (!existsSync(filePath)) {
    check(`${shortPath} — no forbidden claims (file missing)`, false, 'File not found');
    return;
  }
  const content = readFileSync(filePath, 'utf-8').toLowerCase();
  const hit = FORBIDDEN_CLAIMS.find(c => content.includes(c));
  check(
    `${shortPath} — no forbidden claims`,
    hit === undefined,
    hit ? `Found: "${hit}"` : undefined,
  );
}

// ── Section helpers ────────────────────────────────────────────────────────────

function section(title: string): void {
  console.log(`\n── ${title} ─────────────────────────────────────────────`);
}

// ── Check 1: Release environment config default safety ────────────────────────

section('1. Release Environment Config Default Safety');

const releaseConfigPath = resolve(ROOT, 'src/config/releaseEnvironmentConfig.ts');
check('releaseEnvironmentConfig.ts exists', existsSync(releaseConfigPath));
check(
  "defaultReleaseEnvironmentConfig channel is 'publicResearch'",
  fileContains(releaseConfigPath, "channel: 'publicResearch'"),
);
check(
  'experimentalFeaturesEnabled: false in default',
  fileContains(releaseConfigPath, 'experimentalFeaturesEnabled: false'),
);
check(
  'legacyConstantsAllowed: false in default',
  fileContains(releaseConfigPath, 'legacyConstantsAllowed: false'),
);
check(
  'externalApiEnabled: false in default',
  fileContains(releaseConfigPath, 'externalApiEnabled: false'),
);
check(
  'nodeBridgeEnabled: false in default',
  fileContains(releaseConfigPath, 'nodeBridgeEnabled: false'),
);
check(
  'requireInterpretationNotes: true in default',
  fileContains(releaseConfigPath, 'requireInterpretationNotes: true'),
);

// ── Check 2: Public mode config default safety ────────────────────────────────

section('2. Public Research Mode Config Default Safety');

const publicModeConfigPath = resolve(ROOT, 'src/config/publicResearchModeConfig.ts');
check('publicResearchModeConfig.ts exists', existsSync(publicModeConfigPath));
check(
  "defaultPresetId: 'safeBaseline'",
  fileContains(publicModeConfigPath, "defaultPresetId: 'safeBaseline'"),
);
check(
  "defaultScenarioId: 'quietBaseline'",
  fileContains(publicModeConfigPath, "defaultScenarioId: 'quietBaseline'"),
);
check(
  'allowExperimentalMode: false',
  fileContains(publicModeConfigPath, 'allowExperimentalMode: false'),
);
check(
  'allowComplexRuntime: false',
  fileContains(publicModeConfigPath, 'allowComplexRuntime: false'),
);
check(
  'allowWeakPlasticityResistanceOnly: false',
  fileContains(publicModeConfigPath, 'allowWeakPlasticityResistanceOnly: false'),
);
check(
  'allowLegacyConstants: false',
  fileContains(publicModeConfigPath, 'allowLegacyConstants: false'),
);
check(
  'requireWarningBeforeExperimental: true',
  fileContains(publicModeConfigPath, 'requireWarningBeforeExperimental: true'),
);

// ── Check 3: Runtime config default safety ────────────────────────────────────

section('3. AeternaNatural Runtime Config Default Safety');

const runtimeConfigPath = resolve(ROOT, 'src/config/aeternaNaturalRuntimeConfig.ts');
check('aeternaNaturalRuntimeConfig.ts exists', existsSync(runtimeConfigPath));
check(
  "fieldRuntimeMode: 'scalar' (default)",
  fileContains(runtimeConfigPath, "fieldRuntimeMode: 'scalar'"),
);
check(
  "weakPlasticityMode: 'off' (default)",
  fileContains(runtimeConfigPath, "weakPlasticityMode: 'off'"),
);
check(
  'weakPlasticityEnabled: false (default)',
  fileContains(runtimeConfigPath, 'weakPlasticityEnabled: false'),
);
check(
  "externalConstantsMode: 'neutral' (default)",
  fileContains(runtimeConfigPath, "externalConstantsMode: 'neutral'"),
);
check(
  'longRunComparisonEnabled: false (default)',
  fileContains(runtimeConfigPath, 'longRunComparisonEnabled: false'),
);
check(
  "safetyMode: 'safe' (default)",
  fileContains(runtimeConfigPath, "safetyMode: 'safe'"),
);

// ── Check 4: validateReleaseSafety exists ─────────────────────────────────────

section('4. Release Safety Validator');

const validatorPath = resolve(ROOT, 'src/release/validateReleaseSafety.ts');
check('validateReleaseSafety.ts exists', existsSync(validatorPath));
check(
  'validateReleaseSafety function exported',
  fileContains(validatorPath, 'export function validateReleaseSafety'),
);

// ── Check 5: No forbidden claims in key files ─────────────────────────────────

section('5. Forbidden Claims Check');

const FILES_TO_CHECK_FOR_CLAIMS = [
  resolve(ROOT, 'README.md'),
  resolve(ROOT, 'docs/public-research-mode.md'),
  resolve(ROOT, 'docs/first-release-notes.md'),
  resolve(ROOT, 'docs/deployment-readiness.md'),
  resolve(ROOT, 'docs/manual-release-checklist.md'),
  resolve(ROOT, 'src/ui/public/PublicResearchLanding.tsx'),
  resolve(ROOT, 'src/ui/public/PublicInterpretationNote.tsx'),
  resolve(ROOT, 'src/ui/onboarding/FirstRunGuide.tsx'),
  resolve(ROOT, 'src/ui/system/AppErrorBoundary.tsx'),
  resolve(ROOT, 'src/ui/system/FallbackScreen.tsx'),
  resolve(ROOT, 'src/ui/system/SafeResetButton.tsx'),
  resolve(ROOT, 'src/ui/public/PublicBuildInfo.tsx'),
];

for (const fp of FILES_TO_CHECK_FOR_CLAIMS) {
  checkNoForbiddenClaims(fp);
}

// ── Check 6: No external API / Node bridge in config files ────────────────────

section('6. No External API / Node Bridge in Config Files');

const CONFIG_FILES = [
  resolve(ROOT, 'src/config/releaseEnvironmentConfig.ts'),
  resolve(ROOT, 'src/config/publicResearchModeConfig.ts'),
  resolve(ROOT, 'src/config/aeternaNaturalRuntimeConfig.ts'),
  resolve(ROOT, 'src/config/aeternaNaturalPresets.ts'),
];

for (const fp of CONFIG_FILES) {
  const shortPath = fp.replace(ROOT + '/', '');
  check(
    `${shortPath} — no external API import`,
    fileNotContains(fp, /import.*fetch|axios|http|openai|anthropic/i),
  );
  check(
    `${shortPath} — no Node bridge import`,
    fileNotContains(fp, /import.*NodeBridge|import.*nodeBridge|import.*node-bridge/),
  );
}

// ── Check 7: No referenceRatios import in dynamicCore ────────────────────────

section('7. No referenceRatios in dynamicCore');

const dynamicCorePath = resolve(ROOT, 'src/core/dynamicCore.ts');
check(
  'dynamicCore.ts exists',
  existsSync(dynamicCorePath),
);
if (existsSync(dynamicCorePath)) {
  check(
    'dynamicCore.ts does not import referenceRatios',
    fileNotContains(dynamicCorePath, 'referenceRatios'),
  );
  check(
    'dynamicCore.ts does not import observedRatios',
    fileNotContains(dynamicCorePath, 'observedRatios'),
  );
  check(
    'dynamicCore.ts does not import LLM/API',
    fileNotContains(dynamicCorePath, /openai|anthropic|fetch\(|axios/i),
  );
}

// ── Check 8: Key docs exist ───────────────────────────────────────────────────

section('8. Key Docs Exist');

const REQUIRED_DOCS = [
  'README.md',
  'docs/deployment-readiness.md',
  'docs/manual-release-checklist.md',
  'docs/performance-smoke-check.md',
  'docs/public-research-mode.md',
  'docs/first-release-notes.md',
];

for (const docPath of REQUIRED_DOCS) {
  check(`${docPath} exists`, existsSync(resolve(ROOT, docPath)));
}

// ── Check 9: Key UI components exist ─────────────────────────────────────────

section('9. Key UI Components Exist');

const REQUIRED_UI = [
  'src/ui/public/PublicBuildInfo.tsx',
  'src/ui/system/AppErrorBoundary.tsx',
  'src/ui/system/FallbackScreen.tsx',
  'src/ui/system/SafeResetButton.tsx',
  'src/ui/public/PublicResearchLanding.tsx',
  'src/ui/public/PublicInterpretationNote.tsx',
  'src/ui/onboarding/FirstRunGuide.tsx',
];

for (const uiPath of REQUIRED_UI) {
  check(`${uiPath} exists`, existsSync(resolve(ROOT, uiPath)));
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60));
console.log(`Release Checks: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nFailed checks:');
  for (const msg of failMessages) {
    console.error(`  - ${msg}`);
  }
  console.error('\n✗ Release checks FAILED. Fix the issues above before deploying.\n');
  process.exit(1);
} else {
  console.log('\n✓ All release checks passed.\n');
  process.exit(0);
}
