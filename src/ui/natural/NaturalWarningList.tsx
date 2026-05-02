import type { RuntimeModeBadge } from './RuntimeModeBadge.tsx';

export type NaturalWarningSeverity =
    | 'info'
    | 'notice'
    | 'warning'
    | 'critical'
    | 'experimental';

export interface NaturalWarningItem {
    severity: NaturalWarningSeverity;
    title: string;
    detail: string;
}

export interface NaturalWarningInputs {
    runtimeBadges: RuntimeModeBadge[];
    vortexCandidateCount?: number;
    plasticitySaturationRisk?: number;
    nanOrInfinityCount?: number;
    observedRatioMatchStrength?: number;
}

export function createNaturalWarningList(
    inputs: NaturalWarningInputs,
): NaturalWarningItem[] {
    const warnings: NaturalWarningItem[] = [];
    const experimentalBadges = inputs.runtimeBadges.filter((badge) => badge.tone === 'experimental');

    const fieldBadge = inputs.runtimeBadges.find((badge) => badge.id === 'field');
    if (fieldBadge?.value === 'Complex Observer') {
        warnings.push({
            severity: 'info',
            title: 'Complex observer mode active',
            detail: 'Complex phase is being observed without changing scalar baseline behavior.',
        });
    }

    if (inputs.vortexCandidateCount && inputs.vortexCandidateCount > 0) {
        warnings.push({
            severity: 'notice',
            title: 'Vortex candidates detected',
            detail: 'These are observer-side phase-defect candidates and should be read with confidence and charge balance.',
        });
    }

    if ((inputs.plasticitySaturationRisk ?? 0) >= 0.7) {
        warnings.push({
            severity: 'warning',
            title: 'Plasticity accumulation approaching clamp',
            detail: 'Weak plasticity trace remains a proxy; monitor saturation risk before interpreting accumulation.',
        });
    }

    if ((inputs.nanOrInfinityCount ?? 0) > 0) {
        warnings.push({
            severity: 'critical',
            title: 'NaN detected in observation path',
            detail: 'Non-finite values were detected in the current observation set. Read diagnostics before using comparison output.',
        });
    }

    if ((inputs.observedRatioMatchStrength ?? 0) >= 0.8) {
        warnings.push({
            severity: 'info',
            title: 'Reference-ratio proximity observed',
            detail: 'Reference matches are comparison-only and are not causal proof.',
        });
    }

    for (const badge of experimentalBadges) {
        warnings.push({
            severity: 'experimental',
            title: `${badge.label} experimental`,
            detail: badge.note ?? 'Experimental mode is active.',
        });
    }

    return warnings;
}
