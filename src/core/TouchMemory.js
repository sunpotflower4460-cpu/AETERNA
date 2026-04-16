export class TouchMemory {
    constructor(segments) {
        this.segments = segments; this.traceMap = new Float32Array(segments * segments);
        this.lastTouchTime = -Infinity; this.lastTouchNode = -1; this.touchCount = 0;
    }
    // PR4: recordTouch no longer injects directly into currentBuffer.
    // Touch perception is now handled via rawTouch → localPrediction → onset/offset
    // in AeternaNetwork.  This method retains STDP weight updates and the trace map
    // so the history can be used for learning in PR5+.
    recordTouch(normX, normY, simTime, network) {
        const idx = (Math.floor(normX * this.segments)%this.segments)*this.segments + (Math.floor(normY * this.segments)%this.segments);
        const dt = simTime - this.lastTouchTime;
        if (this.lastTouchNode >= 0 && dt > 0 && dt < 100) network.injectSTDPExternal(this.lastTouchNode, idx, dt);
        this.traceMap[idx] = Math.min(this.traceMap[idx] + 1.0, 10.0);
        this.lastTouchTime = simTime; this.lastTouchNode = idx; this.touchCount++;
    }
    decay() { for (let i = 0; i < this.traceMap.length; i++) if (this.traceMap[i] > 0) this.traceMap[i] = Math.max(0, this.traceMap[i] - 0.0008); }
}
