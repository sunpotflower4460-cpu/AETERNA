# First-Time Onboarding & Observation Route

**AETERNA-NATURAL v2.5**

---

## Overview

The v2.5 onboarding system guides first-time users through the torus field observation workspace.
It consists of three coordinated parts:

1. **Observation Route** — a 10-step guided path through the core observation workflow
2. **Guided Demo** — a 7-step preset walkthrough using Quiet Baseline / seed 1000
3. **Beginner Home Panel** — a persistent home tab with links, disclaimers, and safe-reset access

---

## Key Principles

- This system **does not** prove consciousness, life, intelligence, or mystical properties.
- Observations are observations — not proofs.
- Absence of emergence is a valid and expected result.
- All copy is Japanese-first; English IDs and aria-labels are retained for accessibility.

---

## Observation Route Steps

| # | ID | Panel | Beginner |
|---|-----|-------|---------|
| 1 | `intro` | landing | ✓ |
| 2 | `startSafeObservation` | landing | ✓ |
| 3 | `lookAtField` | field | ✓ |
| 4 | `selectCell` | field | ✓ |
| 5 | `inspectCell` | inspector | ✓ |
| 6 | `openLens` | lens | ✓ |
| 7 | `useReplay` | replay | ✓ |
| 8 | `checkRelatedSignals` | trace | — |
| 9 | `askGuide` | guide | ✓ |
| 10 | `exportResult` | export | — |

---

## Guided Demo (7 steps)

1. Safe Baseline を始める (landing)
2. Quiet Baseline を実行する (field)
3. セルを 1 つ選ぶ (field)
4. 位相または曲率を見る → Lens (lens)
5. Replay で前後を見る (replay)
6. 観測ガイドに聞く (guide)
7. Markdown で保存する (export)

**Disclaimer:** `これは結果を保証するデモではありません。観測候補が出ないことも有効な結果です。`

---

## Mobile Tab Bar Changes (v2.5)

A new **はじめに (Home)** tab (`beginner`, icon 🏠) was added as the **first** tab in the mobile tab bar.
The full tab order is now: `beginner → field → inspector → lens → replay → trace → guide`.

---

## Files

| File | Purpose |
|------|---------|
| `src/types/observationRoute.ts` | Type definitions |
| `src/onboarding/defaultObservationRoute.ts` | 10 default steps |
| `src/onboarding/deriveNextObservationHint.ts` | Contextual next-step hints |
| `src/onboarding/guidedDemoConfig.ts` | Guided demo configuration |
| `src/state/onboardingProgressState.ts` | Progress state and helpers |
| `src/ui/onboarding/BeginnerHomePanel.tsx` | Beginner home panel renderer |
| `src/ui/onboarding/ObservationRoutePanel.tsx` | Route panel renderer |
| `src/ui/onboarding/ObservationRouteStepCard.tsx` | Single step card renderer |
| `src/ui/onboarding/ObservationRouteProgress.tsx` | Progress bar renderer |
| `src/ui/onboarding/NextObservationHint.tsx` | Contextual hint renderer |
| `src/ui/onboarding/GuidedDemoPanel.tsx` | Guided demo panel renderer |

---

## LocalStorage

Onboarding progress is persisted to `aeterna_onboarding` in `localStorage`.
Use `saveOnboardingProgress` / `loadOnboardingProgress` from `onboardingProgressState.ts`.
