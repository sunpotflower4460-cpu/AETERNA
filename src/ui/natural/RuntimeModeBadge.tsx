export type RuntimeModeTone = 'safe' | 'research' | 'experimental' | 'legacy';

export type RuntimeModeBadgeId =
    | 'metric'
    | 'field'
    | 'membrane'
    | 'plasticity'
    | 'constants'
    | 'safety';

export interface RuntimeModeBadge {
    id: RuntimeModeBadgeId;
    label: string;
    shortText: string;
    value: string;
    tone: RuntimeModeTone;
    note?: string;
    isDefault?: boolean;
}

export interface RuntimeModeBadgeInputs {
    metricMode?: string | null;
    fieldMode?: string | null;
    membraneMode?: string | null;
    plasticityMode?: string | null;
    constantsMode?: string | null;
    safetyMode?: string | null;
}

function titleCase(value: string): string {
    return value
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (match) => match.toUpperCase())
        .trim();
}

export function deriveRuntimeModeBadges(
    inputs: RuntimeModeBadgeInputs,
): RuntimeModeBadge[] {
    const metricMode = inputs.metricMode === 'curved' ? 'Curved' : 'Flat';
    const fieldMode = inputs.fieldMode ?? 'scalar';
    const membraneMode = inputs.membraneMode ?? 'observerOnly';
    const plasticityMode = inputs.plasticityMode ?? 'off';
    const constantsMode = inputs.constantsMode ?? 'neutral';
    const safetyMode = inputs.safetyMode ?? 'safe';

    return [
        {
            id: 'metric',
            label: 'Metric',
            shortText: `Metric: ${metricMode}`,
            value: metricMode,
            tone: metricMode === 'Curved' ? 'research' : 'safe',
            note: metricMode === 'Curved'
                ? 'Curved torus geometry is being observed.'
                : 'Flat metric preserves the legacy baseline.',
            isDefault: metricMode === 'Flat',
        },
        {
            id: 'field',
            label: 'Field',
            shortText: `Field: ${
                fieldMode === 'complexRuntime'
                    ? 'Complex Runtime'
                    : fieldMode === 'complexObserver'
                        ? 'Complex Observer'
                        : 'Scalar'
            }`,
            value: fieldMode === 'complexRuntime'
                ? 'Complex Runtime'
                : fieldMode === 'complexObserver'
                    ? 'Complex Observer'
                    : 'Scalar',
            tone: fieldMode === 'complexRuntime'
                ? 'experimental'
                : fieldMode === 'complexObserver'
                    ? 'research'
                    : 'safe',
            note: fieldMode === 'complexRuntime'
                ? 'Complex field is coupled to runtime.'
                : fieldMode === 'complexObserver'
                    ? 'Complex field is observer-side only.'
                    : 'Scalar field remains the runtime baseline.',
            isDefault: fieldMode === 'scalar',
        },
        {
            id: 'membrane',
            label: 'Membrane',
            shortText: `Membrane: ${
                membraneMode === 'weakCoupling'
                    ? 'Weak Coupling'
                    : membraneMode === 'observerOnly'
                        ? 'Observer'
                        : 'Off'
            }`,
            value: membraneMode === 'weakCoupling'
                ? 'Weak Coupling'
                : membraneMode === 'observerOnly'
                    ? 'Observer'
                    : 'Off',
            tone: membraneMode === 'weakCoupling'
                ? 'experimental'
                : membraneMode === 'observerOnly'
                    ? 'research'
                    : 'safe',
            note: membraneMode === 'weakCoupling'
                ? 'Boundary layer has weak runtime coupling.'
                : membraneMode === 'observerOnly'
                    ? 'Boundary layer is observer-side only.'
                    : 'Boundary layer is inactive.',
            isDefault: membraneMode === 'observerOnly',
        },
        {
            id: 'plasticity',
            label: 'Plasticity',
            shortText: `Plasticity: ${
                plasticityMode === 'resistanceOnly'
                    ? 'Resistance'
                    : plasticityMode === 'observeOnly'
                        ? 'Observe'
                        : 'Off'
            }`,
            value: plasticityMode === 'resistanceOnly'
                ? 'Resistance'
                : plasticityMode === 'observeOnly'
                    ? 'Observe'
                    : 'Off',
            tone: plasticityMode === 'resistanceOnly'
                ? 'experimental'
                : plasticityMode === 'observeOnly'
                    ? 'research'
                    : 'safe',
            note: plasticityMode === 'resistanceOnly'
                ? 'Weak resistance feedback is allowed.'
                : plasticityMode === 'observeOnly'
                    ? 'Trace is computed but not applied to runtime.'
                    : 'Weak plasticity is inactive.',
            isDefault: plasticityMode === 'off',
        },
        {
            id: 'constants',
            label: 'Constants',
            shortText: `Constants: ${constantsMode === 'legacy' ? 'Legacy' : 'Neutral'}`,
            value: constantsMode === 'legacy' ? 'Legacy' : 'Neutral',
            tone: constantsMode === 'legacy' ? 'legacy' : 'safe',
            note: constantsMode === 'legacy'
                ? 'Legacy constants are comparison-only.'
                : 'Neutral constants are the default runtime baseline.',
            isDefault: constantsMode === 'neutral',
        },
        {
            id: 'safety',
            label: 'Safety',
            shortText: `Safety: ${titleCase(safetyMode)}`,
            value: titleCase(safetyMode),
            tone: safetyMode === 'experimental'
                ? 'experimental'
                : safetyMode === 'research'
                    ? 'research'
                    : 'safe',
            note: safetyMode === 'experimental'
                ? 'Experimental modes are allowed and clearly marked.'
                : safetyMode === 'research'
                    ? 'Observer-side research modes are allowed.'
                    : 'Only safe defaults are active.',
            isDefault: safetyMode === 'safe',
        },
    ];
}
