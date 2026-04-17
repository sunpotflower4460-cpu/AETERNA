import { PHI } from '../constants/aeternaConstants.js';
import { state } from '../organism/state.js';
import { MODE_DYNAMICS } from './aeternaTuning.ts';
import { autoPredictAndError, injectPredictionError, runTorusDynamicsStage, triggerNoise, updatePredictionError } from './torusDynamics.ts';
import { computeIntegrationProxy, computeLargestCluster, computeMeanLocalPredError, computeMeanPredictionError, computePhaseCoherence, runTorusMetricsStage, updateDerivedStateCaches } from './torusMetrics.ts';
import { generateNetworkGeometry, updateNetworkRadius, updateRenderBuffers } from './torusGeometry.ts';
import { injectSTDPExternal, normalizeDirectionalWeights } from './torusWeights.ts';
import { runBaselineActivityStage, updateBaseline, updateResidue } from '../mode/baselineActivity.ts';
import { buildPredictionPacket, runLocalPredictorStage, updateLocalPrediction } from '../perception/localPredictor.ts';
import { addGaussianTouch, captureTouchSensoryInput, finalizeTouchSensoryStage, mapTouchToSurfaceIndex, projectTouchToNetwork, updateRawTouchField, updateTouchPerception } from '../perception/touchSensory.ts';
import { applyTouchPatternStage, getDominantPatternFromScores, runTouchPatternStage } from '../perception/touchPattern.ts';
import { runActionDecisionStage, applyActionToDynamics, getActionDebugSummary, updateActionState } from '../organism/actionDecision.ts';
import { runModeControllerStage, applyDreamReplay, getModeDebugSummary, noteModeTransition, updateModeState } from '../mode/modeController.ts';
import { runPriorRewriteStage, buildRewriteDebugSummary, decayStructuredPriorRewrite, findRewriteCandidate, getRewriteLocalTouch, getRewriteSeedBiases, applyDirectionalRewrite, applyStructuredPriorRewrite, logRewriteEvent, updateStructuredPriorRewrite } from '../organism/priorRewrite.ts';
import { runBodyStateStage, getOrganismDebugSummary, recordOrganismSnapshot, updateOrganismState } from '../organism/bodyState.ts';
import { computeTouchCentroid, updateTouchPatternScores, updateTouchSequenceFeatures } from '../perception/touchPatterns.ts';

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
        this.cachedRecentRewriteMean = 0;
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
    updateBaselineAndResidue() { return runBaselineActivityStage(this); }
    updateLocalPrediction() { runLocalPredictorStage(this); }
    mapTouchToSurfaceIndex(xNorm, yNorm) { return mapTouchToSurfaceIndex(this, xNorm, yNorm); }
    addGaussianTouch(centerIdx, pressure) { addGaussianTouch(this, centerIdx, pressure); }
    updateRawTouchField(activeTouches) { updateRawTouchField(this, activeTouches); }
    updateTouchPerception() { updateTouchPerception(this); }
    projectTouchToNetwork() { projectTouchToNetwork(this); }
    computeTouchCentroid(activeTouches) { return computeTouchCentroid(this, activeTouches); }
    updateTouchSequenceFeatures(activeTouches) { updateTouchSequenceFeatures(this, activeTouches); }
    updateTouchPatternScores() { updateTouchPatternScores(this); }
    getDominantTouchPattern() { return getDominantPatternFromScores(this.touchPatternScores); }
    applyTouchPatternModulation() { applyTouchPatternStage(this); }
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
    updateDynamicsCore() { return runTorusDynamicsStage(this); }
    updateRenderBuffers(diskNodeIdx) { updateRenderBuffers(this, diskNodeIdx); }
    updateDerivedStateCaches(freqRatio) { updateDerivedStateCaches(this, freqRatio); }

    isHubNode(index) {
        for (let k = 0; k < this.octahedronHubs.length; k++) {
            if (this.octahedronHubs[k].nodeIndex === index) return true;
        }
        return false;
    }

    updatePerceptionState(activeTouches) {
        const touchInputPacket = captureTouchSensoryInput(this, activeTouches);
        runLocalPredictorStage(this);
        const touchPatternPacket = runTouchPatternStage(this, activeTouches);
        return finalizeTouchSensoryStage(this, touchInputPacket, touchPatternPacket);
    }

    updatePostPropagationState(perceptionPacket, baselinePacket, dynamicsPacket) {
        const predictionPacket = buildPredictionPacket(this);
        const rewritePacket = runPriorRewriteStage(this);
        const organismPacket = runBodyStateStage(this, {
            touchPacket: perceptionPacket,
            dynamicsPacket,
            baselinePacket,
            predictionPacket,
            rewritePacket,
        });
        const modePacket = runModeControllerStage(this, {
            touchPacket: perceptionPacket,
            dynamicsPacket,
            baselinePacket,
            predictionPacket,
            rewritePacket,
            tension: state.tensionLoad,
        });
        const actionPacket = runActionDecisionStage(this, {
            touchPacket: perceptionPacket,
            organismPacket,
        });
        return {
            predictionPacket,
            rewritePacket,
            organismPacket,
            modePacket,
            actionPacket,
        };
    }

    updateDynamics(diskNodeIdx, activeTouches) {
        this.injectedNodes = [];
        this.simTime++;

        const touchState = activeTouches || new Map();

        // update order: baseline/residue → touch sensory input → local predictor → touch pattern → touch percept packet → torus dynamics → prediction/rewrite → organism → mode → action → metrics → render
        const baselinePacket = runBaselineActivityStage(this);
        const perceptionPacket = this.updatePerceptionState(touchState);
        const dynamicsPacket = runTorusDynamicsStage(this);
        const {
            predictionPacket,
            rewritePacket,
            organismPacket,
            modePacket,
            actionPacket,
        } = this.updatePostPropagationState(perceptionPacket, baselinePacket, dynamicsPacket);
        const metricsPacket = runTorusMetricsStage(this, dynamicsPacket);
        this.updateRenderBuffers(diskNodeIdx);
        this.autoPredictAndError();

        return {
            ignitionRatio: metricsPacket.clusterRatio,
            phiApprox: metricsPacket.phiProxy,
            phaseCoherence: metricsPacket.phaseCoherence,
            meanPredictionError: predictionPacket.meanPredictionError,
            meanLocalPredError: predictionPacket.meanLocalPredictionError,
            arousal: metricsPacket.arousal,
            sigmaDisplay: metricsPacket.sigma,
            firingRateError: metricsPacket.firingRateError,
            baselineLevel: baselinePacket.baselineLevel,
            residueLevel: baselinePacket.residueLevel,
            meanRawTouch: perceptionPacket.rawTouchMean,
            meanTouchOnset: perceptionPacket.onsetMean,
            meanTouchOffset: perceptionPacket.offsetMean,
            meanTouchNovelty: perceptionPacket.noveltyMean,
            activeTouchCount: perceptionPacket.activeTouchCount,
            touchDuration: perceptionPacket.touchDuration,
            touchVelocity: perceptionPacket.touchVelocity,
            touchRepeatCount: perceptionPacket.touchRepeatCount,
            dominantPattern: perceptionPacket.dominantPattern,
            touchPatternScores: { ...perceptionPacket.patternScores },
            rewriteTendency: rewritePacket.dominantRewriteTendency,
            rewritePressureMean: rewritePacket.rewritePressureMean,
            rewritePressureMax: rewritePacket.rewritePressureMax,
            priorBiasMean: rewritePacket.priorBiasMean,
            priorBiasSummary: rewritePacket.priorBiasSummary,
            globalRewriteLoad: rewritePacket.globalRewriteLoad,
            lastRewriteEvent: rewritePacket.lastRewriteEvent,
            modeState: modePacket.modeState,
            modePhase: modePacket.modePhase,
            wakeDrive: modePacket.wakeDrive,
            sleepPressure: modePacket.sleepPressure,
            dreamPressure: modePacket.dreamPressure,
            modeConfidence: modePacket.modeConfidence,
            lastModeChangeTime: modePacket.lastModeChangeTime,
            lastModeChangeFrames: modePacket.lastModeChangeFrames,
            dreamReplayActive: modePacket.dreamReplayActive,
            dreamReplayStrength: modePacket.dreamReplayStrength,
            energy: organismPacket.energy,
            stability: organismPacket.stability,
            overload: organismPacket.overload,
            restDrive: organismPacket.restDrive,
            orientingDrive: organismPacket.orientingDrive,
            actionState: actionPacket.actionState,
            actionPulseLevel: actionPacket.actionPulseLevel,
            actionDirection: actionPacket.actionDirection,
            lastActionChangeTime: actionPacket.lastActionChangeTime,
            lastActionChangeFrames: actionPacket.lastActionChangeFrames,
            lastTouchDirection: perceptionPacket.lastTouchDirection,
        };
    }
}
