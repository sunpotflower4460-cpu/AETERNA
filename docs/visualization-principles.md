# Visualization Principles

AETERNA Phase 6: Truthful Observability / UI / Visualization

## Core Principle

**Visualization is organism truth translation, not演出.**

All visual elements must correspond to actual internal state. Fake演出,演出のためだけのエフェクト, and "それっぽい偽物" are prohibited.

## What This Means

### Allowed

✓ Mapping node activity to particle brightness (1:1 correspondence)
✓ Color-coding based on actual node type (yin vs yang)
✓ Showing prediction error as color intensity (derived from real values)
✓ Camera orbit controls that don't modify organism state
✓ Panel layouts that prioritize main view visibility
✓ Overlays that visualize existing internal buffers

### Prohibited

✗ Adding fake particles for "visual appeal"
✗ Smoothing/interpolating organism dynamics for "aesthetic reasons"
✗ Creating visual effects that have no internal state correspondence
✗ Hiding真実 to make visualization "prettier"
✗ Adding演出 layers that obscure what's actually happening
✗ Using colors arbitrarily without documented meaning

## Graphics Mode Design

Graphics mode exists to make internal state **more readable**, not to create a "cool effect."

### Truthful Graphics Modes

1. **Prediction Error Heatmap**
   - Maps `network.predictionError[i]` to color
   - Low error → cyan/green (matching expectation)
   - High error → yellow/orange/red (surprise)
   - Meaning: Where is the organism surprised by its input?

2. **Coherence Overlay**
   - Maps phase coherence to color/opacity
   - High coherence → bright cyan (synchronized)
   - Low coherence → purple/dim (fragmented)
   - Meaning: Which regions are acting together?

3. **Dormant Wake Markers**
   - Shows `isDormantNode` and `dormantWakePressure`
   - Dormant → dark/invisible
   - Waking → subtle glow proportional to wake pressure
   - Meaning: Which latent capacities are activating?

4. **Touch Expectation Field**
   - Visualizes `touchExpectationField` buffer
   - Expected regions → cyan outline
   - Unexpected contact → orange flash
   - Meaning: What touch did the organism anticipate?

5. **Hierarchy View** (optional切り替え)
   - Shows sub-torus activity as nested overlay
   - Upper torus summary as faint outer ring
   - Meaning: How is activity distributed across scales?

All modes **must** have a 1:1 mapping to internal buffers. No speculation, no interpolation beyond frame smoothing.

## Color Mapping Protocol

### Color Palette and Meanings

Every color has a documented meaning. See `src/render/truthfulColors.js` for the canonical mapping.

#### Blue-Green系 (Coherence / Stability / Restoration)
- `#22d3ee` (cyan): High coherence, stable criticality (σ ≈ 1.0)
- `#4ecdc4` (teal): Inhibitory (yin) nodes, restoration-dominant
- `#34d399` (emerald): Strong prediction match, low error

#### Yellow-Orange系 (Active Prediction / Adaptation / Perturbation)
- `#fbbf24` (amber): Moderate prediction error, adaptation active
- `#fb923c` (orange): High arousal, perturbation processing
- `#ff6b35` (coral): Excitatory (yang) nodes, activity-dominant

#### Red-Black系 (Overload / Instability / Risk)
- `#f87171` (red): Overload accumulation, instability warning
- `#ef4444` (dark red): Critical overload, disintegration risk
- `#000000` (black): Dormant / very low activity

#### Purple系 (Prediction / Internal Processing)
- `#a78bfa` (purple): Prediction-heavy activity, expectation violations
- `#c084fc` (light purple): Dream/replay mode active

**Rule**: If adding a new color, document its meaning in `truthfulColors.js` and this file.

## Panel / Layout Design

### Hierarchy

**A. Always Visible (Thin, Non-Intrusive)**
- System state badge
- Major dominant process indicator
- 1-3 most critical metrics (σ, φ, energy)

**B. Expandable Research Layer**
- Detailed metrics (accordion sections)
- Homeostasis values
- Prediction / expectation values
- Hierarchy / energy / scenario info

**C. Observer / Guide Layer**
- Guide panel (right side, collapsible on mobile)
- Explanation text (does not dictate interpretation)
- Long-horizon readout (optional sparklines)
- Compare / debug overlays (dev mode)

### Layout Rules

1. **Main view is最優先**
   - Torus must be visible at all times
   - Panels must not obscure the organism by default
   - Use collapsible sections, not permanent overlays

2. **Info on demand**
   -常時必要なもの: small, peripheral
   - 深掘り時にだけ必要なもの: accordion/toggle

3. **Mobile-friendly**
   - Touch controls don't conflict with camera orbit
   - Panel auto-collapses on small screens
   - Guide panel hidden on <768px by default

## Camera / Interaction Principles

### Purpose

Camera controls exist to **observe the organism from different angles**, not to "play" with it.

### Implementation

- Orbit controls: rotate around organism without touching it
- Zoom: move closer/farther without changing organism scale
- Pan: shift view target (rarely needed, de-prioritized)
- Preset views: top, side, focus, reset

### Separation of Concerns

**Camera controls ≠ Touch input**

- Camera movement: right-click drag, scroll wheel, or dedicated buttons
- Touch input: left-click/tap, sends stimulus to organism
- No collision: camera uses separate pointer tracking

## Metric Categorization

All metrics displayed in UI must be labeled as one of:

### exact
- Direct measurement from organism state
- Example: `omega_t` (slider input value), `firing rate` (count of spiking nodes / total)

### derived
- Computed from exact measurements using deterministic formula
- Example: `R/r ratio` (R / r_disk), `sigma` (EMA of currGenFiring / prevGenFiring)

### proxy
- Approximation of a theoretical concept, not the concept itself
- Example: `Φ* proxy` (custom integration approximation, **NOT** IIT Φ), `phase coherence` (Kuramoto-like order parameter)

### speculative
- Placeholder or未実装 mechanism
- Example: `attractor ID` (always shows NONE, library not built)

**Rule**: Every metric in `updateMetricsUI.js` must have a tooltip indicating its category.

## Observer / Guide Constraints

The guide panel provides **observation assistance**, not **interpretation dictation**.

### Allowed
- Summarizing observable events: "Sigma rising, cascades detected"
- Highlighting state transitions: "Mode changed to dream"
- Providing context hints: "High prediction error at Eye nodes"

### Prohibited
- Deciding what the organism "feels" or "wants"
- Claiming organism has "consciousness" or "intent"
- Storytelling or anthropomorphization
- Replacing observation with演出

The guide is a **research assistant**, not a narrator.

## Long-Horizon Observation

### Sparklines / Trend Strips

Small, inline charts showing recent history (last 60-200 frames):
- σ trend (stable? oscillating? drifting?)
- Energy / overload / coherence mini-timeline
- Mode transitions (when did modes change?)

### Purpose

Help answer: **"How did we get here?"**

Not演出. Not decoration. Actual recent history from `MajorStateObserver.stateHistory`.

## Testing Truthfulness

Before merging any visualization change, verify:

1. **No behavior break**: Run scenarios, organism dynamics unchanged
2. **1:1 correspondence**: Every visual element maps to a real buffer/value
3. **Documented meaning**: Colors, overlays, indicators have説明
4. **No fake geometry**: Torus shape comes from `network.vertexPositions`, not a separate model

## Summary

- **Truth > Beauty**
- **Clarity > Flash**
- **Measurement > Speculation**
- **Observation > Interpretation**

Visualization serves the research. The research does not serve the visualization.
