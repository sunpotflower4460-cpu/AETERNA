/**
 * torusViewPresets.ts
 * U2: Torus Camera / Controls — view preset definitions
 *
 * These presets define camera positions for observing the torus from different angles.
 * They do NOT change field values, energy, trace, or return.
 * Camera motion is an observation aid; it is not a field dynamics behavior.
 */

export interface TorusViewPreset {
    /** Internal key */
    name: string;
    /** Human-readable label */
    label: string;
    /** Horizontal angle in radians */
    azimuth: number;
    /** Vertical angle in radians (0 = equator, π/2 = north pole) */
    elevation: number;
    /** Distance from target */
    distance: number;
    /** Short description of what this view is for */
    description: string;
    /** Optional keyboard shortcut character */
    shortcut?: string;
}

/** All 8 torus observation presets. Values do not affect runtime dynamics. */
export const TORUS_VIEW_PRESETS: Record<string, TorusViewPreset> = {
    front: {
        name: 'front',
        label: 'Front',
        azimuth: 0,
        elevation: 0.5,
        distance: 15,
        description: '正面から見た標準視点。トーラス全体が見える。',
        shortcut: '1',
    },
    top: {
        name: 'top',
        label: 'Top',
        azimuth: 0,
        elevation: Math.PI * 0.4,
        distance: 18,
        description: '上から見た俯瞰視点。流れの偏りや active region coverage を確認しやすい。',
        shortcut: '2',
    },
    side: {
        name: 'side',
        label: 'Side',
        azimuth: Math.PI * 0.5,
        elevation: 0,
        distance: 15,
        description: '横から見た視点。厚みと奥行きを確認しやすい。',
        shortcut: '3',
    },
    inside_rim: {
        name: 'inside_rim',
        label: 'Inside Rim',
        azimuth: 0,
        elevation: -0.3,
        distance: 8,
        description: 'トーラスの内側リムを観察する視点。',
        shortcut: '4',
    },
    energy_flow: {
        name: 'energy_flow',
        label: 'Energy Flow',
        azimuth: Math.PI * 0.25,
        elevation: 0.3,
        distance: 14,
        description: 'Energy / Activity レイヤーを観察しやすい視点。値は変更しない。',
        shortcut: '5',
    },
    trace: {
        name: 'trace',
        label: 'Trace',
        azimuth: Math.PI * 0.75,
        elevation: 0.4,
        distance: 14,
        description: 'Trace / Residue レイヤーを観察しやすい視点。値は変更しない。',
        shortcut: '6',
    },
    closure: {
        name: 'closure',
        label: 'Closure',
        azimuth: Math.PI,
        elevation: 0.2,
        distance: 13,
        description: 'Actuation pulse / Sensory return / Closure match を観察しやすい視点。',
        shortcut: '7',
    },
    diagnostic: {
        name: 'diagnostic',
        label: 'Diagnostic',
        azimuth: Math.PI * 0.15,
        elevation: 0.6,
        distance: 22,
        description: '全体形状・inactive surface・coverage を確認しやすい遠景視点。',
    },
};

export type TorusViewPresetName = keyof typeof TORUS_VIEW_PRESETS;
