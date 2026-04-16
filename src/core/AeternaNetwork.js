import { PHI, PHI_INV, SCHUMANN_RES, GAMMA_SYNC } from '../constants/aeternaConstants.js';
import { state } from '../state.js';

export class AeternaNetwork {
    constructor(segments = 72) {
        this.segments = segments; this.numNodes = segments * segments;
        this.R = PHI; this.r = 1.0;
        this.basePositions = new Float32Array(this.numNodes * 3);
        this.vertexPositions = new Float32Array(this.numNodes * 3);
        this.normals = new Float32Array(this.numNodes * 3);
        this.colors = new Float32Array(this.numNodes * 3);
        this.prevBuffer = new Float32Array(this.numNodes);
        this.currentBuffer = new Float32Array(this.numNodes);
        this.nextBuffer = new Float32Array(this.numNodes);
        this.nodeType = new Uint8Array(this.numNodes);
        this.nodeSign = new Float32Array(this.numNodes);
        this.spikeTrace = new Float32Array(this.numNodes);
        this.w_up = new Float32Array(this.numNodes).fill(1.0); this.w_down = new Float32Array(this.numNodes).fill(1.0);
        this.w_left = new Float32Array(this.numNodes).fill(1.0); this.w_right = new Float32Array(this.numNodes).fill(1.0);
        this.lastSpikeTime = new Float32Array(this.numNodes).fill(-9999);
        this.simTime = 0; this.currGenFiring = 0; this.prevGenFiring = 0;
        this.branchingRatioRaw = 1.0; this.sigmaDisplay = 1.0; 
        this.TARGET_FIRING_RATE = 0.08; this.firingRateError = 0.0;
        this.nodePhase = new Float32Array(this.numNodes); this.phaseSpeed = 0.02;
        this.attractorLibrary = []; this.currentAttractorId = -1; this.currentAttractorSim = 0;
        this.largestClusterNodes = new Uint8Array(this.numNodes);
        this.isEyeNode = new Uint8Array(this.numNodes); this.nodeLayer = new Uint8Array(this.numNodes);
        this.predictionHistory = new Float32Array(this.numNodes);
        this.AUTO_ERROR_THRESHOLD = 2.0; 
        this.octahedronHubs = []; this.injectedNodes = []; this.heartbeatActive = false;
        
        this.cachedMaxClusterSize = 0; this.cachedPhiApprox = 0; this.cachedPhaseCoherence = 0;

        // PR2: Baseline activity — quiet internal drift even without external input
        this.baselineActivity = new Float32Array(this.numNodes);
        // PR2: Activity residue — faint echo of recent firing
        this.activityResidue = new Float32Array(this.numNodes);

        // PR3: Local prediction — each node's gentle forecast of its next local input
        // based on a weighted neighborhood average.  Initialised to zero.
        this.localPrediction = new Float32Array(this.numNodes);
        // PR3: Prediction error — signed difference between actual state and local forecast.
        this.predictionError = new Float32Array(this.numNodes);

        // PR4: Touch as perceptual prediction error.
        // rawTouch   — surface activation from current pointer contacts (Gaussian spread)
        // touchOnset — max(rawTouch - localPrediction, 0): "unexpected contact"
        // touchOffset— max(localPrediction - rawTouch, 0): "expected contact that vanished"
        // touchNovelty — |rawTouch - localPrediction|: magnitude of perceptual mismatch
        // touchTrace — low-pass filtered novelty; accumulates touch history
        // touchProjection — routed onset/offset ready to be folded into dynamics
        this.rawTouch        = new Float32Array(this.numNodes);
        this.touchOnset      = new Float32Array(this.numNodes);
        this.touchOffset     = new Float32Array(this.numNodes);
        this.touchTrace      = new Float32Array(this.numNodes);
        this.touchNovelty    = new Float32Array(this.numNodes);
        this.touchProjection = new Float32Array(this.numNodes);

        // PR7: Touch sequence state — temporal features of how touch unfolds.
        // These accumulate across frames and decay on release.
        this.touchDurationFrames  = 0;   // consecutive frames with active contact
        this.touchGapFrames       = 0;   // frames since last contact ended
        this.touchMoveDistance    = 0;   // cumulative centroid displacement (normalised)
        this.touchVelocityEstimate = 0;  // EMA of per-frame centroid displacement
        this.touchRepeatCount     = 0;   // count of short-gap re-contacts
        this.lastTouchCentroid    = null; // [normX, normY] or null

        // PR7: Continuous pattern scores (EMA-smoothed, 0..1).
        // Hard classification is intentionally avoided.
        this.touchPatternScores = { tap: 0, repeat: 0, hold: 0, stroke: 0 };

        // PR7: Path history for stroke trail rendering (normalised coords).
        // Populated only while stroke tendency is active.
        this.strokePath = []; // [ {normX, normY}, … ]  max 40 entries

        this.generate();
    }

