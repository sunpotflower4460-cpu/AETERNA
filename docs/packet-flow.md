# Packet Flow

AETERNA core flow is now visible as a thin packet chain:

`baseline/residue -> touch sensory input -> local predictor -> touch pattern -> touch percept -> torus dynamics -> prediction -> rewrite -> organism -> mode -> action -> metrics -> render/geometry`

## Main packets

- `BaselineResiduePacket` — baseline level, residue level.
- `TouchPerceptPacket` — raw touch/onset/offset/novelty means, trace mean, active count, dominant pattern, centroid, direction.
- `PredictionPacket` — mean prediction, mean prediction error, max prediction error, mean local prediction error.
- `RewritePacket` — rewrite pressure mean/max, global rewrite load, dominant rewrite tendency, prior bias summary.
- `OrganismPacket` — energy, stability, overload, rest drive, orienting drive.
- `ModePacket` — mode state, wake/sleep/dream drives, confidence, replay flags.
- `ActionPacket` — action state, pulse level, action direction.
- `DynamicsPacket` — arousal, sigma, cluster ratio, phi proxy, phase coherence.

## Explicit packet handoff notes

- `TouchPerceptPacket.patternScores` now feeds organism/action decisions directly.
- `TouchPerceptPacket.lastTouchDirection` and `touchDirectionStrength` now feed action direction/pulse application directly.
- Rewrite is still a thin split on live torus/touch arrays, but its outward summary is a `RewritePacket`.

## Thin split note

This PR is intentionally a thin split.
Stage modules still operate on the shared live network state when needed, but the handoff between stages is now explicit through packets and partial packet summaries.

## Bridge direction

`src/types/packets.ts` keeps the core packets numeric and shows the overlap with `TorusStatePacket`.
Japanese text synthesis remains downstream in `src/bridge/bridge.ts`, so future work can pass numeric packets toward Signal Runtime before any text adaptation.
