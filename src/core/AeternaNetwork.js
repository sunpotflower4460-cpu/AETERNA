import { PHI, PHI_INV, SCHUMANN_RES, GAMMA_SYNC } from '../constants/aeternaConstants.js';
import { state } from '../state.js';

// PR7: Touch pattern threshold constants — adjust here to tune pattern sensitivity.
const TOUCH_TAP_MAX_FRAMES       = 8;    // contacts shorter than this qualify as tap
const TOUCH_HOLD_MIN_FRAMES      = 20;   // contacts longer than this qualify as hold
const TOUCH_LOW_VELOCITY         = 0.005; // normalised velocity below which movement is "stationary"
const TOUCH_STROKE_MIN_DIST      = 0.05; // cumulative centroid distance to count as stroke
const TOUCH_REPEAT_MIN_COUNT     = 2;    // minimum re-contacts to score as repeat
const TOUCH_REPEAT_GAP_THRESHOLD = 12;   // max frames between contacts to count as repeat
const TOUCH_REPEAT_RESET_FRAMES  = 60;   // gap frames after which repeat counter resets (≈1 s at 60 fps)

const REWRITE_TYPES = ['novelty', 'recurrence', 'persistence', 'directionality'];
const REWRITE_PATTERN_SOURCES = {
    novelty: 'tap',
    recurrence: 'repeat',
    persistence: 'hold',
    directionality: 'stroke',
};
const REWRITE_PRIOR_DECAY = 0.9994;
const REWRITE_PRESSURE_DECAY = 0.965;
const REWRITE_PLASTICITY_DECAY = 0.987;
const REWRITE_LOAD_DECAY = 0.94;
const REWRITE_PRIOR_LIMIT = 0.35;
const REWRITE_CHANNEL_LIMIT = 0.28;
const REWRITE_PRESSURE_LIMIT = 1.0;
const REWRITE_PLASTICITY_LIMIT = 1.0;
const REWRITE_COOLDOWN_FRAMES = 28;
const REWRITE_MAX_GLOBAL_LOAD = 0.3;
const REWRITE_MAX_EVENTS = 8;
const REWRITE_TOUCH_GATE = 0.18;
const REWRITE_SEED_GATE = 0.18;
const REWRITE_TENSION_GATE = 0.08;
const REWRITE_TRIGGER_SCORE = 0.14;
const REWRITE_TRIGGER_PRESSURE = 0.03;
const REWRITE_TRIGGER_PLASTICITY = 0.02;
const REWRITE_DIRECTION_MIN_STRENGTH = 0.01;
const REWRITE_WEIGHT_MIN = 0.25;
const REWRITE_WEIGHT_MAX = 4.0;
const REWRITE_PATTERN_BASE = 0.6;
const REWRITE_PATTERN_SCALE = 0.4;
const REWRITE_SEED_BASE = 0.55;
const REWRITE_SEED_SCALE = 0.45;
const REWRITE_TENSION_BASE = 0.6;
const REWRITE_TENSION_SCALE = 0.4;
const REWRITE_PRESSURE_GAIN = 0.18;
const REWRITE_LOAD_DAMPING_FACTOR = 0.5;
const REWRITE_PLASTICITY_GAIN = 0.10;
const REWRITE_DIRECTION_NEIGHBOR_FALLOFF = 0.45;
const REWRITE_DIRECTION_COUNTER_DAMP = 0.35;
const REWRITE_DIRECTION_VERTICAL_STRENGTH = 0.55;
const REWRITE_DIRECTION_VERTICAL_COUNTER_DAMP = 0.18;
const REWRITE_NOVELTY_PREDICTION_FACTOR = 0.2;
const REWRITE_RECURRENCE_TRACE_FACTOR = 0.25;
const REWRITE_RECURRENCE_PROJECTION_DAMPING = 0.4;
const REWRITE_PERSISTENCE_RESIDUE_FACTOR = 0.12;
const REWRITE_DIRECTIONALITY_WEIGHT_FACTOR = 0.9;
const REWRITE_POST_PRESSURE_FACTOR = 0.4;
const REWRITE_POST_PLASTICITY_FACTOR = 0.5;
const REWRITE_GLOBAL_LOAD_FACTOR = 1.8;
const MODE_TRANSITION_COOLDOWN = 180;
const MODE_HYSTERESIS = 0.06;
const MODE_WAKE_THRESHOLD = 0.34;
const MODE_SLEEP_THRESHOLD = 0.4;
const MODE_DREAM_THRESHOLD = 0.42;
const MODE_DRIVE_SMOOTHING = 0.08;
const MODE_DREAM_REPLAY_LIMIT = 0.028;
const MODE_DREAM_REPLAY_NODE_LIMIT = 6;
const MODE_DREAM_REPLAY_GATE = 0.16;
const MODE_EXTERNAL_QUIET_GATE = 0.035;
const MODE_TRACE_HISTORY_LIMIT = 6;
const MODE_QUIET_TIME_FRAMES = 240;
const MODE_AROUSAL_NORM = 16;
const MODE_PREDICTION_NORM = 3.5;
const MODE_SIGMA_DRIFT_NORM = 4.0;
const MODE_RESIDUE_NORM = 1.2;
const MODE_TRACE_NORM = 0.45;
const MODE_PRIOR_NORM = 8.0;
const MODE_REWRITE_PRESSURE_NORM = 12.0;
const MODE_RECENT_REWRITE_NORM = 0.2;
const TOUCH_PROJ_BASE_GAIN = 0.08;
const MODE_DYNAMICS = {
    sleep: {
        baselineGain: 0.88,
        touchSensitivity: 0.82,
        touchProjectionGain: 0.82,
        rewriteGain: 0.84,
        residueDecayOffset: -0.012,
        replayGain: 0.15,
    },
    wake: {
        baselineGain: 1.02,
        touchSensitivity: 1.0,
        touchProjectionGain: 1.04,
        rewriteGain: 1.0,
        residueDecayOffset: 0.0,
        replayGain: 0.25,
    },
    dream: {
        baselineGain: 0.95,
        touchSensitivity: 0.8,
        touchProjectionGain: 0.78,
        rewriteGain: 0.9,
        residueDecayOffset: 0.006,
        replayGain: 1.0,
    },
};

export class AeternaNetwork {
    constructor(segments = 72) {
        this.segments = segments;
        this.numNodes = segments * segments;
        this.R = PHI;
        this.r = 1.0;

        this.initializeGeometryRenderState();
        this.initializeCoreDynamicState();
        this.initializeStructuralState();
        this.initializeSensoryPerceptualState();
        this.initializePredictionState();
        this.initializePlasticityRewriteState();
        this.initializeModeOngoingLifeState();
        this.initializeTemporaryWorkBuffers();

        this.generate();
    }