    generate() {
        let index = 0; const S = this.segments;
        for (let i = 0; i < S; i++) {
            for (let j = 0; j < S; j++) {
                const u = (i / S) * Math.PI * 2; const v = (j / S) * Math.PI * 2;
                const x = (this.R + this.r * Math.cos(v)) * Math.cos(u);
                const y = (this.R + this.r * Math.cos(v)) * Math.sin(u);
                const z = this.r * Math.sin(v);
                const idx3 = index * 3;
                this.basePositions[idx3] = x; this.basePositions[idx3+1] = y; this.basePositions[idx3+2] = z;
                this.vertexPositions[idx3] = x; this.vertexPositions[idx3+1] = y; this.vertexPositions[idx3+2] = z;
                this.normals[idx3] = Math.cos(v)*Math.cos(u); this.normals[idx3+1] = Math.cos(v)*Math.sin(u); this.normals[idx3+2] = Math.sin(v);
                
                if (Math.sin(u + v) > 0) { this.nodeType[index] = 0; this.nodeSign[index] = 1.0; } 
                else { this.nodeType[index] = 1; this.nodeSign[index] = -1.2; } 

                this.nodeLayer[index] = (Math.abs(Math.cos(v)) > 0.7) ? 1 : 0;

                if ((i===Math.floor(S*0.25) && j===Math.floor(S*0.75)) || (i===Math.floor(S*0.75) && j===Math.floor(S*0.25))) {
                    this.nodeType[index] = 2; this.nodeSign[index] = 0.0; this.isEyeNode[index] = 1;
                }
                this.nodePhase[index] = (i / S) * Math.PI * 2;
                index++;
            }
        }
        const hubDefs = [
            { i: 0, j: 0, modality: 'visual-relay' }, { i: Math.floor(S/2), j: 0, modality: 'auditory-relay' },
            { i: 0, j: Math.floor(S/4), modality: 'semantic-hub' }, { i: 0, j: Math.floor(3*S/4), modality: 'motor-hub' },
            { i: Math.floor(S/4), j: Math.floor(S/2), modality: 'interoceptive' }, { i: Math.floor(3*S/4), j:Math.floor(S/2), modality: 'contextual' }
        ];
        hubDefs.forEach(hub => {
            const idx = hub.i * S + hub.j; hub.nodeIndex = idx;
            this.nodeType[idx] = 3; this.nodeSign[idx] = 1.5; this.isEyeNode[idx] = 1; this.octahedronHubs.push(hub);
            for(let di=-3; di<=3; di++){ for(let dj=-3; dj<=3; dj++){
                const nidx = ((hub.i+di+S)%S)*S + ((hub.j+dj+S)%S);
                this.w_up[nidx]=Math.min(this.w_up[nidx]*1.15, 2.5); this.w_down[nidx]=Math.min(this.w_down[nidx]*1.15, 2.5);
                this.w_left[nidx]=Math.min(this.w_left[nidx]*1.15, 2.5); this.w_right[nidx]=Math.min(this.w_right[nidx]*1.15, 2.5);
            }}
        });
    }

    updateRadius(newR) {
        this.r = newR;
        let index = 0;
        const S = this.segments;
        for (let i = 0; i < S; i++) {
            for (let j = 0; j < S; j++) {
                const u = (i / S) * Math.PI * 2;
                const v = (j / S) * Math.PI * 2;
                const x = (this.R + newR * Math.cos(v)) * Math.cos(u);
                const y = (this.R + newR * Math.cos(v)) * Math.sin(u);
                const z = newR * Math.sin(v);
                const idx3 = index * 3;
                this.basePositions[idx3] = x;
                this.basePositions[idx3+1] = y;
                this.basePositions[idx3+2] = z;
                this.normals[idx3] = Math.cos(v)*Math.cos(u);
                this.normals[idx3+1] = Math.cos(v)*Math.sin(u);
                this.normals[idx3+2] = Math.sin(v);
                index++;
            }
        }
    }

    isHubNode(index) {
        for (let k = 0; k < this.octahedronHubs.length; k++) {
            if (this.octahedronHubs[k].nodeIndex === index) return true;
        }
        return false;
    }
    
