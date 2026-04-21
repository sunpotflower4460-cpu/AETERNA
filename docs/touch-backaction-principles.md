## Touch Backaction (Q1-2 Minimal Layer)

- **What it is**: a state-dependent weighting layer that slightly modulates how the same touch enters the organism depending on the current mixed state. It is **not** a literal quantum measurement or entanglement mechanism.
- **Inputs**: last open-state snapshot (felt/activation/drive mixes), felt-state / arousal-awareness traces, need-motivation hints, touch expectation familiarity/surprise, boundary and openness proxies.
- **Outputs**: small gains for `backactionGain`, `surpriseGain`, `boundaryModulation`, `opennessModulation`, `coherenceShift`, with optional `awarenessCoupling`, `overloadAmplification`, `familiarityDamping`. These stay within tight clamps to avoid behavior breaks.
- **Role**: sits as a light pre-/post-weight on the touch pipeline (e.g., sensitivity/novelty weighting) without replacing existing touch injection, prediction error, or expectation logic.
- **Same touch, different state**: overload + weak boundary + narrow awareness tilts toward higher surprise/overload amplification; coherent + moderate openness keeps effects gentle; familiar/repeated touch raises familiarity damping to reduce surprise.
- **Ablation**: `touchBackactionEnabled` (and familiarity toggle) allow on/off comparisons for experiments and observer summaries.
- **Not a mode driver**: does not switch modes or perform global rewrite; remains a thin supporting layer for Q1-2. Larger perceptual rewrite/global workspace are explicitly out-of-scope here (reserved for later Q2/Q3).