    // PR10-C: geometry/render state — the torus body used for visualisation.
    initializeGeometryRenderState() {
        this.basePositions = new Float32Array(this.numNodes * 3);
        this.vertexPositions = new Float32Array(this.numNodes * 3);
        this.normals = new Float32Array(this.numNodes * 3);
        this.colors = new Float32Array(this.numNodes * 3);
    }

    // PR10-C: core dynamic state — persistent activity fields and timing of the living wave.
    initializeCoreDynamicState() {
        this.prevBuffer = new Float32Array(this.numNodes);
        this.currentBuffer = new Float32Array(this.numNodes);
        this.nextBuffer = new Float32Array(this.numNodes);
        this.spikeTrace = new Float32Array(this.numNodes);
        this.lastSpikeTime = new Float32Array(this.numNodes).fill(-9999);
        this.simTime = 0;
        this.currGenFiring = 0;
        this.prevGenFiring = 0;
        this.branchingRatioRaw = 1.0;
        this.sigmaDisplay = 1.0;
        this.nodePhase = new Float32Array(this.numNodes);
        this.phaseSpeed = 0.02;
        this.attractorLibrary = [];
        this.currentAttractorId = -1;
        this.currentAttractorSim = 0;
    }

    // PR10-C: structural/connective state — persistent scaffold and directional couplings.
    initializeStructuralState() {
        this.nodeType = new Uint8Array(this.numNodes);
        this.nodeSign = new Float32Array(this.numNodes);
        this.nodeLayer = new Uint8Array(this.numNodes);
        this.isEyeNode = new Uint8Array(this.numNodes);
        this.w_up = new Float32Array(this.numNodes).fill(1.0);
        this.w_down = new Float32Array(this.numNodes).fill(1.0);
        this.w_left = new Float32Array(this.numNodes).fill(1.0);
        this.w_right = new Float32Array(this.numNodes).fill(1.0);
        this.octahedronHubs = [];
    }

    // PR10-C: sensory/perceptual state — what the organism currently feels from outside contact.
    initializeSensoryPerceptualState() {
        this.rawTouch = new Float32Array(this.numNodes);
        this.touchOnset = new Float32Array(this.numNodes);
        this.touchOffset = new Float32Array(this.numNodes);
        this.touchTrace = new Float32Array(this.numNodes);
        this.touchNovelty = new Float32Array(this.numNodes);
        this.touchProjection = new Float32Array(this.numNodes);

        // Persistent touch-sequence memory across frames.
        // touchDirectionVector is an immediate motion cue from contact, later read by rewrite logic.
        this.touchDurationFrames = 0;
        this.touchGapFrames = 0;
        this.touchMoveDistance = 0;
        this.touchVelocityEstimate = 0;
        this.touchRepeatCount = 0;
        this.lastTouchCentroid = null;
        this.touchPatternScores = { tap: 0, repeat: 0, hold: 0, stroke: 0 };
        this.strokePath = [];
        this.touchDirectionVector = { dx: 0, dy: 0, strength: 0 };
    }

    // PR10-C: prediction/error state — local forecasts, mismatches, and auto-error history.
    initializePredictionState() {
        this.localPrediction = new Float32Array(this.numNodes);
        this.predictionError = new Float32Array(this.numNodes);
        this.predictionHistory = new Float32Array(this.numNodes);
        this.AUTO_ERROR_THRESHOLD = 2.0;
    }

    // PR10-C: plasticity/rewrite state — slow biasing of how future contact is taken in.
    initializePlasticityRewriteState() {
        this.priorBias = new Float32Array(this.numNodes);
        this.rewritePressure = new Float32Array(this.numNodes);
        this.plasticityTrace = new Float32Array(this.numNodes);
        this.recentRewriteMask = new Uint8Array(this.numNodes);
        this.globalRewriteLoad = 0;
        this.priorChannels = {
            novelty: new Float32Array(this.numNodes),
            recurrence: new Float32Array(this.numNodes),
            persistence: new Float32Array(this.numNodes),
            directionality: new Float32Array(this.numNodes),
        };
        this.rewriteEvents = [];
        this.lastRewriteEvent = null;
        this.lastRewriteEventId = 0;
        this.rewriteProtoMeaningBiases = { novelty: 0, recurrence: 0, persistence: 0, directionality: 0 };
        this.currentRewriteTendency = 'none';
    }

    // PR10-C: mode/ongoing-life state — slow background drift, residue, and wake/sleep/dream balance.
    initializeModeOngoingLifeState() {
        this.baselineActivity = new Float32Array(this.numNodes);
        this.activityResidue = new Float32Array(this.numNodes);
        this.TARGET_FIRING_RATE = 0.08;
        this.firingRateError = 0.0;
        this.heartbeatActive = false;
        this.modeState = 'wake';
        this.modePhase = 0;
        this.wakeDrive = 0.4;
        this.sleepPressure = 0.24;
        this.dreamPressure = 0.18;
        this.modeConfidence = 0;
        this.lastModeChangeTime = 0;
        this.modeTrace = [{ mode: this.modeState, time: 0 }];
        this.externalQuietFrames = 0;
        this.dreamReplayActive = false;
        this.dreamReplayStrength = 0;
        this.currentModeDynamics = MODE_DYNAMICS.wake;
    }

    // PR10-C: temporary/work buffers — transient event lists and low-frequency derived caches.
    initializeTemporaryWorkBuffers() {
        this.largestClusterNodes = new Uint8Array(this.numNodes); // derived render-assist buffer
        this.injectedNodes = []; // transient per-frame event list, populated by injectPredictionError/autoPredictAndError
        this.cachedMaxClusterSize = 0; // derived cache
        this.cachedPhiApprox = 0; // derived cache
        this.cachedPhaseCoherence = 0; // derived cache
    }

    /**
     * PR10-C future GPU layout candidate.
     * CPU arrays above remain the current source of truth; this is only a layout note for later texture packing.
     *
     * Texture A (core dynamics): currentBuffer, prevBuffer, nextBuffer, spikeTrace
     * Texture B (sensory + prediction): rawTouch, touchTrace, localPrediction, predictionError
     * Texture C (plasticity + ongoing-life residue): priorBias, rewritePressure, plasticityTrace, activityResidue
     * Texture D (directional/connective): w_up, w_down, w_left, w_right
     * Separate render attributes: basePositions, vertexPositions, normals, colors
     */

