/**
 * SelectedCellMarker.tsx
 * v1.7: Deep Inspector / Time Replay — Selected Cell Marker
 *
 * Displays a small visual marker (ring/outline) at the selected cell's
 * projected screen position, to help the user identify the selection on
 * the torus canvas.
 *
 * Design principles:
 * - Marker is an OBSERVATION AID, not a fake energy/glow effect.
 * - Marker size and opacity are fixed — no animation that implies dynamics.
 * - Marker color can vary slightly by active lens (optional).
 * - No fake vortex, fake deformation, or fake energy visualisation.
 * - Rendered as an SVG overlay on top of the canvas element.
 *
 * Guardrails:
 * - Selected cell marker is an observation aid only.
 * - It does NOT represent fake energy, fake vortex, or fake deformation.
 *
 * Reference: docs/deep-inspector-time-replay.md §3
 */

import type { MetricLensId } from '../lens/metricLensRegistry.ts';

// ── SelectedCellMarkerProps ───────────────────────────────────────────────────

export interface SelectedCellMarkerProps {
    /**
     * 2D screen position [x, y] of the selected cell in pixels.
     * null = no cell selected or cell is off-screen.
     */
    screenPosition: { x: number; y: number } | null;
    /** Canvas dimensions (for SVG viewport) */
    canvasWidth: number;
    canvasHeight: number;
    /** Active lens ID for optional marker color variation */
    activeLensId?: MetricLensId | null;
    /** Whether the marker is visible */
    visible?: boolean;
}

// ── Lens color map ────────────────────────────────────────────────────────────

const LENS_MARKER_COLORS: Partial<Record<MetricLensId, string>> = {
    gaussianCurvature:    '#34d399',
    areaElement:          '#a3e635',
    innerOuterBias:       '#60a5fa',
    fieldAmplitude:       '#38bdf8',
    fieldPhase:           '#e879f9',
    phaseCoherence:       '#c084fc',
    flowContinuity:       '#22d3ee',
    energyThroughput:     '#fbbf24',
    vortexConfidence:     '#f472b6',
    topologicalCharge:    '#fb923c',
    membraneDeformation:  '#f87171',
    membraneTension:      '#fca5a5',
    membranePermeability: '#fde68a',
    twoSidedness:         '#d9f99d',
    plasticityTrace:      '#a78bfa',
    resistanceScale:      '#818cf8',
    observedRatioMatch:   '#f9a8d4',
};

const DEFAULT_MARKER_COLOR = '#ffffff';
const MARKER_RADIUS = 14;
const MARKER_STROKE_WIDTH = 1.5;

// ── renderSelectedCellMarkerSVG ───────────────────────────────────────────────

/**
 * Render the selected-cell marker as an SVG string.
 *
 * For use in non-React contexts (vanilla DOM overlay).
 *
 * @param props - SelectedCellMarkerProps
 * @returns     - SVG string, or empty string if not visible
 */
export function renderSelectedCellMarkerSVG(props: SelectedCellMarkerProps): string {
    const { screenPosition, canvasWidth, canvasHeight, activeLensId, visible = true } = props;

    if (!visible || !screenPosition) return '';

    const color = (activeLensId && LENS_MARKER_COLORS[activeLensId]) ?? DEFAULT_MARKER_COLOR;
    const { x, y } = screenPosition;

    return `<svg
  xmlns="http://www.w3.org/2000/svg"
  style="position:absolute;top:0;left:0;pointer-events:none;overflow:visible;"
  width="${canvasWidth}"
  height="${canvasHeight}"
  viewBox="0 0 ${canvasWidth} ${canvasHeight}"
  aria-hidden="true"
>
  <circle
    cx="${x.toFixed(1)}"
    cy="${y.toFixed(1)}"
    r="${MARKER_RADIUS}"
    fill="none"
    stroke="${color}"
    stroke-width="${MARKER_STROKE_WIDTH}"
    stroke-opacity="0.75"
  />
</svg>`;
}

// ── projectCellToScreen ───────────────────────────────────────────────────────

/**
 * Project a cell's world-space [x, y, z] to 2D screen pixels.
 *
 * Requires the same projection × view matrices used for rendering.
 * Returns null when the cell is behind the camera or matrices are absent.
 *
 * @param worldX, worldY, worldZ - 3D world position of the cell
 * @param projectionMatrix       - 4×4 column-major projection matrix
 * @param viewMatrix             - 4×4 column-major view matrix
 * @param canvasWidth            - Canvas width in pixels
 * @param canvasHeight           - Canvas height in pixels
 */
export function projectCellToScreen(
    worldX: number,
    worldY: number,
    worldZ: number,
    projectionMatrix: Float32Array,
    viewMatrix: Float32Array,
    canvasWidth: number,
    canvasHeight: number,
): { x: number; y: number } | null {
    // View space
    const vx = viewMatrix[0]*worldX + viewMatrix[4]*worldY + viewMatrix[8] *worldZ + viewMatrix[12];
    const vy = viewMatrix[1]*worldX + viewMatrix[5]*worldY + viewMatrix[9] *worldZ + viewMatrix[13];
    const vz = viewMatrix[2]*worldX + viewMatrix[6]*worldY + viewMatrix[10]*worldZ + viewMatrix[14];
    const vw = viewMatrix[3]*worldX + viewMatrix[7]*worldY + viewMatrix[11]*worldZ + viewMatrix[15];

    // Clip space
    const cx = projectionMatrix[0]*vx + projectionMatrix[4]*vy + projectionMatrix[8] *vz + projectionMatrix[12]*vw;
    const cy = projectionMatrix[1]*vx + projectionMatrix[5]*vy + projectionMatrix[9] *vz + projectionMatrix[13]*vw;
    const cw = projectionMatrix[3]*vx + projectionMatrix[7]*vy + projectionMatrix[11]*vz + projectionMatrix[15]*vw;

    if (!Number.isFinite(cw) || cw <= 0) return null;

    const ndcX = cx / cw;
    const ndcY = cy / cw;

    // Convert NDC to screen pixels
    const screenX = (ndcX + 1) * 0.5 * canvasWidth;
    const screenY = (1 - (ndcY + 1) * 0.5) * canvasHeight;

    return { x: screenX, y: screenY };
}
