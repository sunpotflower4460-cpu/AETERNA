// Simple inline sparklines for long-horizon observation
// Phase 6: Truthful trend visualization

export class TrendSparkline {
    constructor(canvasId, width = 100, height = 20) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn(`TrendSparkline: canvas ${canvasId} not found`);
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
    }

    render(values, options = {}) {
        if (!this.ctx || values.length === 0) return;

        const {
            color = '#22d3ee',
            fillColor = 'rgba(34, 211, 238, 0.1)',
            minValue = 0,
            maxValue = 2,
            showBaseline = true,
            baselineValue = 1.0
        } = options;

        this.ctx.clearRect(0, 0, this.width, this.height);

        const range = maxValue - minValue;
        const step = this.width / Math.max(values.length - 1, 1);

        // Normalize values to canvas coordinates
        const points = values.map((v, i) => {
            const x = i * step;
            const normalized = (v - minValue) / range;
            const y = this.height - (normalized * this.height);
            return { x, y };
        });

        // Draw filled area
        if (fillColor) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);
            points.forEach(p => this.ctx.lineTo(p.x, p.y));
            this.ctx.lineTo(this.width, this.height);
            this.ctx.closePath();
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => this.ctx.lineTo(p.x, p.y));
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Draw baseline if requested
        if (showBaseline && baselineValue !== null) {
            const baselineY = this.height - ((baselineValue - minValue) / range * this.height);
            this.ctx.beginPath();
            this.ctx.moveTo(0, baselineY);
            this.ctx.lineTo(this.width, baselineY);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 2]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    renderMultiple(datasets) {
        // datasets: [{ values, color, fillColor, minValue, maxValue }, ...]
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.width, this.height);

        datasets.forEach(dataset => {
            this.renderDataset(dataset);
        });
    }

    renderDataset(dataset) {
        const {
            values,
            color = '#22d3ee',
            fillColor = null,
            minValue = 0,
            maxValue = 1
        } = dataset;

        if (values.length === 0) return;

        const range = maxValue - minValue;
        const step = this.width / Math.max(values.length - 1, 1);

        const points = values.map((v, i) => {
            const x = i * step;
            const normalized = (v - minValue) / range;
            const y = this.height - (normalized * this.height);
            return { x, y };
        });

        if (fillColor) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);
            points.forEach(p => this.ctx.lineTo(p.x, p.y));
            this.ctx.lineTo(this.width, this.height);
            this.ctx.closePath();
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => this.ctx.lineTo(p.x, p.y));
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
    }
}

// Helper to render state trends from MajorStateObserver
export function updateStateTrends(observer) {
    const sigmaSparkline = new TrendSparkline('sparkline-sigma', 100, 20);
    const phiSparkline = new TrendSparkline('sparkline-phi', 100, 20);
    const energySparkline = new TrendSparkline('sparkline-energy', 100, 20);

    const sigmaTrend = observer.getRecentTrend('sigma', 100);
    const phiTrend = observer.getRecentTrend('phi', 100);
    const energyTrend = observer.getRecentTrend('energy', 100);

    sigmaSparkline.render(sigmaTrend, {
        color: '#22d3ee',
        fillColor: 'rgba(34, 211, 238, 0.1)',
        minValue: 0,
        maxValue: 2,
        showBaseline: true,
        baselineValue: 1.0
    });

    phiSparkline.render(phiTrend, {
        color: '#a78bfa',
        fillColor: 'rgba(167, 139, 250, 0.1)',
        minValue: 0,
        maxValue: 0.01
    });

    energySparkline.render(energyTrend, {
        color: '#34d399',
        fillColor: 'rgba(52, 211, 153, 0.1)',
        minValue: 0,
        maxValue: 1.0
    });
}