    clampFinite(value, min, max, fallback = 0) {
        if (!Number.isFinite(value)) return fallback;
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    normalizeDirectionalWeights(index) {
        this.w_up[index] = this.clampFinite(this.w_up[index], REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
        this.w_down[index] = this.clampFinite(this.w_down[index], REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
        this.w_left[index] = this.clampFinite(this.w_left[index], REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
        this.w_right[index] = this.clampFinite(this.w_right[index], REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
        const sum = this.w_up[index] + this.w_down[index] + this.w_left[index] + this.w_right[index];
        if (!Number.isFinite(sum) || sum <= 0) {
            this.w_up[index] = 1.0; this.w_down[index] = 1.0; this.w_left[index] = 1.0; this.w_right[index] = 1.0;
            return;
        }
        const factor = 4.0 / sum;
        this.w_up[index] = this.clampFinite(this.w_up[index] * factor, REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
        this.w_down[index] = this.clampFinite(this.w_down[index] * factor, REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
        this.w_left[index] = this.clampFinite(this.w_left[index] * factor, REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
        this.w_right[index] = this.clampFinite(this.w_right[index] * factor, REWRITE_WEIGHT_MIN, REWRITE_WEIGHT_MAX, 1.0);
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
        const gain = this.currentModeDynamics?.baselineGain ?? 1.0;
        // modePhase is a global mode drift, not a per-node phase field.
        const phaseOffset = this.modePhase * Math.PI * 2;
        for (let i = 0; i < this.numNodes; i++) {
            this.baselineActivity[i] = BASELINE_AMP * gain * Math.sin(this.nodePhase[i] + t + phaseOffset);
        }
    }

    // PR2: Residue of recent activity — the ember that stays after fire
    updateResidue() {
        const RESIDUE_DECAY  = 0.97;
        const RESIDUE_INTAKE = 0.02;
        const modeResidueOffset = this.currentModeDynamics?.residueDecayOffset ?? 0;
        for (let i = 0; i < this.numNodes; i++) {
            const persistenceBias = this.priorChannels.persistence[i];
            const decay = this.clampFinite(RESIDUE_DECAY + persistenceBias * 0.01, 0.97, 0.995, RESIDUE_DECAY);
            const intake = this.clampFinite(RESIDUE_INTAKE + persistenceBias * 0.004, RESIDUE_INTAKE, 0.03, RESIDUE_INTAKE);
            const modeDecayTarget = decay + modeResidueOffset;
            const modeDecay = this.clampFinite(modeDecayTarget, 0.94, 0.995, modeDecayTarget);
            this.activityResidue[i] = this.activityResidue[i] * modeDecay
                                    + this.spikeTrace[i]       * intake;
            this.activityResidue[i] = this.clampFinite(this.activityResidue[i], 0, 1.25, 0);
        }
    }

    // PR10-C: mode/ongoing-life update step.
    // Applies persistent baseline/residue state into the live activity buffer.
    updateBaselineAndResidue() {
        const BASELINE_GAIN = 0.4;
        const RESIDUE_GAIN  = 0.005;
        this.updateBaseline();
        this.updateResidue();

        let baselineSum = 0;
        let residueSum = 0;
        for (let i = 0; i < this.numNodes; i++) {
            this.currentBuffer[i] += this.baselineActivity[i] * BASELINE_GAIN
                                   + this.activityResidue[i] * RESIDUE_GAIN;
            baselineSum += Math.abs(this.baselineActivity[i]);
            residueSum += this.activityResidue[i];
        }

        return {
            baselineLevel: baselineSum / this.numNodes,
            residueLevel: residueSum / this.numNodes,
        };
    }

    // PR3: Slowly track the weighted neighbourhood average as a local prediction.
    // alpha is deliberately conservative so the predictor does not chase fast transients.
    updateLocalPrediction() {
        const S = this.segments;
        const baseAlpha = 0.05;
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

                const noveltyBias = this.priorChannels.novelty[idx];
                const adaptiveAlpha = this.clampFinite(
                    baseAlpha + noveltyBias * 0.03 + this.priorBias[idx] * 0.015,
                    0.03,
                    0.12,
                    baseAlpha,
                );
                const oneMinusAlpha = 1.0 - adaptiveAlpha;
                this.localPrediction[idx] = this.localPrediction[idx] * oneMinusAlpha + neighborAvg * adaptiveAlpha;
                this.localPrediction[idx] = this.clampFinite(this.localPrediction[idx], -8.0, 8.0, 0);
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
        const touchSensitivity = this.currentModeDynamics?.touchSensitivity ?? 1.0;
        for (let i = 0; i < this.numNodes; i++) {
            const err = this.rawTouch[i] - this.localPrediction[i];
            const noveltyBias = this.priorChannels.novelty[i];
            const recurrenceBias = this.priorChannels.recurrence[i];
            const persistenceBias = this.priorChannels.persistence[i];
            const traceDecay = this.clampFinite(
                TRACE_DECAY + recurrenceBias * 0.02 + persistenceBias * 0.015 - noveltyBias * 0.015,
                0.9,
                0.995,
                TRACE_DECAY,
            );
            const traceIntake = this.clampFinite(
                TRACE_INTAKE + noveltyBias * 0.012 + persistenceBias * 0.008,
                0.02,
                0.08,
                TRACE_INTAKE,
            );
            this.touchOnset[i]   = err  > 0 ? err * touchSensitivity : 0;
            this.touchOffset[i]  = err  < 0 ? -err : 0;
            this.touchNovelty[i] = Math.abs(err) * (0.7 + touchSensitivity * 0.3);
            this.touchTrace[i]   = this.touchTrace[i] * traceDecay
                                 + this.touchNovelty[i] * traceIntake;
            this.touchTrace[i] = this.clampFinite(this.touchTrace[i], 0, 4.0, 0);
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
        const projectionGain = this.currentModeDynamics?.touchProjectionGain ?? 1.0;
        for (let i = 0; i < this.numNodes; i++) {
            const noveltyBias = this.priorChannels.novelty[i];
            const recurrenceBias = this.priorChannels.recurrence[i];
            const persistenceBias = this.priorChannels.persistence[i];
            const directionBias = this.priorChannels.directionality[i];
            const projDecay = this.clampFinite(PROJ_DECAY + recurrenceBias * 0.02, 0.88, 0.96, PROJ_DECAY);
            const onsetCoefficient = this.clampFinite(
                ONSET_COEFFICIENT + noveltyBias * 0.03 + directionBias * 0.015,
                ONSET_COEFFICIENT,
                0.18,
                ONSET_COEFFICIENT,
            );
            const offsetCoefficient = this.clampFinite(
                OFFSET_COEFFICIENT + persistenceBias * 0.025,
                OFFSET_COEFFICIENT,
                0.12,
                OFFSET_COEFFICIENT,
            );
            const repeatDamp = this.clampFinite(1.0 - recurrenceBias * 0.08, 0.85, 1.0, 1.0);
            this.touchProjection[i] =
                this.touchProjection[i] * projDecay
                + this.touchOnset[i]  * onsetCoefficient * repeatDamp * projectionGain
                - this.touchOffset[i] * offsetCoefficient;
            this.touchProjection[i] = this.clampFinite(this.touchProjection[i], -4.0, 4.0, 0);
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
            // Contact just (re-)started after a gap — check if it qualifies as a repeat
            if (this.touchDurationFrames === 0) {
                if (this.touchGapFrames > 0 && this.touchGapFrames < TOUCH_REPEAT_GAP_THRESHOLD) {
                    this.touchRepeatCount += 1;
                } else if (this.touchGapFrames >= TOUCH_REPEAT_RESET_FRAMES) {
                    // Long silence: start a fresh sequence
                    this.touchRepeatCount = 0;
                }
            }
            this.touchDurationFrames += 1;
            this.touchGapFrames = 0;
            if (this.lastTouchCentroid) {
                const dx = centroid[0] - this.lastTouchCentroid[0];
                const dy = centroid[1] - this.lastTouchCentroid[1];
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.touchMoveDistance += dist;
                this.touchVelocityEstimate = this.touchVelocityEstimate * 0.8 + dist * 0.2;
                this.touchDirectionVector = { dx, dy, strength: Math.min(dist / TOUCH_STROKE_MIN_DIST, 1.0) };
            } else {
                this.touchDirectionVector = { dx: 0, dy: 0, strength: 0 };
            }
            this.lastTouchCentroid = centroid;
        } else {
            this.touchGapFrames += 1;
            this.touchDurationFrames = 0;
            this.touchMoveDistance    *= 0.95;
            this.touchVelocityEstimate *= 0.9;
            this.lastTouchCentroid = null;
            this.touchDirectionVector = { dx: 0, dy: 0, strength: 0 };
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

        const tapRaw    = (dur > 0 && dur < TOUCH_TAP_MAX_FRAMES    && vel < TOUCH_LOW_VELOCITY) ? 1 : 0;
        const holdRaw   = (dur > TOUCH_HOLD_MIN_FRAMES               && vel < TOUCH_LOW_VELOCITY) ? 1 : 0;
        const repeatRaw = (rpt >= TOUCH_REPEAT_MIN_COUNT             && gap < TOUCH_REPEAT_GAP_THRESHOLD) ? 1 : 0;
        const strokeRaw = (dur > 0 && move > TOUCH_STROKE_MIN_DIST)  ? 1 : 0;

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

    // PR10-C: sensory/perceptual update step.
    // Keeps transient touch work separate from the persistent buffers it updates.
    updatePerceptionState(activeTouches) {
        this.updateRawTouchField(activeTouches);
        this.updateTouchSequenceFeatures(activeTouches);
        this.updateTouchPatternScores();
        this.updateLocalPrediction();
        this.updateTouchPerception();
        this.projectTouchToNetwork();
        this.applyTouchPatternModulation();

        const activeTouchCount = activeTouches.size;
        let replayRawTouchSum = 0;
        let replayOnsetSum = 0;
        let replayNoveltySum = 0;
        for (let i = 0; i < this.numNodes; i++) {
            replayRawTouchSum += this.rawTouch[i];
            replayOnsetSum += this.touchOnset[i];
            replayNoveltySum += this.touchNovelty[i];
        }

        const replayExternalLevel = this.clampFinite(
            (activeTouchCount > 0 ? 0.45 : 0) +
            (replayRawTouchSum / this.numNodes) * 0.9 +
            (replayOnsetSum / this.numNodes) * 0.7 +
            (replayNoveltySum / this.numNodes) * 0.45,
            0,
            1,
            0,
        );
        this.applyDreamReplay(replayExternalLevel);

        const touchProjGain = TOUCH_PROJ_BASE_GAIN * (this.currentModeDynamics?.touchProjectionGain ?? 1.0);
        let rawTouchSum = 0;
        let onsetSum = 0;
        let offsetSum = 0;
        let noveltySum = 0;
        let traceSum = 0;
        for (let i = 0; i < this.numNodes; i++) {
            this.currentBuffer[i] += this.touchProjection[i] * touchProjGain;
            rawTouchSum += this.rawTouch[i];
            onsetSum += this.touchOnset[i];
            offsetSum += this.touchOffset[i];
            noveltySum += this.touchNovelty[i];
            traceSum += this.touchTrace[i];
        }

        return {
            activeTouchCount,
            meanRawTouch: rawTouchSum / this.numNodes,
            meanTouchOnset: onsetSum / this.numNodes,
            meanTouchOffset: offsetSum / this.numNodes,
            meanTouchNovelty: noveltySum / this.numNodes,
            meanTouchTrace: traceSum / this.numNodes,
        };
    }

    getRewriteSeedBiases() {
        const biases = {};
        for (const type of REWRITE_TYPES) {
            const patternKey = REWRITE_PATTERN_SOURCES[type];
            biases[type] = this.clampFinite(this.touchPatternScores[patternKey], 0, 1, 0);
        }
        let tendency = 'none';
        let maxBias = 0;
        for (const type of REWRITE_TYPES) {
            if (biases[type] > maxBias) {
                maxBias = biases[type];
                tendency = type;
            }
        }
        this.rewriteProtoMeaningBiases = biases;
        this.currentRewriteTendency = maxBias >= 0.05 ? tendency : 'none';
        return { ...biases, tendency: this.currentRewriteTendency };
    }

    getModeDebugSummary() {
        return {
            modeState: this.modeState,
            modePhase: this.modePhase,
            wakeDrive: this.wakeDrive,
            sleepPressure: this.sleepPressure,
            dreamPressure: this.dreamPressure,
            modeConfidence: this.modeConfidence,
            lastModeChangeTime: this.lastModeChangeTime,
            lastModeChangeFrames: Math.max(this.simTime - this.lastModeChangeTime, 0),
            dreamReplayActive: this.dreamReplayActive,
            dreamReplayStrength: this.dreamReplayStrength,
        };
    }

    noteModeTransition(nextMode) {
        this.modeState = nextMode;
        this.lastModeChangeTime = this.simTime;
        this.modeTrace.unshift({ mode: nextMode, time: this.simTime });
        if (this.modeTrace.length > MODE_TRACE_HISTORY_LIMIT) this.modeTrace.pop();
    }

    updateModeState({
        activeTouchCount = 0,
        meanRawTouch = 0,
        meanTouchOnset = 0,
        meanTouchNovelty = 0,
        arousal = 0,
        meanPredictionError = 0,
        sigmaDisplay = 1,
        tension = 0,
        residueLevel = 0,
        traceLevel = 0,
        priorBiasMean = 0,
        rewritePressureMean = 0,
        recentRewriteMean = 0,
    } = {}) {
        const touchPresence = activeTouchCount > 0 ? 1 : 0;
        const externalLevel = this.clampFinite(
            touchPresence * 0.45 + meanRawTouch * 0.9 + meanTouchOnset * 0.7 + meanTouchNovelty * 0.45,
            0,
            1,
            0,
        );
        if (externalLevel < MODE_EXTERNAL_QUIET_GATE) this.externalQuietFrames += 1;
        else this.externalQuietFrames = 0;

        const quietTime = this.clampFinite(this.externalQuietFrames / MODE_QUIET_TIME_FRAMES, 0, 1, 0);
        const arousalNorm = this.clampFinite(arousal * MODE_AROUSAL_NORM, 0, 1, 0);
        const predictionNorm = this.clampFinite(meanPredictionError * MODE_PREDICTION_NORM, 0, 1, 0);
        const sigmaDrift = this.clampFinite(Math.abs(sigmaDisplay - 1.0) * MODE_SIGMA_DRIFT_NORM, 0, 1, 0);
        const tensionNorm = this.clampFinite(tension, 0, 1, 0);
        const residueNorm = this.clampFinite(residueLevel * MODE_RESIDUE_NORM, 0, 1, 0);
        const traceNorm = this.clampFinite(traceLevel * MODE_TRACE_NORM, 0, 1, 0);
        const priorNorm = this.clampFinite(priorBiasMean * MODE_PRIOR_NORM, 0, 1, 0);
        const rewriteNorm = this.clampFinite(
            rewritePressureMean * MODE_REWRITE_PRESSURE_NORM + recentRewriteMean * MODE_RECENT_REWRITE_NORM,
            0,
            1,
            0,
        );
        const quietness = this.clampFinite(
            (1.0 - externalLevel) * 0.5 + (1.0 - arousalNorm) * 0.3 + (1.0 - tensionNorm) * 0.2,
            0,
            1,
            0,
        );
        const ember = this.clampFinite(
            residueNorm * 0.34 + traceNorm * 0.24 + priorNorm * 0.22 + rewriteNorm * 0.2,
            0,
            1,
            0,
        );

        const wakeTarget = this.clampFinite(
            0.12 + externalLevel * 0.42 + arousalNorm * 0.16 + predictionNorm * 0.12 + tensionNorm * 0.1 + sigmaDrift * 0.08,
            0,
            1,
            0,
        );
        const sleepTarget = this.clampFinite(
            0.08 + quietTime * 0.42 + quietness * 0.26 + (1.0 - ember) * 0.12 - externalLevel * 0.18,
            0,
            1,
            0,
        );
        const dreamTarget = this.clampFinite(
            0.06 + quietTime * 0.24 + quietness * 0.12 + ember * 0.44 + rewriteNorm * 0.08 - externalLevel * 0.22,
            0,
            1,
            0,
        );

        this.wakeDrive = this.clampFinite(this.wakeDrive * (1 - MODE_DRIVE_SMOOTHING) + wakeTarget * MODE_DRIVE_SMOOTHING, 0, 1, 0);
        this.sleepPressure = this.clampFinite(this.sleepPressure * (1 - MODE_DRIVE_SMOOTHING) + sleepTarget * MODE_DRIVE_SMOOTHING, 0, 1, 0);
        this.dreamPressure = this.clampFinite(this.dreamPressure * (1 - MODE_DRIVE_SMOOTHING) + dreamTarget * MODE_DRIVE_SMOOTHING, 0, 1, 0);

        const scores = {
            wake: this.wakeDrive,
            sleep: this.sleepPressure,
            dream: this.dreamPressure,
        };
        const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const [topMode, topScore] = ordered[0];
        const [, secondScore] = ordered[1];
        this.modeConfidence = this.clampFinite(topScore - secondScore, 0, 1, 0);

        const cooldownElapsed = this.simTime - this.lastModeChangeTime;
        const currentScore = scores[this.modeState] ?? 0;
        const thresholdMet =
            (topMode === 'wake' && topScore >= MODE_WAKE_THRESHOLD) ||
            (topMode === 'sleep' && topScore >= MODE_SLEEP_THRESHOLD) ||
            (topMode === 'dream' && topScore >= MODE_DREAM_THRESHOLD);

        if (
            topMode !== this.modeState &&
            cooldownElapsed >= MODE_TRANSITION_COOLDOWN &&
            thresholdMet &&
            topScore > currentScore + MODE_HYSTERESIS
        ) {
            this.noteModeTransition(topMode);
        }

        this.modePhase = (this.modePhase + 0.004 + topScore * 0.01) % 1;
        this.currentModeDynamics = MODE_DYNAMICS[this.modeState] ?? MODE_DYNAMICS.wake;
        return this.getModeDebugSummary();
    }

    applyDreamReplay(externalLevel) {
        this.dreamReplayActive = false;
        this.dreamReplayStrength = 0;
        if (this.modeState !== 'dream') return;
        if (this.dreamPressure < MODE_DREAM_THRESHOLD - 0.05) return;
        if (externalLevel > MODE_EXTERNAL_QUIET_GATE) return;

        const replayCandidates = [];
        for (let i = 0; i < this.numNodes; i++) {
            const residueSeed = this.clampFinite(this.activityResidue[i] / 1.25, 0, 1, 0);
            const traceSeed = this.clampFinite(this.touchTrace[i] / 4.0, 0, 1, 0);
            const priorSeed = this.clampFinite(this.priorBias[i] / REWRITE_PRIOR_LIMIT, 0, 1, 0);
            const rewriteSeed = this.clampFinite(this.recentRewriteMask[i] / REWRITE_COOLDOWN_FRAMES, 0, 1, 0);
            const score = residueSeed * 0.34 + traceSeed * 0.28 + priorSeed * 0.22 + rewriteSeed * 0.16;
            if (score >= MODE_DREAM_REPLAY_GATE) replayCandidates.push({ index: i, score });
        }

        replayCandidates.sort((a, b) => b.score - a.score);
        const replayGain = this.currentModeDynamics?.replayGain ?? 1.0;
        const chosen = replayCandidates.slice(0, MODE_DREAM_REPLAY_NODE_LIMIT);
        for (const candidate of chosen) {
            const replay = this.clampFinite(candidate.score * this.dreamPressure * replayGain * 0.03, 0, MODE_DREAM_REPLAY_LIMIT, 0);
            if (replay <= 0) continue;
            const idx = candidate.index;
            this.activityResidue[idx] = this.clampFinite(this.activityResidue[idx] + replay * 0.7, 0, 1.25, 0);
            this.touchProjection[idx] = this.clampFinite(this.touchProjection[idx] + replay * 0.5, -4.0, 4.0, 0);
            this.localPrediction[idx] = this.clampFinite(this.localPrediction[idx] + this.priorBias[idx] * replay * 0.08, -8.0, 8.0, 0);
            this.dreamReplayStrength += replay;
        }

        this.dreamReplayActive = this.dreamReplayStrength > 0;
        this.dreamReplayStrength = this.clampFinite(this.dreamReplayStrength, 0, MODE_DREAM_REPLAY_LIMIT * MODE_DREAM_REPLAY_NODE_LIMIT, 0);
    }

    decayStructuredPriorRewrite() {
        this.globalRewriteLoad = this.clampFinite(this.globalRewriteLoad * REWRITE_LOAD_DECAY, 0, 1, 0);
        for (let i = 0; i < this.numNodes; i++) {
            this.priorBias[i] = this.clampFinite(this.priorBias[i] * REWRITE_PRIOR_DECAY, 0, REWRITE_PRIOR_LIMIT, 0);
            this.rewritePressure[i] = this.clampFinite(this.rewritePressure[i] * REWRITE_PRESSURE_DECAY, 0, REWRITE_PRESSURE_LIMIT, 0);
            this.plasticityTrace[i] = this.clampFinite(this.plasticityTrace[i] * REWRITE_PLASTICITY_DECAY, 0, REWRITE_PLASTICITY_LIMIT, 0);
            if (this.recentRewriteMask[i] > 0) this.recentRewriteMask[i] -= 1;
        }
        for (const type of REWRITE_TYPES) {
            const channel = this.priorChannels[type];
            for (let i = 0; i < this.numNodes; i++) {
                channel[i] = this.clampFinite(channel[i] * REWRITE_PRIOR_DECAY, 0, REWRITE_CHANNEL_LIMIT, 0);
            }
        }
    }

    getRewriteLocalTouch(type, index) {
        if (type === 'novelty') return this.touchOnset[index] + this.touchNovelty[index] * 0.5;
        if (type === 'recurrence') return this.touchTrace[index] + this.rawTouch[index] * 0.25;
        if (type === 'persistence') return this.touchOffset[index] + this.touchTrace[index] * 0.6 + this.activityResidue[index] * 0.2;
        return Math.abs(this.touchProjection[index]) + this.touchNovelty[index] * 0.4 + this.rawTouch[index] * 0.3;
    }

    findRewriteCandidate(type, seedBias, tension) {
        const patternKey = REWRITE_PATTERN_SOURCES[type];
        const patternScore = this.clampFinite(this.touchPatternScores[patternKey] ?? 0, 0, 1, 0);
        if (patternScore < REWRITE_TOUCH_GATE || seedBias < REWRITE_SEED_GATE || tension < REWRITE_TENSION_GATE) return null;
        if (type === 'directionality' && this.touchDirectionVector.strength < REWRITE_DIRECTION_MIN_STRENGTH) return null;

        let best = null;
        const patternFactor = REWRITE_PATTERN_BASE + patternScore * REWRITE_PATTERN_SCALE;
        const seedFactor = REWRITE_SEED_BASE + seedBias * REWRITE_SEED_SCALE;
        const tensionFactor = REWRITE_TENSION_BASE + Math.min(tension, 1.0) * REWRITE_TENSION_SCALE;

        for (let i = 0; i < this.numNodes; i++) {
            const localTouchNorm = Math.min(Math.abs(this.getRewriteLocalTouch(type, i)), 1.5) / 1.5;
            if (localTouchNorm < 0.04) continue;
            const localErrorNorm = Math.min(Math.abs(this.predictionError[i]), 1.5) / 1.5;
            if (localErrorNorm < 0.06) continue;

            const composite = localErrorNorm * localTouchNorm * patternFactor * seedFactor * tensionFactor * (this.currentModeDynamics?.rewriteGain ?? 1.0);
            if (!Number.isFinite(composite) || composite <= 0) continue;

            this.rewritePressure[i] = this.clampFinite(
                this.rewritePressure[i] + composite * REWRITE_PRESSURE_GAIN * (1.0 - this.globalRewriteLoad * REWRITE_LOAD_DAMPING_FACTOR),
                0,
                REWRITE_PRESSURE_LIMIT,
                0,
            );
            if (composite > 0.07) {
                this.plasticityTrace[i] = this.clampFinite(this.plasticityTrace[i] + composite * REWRITE_PLASTICITY_GAIN, 0, REWRITE_PLASTICITY_LIMIT, 0);
            }

            if (this.recentRewriteMask[i] > 0) continue;
            if (
                composite < REWRITE_TRIGGER_SCORE ||
                this.rewritePressure[i] < REWRITE_TRIGGER_PRESSURE ||
                this.plasticityTrace[i] < REWRITE_TRIGGER_PLASTICITY
            ) {
                continue;
            }

            if (!best || composite > best.score) {
                best = {
                    node: i,
                    rewriteType: type,
                    score: composite,
                    patternScore,
                    seedBias,
                    tension,
                    localTouch: this.getRewriteLocalTouch(type, i),
                    localError: Math.abs(this.predictionError[i]),
                };
            }
        }

        return best;
    }

    applyDirectionalRewrite(centerIndex, delta) {
        const S = this.segments;
        const ci = Math.floor(centerIndex / S);
        const cj = centerIndex % S;
        const { dx, dy } = this.touchDirectionVector;
        const horizontalDominant = Math.abs(dx) > Math.abs(dy);
        const verticalDominant = Math.abs(dy) > Math.abs(dx);
        const balancedAxes = !horizontalDominant && !verticalDominant;
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const idx = ((ci + di + S) % S) * S + ((cj + dj + S) % S);
                const falloff = (di === 0 && dj === 0) ? 1.0 : REWRITE_DIRECTION_NEIGHBOR_FALLOFF;
                if (horizontalDominant || balancedAxes) {
                    if (dx >= 0) {
                        this.w_right[idx] += delta * falloff;
                        this.w_left[idx] -= delta * falloff * REWRITE_DIRECTION_COUNTER_DAMP;
                    } else {
                        this.w_left[idx] += delta * falloff;
                        this.w_right[idx] -= delta * falloff * REWRITE_DIRECTION_COUNTER_DAMP;
                    }
                }
                if ((verticalDominant || balancedAxes) && Math.abs(dy) > 0.001) {
                    if (dy >= 0) {
                        this.w_down[idx] += delta * falloff * REWRITE_DIRECTION_VERTICAL_STRENGTH;
                        this.w_up[idx] -= delta * falloff * REWRITE_DIRECTION_VERTICAL_COUNTER_DAMP;
                    } else {
                        this.w_up[idx] += delta * falloff * REWRITE_DIRECTION_VERTICAL_STRENGTH;
                        this.w_down[idx] -= delta * falloff * REWRITE_DIRECTION_VERTICAL_COUNTER_DAMP;
                    }
                }
                this.normalizeDirectionalWeights(idx);
            }
        }
    }

    logRewriteEvent(candidate, delta) {
        const event = {
            id: ++this.lastRewriteEventId,
            timestamp: this.simTime,
            node: candidate.node,
            region: {
                i: Math.floor(candidate.node / this.segments),
                j: candidate.node % this.segments,
            },
            rewriteType: candidate.rewriteType,
            triggerSummary: `err=${candidate.localError.toFixed(3)} touch=${candidate.localTouch.toFixed(3)} seed=${candidate.seedBias.toFixed(2)} tension=${candidate.tension.toFixed(2)}`,
            deltaMagnitude: Number(delta.toFixed(4)),
        };
        this.lastRewriteEvent = event;
        this.rewriteEvents.unshift(event);
        if (this.rewriteEvents.length > REWRITE_MAX_EVENTS) this.rewriteEvents.pop();
    }

    applyStructuredPriorRewrite(candidate) {
        const idx = candidate.node;
        const delta = this.clampFinite(
            (0.004 + candidate.score * 0.012) * (this.currentModeDynamics?.rewriteGain ?? 1.0),
            0.004,
            0.018,
            0.004,
        );
        const channel = this.priorChannels[candidate.rewriteType];
        channel[idx] = this.clampFinite(channel[idx] + delta, 0, REWRITE_CHANNEL_LIMIT, 0);
        this.priorBias[idx] = this.clampFinite(this.priorBias[idx] + delta * 0.7, 0, REWRITE_PRIOR_LIMIT, 0);

        if (candidate.rewriteType === 'novelty') {
            this.localPrediction[idx] = this.clampFinite(
                this.localPrediction[idx] + this.touchOnset[idx] * delta * REWRITE_NOVELTY_PREDICTION_FACTOR,
                -8.0,
                8.0,
                0,
            );
        } else if (candidate.rewriteType === 'recurrence') {
            this.touchTrace[idx] = this.clampFinite(this.touchTrace[idx] + this.touchNovelty[idx] * delta * REWRITE_RECURRENCE_TRACE_FACTOR, 0, 4.0, 0);
            this.touchProjection[idx] = this.clampFinite(this.touchProjection[idx] * (1.0 - delta * REWRITE_RECURRENCE_PROJECTION_DAMPING), -4.0, 4.0, 0);
        } else if (candidate.rewriteType === 'persistence') {
            this.activityResidue[idx] = this.clampFinite(
                this.activityResidue[idx] + (this.touchOffset[idx] + this.touchTrace[idx]) * delta * REWRITE_PERSISTENCE_RESIDUE_FACTOR,
                0,
                1.25,
                0,
            );
        } else if (candidate.rewriteType === 'directionality') {
            this.applyDirectionalRewrite(idx, delta * REWRITE_DIRECTIONALITY_WEIGHT_FACTOR);
        }

        this.rewritePressure[idx] = this.clampFinite(this.rewritePressure[idx] * REWRITE_POST_PRESSURE_FACTOR, 0, REWRITE_PRESSURE_LIMIT, 0);
        this.plasticityTrace[idx] = this.clampFinite(this.plasticityTrace[idx] * REWRITE_POST_PLASTICITY_FACTOR, 0, REWRITE_PLASTICITY_LIMIT, 0);
        this.recentRewriteMask[idx] = REWRITE_COOLDOWN_FRAMES;
        this.globalRewriteLoad = this.clampFinite(this.globalRewriteLoad + delta * REWRITE_GLOBAL_LOAD_FACTOR, 0, 1, 0);
        this.logRewriteEvent(candidate, delta);
    }

    buildRewriteDebugSummary(seedBiases) {
        let pressureSum = 0;
        let pressureMax = 0;
        let priorSum = 0;
        const channelSummary = { novelty: 0, recurrence: 0, persistence: 0, directionality: 0 };
        for (let i = 0; i < this.numNodes; i++) {
            pressureSum += this.rewritePressure[i];
            priorSum += this.priorBias[i];
            if (this.rewritePressure[i] > pressureMax) pressureMax = this.rewritePressure[i];
            for (const type of REWRITE_TYPES) channelSummary[type] += this.priorChannels[type][i];
        }
        const norm = Math.max(this.numNodes, 1);
        return {
            tendency: seedBiases.tendency,
            pressureMean: pressureSum / norm,
            pressureMax,
            priorBiasMean: priorSum / norm,
            globalLoad: this.globalRewriteLoad,
            priorBiasSummary: {
                novelty: channelSummary.novelty / norm,
                recurrence: channelSummary.recurrence / norm,
                persistence: channelSummary.persistence / norm,
                directionality: channelSummary.directionality / norm,
            },
            lastEvent: this.lastRewriteEvent,
        };
    }

    updateStructuredPriorRewrite() {
        this.decayStructuredPriorRewrite();
        const seedBiases = this.getRewriteSeedBiases();
        const tension = this.clampFinite(state.tensionLoad, 0, 1.5, 0);
        if (this.globalRewriteLoad < REWRITE_MAX_GLOBAL_LOAD) {
            const candidates = [];
            for (const type of REWRITE_TYPES) {
                const candidate = this.findRewriteCandidate(type, seedBiases[type], tension);
                if (candidate) candidates.push(candidate);
            }
            candidates.sort((a, b) => b.score - a.score);
            const chosen = candidates[0] ?? null;
            if (chosen) this.applyStructuredPriorRewrite(chosen);
        }
        return this.buildRewriteDebugSummary(seedBiases);
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

    // PR10-C: core dynamic step — spike detection, homeostatic damping, and wave propagation.
    updateDynamicsCore() {
        const freqRatio = (state.disk.omega_t - SCHUMANN_RES) / (GAMMA_SYNC - SCHUMANN_RES);
        const waveSpeed = 0.1 + 0.15 * freqRatio;
        const damping = 0.985 - (1.0 - PHI_INV) * 0.02 * (1.0 - freqRatio);

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
            this.w_up[i] *= 0.99995;
            this.w_down[i] *= 0.99995;
            this.w_left[i] *= 0.99995;
            this.w_right[i] *= 0.99995;
            const sum = this.w_up[i] + this.w_down[i] + this.w_left[i] + this.w_right[i];
            if (sum > 0.001) {
                const f = 4.0 / sum;
                const a = 0.01;
                this.w_up[i] += (this.w_up[i] * f - this.w_up[i]) * a;
                this.w_down[i] += (this.w_down[i] * f - this.w_down[i]) * a;
                this.w_left[i] += (this.w_left[i] * f - this.w_left[i]) * a;
                this.w_right[i] += (this.w_right[i] * f - this.w_right[i]) * a;
            }
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
                const idx = i * this.segments + j;
                const up = ((i - 1 + this.segments) % this.segments) * this.segments + j;
                const down = ((i + 1) % this.segments) * this.segments + j;
                const left = i * this.segments + ((j - 1 + this.segments) % this.segments);
                const right = i * this.segments + ((j + 1) % this.segments);

                let laplacian =
                    (this.w_down[up] * this.currentBuffer[up] * this.nodeSign[up]) +
                    (this.w_up[down] * this.currentBuffer[down] * this.nodeSign[down]) +
                    (this.w_right[left] * this.currentBuffer[left] * this.nodeSign[left]) +
                    (this.w_left[right] * this.currentBuffer[right] * this.nodeSign[right]) -
                    ((this.w_up[idx] + this.w_down[idx] + this.w_left[idx] + this.w_right[idx]) * this.currentBuffer[idx]);

                let nextVal = 2 * this.currentBuffer[idx] - this.prevBuffer[idx] + waveSpeed * laplacian;
                nextVal *= homeoDamping;
                if (nextVal > 8.0) nextVal = 8.0 + (nextVal - 8.0) * 0.01;
                if (nextVal < -8.0) nextVal = -8.0 + (nextVal + 8.0) * 0.01;
                this.nextBuffer[idx] = nextVal;
            }
        }

        const temp = this.prevBuffer;
        this.prevBuffer = this.currentBuffer;
        this.currentBuffer = this.nextBuffer;
        this.nextBuffer = temp;

        return { arousal, freqRatio };
    }

    // PR10-C: prediction/error, rewrite, and mode step after propagation has settled.
    updatePostPropagationState(perceptionState, ongoingState, coreState) {
        this.updatePredictionError();
        const rewriteDebug = this.updateStructuredPriorRewrite();
        let recentRewriteSum = 0;
        for (let i = 0; i < this.numNodes; i++) recentRewriteSum += this.recentRewriteMask[i];
        const modeDebug = this.updateModeState({
            activeTouchCount: perceptionState.activeTouchCount,
            meanRawTouch: perceptionState.meanRawTouch,
            meanTouchOnset: perceptionState.meanTouchOnset,
            meanTouchNovelty: perceptionState.meanTouchNovelty,
            arousal: coreState.arousal,
            meanPredictionError: this.computeMeanPredictionError(),
            sigmaDisplay: this.sigmaDisplay,
            tension: state.tensionLoad,
            residueLevel: ongoingState.residueLevel,
            traceLevel: perceptionState.meanTouchTrace,
            priorBiasMean: rewriteDebug.priorBiasMean,
            rewritePressureMean: rewriteDebug.pressureMean,
            recentRewriteMean: recentRewriteSum / this.numNodes,
        });
        return { rewriteDebug, modeDebug };
    }

    // PR10-C: geometry/render state step — body deformation and colour projection.
    updateRenderBuffers(diskNodeIdx) {
        for (let i = 0; i < this.numNodes; i++) {
            const val = this.currentBuffer[i];
            const trace = this.spikeTrace[i];
            const idx3 = i * 3;
            let r = 0;
            let g = 0;
            let b = 0;
            if (i === diskNodeIdx) {
                r = 1.0;
            } else {
                if (this.nodeType[i] === 1) {
                    r = 0.3 + trace * 1.5;
                    b = 0.1 + trace * 0.2;
                } else {
                    if (val > 0) {
                        r = val * 0.3 + trace;
                        g = 0.1 + val * 0.7 + trace;
                        b = 0.4 + val * 0.8 + trace;
                    } else {
                        r = -val * 0.4 + trace;
                        g = trace * 0.5;
                        b = 0.3 - val * 0.7 + trace;
                    }
                }
                if (this.largestClusterNodes[i] === 1) b += 0.5;
            }
            this.colors[idx3] = Math.min(Math.max(r, 0), 1.0);
            this.colors[idx3 + 1] = Math.min(Math.max(g, 0), 1.0);
            this.colors[idx3 + 2] = Math.min(Math.max(b, 0), 1.0);
            const d = val * 0.04 + trace * 0.06;
            this.vertexPositions[idx3] = this.basePositions[idx3] + this.normals[idx3] * d;
            this.vertexPositions[idx3 + 1] = this.basePositions[idx3 + 1] + this.normals[idx3 + 1] * d;
            this.vertexPositions[idx3 + 2] = this.basePositions[idx3 + 2] + this.normals[idx3 + 2] * d;
        }
    }

    // PR10-C: low-frequency derived state refresh.
    updateDerivedStateCaches(freqRatio) {
        this.phaseSpeed = 0.015 + 0.025 * freqRatio;
        for (let i = 0; i < this.numNodes; i++) {
            this.nodePhase[i] = (this.nodePhase[i] + this.phaseSpeed) % (Math.PI * 2);
        }

        if (this.simTime % 4 === 0) {
            this.cachedMaxClusterSize = this.computeLargestCluster();
            this.cachedPhiApprox = this.computeIntegrationProxy();
            this.cachedPhaseCoherence = this.computePhaseCoherence();
        }
    }

    updateDynamics(diskNodeIdx, activeTouches) {
        this.injectedNodes = [];
        this.simTime++;

        const touchState = activeTouches || new Map();
        const ongoingState = this.updateBaselineAndResidue();
        const perceptionState = this.updatePerceptionState(touchState);
        const coreState = this.updateDynamicsCore();
        const { rewriteDebug, modeDebug } = this.updatePostPropagationState(perceptionState, ongoingState, coreState);
        this.updateDerivedStateCaches(coreState.freqRatio);
        this.updateRenderBuffers(diskNodeIdx);
        this.autoPredictAndError();

        return {
            ignitionRatio: this.cachedMaxClusterSize / this.numNodes,
            phiApprox: this.cachedPhiApprox,
            phaseCoherence: this.cachedPhaseCoherence,
            meanPredictionError: this.computeMeanPredictionError(),
            meanLocalPredError: this.computeMeanLocalPredError(),
            arousal: coreState.arousal,
            sigmaDisplay: this.sigmaDisplay,
            firingRateError: this.firingRateError,
            baselineLevel: ongoingState.baselineLevel,
            residueLevel: ongoingState.residueLevel,
            // PR4: touch perception metrics
            meanRawTouch: perceptionState.meanRawTouch,
            meanTouchOnset: perceptionState.meanTouchOnset,
            meanTouchOffset: perceptionState.meanTouchOffset,
            meanTouchNovelty: perceptionState.meanTouchNovelty,
            activeTouchCount: perceptionState.activeTouchCount,
            // PR7: touch pattern metrics
            touchDuration:      this.touchDurationFrames,
            touchVelocity:      this.touchVelocityEstimate,
            touchRepeatCount:   this.touchRepeatCount,
            dominantPattern:    this.getDominantTouchPattern(),
            touchPatternScores: { ...this.touchPatternScores },
            rewriteTendency: rewriteDebug.tendency,
            rewritePressureMean: rewriteDebug.pressureMean,
            rewritePressureMax: rewriteDebug.pressureMax,
            priorBiasMean: rewriteDebug.priorBiasMean,
            priorBiasSummary: rewriteDebug.priorBiasSummary,
            globalRewriteLoad: rewriteDebug.globalLoad,
            lastRewriteEvent: rewriteDebug.lastEvent,
            modeState: modeDebug.modeState,
            modePhase: modeDebug.modePhase,
            wakeDrive: modeDebug.wakeDrive,
            sleepPressure: modeDebug.sleepPressure,
            dreamPressure: modeDebug.dreamPressure,
            modeConfidence: modeDebug.modeConfidence,
            lastModeChangeTime: modeDebug.lastModeChangeTime,
            lastModeChangeFrames: modeDebug.lastModeChangeFrames,
            dreamReplayActive: modeDebug.dreamReplayActive,
            dreamReplayStrength: modeDebug.dreamReplayStrength,
        };
    }
}
