/**
 * MiniMetricSparkline.ts
 * U5: Overview / Now Summary / Event Timeline
 *
 * Lightweight sparkline renderer for Overview mini time-series graphs.
 * Renders a compact sparkline of a single metric's recent history on a canvas.
 *
 * Principles:
 * - Displays value trends only — does NOT imply emotion or consciousness.
 * - Does NOT modify runtime state.
 * - Designed to be small and non-intrusive.
 * - Mobile-friendly (canvas is small; parent can hide on small screens).
 *
 * Reference: docs/scientific-ui-ux-principles.md §2.5
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SparklineOptions {
    /** Line color (CSS string) — defaults to '#22d3ee' */
    color?: string;
    /** Fill area color — defaults to translucent version of color */
    fillColor?: string;
    /** Minimum expected value (for y-axis scaling) — defaults to 0 */
    minValue?: number;
    /** Maximum expected value (for y-axis scaling) — defaults to 1 */
    maxValue?: number;
    /** Whether to draw a horizontal reference baseline — defaults to false */
    showBaseline?: boolean;
    /** Y value for the baseline — defaults to 0.5 */
    baselineValue?: number;
}

// ── MiniMetricSparkline ────────────────────────────────────────────────────────

/**
 * Renders a compact sparkline on a <canvas> element.
 * Used in the Overview tab to show recent metric trends.
 */
export class MiniMetricSparkline {
    private readonly canvas: HTMLCanvasElement | null;
    private readonly ctx: CanvasRenderingContext2D | null;
    private readonly width: number;
    private readonly height: number;

    /** Circular history buffer (up to maxHistory values) */
    private readonly history: number[];
    private readonly maxHistory: number;

    constructor(
        canvasId: string,
        width = 80,
        height = 16,
        maxHistory = 60
    ) {
        const el = document.getElementById(canvasId);
        this.canvas = el instanceof HTMLCanvasElement ? el : null;
        if (!this.canvas) {
            // Canvas not in DOM yet — silently degrade
            this.ctx = null;
        } else {
            this.canvas.width = width;
            this.canvas.height = height;
            this.ctx = this.canvas.getContext('2d');
        }
        this.width = width;
        this.height = height;
        this.history = [];
        this.maxHistory = maxHistory;
    }

    /** Push a new sample value and re-render */
    push(value: number, options: SparklineOptions = {}): void {
        const safeVal = isFinite(value) && !isNaN(value) ? value : 0;
        this.history.push(safeVal);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.render(options);
    }

    /** Render the current history onto the canvas */
    render(options: SparklineOptions = {}): void {
        if (!this.ctx || this.history.length === 0) return;

        const {
            color = '#22d3ee',
            fillColor = 'rgba(34, 211, 238, 0.12)',
            minValue = 0,
            maxValue = 1,
            showBaseline = false,
            baselineValue = 0.5,
        } = options;

        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const range = maxValue - minValue || 1;

        ctx.clearRect(0, 0, w, h);

        const vals = this.history;
        const step = w / Math.max(vals.length - 1, 1);

        const toY = (v: number) => h - ((clamp(v, minValue, maxValue) - minValue) / range) * h;

        const pts = vals.map((v, i) => ({ x: i * step, y: toY(v) }));

        // Filled area
        ctx.beginPath();
        ctx.moveTo(0, h);
        pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Baseline
        if (showBaseline) {
            const by = toY(baselineValue);
            ctx.beginPath();
            ctx.moveTo(0, by);
            ctx.lineTo(w, by);
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.lineWidth = 0.8;
            ctx.setLineDash([2, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    /** Clear the canvas and history */
    clear(): void {
        this.history.length = 0;
        if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /** Get a copy of the current history */
    getHistory(): number[] {
        return [...this.history];
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v;
}

// ── Overview sparkline registry ────────────────────────────────────────────────

/**
 * Named sparkline instances for the Overview tab metrics.
 * Instantiated lazily when first used (canvas may not be in DOM yet).
 */
export interface OverviewSparklines {
    flowContinuity:   MiniMetricSparkline;
    energyThroughput: MiniMetricSparkline;
    returnStrength:   MiniMetricSparkline;
    echoPersistence:  MiniMetricSparkline;
    closureStability: MiniMetricSparkline;
    saturationRisk:   MiniMetricSparkline;
    extinctionRisk:   MiniMetricSparkline;
}

let _overviewSparklines: OverviewSparklines | null = null;

/** Get (or lazily create) the shared Overview sparkline instances. */
export function getOverviewSparklines(): OverviewSparklines {
    if (!_overviewSparklines) {
        _overviewSparklines = {
            flowContinuity:   new MiniMetricSparkline('ov-spark-flow',      80, 16),
            energyThroughput: new MiniMetricSparkline('ov-spark-energy',    80, 16),
            returnStrength:   new MiniMetricSparkline('ov-spark-return',    80, 16),
            echoPersistence:  new MiniMetricSparkline('ov-spark-echo',      80, 16),
            closureStability: new MiniMetricSparkline('ov-spark-closure',   80, 16),
            saturationRisk:   new MiniMetricSparkline('ov-spark-saturation',80, 16),
            extinctionRisk:   new MiniMetricSparkline('ov-spark-extinction',80, 16),
        };
    }
    return _overviewSparklines;
}

/**
 * Push new values to all Overview sparklines.
 * Called once per display update cycle.
 */
export function pushOverviewSparklineValues(values: {
    flowContinuity:   number;
    energyThroughput: number;
    returnStrength:   number;
    echoPersistence:  number;
    closureStability: number;
    saturationRisk:   number;
    extinctionRisk:   number;
}): void {
    const sp = getOverviewSparklines();
    sp.flowContinuity.push(values.flowContinuity,     { color: '#22d3ee' });
    sp.energyThroughput.push(values.energyThroughput, { color: '#34d399' });
    sp.returnStrength.push(values.returnStrength,     { color: '#fb923c' });
    sp.echoPersistence.push(values.echoPersistence,   { color: '#a78bfa' });
    sp.closureStability.push(values.closureStability, { color: '#67e8f9' });
    sp.saturationRisk.push(values.saturationRisk,     { color: '#fbbf24', fillColor: 'rgba(251,191,36,0.1)' });
    sp.extinctionRisk.push(values.extinctionRisk,     { color: '#f87171', fillColor: 'rgba(248,113,113,0.1)' });
}
