# AETERNA Natural Roadmap

## N0 Geometry / Dynamics Audit

現在の core dynamics を geometry / field / constants / observer-runtime boundary の観点から監査し、比較基準を固定する。  
runtime は変更しない。

## N1 Curved Torus Metric

flat torus 更新から、曲率と面積要素を持つ curved torus metric へ進む。  
inner rim / outer rim の幾何差が flow にどう入るかを明示する。

Implemented in N1 as:

- torus geometry cell generation
- area / curvature / tangent / normal validation
- flat / curved metric ablation mode
- observer/UI geometry exposure with default runtime still flat

## N2 Complex Scalar Field

単一実数場から complex scalar field へ進む。  
amplitude / phase / phase gradient を導入するが、semantic interpretation はしない。

Implemented in N2 as:

- guarded `ComplexFieldState` / `ComplexFieldConfig`
- observer-side amplitude / phase / phase-gradient derivation
- reproducible quiet seeding for real / imag buffers
- observer-side vortex candidate detection with topological charge
- `fieldPhase` / `vortexCandidate` layer registration
- default scalar runtime preserved

## N3 Curvature × Vortex Coupling

曲率場と位相欠陥候補の相互作用を observer-side から監査する。  
vortex はまず candidate として扱い、意味づけしない。

Implemented in N3 as:

- observer-side `CurvatureVortexCouplingState` type
- `deriveCurvatureVortexCoupling()` — pure function combining N1 geometry + N2 vortex observation
- `signedTotalCharge` / `chargeDeviation` topological check (expected 0 on torus)
- five curvature bands with per-band vortex density statistics
- five geometric regions (outerRim / innerRim / upperRim / lowerRim / neutral)
- `curvatureVortexCorrelation` (Pearson, curvature at vortex site vs confidence)
- `curvatureBiasStrength` proxy
- `deriveVortexPairs()` — proximity-based ±-charge pair detection
- `compareFlatCurvedVortexStats()` — flat vs curved snapshot comparison scaffolding
- `curvatureVortexCoupling` field layer in registry (overlay/diagnostic, default OFF)
- `deriveNowSummary` extended with coupling observation lines
- docs/curvature-vortex-coupling.md

## N4 Boundary as Mediating Layer

boundary を単なる wrap 条件ではなく、媒介層として整理する。  
膜的なふるまいを入れても、soul / self boundary の主張には進まない。

## N5 Weak Plasticity Channel

observer-side と runtime の間に極小の plasticity channel を 1 本だけ導入する。  
必ず tiny / ablatable / non-semantic に保つ。

## N6 External Constants Removal / Observed Ratios

`PHI_INV` や `SCHUMANN_RES` のような外来定数を core update equations から外し、可能なら observer/reference ratio へ移す。  
研究比較のための observed ratio は残してよい。

## N7 Long-Run Comparison Suite

N0〜N6 の差分を長時間シナリオで比較できる suite を固定する。  
geometry, field, plasticity, constants removal の影響を見える化する。
