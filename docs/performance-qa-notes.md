# Performance QA Notes

## Confirmed display modes

- High Quality
- Balanced
- Battery Saver
- Diagnostic

These modes are defined in `src/types/torusRenderState.ts` and managed by `src/ui/render/torusRenderModeManager.ts`.
They change display quality only. They do not change simulation dynamics.

## Renderer-side checks

- High Quality uses higher mesh / particles / bloom multipliers.
- Battery Saver reduces mesh / particles / bloom.
- Diagnostic sets bloom to 0 and prioritizes value readability.
- Smooth mode is presentation-only and stays distinct from raw mode.

## Mobile / device notes

- Safe-area CSS is present for HUD, overlays, floating buttons, and bottom nav.
- Bottom nav height includes `env(safe-area-inset-bottom)`.
- Mobile sheet uses a single research panel transformed into a bottom sheet.

## Follow-up note

- No explicit `devicePixelRatio` cap was found during the U8 audit. This is a next-phase performance hardening candidate if mobile load becomes an issue.
