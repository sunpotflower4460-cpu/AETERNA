import { decayTouchMemoryTrace, mapTouchIndex, updateTouchMemoryTrace } from './touchMemoryState.ts';

export class TouchMemory {
    constructor(segments) {
        this.segments = segments;
        this.traceMap = new Float32Array(segments * segments);
        this.lastTouchTime = -Infinity;
        this.lastTouchNode = -1;
        this.touchCount = 0;
    }

    recordTouch(normX, normY, simTime, network) {
        const idx = mapTouchIndex(this.segments, normX, normY);
        const dt = simTime - this.lastTouchTime;
        if (this.lastTouchNode >= 0 && dt > 0 && dt < 100) network.injectSTDPExternal(this.lastTouchNode, idx, dt);
        updateTouchMemoryTrace(this.traceMap, idx);
        this.lastTouchTime = simTime;
        this.lastTouchNode = idx;
        this.touchCount++;
    }

    decay() {
        decayTouchMemoryTrace(this.traceMap);
    }
}