    computeIntegrationProxy() {
        const N = this.numNodes;
        let tAll = 0, tYin = 0, cYin = 0, tYang = 0, cYang = 0;
        let tL0 = 0, cL0 = 0, tL1 = 0, cL1 = 0;
        let tHalf1 = 0, tHalf2 = 0;

        for (let i = 0; i < N; i++) {
            const f = this.spikeTrace[i]; tAll += f;
            if(this.nodeType[i]===1){ tYin+=f; cYin++; } else { tYang+=f; cYang++; }
            if(this.nodeLayer[i]===0){ tL0+=f; cL0++; } else { tL1+=f; cL1++; }
            if(i < N/2) tHalf1+=f; else tHalf2+=f;
        }
        const H_whole = tAll / N;
        const H_parts = ( (tYin/cYin + tYang/cYang)/2 + (tL0/cL0 + tL1/cL1)/2 + (tHalf1/(N/2) + tHalf2/(N/2))/2 ) / 3;
        return Math.max(0, H_whole - H_parts); 
    }

    computePhaseCoherence() {
        let rCos = 0, rSin = 0;
        for (let i = 0; i < this.numNodes; i++) {
            const wPhase = (this.nodeLayer[i] === 1) ? this.nodePhase[i] : this.nodePhase[i] * 0.5;
            const wLocal = this.w_up[i] + this.w_down[i] + this.w_left[i] + this.w_right[i];
            const amp = Math.max(0.1, Math.min(wLocal, 1.0));
            rCos += amp * Math.cos(wPhase);
            rSin += amp * Math.sin(wPhase);
        }
        return Math.sqrt(rCos * rCos + rSin * rSin) / this.numNodes;
    }

    computeMeanPredictionError() {
        let sum = 0;
        for (let i = 0; i < this.numNodes; i++) sum += this.predictionHistory[i];
        return sum / this.numNodes;
    }

    computeLargestCluster() {
        const S = this.segments; const N = this.numNodes;
        const parent = new Int32Array(N); const rank = new Uint8Array(N);
        for (let i = 0; i < N; i++) parent[i] = i;
        const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        const union = (a, b) => { const ra = find(a), rb = find(b); if (ra === rb) return; if (rank[ra] < rank[rb]) parent[ra] = rb; else if (rank[ra] > rank[rb]) parent[rb] = ra; else { parent[rb] = ra; rank[ra]++; } };
        for (let i = 0; i < S; i++) { for (let j = 0; j < S; j++) {
            const idx = i*S+j; if (this.spikeTrace[idx] <= 0.5) continue;
            const right = i*S+((j+1)%S); const down = ((i+1)%S)*S+j;
            if (this.spikeTrace[right] > 0.5) union(idx, right);
            if (this.spikeTrace[down] > 0.5) union(idx, down);
        }}
        const sizeMap = new Map(); let maxRoot = -1; let maxSize = 0;
        for (let i = 0; i < N; i++) {
            if (this.spikeTrace[i] <= 0.5) continue;
            const root = find(i); const size = (sizeMap.get(root) || 0) + 1; sizeMap.set(root, size);
            if (size > maxSize) { maxSize = size; maxRoot = root; }
        }
        this.largestClusterNodes.fill(0);
        if (maxRoot !== -1) {
            for (let i = 0; i < N; i++) if (this.spikeTrace[i] > 0.5 && find(i) === maxRoot) this.largestClusterNodes[i] = 1;
        }
        return maxSize;
    }

    injectSTDPExternal(fromNode, toNode, deltaT) {
        const A_PLUS = 0.08; const TAU = 30.0; const dw = A_PLUS * Math.exp(-deltaT / TAU);
        const S = this.segments; const fi = Math.floor(fromNode / S), fj = fromNode % S; const ti = Math.floor(toNode / S), tj = toNode % S;
        let di = ti - fi; if (di < -S/2) di += S; else if (di > S/2) di -= S;
        let dj = tj - fj; if (dj < -S/2) dj += S; else if (dj > S/2) dj -= S;
        if (Math.abs(di) >= Math.abs(dj)) { if (di > 0) this.w_down[fromNode] = Math.min(this.w_down[fromNode] + dw, 4.0); else this.w_up[fromNode] = Math.min(this.w_up[fromNode] + dw, 4.0); } 
        else { if (dj > 0) this.w_right[fromNode] = Math.min(this.w_right[fromNode] + dw, 4.0); else this.w_left[fromNode] = Math.min(this.w_left[fromNode] + dw, 4.0); }
    }

    injectPredictionError(index) {
        const targetVal = 10.0; const error = targetVal - this.currentBuffer[index];
        this.currentBuffer[index] += error * 0.8;
        const i = Math.floor(index / this.segments); const j = index % this.segments;
        const up = ((i-1+this.segments)%this.segments)*this.segments+j; const down = ((i+1)%this.segments)*this.segments+j;
        const left = i*this.segments+((j-1+this.segments)%this.segments); const right = i*this.segments+((j+1)%this.segments);
        this.currentBuffer[up]+=error*0.4; this.currentBuffer[down]+=error*0.4; this.currentBuffer[left]+=error*0.4; this.currentBuffer[right]+=error*0.4;
        this.injectedNodes.push(index);
    }
    
