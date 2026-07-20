# Current Public Runtime Map (PR0)

Purpose: state plainly what a user actually gets when they load `dist/index.html` from this repo **today**, since there is currently no distinct "public build" pipeline — `npm run build` always produces the same artifact regardless of any `channel`/`publicResearch` setting, because nothing in the live app reads those settings (see `docs/ui-runtime-inventory.md` §8).

## 1. There is no build-time or run-time channel switch

- `vite.config.ts` has a single build target: `index.html`. There is no `--mode public` / env-based conditional entry, no separate public `index.html`, and no code path in `main.ts` that branches on a channel.
- `src/config/releaseEnvironmentConfig.ts` defines `channel: 'publicResearch' | 'preview' | 'local' | 'internalResearch' | 'experimental'` and `src/release/validateReleaseSafety.ts` defines the validation rules for each — but neither is imported by `main.ts`, `index.html`, or anything in the live call graph. **Whatever ships today ships identically regardless of intended channel.**

## 2. What is actually live in the one build that exists

| Capability | Design intent (per `docs/public-research-mode.md` §8) | Actual state today |
|---|---|---|
| External LLM API calls | "LLM / API calls: inactive" (permanent, all modes) | **Live.** `index.html:1488` ships a password-type API key input in the `#tab-raw` tab; `pointerHandlers.js:172-199` (`testAPIConnection`) and `GuidePanel.js:89-99` send it directly to `generativelanguage.googleapis.com` (Gemini) or `api.openai.com` (OpenAI) from client-side JS, unconditionally on any pointer/organism-event cycle once a key is entered. No flag check anywhere in this path. |
| Node/semantic bridge | "Node bridge: inactive" (permanent, all modes) | **Live.** `src/organism/runtimeLoop.ts`'s `maybeBridgeSignal` runs `bridgeTorusToSignal` unconditionally every ~100ms. `nodeBridgeEnabled` has zero consumers in the live path. |
| Debug panels | `showDebugPanels: false` in public config | **Live, unconditional.** `src/ui/debugPanels.js` is loaded directly by `index.html:1673` with no gate at all — `showDebugPanels` has zero consumers anywhere in the codebase outside its own definition. |
| Raw diagnostics | `showRawDiagnostics: false` in public config | **Live.** The `#tab-raw` tab (containing the API key input, provider select, and raw diagnostic controls) is part of the same always-present tab set as Overview/Field/World/Medium — hidden only by default tab selection (a UI convenience), not by any code gate. `showRawDiagnostics` has zero consumers. |
| Experimental features | `experimentalFeaturesEnabled: false` in public config | **Not actually gated.** No consumer of this flag exists in `pointerHandlers.js`, `AeternaNetwork.js`, or `main.ts`. |
| Semantic leak count / NaN-infinity count must be 0 | Guardrail invariant | Not independently checked at runtime by anything in the live path; only exercised inside vitest scenario tests, not the shipped app. |

## 3. Net effect

Anyone who loads the built `dist/index.html` today — regardless of whether the intent was "public demo" or "internal research" — gets the **same single build** with: a working external-API-key input wired to two commercial LLM providers, an always-on internal signal-bridge pipeline, and always-loaded debug panels. The `docs/public-research-mode.md` and `docs/deployment-readiness.md` guardrail documents describe a *config model* that is fully specified and unit-tested in isolation (`src/tests/release/**`), but describe **zero actual protection** for whatever gets deployed from this repository as-is.

`npm run check:release` (once its missing `tsx` devDependency is installed — see `docs/ui-runtime-inventory.md`'s Verification section) reports "61 passed, 0 failed," but its checks are static/existence-based (file exists, no forbidden substring in config/doc files, no disallowed import inside specific files like `dynamicCore.ts`) — it does not load the app and confirm the API-key input is absent, the debug panels don't load, or the bridge doesn't run. Passing `check:release` today is not evidence of public safety.

## 4. What "Public" would need to actually mean (target for PR2+)

1. A real branch point in `main.ts`'s boot sequence (or a thin wrapper around it) that calls `validateReleaseSafety`/resolves `releaseEnvironmentConfig` **before** `init()` proceeds.
2. `index.html`'s `#tab-raw` content (API key input, provider select, TEST button) must not even be present in the DOM for a public build — not just hidden by tab selection — or must be conditionally excluded at build time.
3. `src/ui/debugPanels.js`'s `<script>` tag in `index.html` must become conditional (build-time flag or runtime early-return guarded by the resolved channel) rather than unconditionally loaded.
4. `GuidePanel.js`'s external-fetch code path and `pointerHandlers.js`'s `testAPIConnection` must both check `externalApiEnabled` (or simply not exist in a public bundle) before making any network call.
5. `runtimeLoop.ts`'s `maybeBridgeSignal` must check `nodeBridgeEnabled` before running the bridge pipeline in public mode.
6. Once wired, `check:release` (or a new Playwright "no external network request" / "no console API-key element" smoke test per master-spec §21) must be extended to verify these behaviorally, not just statically — this is exactly PR1's "Network request check" / "Playwright public" item.

None of this is implemented in PR0 (docs-only, as instructed). This document exists so PR2's scope is unambiguous and testable against a concrete before/after.
