# Deployment Readiness

AETERNA-NATURAL v1.5 — App Packaging / Deployment Readiness

---

## 1. Purpose

This document describes the deployment readiness configuration for AETERNA-NATURAL.
The goal is to ensure AETERNA-NATURAL can be safely built, previewed, and deployed as a public research tool.

Key objectives:
- Build, preview, and deploy are stable and repeatable.
- Public research mode is the default entry state.
- Experimental features cannot be accidentally activated in public mode.
- Environment variables, build settings, and public config are organized.
- Release checks can be run automatically and manually.
- Mobile and desktop minimum quality is confirmed.
- The codebase is ready for future Capacitor / App Store packaging.

---

## 2. Release Channels

| Channel           | Description                                              | Experimental | Legacy | Debug |
|-------------------|----------------------------------------------------------|:------------:|:------:|:-----:|
| `publicResearch`  | Default public release — safe, no experimental           | ✗            | ✗      | ✗     |
| `preview`         | Staging / preview deployment — warnings for risky config | warn         | warn   | opt   |
| `local`           | Local development — all warnings, no errors              | warn         | warn   | opt   |
| `internalResearch`| Internal research — advanced features with warnings      | warn         | warn   | opt   |
| `experimental`    | Experimental build — all features allowed with warnings  | ✓            | ✓      | opt   |

The default channel is `publicResearch`.

---

## 3. Public Research Mode Defaults

The following settings apply in `publicResearch` channel:

| Setting                          | Value   |
|----------------------------------|---------|
| `publicResearchModeEnabled`      | `true`  |
| `experimentalFeaturesEnabled`    | `false` |
| `legacyConstantsAllowed`         | `false` |
| `externalApiEnabled`             | `false` |
| `nodeBridgeEnabled`              | `false` |
| `showDebugPanels`                | `false` |
| `showRawDiagnostics`             | `false` |
| `allowFullLongRun`               | `false` |
| `requireInterpretationNotes`     | `true`  |
| default preset                   | `safeBaseline` |
| default scenario                 | `quietBaseline` |

Source: `src/config/releaseEnvironmentConfig.ts`, `src/config/publicResearchModeConfig.ts`

---

## 4. Build Commands

```sh
# Install dependencies
npm install

# Type-check only (fast check without full build)
npx tsc --noEmit

# Full production build
npm run build

# Development server
npm run dev

# Preview production build locally
npm run preview
```

---

## 5. Preview Commands

```sh
# Build and serve preview
npm run build && npm run preview
```

Default preview port: `http://localhost:4173`

---

## 6. Release Checks

Run the full release check before every deployment:

```sh
npm run check:release
```

The release check script (`scripts/run-release-checks.ts`) verifies:
1. `defaultReleaseEnvironmentConfig` channel is `publicResearch`
2. Experimental features disabled in public config
3. Legacy constants disabled in public config
4. External API disabled
5. Node bridge disabled
6. Interpretation notes required
7. No forbidden proof claims in key files
8. No `referenceRatios` or `observedRatios` import in `dynamicCore.ts`
9. No external API / Node bridge imports in config files
10. Key docs exist
11. Key UI components exist

---

## 7. Environment Variables

AETERNA-NATURAL does not use environment variables for runtime configuration.
All configuration is in TypeScript source files:

| Config file                                | Purpose                              |
|--------------------------------------------|--------------------------------------|
| `src/config/releaseEnvironmentConfig.ts`   | Release channel and deployment flags |
| `src/config/publicResearchModeConfig.ts`   | Public research mode defaults        |
| `src/config/aeternaNaturalRuntimeConfig.ts`| Runtime mode defaults                |
| `src/config/aeternaNaturalPresets.ts`      | Named runtime presets                |

If you need build-time environment variables (e.g., for version injection), use `vite.config.ts` with `define`.

---

## 8. What Must Remain Disabled in Public Mode

The following must always be `false` / disabled in `publicResearch` channel:

- `experimentalFeaturesEnabled` — experimental runtime feedback paths
- `legacyConstantsAllowed` — pre-N6 external constants
- `externalApiEnabled` — external API (not implemented; must stay false)
- `nodeBridgeEnabled` — Node/AI bridge (not implemented; must stay false)
- `showDebugPanels` — raw internal diagnostics
- `showRawDiagnostics` — raw field values without interpretation context
- `allowFullLongRun` — expensive long-run suite (not suitable for CI default)
- `fieldRuntimeMode=complexRuntime` — complex field runtime feedback
- `weakPlasticityMode=resistanceOnly` — resistance-only plasticity
- `externalConstantsMode=legacy` — pre-N6 constants
- `safetyMode=experimental` — experimental safety mode

---

## 9. Manual QA Checklist

See `docs/manual-release-checklist.md` for the full manual QA checklist.

Quick pre-deploy checklist:

- [ ] `npm run build` passes with no errors
- [ ] `npm run check:release` passes
- [ ] App opens in browser without JavaScript errors
- [ ] Public landing page appears
- [ ] First Run Guide is accessible
- [ ] safeBaseline preset is the initial state
- [ ] Experimental panels are not visible by default
- [ ] JSON export works
- [ ] Markdown export works
- [ ] No forbidden claims in rendered UI

---

## 10. Known Limitations

- AETERNA-NATURAL is a research prototype, not production software.
- The torus simulation is a mathematical field model; it does not model biological systems.
- Vortex candidates are geometric phase defects, not minds or proto-minds.
- Weak plasticity traces are medium-history proxies, not semantic memory.
- Observed ratio matches are observational comparisons, not proof of any kind.
- Long-run runs may exhibit saturation risk; this is a known dynamics property.
- NaN / Infinity counts must be monitored; non-zero values require investigation.
- Full long-run comparison is expensive and should not run in CI default.
- No mobile-native packaging (Capacitor) is implemented yet.

---

## Future Capacitor / App Store Notes

For future mobile packaging (Capacitor / App Store):

- Public research mode should remain the default entry state.
- Offline `safeBaseline` should work without network access.
- Export should use the device share/download API where available.
- Heavy long-run runs should be disabled or clearly marked as advanced.
- No external API should be enabled by default.
- No health, healing, consciousness, or mystical claims may appear in app store descriptions.
- App store category: Education / Research Tools.
- App store age rating: 4+ (no sensitive content).

Suggested Capacitor setup steps (when ready):
1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init AETERNA-NATURAL com.aeterna.natural`
3. `npx cap add ios` / `npx cap add android`
4. Set `publicResearch` as the default build channel in `releaseEnvironmentConfig.ts`
5. Verify all forbidden claims are absent from the build
6. Run `npm run check:release` before each app store submission