    autoPredictAndError() {
        if (this.simTime % 60 !== 0) return;
        let maxError = 0; let maxErrorNode = -1;
        for (let i = 0; i < this.numNodes; i++) {
            const error = Math.abs(this.currentBuffer[i] - this.prevBuffer[i]) * 2.0;
            this.predictionHistory[i] = this.predictionHistory[i] * 0.95 + error * 0.05;
            if (error > maxError) { maxError = error; maxErrorNode = i; }
            
            const hubBoostThreshold = this.isHubNode(i) ? this.AUTO_ERROR_THRESHOLD * 0.75 : this.AUTO_ERROR_THRESHOLD;
            if ((this.isEyeNode[i] === 1 || this.isHubNode(i)) && this.predictionHistory[i] > hubBoostThreshold) {
                this.injectPredictionError(i);
            }
        }
        if (maxErrorNode >= 0 && maxError > 2.0) this.injectPredictionError(maxErrorNode);
    }

    triggerNoise(tension, sigmaDisp) {
        const thermalRate = state.disk.omega_t > 30 ? 0.02 : 0.05;
        const eventRate = (tension * 0.2) + (Math.abs(sigmaDisp - 1.0) * 0.1);
        const finalRate = thermalRate + eventRate;
        for (let i = 0; i < 3; i++) {
            if (Math.random() < finalRate) { this.currentBuffer[Math.floor(Math.random() * this.numNodes)] += 1.0 + Math.random(); }
        }
    }

    // PR2: Slow sinusoidal drift — the quiet sea that always flows
    updateBaseline() {
        const BASELINE_AMP = 0.003;
        const TIME_DRIFT = 0.0008;
        const t = this.simTime * TIME_DRIFT;
        for (let i = 0; i < this.numNodes; i++) {
            this.baselineActivity[i] = BASELINE_AMP * Math.sin(this.nodePhase[i] + t);
        }
    }

    // PR2: Residue of recent activity — the ember that stays after fire
    updateResidue() {
        const RESIDUE_DECAY  = 0.97;
        const RESIDUE_INTAKE = 0.02;
        for (let i = 0; i < this.numNodes; i++) {
            this.activityResidue[i] = this.activityResidue[i] * RESIDUE_DECAY
                                    + this.spikeTrace[i]       * RESIDUE_INTAKE;
        }
    }

    // PR3: Slowly track the weighted neighbourhood average as a local prediction.
    // alpha is deliberately conservative so the predictor does not chase fast transients.
    updateLocalPrediction() {
        const S = this.segments;
        const alpha = 0.05;
        const oneMinusAlpha = 1.0 - alpha;
        for (let i = 0; i < S; i++) {
            for (let j = 0; j < S; j++) {
                const idx   = i * S + j;
                const up    = ((i - 1 + S) % S) * S + j;
                const down  = ((i + 1)     % S) * S + j;
                const left  = i * S + ((j - 1 + S) % S);
                const right = i * S + ((j + 1)     % S);

                const weightSum =
                    this.w_up[idx] + this.w_down[idx] +
                    this.w_left[idx] + this.w_right[idx];

                const neighborAvg = (
                    this.currentBuffer[up]    * this.w_up[idx]   +
                    this.currentBuffer[down]  * this.w_down[idx] +
                    this.currentBuffer[left]  * this.w_left[idx] +
                    this.currentBuffer[right] * this.w_right[idx]
                ) / Math.max(weightSum, 1e-6);

                this.localPrediction[idx] = this.localPrediction[idx] * oneMinusAlpha + neighborAvg * alpha;
            }
        }
    }

    // PR4: Map normalised pointer coordinates to the nearest torus node index.
    mapTouchToSurfaceIndex(xNorm, yNorm) {
        const S = this.segments;
        const i = Math.floor(xNorm * S) % S;
        const j = Math.floor(yNorm * S) % S;
        return i * S + j;
    }

    // PR4: Spread a single contact point across a Gaussian neighbourhood on the torus.
    addGaussianTouch(centerIdx, pressure) {
        const S  = this.segments;
        const ci = Math.floor(centerIdx / S);
        const cj = centerIdx % S;
        const sigma  = 2.5;
        const radius = 5;
        const inv2s2 = 1.0 / (2.0 * sigma * sigma);
        for (let di = -radius; di <= radius; di++) {
            for (let dj = -radius; dj <= radius; dj++) {
                const ni  = ((ci + di + S) % S);
                const nj  = ((cj + dj + S) % S);
                const idx = ni * S + nj;
                const w   = pressure * Math.exp(-(di * di + dj * dj) * inv2s2);
                this.rawTouch[idx] += w;
            }
        }
    }

