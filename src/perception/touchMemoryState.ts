export function mapTouchIndex(segments: number, normX: number, normY: number) {
  return (Math.floor(normX * segments) % segments) * segments + (Math.floor(normY * segments) % segments);
}

export function updateTouchMemoryTrace(traceMap: Float32Array, index: number) {
  traceMap[index] = Math.min(traceMap[index] + 1.0, 10.0);
}

export function decayTouchMemoryTrace(traceMap: Float32Array) {
  for (let i = 0; i < traceMap.length; i++) {
    if (traceMap[i] > 0) traceMap[i] = Math.max(0, traceMap[i] - 0.0008);
  }
}
