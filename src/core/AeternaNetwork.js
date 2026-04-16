import { PHI } from '../constants/aeternaConstants.js';
import { state } from '../organism/state.js';
import { MODE_DYNAMICS, REWRITE_TYPES, TOUCH_PROJ_BASE_GAIN } from './aeternaTuning.ts';
import { updateDynamicsCore, updateBaseline, updateBaselineAndResidue, updatePredictionError, updateResidue, autoPredictAndError, injectPredictionError, triggerNoise } from './dynamicCore.ts';
import { computeIntegrationProxy, computeLargestCluster, computeMeanLocalPredError, computeMeanPredictionError, computePhaseCoherence, updateDerivedStateCaches } from './derivedMetrics.ts';
import { generateNetworkGeometry, updateNetworkRadius, updateRenderBuffers } from './networkGeometry.ts';
import { injectSTDPExternal, normalizeDirectionalWeights } from './networkWeights.ts';
import { updateLocalPrediction } from '../perception/localPrediction.ts';
import { addGaussianTouch, mapTouchToSurfaceIndex, projectTouchToNetwork, updateRawTouchField, updateTouchPerception } from '../perception/touchPerception.ts';
import { applyTouchPatternModulation, computeTouchCentroid, getDominantTouchPattern, updateTouchPatternScores, updateTouchSequenceFeatures } from '../perception/touchPatterns.ts';
import { applyActionToDynamics, getActionDebugSummary, updateActionState } from '../organism/actionState.ts';
import { applyDreamReplay, getModeDebugSummary, noteModeTransition, updateModeState } from '../organism/modeState.ts';
import { buildRewriteDebugSummary, decayStructuredPriorRewrite, findRewriteCandidate, getRewriteLocalTouch, getRewriteSeedBiases, applyDirectionalRewrite, applyStructuredPriorRewrite, logRewriteEvent, updateStructuredPriorRewrite } from '../organism/rewrite.ts';
import { getOrganismDebugSummary, recordOrganismSnapshot, updateOrganismState } from '../organism/survivalState.ts';

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
        this.initializeOrganismActionState();
        this.initializeTemporaryWorkBuffers();

        this.generate();
    }

    initializeGeometryRenderState() {
        this.basePositions = new Float32Array(this.numNodes * 3);
        this.vertexPositions = new Float32Array(this.numNodes * 3);
        this.normals = new Float32Array(this.numNodes * 3);
        this.colors = new Float32Array(this.numNodes * 3);
    }

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

    initializeSensoryPerceptualState() {
        this.rawTouch = new Float32Array(this.numNodes);
        this.touchOnset = new Float32Array(this.numNodes);
        this.touchOffset = new Float32Array(this.numNodes);
        this.touchTrace = new Float32Array(this.numNodes);
        this.touchNovelty = new Float32Array(this.numNodes);
        this.touchProjection = new Float32Array(this.numNodes);
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

    initializePredictionState() {
        this.localPrediction = new Float32Array(this.numNodes);
        this.predictionError = new Float32Array(this.numNodes);
        this.predictionHistory = new Float32Array(this.numNodes);
        this.AUTO_ERROR_THRESHOLD = 2.0;
    }

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

    initializeOrganismActionState() {
        this.energy = 0.62;
        this.stability = 0.58;
        this.overload = 0.08;
        this.restDrive = 0.22;
        this.orientingDrive = 0.18;
        this.comfortBias = 0.5;
        this.organismStateHistory = [{
            time: 0,
            energy: this.energy,
            stability: this.stability,
            overload: this.overload,
            restDrive: this.restDrive,
            orientingDrive: this.orientingDrive,
        }];
        this.actionState = 'idle';
        this.actionPulseLevel = 0;
        this.actionDirection = null;
        this.lastActionChangeTime = 0;
    }

    initializeTemporaryWorkBuffers() {
        this.largestClusterNodes = new Uint8Array(this.numNodes);
        this.injectedNodes = [];
        this.cachedMaxClusterSize = 0;
        this.cachedPhiApprox = 0;
        this.cachedPhaseCoherence = 0;
    }

    clampFinite(value, min, max, fallback = 0) {
        if (!Number.isFinite(value)) return fallback;
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    clamp01(value, fallback = 0) {
        return this.clampFinite(value, 0, 1, fallback);
    }

    getTouchDirectionArray(direction = this.touchDirectionVector) {
        if (!direction || direction.strength <= 0.001) return null;
        return [direction.dx, direction.dy];
    }

    getActionEnergyGate() {
        const energy = Number.isFinite(this.energy) ? this.energy : 1.0;
        return this.clampFinite(0.25 + energy * 0.75, 0.25, 1.0, 1.0);
    }

    generate() { generateNetworkGeometry(this); }
    updateRadius(newR) { updateNetworkRadius(this, newR); }
    normalizeDirectionalWeights(index) { normalizeDirectionalWeights(this, index); }
    computeIntegrationProxy() { return computeIntegrationProxy(this); }
    computePhaseCoherence() { return computePhaseCoherence(this); }
    computeMeanPredictionError() { return computeMeanPredictionError(this); }
    computeLargestCluster() { return computeLargestCluster(this); }
    injectSTDPExternal(fromNode, toNode, deltaT) { injectSTDPExternal(this, fromNode, toNode, deltaT); }
    injectPredictionError(index) { injectPredictionError(this, index); }
    autoPredictAndError() { autoPredictAndError(this); }
    triggerNoise(tension, sigmaDisp) { triggerNoise(this, tension, sigmaDisp); }
    updateBaseline() { updateBaseline(this); }
    updateResidue() { updateResidue(this); }
    updateBaselineAndResidue() { return updateBaselineAndResidue(this); }
    updateLocalPrediction() { updateLocalPrediction(this); }
    mapTouchToSurfaceIndex(xNorm, yNorm) { return mapTouchToSurfaceIndex(this, xNorm, yNorm); }
    addGaussianTouch(centerIdx, pressure) { addGaussianTouch(this, centerIdx, pressure); }
    updateRawTouchField(activeTouches) { updateRawTouchField(this, activeTouches); }
    updateTouchPerception() { updateTouchPerception(this); }
    projectTouchToNetwork() { projectTouchToNetwork(this); }
    computeTouchCentroid(activeTouches) { return computeTouchCentroid(this, activeTouches); }
    updateTouchSequenceFeatures(activeTouches) { updateTouchSequenceFeatures(this, activeTouches); }
    updateTouchPatternScores() { updateTouchPatternScores(this); }
    getDominantTouchPattern() { return getDominantTouchPattern(this); }
    applyTouchPatternModulation() { applyTouchPatternModulation(this); }
    getRewriteSeedBiases() { return getRewriteSeedBiases(this); }
    getModeDebugSummary() { return getModeDebugSummary(this); }
    noteModeTransition(nextMode) { noteModeTransition(this, nextMode); }
    updateModeState(args) { return updateModeState(this, args); }
    recordOrganismSnapshot() { recordOrganismSnapshot(this); }
    updateOrganismState(args) { return updateOrganismState(this, args); }
    updateActionState(args) { return updateActionState(this, args); }
    applyActionToDynamics() { applyActionToDynamics(this); }
    getOrganismDebugSummary() { return getOrganismDebugSummary(this); }
    getActionDebugSummary() { return getActionDebugSummary(this); }
    applyDreamReplay(externalLevel) { applyDreamReplay(this, externalLevel); }
    decayStructuredPriorRewrite() { decayStructuredPriorRewrite(this); }
    getRewriteLocalTouch(type, index) { return getRewriteLocalTouch(this, type, index); }
    findRewriteCandidate(type, seedBias, tension) { return findRewriteCandidate(this, type, seedBias, tension); }
    applyDirectionalRewrite(centerIndex, delta) { applyDirectionalRewrite(this, centerIndex, delta); }
    logRewriteEvent(candidate, delta) { logRewriteEvent(this, candidate, delta); }
    applyStructuredPriorRewrite(candidate) { applyStructuredPriorRewrite(this, candidate); }
    buildRewriteDebugSummary(seedBiases) { return buildRewriteDebugSummary(this, seedBiases); }
    updateStructuredPriorRewrite() { return updateStructuredPriorRewrite(this); }
    updatePredictionError() { updatePredictionError(this); }
    computeMeanLocalPredError() { return computeMeanLocalPredError(this); }
    updateDynamicsCore() { return updateDynamicsCore(this); }
    updateRenderBuffers(diskNodeIdx) { updateRenderBuffers(this, diskNodeIdx); }
    updateDerivedStateCaches(freqRatio) { updateDerivedStateCaches(this, freqRatio); }

    isHubNode(index) {
        for (let k = 0; k < this.octahedronHubs.length; k++) {
            if (this.octahedronHubs[k].nodeIndex === index) return true;
        }
        return false;
    }

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
            (activeTouchCount > 0 ? 0.45 : 0) + (replayRawTouchSum / this.numNodes) * 0.9 + (replayOnsetSum / this.numNodes) * 0.7 + (replayNoveltySum / this.numNodes) * 0.45,
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

    updatePostPropagationState(perceptionState, ongoingState, coreState) {
        this.updatePredictionError();
        const rewriteDebug = this.updateStructuredPriorRewrite();
        let recentRewriteSum = 0;
        for (let i = 0; i < this.numNodes; i++) recentRewriteSum += this.recentRewriteMask[i];
        this.updateOrganismState({
            activeTouchCount: perceptionState.activeTouchCount,
            meanRawTouch: perceptionState.meanRawTouch,
            meanTouchOnset: perceptionState.meanTouchOnset,
            meanTouchNovelty: perceptionState.meanTouchNovelty,
            meanTouchTrace: perceptionState.meanTouchTrace,
            arousal: coreState.arousal,
            meanPredictionError: this.computeMeanPredictionError(),
            residueLevel: ongoingState.residueLevel,
            rewritePressureMean: rewriteDebug.pressureMean,
            globalRewriteLoad: rewriteDebug.globalLoad,
        });
        this.updateActionState({
            activeTouchCount: perceptionState.activeTouchCount,
            meanRawTouch: perceptionState.meanRawTouch,
            meanTouchNovelty: perceptionState.meanTouchNovelty,
            meanTouchTrace: perceptionState.meanTouchTrace,
        });
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
        this.applyActionToDynamics();
        return {
            rewriteDebug,
            modeDebug,
            organismDebug: this.getOrganismDebugSummary(),
            actionDebug: this.getActionDebugSummary(),
        };
    }

    updateDynamics(diskNodeIdx, activeTouches) {
        this.injectedNodes = [];
        this.simTime++;

        const touchState = activeTouches || new Map();

        // update order: baseline/residue → perception → core propagation → prediction/rewrite → organism/action/mode → derived metrics → render buffers
        const ongoingState = this.updateBaselineAndResidue();
        const perceptionState = this.updatePerceptionState(touchState);
        const coreState = this.updateDynamicsCore();
        const { rewriteDebug, modeDebug, organismDebug, actionDebug } = this.updatePostPropagationState(perceptionState, ongoingState, coreState);
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
            meanRawTouch: perceptionState.meanRawTouch,
            meanTouchOnset: perceptionState.meanTouchOnset,
            meanTouchOffset: perceptionState.meanTouchOffset,
            meanTouchNovelty: perceptionState.meanTouchNovelty,
            activeTouchCount: perceptionState.activeTouchCount,
            touchDuration: this.touchDurationFrames,
            touchVelocity: this.touchVelocityEstimate,
            touchRepeatCount: this.touchRepeatCount,
            dominantPattern: this.getDominantTouchPattern(),
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
            energy: organismDebug.energy,
            stability: organismDebug.stability,
            overload: organismDebug.overload,
            restDrive: organismDebug.restDrive,
            orientingDrive: organismDebug.orientingDrive,
            actionState: actionDebug.actionState,
            actionPulseLevel: actionDebug.actionPulseLevel,
            actionDirection: actionDebug.actionDirection,
            lastActionChangeTime: actionDebug.lastActionChangeTime,
            lastActionChangeFrames: actionDebug.lastActionChangeFrames,
            lastTouchDirection: this.getTouchDirectionArray(),
        };
    }
}