    // PR4: Rebuild rawTouch every frame from the current set of active pointer contacts.
    // Does NOT write to currentBuffer — rawTouch is the raw sensory surface only.
    updateRawTouchField(activeTouches) {
        this.rawTouch.fill(0);
        const wW = window.innerWidth  || 1;
        const wH = window.innerHeight || 1;
        for (const [, touch] of activeTouches) {
            const xNorm    = touch.x / wW;
            const yNorm    = touch.y / wH;
            const centerIdx = this.mapTouchToSurfaceIndex(xNorm, yNorm);
            this.addGaussianTouch(centerIdx, touch.pressure ?? 1.0);
        }
    }

    // PR4: Compute perceptual error fields from rawTouch vs localPrediction.
    // onset  — "unexpected contact arrived"
    // offset — "expected contact has vanished"
    // novelty — overall mismatch magnitude
    // touchTrace — low-pass history of novelty (persists after contact ends)
    updateTouchPerception() {
        const TRACE_DECAY  = 0.96;
        const TRACE_INTAKE = 0.04;
        for (let i = 0; i < this.numNodes; i++) {
            const err = this.rawTouch[i] - this.localPrediction[i];
            this.touchOnset[i]   = err  > 0 ? err  : 0;
            this.touchOffset[i]  = err  < 0 ? -err : 0;
            this.touchNovelty[i] = Math.abs(err);
            this.touchTrace[i]   = this.touchTrace[i] * TRACE_DECAY
                                 + this.touchNovelty[i] * TRACE_INTAKE;
        }
    }

    // PR4: Convert onset/offset into a projected signal destined for the network.
    // touchProjection decays each frame so it does not accumulate unboundedly.
    // onset  → excitatory push  (positive)
    // offset → mild inhibitory pull (negative, smaller coefficient)
    projectTouchToNetwork() {
        const PROJ_DECAY        = 0.90;
        const ONSET_COEFFICIENT = 0.12;
        const OFFSET_COEFFICIENT = 0.06;
        for (let i = 0; i < this.numNodes; i++) {
            this.touchProjection[i] =
                this.touchProjection[i] * PROJ_DECAY
                + this.touchOnset[i]  * ONSET_COEFFICIENT
                - this.touchOffset[i] * OFFSET_COEFFICIENT;
        }
    }

    // PR7: Compute centroid of active touches in normalised [0,1] coordinates.
    computeTouchCentroid(activeTouches) {
        if (activeTouches.size === 0) return null;
        const wW = window.innerWidth  || 1;
        const wH = window.innerHeight || 1;
        let sx = 0, sy = 0;
        for (const [, t] of activeTouches) { sx += t.x / wW; sy += t.y / wH; }
        return [sx / activeTouches.size, sy / activeTouches.size];
    }

    // PR7: Update temporal sequence features from the current set of active touches.
    // Called once per frame before pattern scoring.
    updateTouchSequenceFeatures(activeTouches) {
        if (activeTouches.size > 0) {
            const centroid = this.computeTouchCentroid(activeTouches);
            this.touchDurationFrames += 1;
            this.touchGapFrames = 0;
            if (this.lastTouchCentroid) {
                const dx = centroid[0] - this.lastTouchCentroid[0];
                const dy = centroid[1] - this.lastTouchCentroid[1];
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.touchMoveDistance += dist;
                this.touchVelocityEstimate = this.touchVelocityEstimate * 0.8 + dist * 0.2;
            }
            this.lastTouchCentroid = centroid;
        } else {
            if (this.touchDurationFrames > 0 && this.touchGapFrames === 0) {
                // Contact just ended — count as a repeat candidate if gap is short
                if (this.touchRepeatCount > 0 || this.touchGapFrames < 12) {
                    this.touchRepeatCount += 1;
                }
            }
            // Reset repeat count after a long silent gap (>60 frames ≈ 1 s)
            if (this.touchGapFrames > 60) { this.touchRepeatCount = 0; }
            this.touchGapFrames += 1;
            this.touchDurationFrames = 0;
            this.touchMoveDistance    *= 0.95;
            this.touchVelocityEstimate *= 0.9;
            this.lastTouchCentroid = null;
        }
    }

    // PR7: Update EMA-smoothed touch pattern scores.
    // Scores are continuous [0..1] tendencies, not hard classifications.
    updateTouchPatternScores() {
        const dur  = this.touchDurationFrames;
        const vel  = this.touchVelocityEstimate;
        const move = this.touchMoveDistance;
        const rpt  = this.touchRepeatCount;
        const gap  = this.touchGapFrames;

        const tapRaw    = (dur > 0 && dur < 8  && vel < 0.005) ? 1 : 0;
        const holdRaw   = (dur > 20 && vel < 0.005)            ? 1 : 0;
        const repeatRaw = (rpt >= 2 && gap < 10)               ? 1 : 0;
        const strokeRaw = (dur > 0  && move > 0.05)            ? 1 : 0;

        const DECAY = 0.85, INTAKE = 0.15;
        this.touchPatternScores.tap    = this.touchPatternScores.tap    * DECAY + tapRaw    * INTAKE;
        this.touchPatternScores.hold   = this.touchPatternScores.hold   * DECAY + holdRaw   * INTAKE;
        this.touchPatternScores.repeat = this.touchPatternScores.repeat * DECAY + repeatRaw * INTAKE;
        this.touchPatternScores.stroke = this.touchPatternScores.stroke * DECAY + strokeRaw * INTAKE;
    }

    // PR7: Return the name of the currently dominant touch tendency, or null.
    // Returns null when all scores are below a minimum threshold.
    getDominantTouchPattern() {
        const s = this.touchPatternScores;
        const maxScore = Math.max(s.tap, s.hold, s.repeat, s.stroke);
        if (maxScore < 0.05) return null;
        if (maxScore === s.tap)    return 'tap';
        if (maxScore === s.hold)   return 'hold';
        if (maxScore === s.repeat) return 'repeat';
        return 'stroke';
    }

    // PR7: Conservative pattern-driven modulation of touch dynamics.
    // Adjusts already-computed touchProjection / touchTrace without touching the
    // core wave equation.  All coefficients are kept small by design.
    applyTouchPatternModulation() {
        const tapS    = this.touchPatternScores.tap;
        const holdS   = this.touchPatternScores.hold;
        const repeatS = this.touchPatternScores.repeat;
        const strokeS = this.touchPatternScores.stroke;

        // Exit early when no pattern is meaningfully active
        if (tapS < 0.02 && holdS < 0.02 && repeatS < 0.02 && strokeS < 0.02) return;

        for (let i = 0; i < this.numNodes; i++) {
            // tap: point surprise — brief novelty boost, shorter trace
            if (tapS > 0.02) {
                this.touchProjection[i] += this.touchOnset[i] * tapS * 0.06;
                this.touchTrace[i] *= (1.0 - tapS * 0.04); // faster trace decay
            }
            // hold: desensitise onset over time, keep trace (residue) longer
            if (holdS > 0.02) {
                const holdFade = Math.min(this.touchDurationFrames / 40.0, 1.0);
                this.touchProjection[i] *= (1.0 - holdS * holdFade * 0.10);
                this.touchTrace[i]      += this.touchNovelty[i] * holdS * 0.015;
            }
            // repeat: dampen re-surprise — the familiar contact arrives again
            if (repeatS > 0.02) {
                this.touchProjection[i] *= (1.0 - repeatS * 0.06);
            }
            // stroke: prolong trace as path-like residue
            if (strokeS > 0.02) {
                this.touchTrace[i] += this.touchNovelty[i] * strokeS * 0.02;
            }
        }

        // stroke: maintain centroid path for the visual layer
        if (strokeS > 0.05 && this.lastTouchCentroid) {
            this.strokePath.push({ normX: this.lastTouchCentroid[0], normY: this.lastTouchCentroid[1] });
            if (this.strokePath.length > 40) this.strokePath.shift();
        } else if (strokeS < 0.02) {
            if (this.strokePath.length > 0) this.strokePath.shift(); // gradual fade
        }
    }

    // PR3: Signed residual between actual state and local prediction.
    // Simple and intentionally unfiltered — the raw perceptual gap.
    updatePredictionError() {
        for (let i = 0; i < this.numNodes; i++) {
            this.predictionError[i] = this.currentBuffer[i] - this.localPrediction[i];
        }
    }

    // PR3: Mean absolute prediction error across all nodes (for metrics / UI).
    computeMeanLocalPredError() {
        let sum = 0;
        for (let i = 0; i < this.numNodes; i++) {
            sum += Math.abs(this.predictionError[i]);
        }
        return sum / this.numNodes;
    }

    updateDynamics(diskNodeIdx, activeTouches) {
        this.injectedNodes = []; this.simTime++;

        // PR2: Apply baseline drift and activity residue before wave propagation.
        // Gains are deliberately tiny so no runaway firing occurs when input is zero.
        const BASELINE_GAIN = 0.4;   // scales the ±0.003 sinusoid → ±0.0012 max on currentBuffer
        const RESIDUE_GAIN  = 0.005; // residue [0,1] → at most 0.005 added per frame
        this.updateBaseline();
        this.updateResidue();
        let baselineSum = 0, residueSum = 0;
        for (let i = 0; i < this.numNodes; i++) {
            this.currentBuffer[i] += this.baselineActivity[i] * BASELINE_GAIN
                                   + this.activityResidue[i]  * RESIDUE_GAIN;
            baselineSum += Math.abs(this.baselineActivity[i]);
            residueSum  += this.activityResidue[i];
        }
        const baselineLevel = baselineSum / this.numNodes;
        const residueLevel  = residueSum  / this.numNodes;

        // PR4: Step 2 — rebuild rawTouch surface from current pointer contacts.
        // activeTouches is the state.activeTouches Map (pixel coords).
        this.updateRawTouchField(activeTouches || new Map());

        // PR7: Update touch sequence features and pattern scores before perceptual steps,
        // so that modulation can be applied to the perception/projection outputs below.
        this.updateTouchSequenceFeatures(activeTouches || new Map());
        this.updateTouchPatternScores();

        // PR3 / PR4: Update local predictor after baseline/residue and raw touch
        // are known, so it sees the freshest quiet-state values before we compute
        // the perceptual error.
        this.updateLocalPrediction();

        // PR4: Step 4 — derive onset / offset / novelty / trace from raw touch vs prediction.
        this.updateTouchPerception();

        // PR4: Step 5 — accumulate onset/offset into touchProjection (decaying buffer).
        this.projectTouchToNetwork();

        // PR7: Apply conservative pattern-driven modulation to touchProjection / touchTrace.
        this.applyTouchPatternModulation();

        // PR4: Step 6 — fold touchProjection into currentBuffer with a conservative gain.
        // This is the only path from touch into the dynamics; no other direct injection.
        const TOUCH_PROJ_GAIN = 0.08;
        let rawTouchSum = 0, onsetSum = 0, offsetSum = 0, noveltySum = 0;
        for (let i = 0; i < this.numNodes; i++) {
            this.currentBuffer[i] += this.touchProjection[i] * TOUCH_PROJ_GAIN;
            rawTouchSum  += this.rawTouch[i];
            onsetSum     += this.touchOnset[i];
            offsetSum    += this.touchOffset[i];
            noveltySum   += this.touchNovelty[i];
        }
        const meanRawTouch   = rawTouchSum  / this.numNodes;
        const meanTouchOnset = onsetSum     / this.numNodes;
        const meanTouchOffset= offsetSum    / this.numNodes;
        const meanTouchNovelty = noveltySum / this.numNodes;
        const activeTouchCount = activeTouches ? activeTouches.size : 0;

        const freqRatio = (state.disk.omega_t - SCHUMANN_RES) / (GAMMA_SYNC - SCHUMANN_RES);
        const waveSpeed = 0.1 + 0.15 * freqRatio; const damping = 0.985 - (1.0 - PHI_INV) * 0.02 * (1.0 - freqRatio);
        
        let newlyFiredCount = 0;
        for (let i = 0; i < this.numNodes; i++) {
            if (this.currentBuffer[i] > 0.8 && this.prevBuffer[i] <= 0.8) { 
                this.spikeTrace[i] = 1.0; 
                this.lastSpikeTime[i] = this.simTime; 
                newlyFiredCount++;
            } else { 
                this.spikeTrace[i] *= 0.9; 
            }
        }

        for (let i = 0; i < this.numNodes; i++) {
            this.w_up[i] *= 0.99995; this.w_down[i] *= 0.99995; this.w_left[i] *= 0.99995; this.w_right[i] *= 0.99995;
            const sum = this.w_up[i]+this.w_down[i]+this.w_left[i]+this.w_right[i];
            if (sum > 0.001) { const f = 4.0/sum; const a = 0.01; this.w_up[i]+=(this.w_up[i]*f-this.w_up[i])*a; this.w_down[i]+=(this.w_down[i]*f-this.w_down[i])*a; this.w_left[i]+=(this.w_left[i]*f-this.w_left[i])*a; this.w_right[i]+=(this.w_right[i]*f-this.w_right[i])*a; }
        }

        this.prevGenFiring = this.currGenFiring;
        this.currGenFiring = newlyFiredCount;
        
        this.branchingRatioRaw = this.prevGenFiring > 0 ? this.currGenFiring / this.prevGenFiring : 1.0;
        this.sigmaDisplay = this.sigmaDisplay * 0.9 + this.branchingRatioRaw * 0.1; 
        
        const arousal = this.currGenFiring / this.numNodes;
        this.firingRateError = this.TARGET_FIRING_RATE - arousal;

        const homeoDamping = damping + this.firingRateError * 0.002;
        for (let i = 0; i < this.segments; i++) { 
            for (let j = 0; j < this.segments; j++) {
                const idx = i*this.segments+j; 
                const up = ((i-1+this.segments)%this.segments)*this.segments+j; 
                const down = ((i+1)%this.segments)*this.segments+j; 
                const left = i*this.segments+((j-1+this.segments)%this.segments); 
                const right = i*this.segments+((j+1)%this.segments);
                
                // Expanded for readability and debuggability
                let laplacian = 
                    (this.w_down[up] * this.currentBuffer[up] * this.nodeSign[up]) +
                    (this.w_up[down] * this.currentBuffer[down] * this.nodeSign[down]) +
                    (this.w_right[left] * this.currentBuffer[left] * this.nodeSign[left]) +
                    (this.w_left[right] * this.currentBuffer[right] * this.nodeSign[right]) -
                    ((this.w_up[idx] + this.w_down[idx] + this.w_left[idx] + this.w_right[idx]) * this.currentBuffer[idx]);
                    
                let nextVal = 2*this.currentBuffer[idx]-this.prevBuffer[idx]+waveSpeed*laplacian;
                nextVal *= homeoDamping;
                if (nextVal > 8.0) nextVal = 8.0+(nextVal-8.0)*0.01; if (nextVal < -8.0) nextVal = -8.0+(nextVal+8.0)*0.01;
                this.nextBuffer[idx] = nextVal;
            }
        }
        
        let temp = this.prevBuffer; this.prevBuffer = this.currentBuffer; this.currentBuffer = this.nextBuffer; this.nextBuffer = temp;

        // PR3: Now that currentBuffer holds the freshly propagated state, compute
        // how much reality differed from the local prediction made before propagation.
        this.updatePredictionError();
        
        this.phaseSpeed = 0.015 + 0.025 * freqRatio;
        for (let i = 0; i < this.numNodes; i++) { this.nodePhase[i] = (this.nodePhase[i] + this.phaseSpeed) % (Math.PI*2); }

        if (this.simTime % 4 === 0) {
            this.cachedMaxClusterSize = this.computeLargestCluster();
            this.cachedPhiApprox = this.computeIntegrationProxy();
            this.cachedPhaseCoherence = this.computePhaseCoherence();
        }

        for (let i = 0; i < this.numNodes; i++) {
            const val = this.currentBuffer[i]; const trace = this.spikeTrace[i]; const idx3 = i*3; let r=0,g=0,b=0;
            if (i === diskNodeIdx) { r = 1.0; }
            else {
                if (this.nodeType[i] === 1) { r = 0.3+trace*1.5; b = 0.1+trace*0.2; } 
                else {
                    if (val > 0) { r = val*0.3+trace; g = 0.1+val*0.7+trace; b = 0.4+val*0.8+trace; }
                    else { r = -val*0.4+trace; g = trace*0.5; b = 0.3-val*0.7+trace; }
                }
                if (this.largestClusterNodes[i] === 1) b += 0.5;
            }
            this.colors[idx3] = Math.min(Math.max(r,0),1.0); this.colors[idx3+1] = Math.min(Math.max(g,0),1.0); this.colors[idx3+2] = Math.min(Math.max(b,0),1.0);
            const d = val*0.04+trace*0.06;
            this.vertexPositions[idx3] = this.basePositions[idx3]+this.normals[idx3]*d; this.vertexPositions[idx3+1] = this.basePositions[idx3+1]+this.normals[idx3+1]*d; this.vertexPositions[idx3+2] = this.basePositions[idx3+2]+this.normals[idx3+2]*d;
        }
        
        this.autoPredictAndError();

        return {
            ignitionRatio: this.cachedMaxClusterSize / this.numNodes,
            phiApprox: this.cachedPhiApprox,
            phaseCoherence: this.cachedPhaseCoherence,
            meanPredictionError: this.computeMeanPredictionError(),
            meanLocalPredError: this.computeMeanLocalPredError(),
            arousal: arousal,
            sigmaDisplay: this.sigmaDisplay,
            firingRateError: this.firingRateError,
            baselineLevel: baselineLevel,
            residueLevel: residueLevel,
            // PR4: touch perception metrics
            meanRawTouch:     meanRawTouch,
            meanTouchOnset:   meanTouchOnset,
            meanTouchOffset:  meanTouchOffset,
            meanTouchNovelty: meanTouchNovelty,
            activeTouchCount: activeTouchCount,
            // PR7: touch pattern metrics
            touchDuration:      this.touchDurationFrames,
            touchVelocity:      this.touchVelocityEstimate,
            touchRepeatCount:   this.touchRepeatCount,
            dominantPattern:    this.getDominantTouchPattern(),
            touchPatternScores: { ...this.touchPatternScores }
        };
    }
}
