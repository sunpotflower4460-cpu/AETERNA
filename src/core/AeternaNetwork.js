import { PHI } from '../constants/aeternaConstants.js';
import { state } from '../organism/state.js';
import { MODE_DYNAMICS } from './aeternaTuning.ts';
import { clampFinite, clamp01 } from './coreConstants.ts';
import { autoPredictAndError, injectPredictionError, runTorusDynamicsStage, triggerNoise, updatePredictionError } from './torusDynamics.ts';
import { computeIntegrationProxy, computeLargestCluster, computeMeanLocalPredError, computeMeanPredictionError, computePhaseCoherence, runTorusMetricsStage, updateDerivedStateCaches } from './torusMetrics.ts';
import { buildDormantDebugSummary, initializeDormantNodes, updateDormantNodes } from './dormantNodes.ts';
import { generateNetworkGeometry, setNetworkTorusMetricMode, updateNetworkRadius, updateRenderBuffers } from './torusGeometry.ts';
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
import { createSoundSensoryController, updateSoundSensory } from '../perception/soundSensory.ts';
import { createLightSensoryController, updateLightSensory } from '../perception/lightSensory.ts';
import { createMotionSensoryController, updateMotionSensory } from '../perception/motionSensory.ts';
import { createTimeSensoryController, updateTimeSensory } from '../perception/timeSensory.ts';
import { createInitialEnergyFlowState, updateEnergyFlowState, getEnergyFlowDebugSummary } from '../organism/energyFlow.ts';
import { createInitialLivingState, updateLivingState, getLivingStateDebug, getLivingStateInfluence } from '../organism/livingState.ts';
import { createTouchExpectationState, updateTouchExpectation, computeTouchSurprise, updateTouchHabituation, getTouchExpectationDebug, getTouchExpectationInfluence } from '../perception/touchExpectation.ts';
import { createInitialHomeostaticState, updateHomeostaticState, getHomeostaticDebugSummary, getHomeostaticInfluence } from '../organism/survivalState.ts';
import { createDynamicsEngine } from './DynamicsEngine.ts';
import { createPredictionCore } from './PredictionCore.ts';
import { createPlasticityEngine } from './PlasticityEngine.ts';
import { createNoiseField } from './NoiseField.ts';
import { createOrganismRuntime } from './OrganismRuntime.ts';
import { runInteroceptionStage } from '../stages/runInteroceptionStage.ts';
import { runSelfWorldModelStage } from '../stages/runSelfWorldModelStage.ts';
import { deriveFeltState } from '../organism/deriveFeltState.ts';
import { deriveArousalAwareness } from '../organism/deriveArousalAwareness.ts';
import { deriveTraceState } from '../organism/deriveTraceState.ts';
import { deriveNeedMotivation } from '../organism/deriveNeedMotivation.ts';
import { deriveOpenStateSnapshot } from '../organism/deriveOpenStateSnapshot.ts';
import { classifyCollapseMode, classifyRecoveryTrajectory, deriveRecoveryState } from '../organism/deriveRecoveryState.ts';
import { derivePressureCompetition } from '../organism/derivePressureCompetition.ts';
import { deriveBodySurfaceState } from '../body/deriveBodySurfaceState.ts';
import { deriveActuationPulse } from '../actuation/deriveActuationPulse.ts';
import { derivePerturbationEvent } from '../perception/derivePerturbationEvent.ts';
import { derivePredictionMismatch } from '../prediction/derivePredictionMismatch.ts';
import { updateWorldMedium } from '../world/updateWorldMedium.ts';
import { deriveSensoryReturn } from '../perception/deriveSensoryReturn.ts';
import { deriveReafferenceComparison } from '../closure/deriveReafferenceComparison.ts';
import { deriveBodyWorldClosureState } from '../closure/deriveBodyWorldClosureState.ts';
import { deriveMediumProfileState } from '../closure/deriveMediumProfileState.ts';
import {
    computeBeautifulLoopModulation,
    smoothModulation,
    clampModulation,
    createDefaultModulationConfig,
    createZeroModulation,
} from './beautifulLoopModulation.ts';
import {
    defaultTorusMetricConfig,
    normalizeTorusMetricConfig,
} from '../config/torusMetricConfig.ts';
import { deriveTorusCurvatureObservation } from '../observer/deriveTorusCurvatureObservation.ts';
import { createComplexFieldState } from './complexField.ts';
import { updateComplexField } from './updateComplexField.ts';
import { deriveVortexCandidates } from '../observer/deriveVortexCandidates.ts';
import { defaultComplexFieldConfig } from '../types/complexField.ts';

export class AeternaNetwork {
    constructor(segments = 72) {
        this.segments = segments;
        this.numNodes = segments * segments;
        this.R = PHI;
        this.r = 1.0;
        this.torusMetricConfig = normalizeTorusMetricConfig({
            ...defaultTorusMetricConfig,
            majorRadius: this.R,
            minorRadius: this.r,
        });
        this.torusMetricMode = this.torusMetricConfig.metricMode;

        this.initializeGeometryRenderState();
        this.initializeCoreDynamicState();
        this.initializeComplexFieldObserverState();
        this.initializeStructuralState();
        this.initializeSensoryPerceptualState();
        this.initializePredictionState();
        this.initializePlasticityRewriteState();
        this.initializeModeOngoingLifeState();
        this.initializeOrganismActionState();
        this.initializeEnergyFlowState();
        this.initializeLivingState();
        this.initializeTouchExpectationState();
        this.initializeTouchBackactionState();
        this.initializeHomeostaticState();
        this.initializeBeautifulLoopState();
        this.initializeTemporaryWorkBuffers();
        this.initializeEngines();

        this.generate();
    }

    initializeEngines() {
        // Phase 5: Initialize separated engines
        // These engines will gradually take over responsibilities from AeternaNetwork
        this.dynamicsEngine = createDynamicsEngine();
        this.predictionCore = createPredictionCore();
        this.plasticityEngine = createPlasticityEngine();
        this.noiseField = createNoiseField();
        this.organismRuntime = createOrganismRuntime({
            dynamicsEngine: this.dynamicsEngine,
            predictionCore: this.predictionCore,
            plasticityEngine: this.plasticityEngine,
            noiseField: this.noiseField,
        });
    }

    initializeGeometryRenderState() {
        this.basePositions = new Float32Array(this.numNodes * 3);
        this.vertexPositions = new Float32Array(this.numNodes * 3);
        this.normals = new Float32Array(this.numNodes * 3);
        this.colors = new Float32Array(this.numNodes * 3);
        this.curvedTorusGeometry = null;
        this.torusGeometry = null;
        this.lastTorusCurvatureObservation = null;
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

    initializeComplexFieldObserverState() {
        const initialState = createComplexFieldState({
            segments: this.segments,
            seed: this.segments,
            initialAmplitude: 0.01,
        });
        this.fieldRuntimeMode = 'scalar';
        this.complexFieldConfig = { ...defaultComplexFieldConfig };
        this.complexFieldState = initialState;
        this.lastComplexFieldState = initialState;
        this.lastVortexObservationState = null;
        this.currentBufferReal = initialState.real;
        this.currentBufferImag = initialState.imag;
        this.previousBufferReal = initialState.previousReal;
        this.previousBufferImag = initialState.previousImag;
        this.complexAmplitude = initialState.amplitude;
        this.complexPhase = initialState.phase;
        this.phaseGradient = initialState.phaseGradient;
        this.vorticity = initialState.vorticity;
        this.topologicalCharge = initialState.topologicalCharge;
        this.vortexCandidate = initialState.vortexCandidate;
        this.complexFieldSeededFromScalar = false;
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
        this.dormantTraitMask = new Uint8Array(this.numNodes);
        this.isDormantNode = new Uint8Array(this.numNodes);
        this.dormantWakePressure = new Float32Array(this.numNodes);
        this.dormantWakeCooldown = new Float32Array(this.numNodes);
        this.recentDormantWakeEvents = [];
        this.totalDormantNodeCount = 0;
        this.totalDormantWakeCount = 0;
        this.activeDormantNodeCount = 0;
        this.hardwareRandomNoiseSource = 'uninitialized';
        this.lastNoiseMagnitude = 0;
        this.lastNoiseEventCount = 0;
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
        this.soundSensory = createSoundSensoryController();
        this.lastSoundPerceptPacket = { ...this.soundSensory.packet };
        this.soundLevel = 0;
        this.soundDelta = 0;
        this.soundBandLow = 0;
        this.soundBandMid = 0;
        this.soundBandHigh = 0;
        this.soundNovelty = 0;
        this.soundPersistence = 0;
        this.soundRecurrence = 0;
        this.soundDirectionality = 0;
        this.soundActive = false;
        this.lightSensory = createLightSensoryController();
        this.lightLevel = 0;
        this.lightDelta = 0;
        this.lightNovelty = 0;
        this.lightPersistence = 0;
        this.lightActive = false;
        this.motionSensory = createMotionSensoryController();
        this.motionLevel = 0;
        this.motionDelta = 0;
        this.motionNovelty = 0;
        this.motionPersistence = 0;
        this.motionActive = false;
        this.timeSensory = createTimeSensoryController();
        this.timePhase = 0;
        this.timeLevel = 0;
        this.timePersistence = 0;
        this.timeActive = true;
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

    initializeEnergyFlowState() {
        this.energyFlowState = createInitialEnergyFlowState();
    }

    initializeLivingState() {
        this.livingState = createInitialLivingState();
    }

    initializeTouchExpectationState() {
        this.touchExpectation = createTouchExpectationState(this.numNodes);
        this.touchSurpriseMetrics = {
            spatialSurprise: 0,
            temporalSurprise: 0,
            strengthSurprise: 0,
            missingTouchSurprise: 0,
            releaseSurprise: 0,
            totalSurprise: 0,
        };
    }

    initializeTouchBackactionState() {
        this.touchBackactionEnabled = true;
        this.familiarityBackactionEnabled = true;
        this.touchBackactionState = null;
        this.lastOpenStateSnapshot = null;
        this.lastFeltState = null;
        this.lastNeedMotivationState = null;
        this.lastPressureCompetitionState = null;
        this.lastBodySurfaceState = null;
        this.lastActuationPulse = null;
    }

    initializeHomeostaticState() {
        this.homeostaticState = createInitialHomeostaticState();
    }

    initializeBeautifulLoopState() {
        // Beautiful Loop L2: Observer packet state holders
        // These track previous frame packets to enable continuity calculation
        // and provide history for future modulation (L3+)
        this.lastInteroceptionPacket = null;
        this.lastSelfWorldModelPacket = null;

        // Beautiful Loop L3: Modulation state
        // Configuration for packet → organism modulation
        this.blModulationConfig = createDefaultModulationConfig();
        // Last modulation bundle for smoothing
        this.lastModulation = createZeroModulation();
        // Current modulation bundle (computed each frame)
        this.currentModulation = createZeroModulation();
        this.lastArousalAwarenessState = null;
        this.lastTraceState = null;
        this.recentPerturbationHistory = [];
        this.recentRecoveryHistory = [];
        this.recentPatternHistory = [];
        this.actuationPulseGeneratedCount = 0;
        this.actuationPulseNullCount = 0;
        this.actuationPulseChannelCounts = {
            visual: 0,
            simulatedForce: 0,
        };

        // W3+W4+W5: World Medium, Sensory Return, Reafference Comparison
        // World Medium state (simulated external environment)
        this.worldMediumState = {
            timestamp: 0,
            ambientLight: 0.5,
            ambientNoise: 0.2,
            surfaceResistance: 0.4,
            echoLevel: 0.25,
            motionDrift: 0.2,
            fieldTemperature: 0.35,
            feedbackDelay: 0.2,
            lastPulseImpact: 0,
            mediumStability: 0.7,
            visualResidue: 0,
            forceResidue: 0,
            worldTurbulence: 0.15,
            returnReadiness: 0.3,
        };
        this.previousWorldMediumState = null;
        this.lastSensoryReturnPackets = [];
        this.lastReafferenceComparisonState = null;
        this.lastBodyWorldClosureState = null;
        this.lastMediumProfileState = null;
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
        // Delegate to centralized helper
        return clampFinite(value, min, max, fallback);
    }

    clamp01(value, fallback = 0) {
        // Delegate to centralized helper
        return clamp01(value, fallback);
    }

    getTouchDirectionArray(direction = this.touchDirectionVector) {
        if (!direction || direction.strength <= 0.001) return null;
        return [direction.dx, direction.dy];
    }

    getActionEnergyGate() {
        const energy = Number.isFinite(this.energy) ? this.energy : 1.0;
        return this.clampFinite(0.25 + energy * 0.75, 0.25, 1.0, 1.0);
    }

    refreshTorusMetricObservation() {
        this.lastTorusCurvatureObservation = deriveTorusCurvatureObservation({
            geometry: this.torusGeometry,
            timestamp: this.simTime,
        });
        return this.lastTorusCurvatureObservation;
    }

    configureComplexField(config = {}) {
        this.complexFieldConfig = {
            ...this.complexFieldConfig,
            ...config,
        };
        return this.complexFieldConfig;
    }

    setFieldRuntimeMode(mode = 'scalar') {
        this.fieldRuntimeMode = mode;
        return this.fieldRuntimeMode;
    }

    resolveComplexFieldMode() {
        if (this.fieldRuntimeMode === 'complexRuntime') return 'runtime';
        if (this.fieldRuntimeMode === 'complexObserver') return 'observerOnly';
        if (this.complexFieldConfig.enabled) return this.complexFieldConfig.mode;
        return 'off';
    }

    seedComplexFieldFromScalar() {
        const amplitudeClamp = this.clampFinite(
            this.complexFieldConfig.amplitudeClamp ?? 5,
            0.25,
            64,
            5
        );
        const seedScale = Math.min(0.05, amplitudeClamp * 0.01);
        for (let i = 0; i < this.numNodes; i++) {
            const scalarValue = this.clampFinite(this.currentBuffer[i], -seedScale, seedScale, 0);
            const quietImag = Math.sin((i + 1) * 12.9898 + this.segments) * 0.0005;
            this.currentBufferReal[i] = scalarValue;
            this.currentBufferImag[i] = quietImag;
            this.previousBufferReal[i] = scalarValue;
            this.previousBufferImag[i] = quietImag;
        }
        this.complexFieldSeededFromScalar = true;
    }

    updateComplexFieldObservation() {
        const complexMode = this.resolveComplexFieldMode();
        if (complexMode === 'off') {
            return {
                complexMode: 'off',
                observation: null,
                vortexObservation: null,
                renderRefreshNeeded: false,
            };
        }

        if (!this.complexFieldSeededFromScalar) {
            this.seedComplexFieldFromScalar();
        }

        const config = {
            ...this.complexFieldConfig,
            enabled: true,
            mode: complexMode,
        };
        const nextState = updateComplexField({
            state: this.complexFieldState,
            config,
            timestamp: this.simTime,
            metricMode: this.torusMetricConfig.metricMode,
            geometry: this.torusGeometry,
            curvatureInfluence: this.torusMetricConfig.curvatureInfluence,
        });

        this.complexFieldState = nextState;
        this.lastComplexFieldState = nextState;
        this.currentBufferReal = nextState.real;
        this.currentBufferImag = nextState.imag;
        this.previousBufferReal = nextState.previousReal;
        this.previousBufferImag = nextState.previousImag;
        this.complexAmplitude = nextState.amplitude;
        this.complexPhase = nextState.phase;
        this.phaseGradient = nextState.phaseGradient;

        const vortexObservation = deriveVortexCandidates({
            timestamp: this.simTime,
            phase: nextState.phase,
            amplitude: nextState.amplitude,
            phaseGradient: nextState.phaseGradient,
            segments: this.segments,
        });

        const previousCandidates = new Map(
            (this.lastVortexObservationState?.candidates ?? []).map((candidate) => [
                `${candidate.regionId}:${candidate.topologicalCharge}`,
                candidate,
            ])
        );
        vortexObservation.candidates.forEach((candidate) => {
            const previousCandidate = previousCandidates.get(
                `${candidate.regionId}:${candidate.topologicalCharge}`
            );
            candidate.lifetimeTicks = previousCandidate
                ? (previousCandidate.lifetimeTicks ?? 1) + 1
                : 1;
        });

        this.lastVortexObservationState = vortexObservation;
        this.vorticity = vortexObservation.vorticity;
        this.topologicalCharge = vortexObservation.topologicalCharge;
        this.vortexCandidate = vortexObservation.vortexCandidateMask;
        this.complexFieldState = {
            ...nextState,
            vorticity: vortexObservation.vorticity,
            topologicalCharge: vortexObservation.topologicalCharge,
            vortexCandidate: vortexObservation.vortexCandidateMask,
            phaseUnwrapWarningCount: vortexObservation.phaseUnwrapWarningCount,
        };
        this.lastComplexFieldState = this.complexFieldState;

        let renderRefreshNeeded = false;
        if (complexMode === 'runtime') {
            const coupling = this.clampFinite(
                config.couplingToScalar,
                0,
                0.25,
                0
            );
            if (coupling > 0) {
                for (let i = 0; i < this.numNodes; i++) {
                    this.currentBuffer[i] = this.clampFinite(
                        this.currentBuffer[i] * (1 - coupling) + this.currentBufferReal[i] * coupling,
                        -8,
                        8,
                        this.currentBuffer[i]
                    );
                }
                renderRefreshNeeded = true;
            }
        }

        return {
            complexMode,
            observation: this.complexFieldState,
            vortexObservation,
            renderRefreshNeeded,
        };
    }

    generate() {
        generateNetworkGeometry(this);
        this.refreshTorusMetricObservation();
        initializeDormantNodes(this);
    }
    updateRadius(newR) {
        updateNetworkRadius(this, newR);
        this.refreshTorusMetricObservation();
    }
    setTorusMetricMode(metricMode) {
        const nextConfig = setNetworkTorusMetricMode(this, metricMode);
        this.refreshTorusMetricObservation();
        return nextConfig;
    }
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
        const perceptionPacket = finalizeTouchSensoryStage(this, touchInputPacket, touchPatternPacket);
        const soundController = updateSoundSensory(this.soundSensory);
        this.lastSoundPerceptPacket = { ...soundController.packet };
        this.soundLevel = this.lastSoundPerceptPacket.level;
        this.soundDelta = this.lastSoundPerceptPacket.delta;
        this.soundBandLow = this.lastSoundPerceptPacket.bandLow;
        this.soundBandMid = this.lastSoundPerceptPacket.bandMid;
        this.soundBandHigh = this.lastSoundPerceptPacket.bandHigh;
        this.soundNovelty = this.lastSoundPerceptPacket.novelty;
        this.soundPersistence = this.lastSoundPerceptPacket.persistence;
        this.soundRecurrence = this.lastSoundPerceptPacket.recurrence;
        this.soundDirectionality = this.lastSoundPerceptPacket.directionality;
        this.soundActive = this.lastSoundPerceptPacket.active;
        const lightController = updateLightSensory(this.lightSensory);
        this.lightLevel = lightController.packet.level;
        this.lightDelta = lightController.packet.delta;
        this.lightNovelty = lightController.packet.novelty;
        this.lightPersistence = lightController.packet.persistence;
        this.lightActive = lightController.packet.active;
        const motionController = updateMotionSensory(this.motionSensory);
        this.motionLevel = motionController.packet.level;
        this.motionDelta = motionController.packet.delta;
        this.motionNovelty = motionController.packet.novelty;
        this.motionPersistence = motionController.packet.persistence;
        this.motionActive = motionController.packet.active;
        const timeController = updateTimeSensory(this.timeSensory);
        this.timePhase = timeController.packet.phase;
        this.timeLevel = timeController.packet.level;
        this.timePersistence = timeController.packet.persistence;
        this.timeActive = timeController.packet.active;
        return perceptionPacket;
    }

    updatePostPropagationState(perceptionPacket, baselinePacket, dynamicsPacket) {
        const predictionPacket = buildPredictionPacket(this);
        const rewritePacket = runPriorRewriteStage(this);

        // Phase F: Update energy flow state based on sensory inputs and activity
        this.energyFlowState = updateEnergyFlowState(this.energyFlowState, {
            soundNovelty: this.soundNovelty,
            soundLevel: this.soundLevel,
            soundActive: this.soundActive,
            lightNovelty: this.lightNovelty,
            lightLevel: this.lightLevel,
            lightActive: this.lightActive,
            motionNovelty: this.motionNovelty,
            motionLevel: this.motionLevel,
            motionActive: this.motionActive,
            arousal: dynamicsPacket.arousal,
            sigma: dynamicsPacket.sigma,
            clusterRatio: dynamicsPacket.clusterRatio,
            meanActivity: (dynamicsPacket.arousal + baselinePacket.residueLevel) * 0.5,
            rewritePressureMean: rewritePacket.rewritePressureMean,
            globalRewriteLoad: rewritePacket.globalRewriteLoad,
            priorBiasMean: rewritePacket.priorBiasMean,
            numNodes: this.numNodes,
            simTime: this.simTime,
        });

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

    /**
     * Build OrganismSnapshot for Beautiful Loop packet generation
     * BL-L2: This snapshot provides minimal organism state to packet stages
     * without exposing full network internals.
     */
    buildOrganismSnapshot(organismPacket, predictionPacket, perceptionPacket) {
        return {
            timestamp: this.simTime,
            energy: organismPacket.energy,
            overload: organismPacket.overload,
            coherence: organismPacket.stability,
            boundary: this.homeostaticState?.boundaryIntegrity ?? 1.0,
            modeState: this.modeState,
            touchExpectationConfidence: this.touchExpectation?.touchExpectationConfidence ?? 0.5,
            recentPerturbationPressure: predictionPacket.meanPredictionError,
            meanPredictionError: predictionPacket.meanPredictionError,
            restorationBias: this.homeostaticState?.restorationBias ?? 0.5,
            coherenceMemory: this.livingState?.coherenceMemory ?? 0.5,
            recentTouchActivity: perceptionPacket.rawTouchMean,
            currentActivity: this.currGenFiring ?? 0,
            ignitionRatio: this.cachedMaxClusterSize ? this.cachedMaxClusterSize / this.numNodes : 0,
            recentTouchSurprise: this.touchSurpriseMetrics?.totalSurprise ?? 0,
        };
    }

    updateDynamics(diskNodeIdx, activeTouches) {
        this.injectedNodes = [];
        this.simTime++;

        const touchState = activeTouches || new Map();

        // update order: baseline/residue → touch sensory input → local predictor → touch pattern → touch percept packet → torus dynamics → prediction/rewrite → organism → mode → action → metrics → render
        const baselinePacket = runBaselineActivityStage(this);
        const perceptionPacket = this.updatePerceptionState(touchState);
        updateDormantNodes(this);
        const dynamicsPacket = runTorusDynamicsStage(this);
        const {
            predictionPacket,
            rewritePacket,
            organismPacket,
            modePacket,
            actionPacket,
        } = this.updatePostPropagationState(perceptionPacket, baselinePacket, dynamicsPacket);
        const metricsPacket = runTorusMetricsStage(this, dynamicsPacket);
        const dormantDebug = buildDormantDebugSummary(this);
        const torusCurvatureObservation = this.refreshTorusMetricObservation();
        this.updateRenderBuffers(diskNodeIdx);
        this.autoPredictAndError();

        // Beautiful Loop L2: Run observer packet stages
        // These generate interoception and self/world model packets
        const organismSnapshot = this.buildOrganismSnapshot(organismPacket, predictionPacket, perceptionPacket);
        const interoceptionPacket = runInteroceptionStage(organismSnapshot);
        const selfWorldModelPacket = runSelfWorldModelStage(interoceptionPacket, organismSnapshot, this.lastSelfWorldModelPacket);
        const feltState = deriveFeltState(
            organismSnapshot,
            this.livingState,
            this.homeostaticState,
            this.energyFlowState,
            selfWorldModelPacket
        );
        const arousalAwarenessState = deriveArousalAwareness(
            organismSnapshot,
            feltState,
            this.livingState,
            selfWorldModelPacket
        );

        // Q1-2: Maintain last mixed states for backaction derivation
        try {
            const neutralReplayState = {
                timestamp: this.simTime,
                replayPressure: 0,
                replayReadiness: 0,
                consolidationGain: 0,
                activeReplayCount: 0,
                recentReplaySalience: 0,
                restConsolidationDepth: 0,
                replaySuppression: 1,
                lastReplayCategory: null,
            };
            const needMotivation = deriveNeedMotivation(
                organismSnapshot,
                feltState,
                arousalAwarenessState,
                neutralReplayState,
                this.livingState,
                this.energyFlowState,
                this.homeostaticState,
                selfWorldModelPacket
            );
            this.lastNeedMotivationState = needMotivation;
            this.lastPressureCompetitionState = derivePressureCompetition(needMotivation);
            this.lastOpenStateSnapshot = deriveOpenStateSnapshot(
                feltState,
                arousalAwarenessState,
                needMotivation
            );
        } catch (e) {
            // keep previous mixed-state snapshot if derivation fails
        }

        this.lastFeltState = feltState;
        this.recentPerturbationHistory.push(predictionPacket.meanPredictionError || 0);
        if (this.recentPerturbationHistory.length > 180) this.recentPerturbationHistory.shift();

        const recoveryState = deriveRecoveryState({
            timestamp: this.simTime,
            meanPredictionError: predictionPacket.meanPredictionError,
            perturbationLoad: interoceptionPacket.perturbationPressure,
            boundaryIntegrity: this.homeostaticState?.boundaryIntegrity ?? 1,
            restorationBias: this.homeostaticState?.restorationBias ?? 0.5,
            stability: organismPacket.stability,
            overload: organismPacket.overload,
            depletion: feltState.depletion,
            selfPreservationBias: this.homeostaticState?.selfPreservationBias ?? 0.5,
            replaySuppression: 1 - arousalAwarenessState.salienceOpenness,
            touchOpennessDamping: 1 - feltState.openness,
            recentPerturbationHistory: this.recentPerturbationHistory,
        });
        const recoveryTrajectory = classifyRecoveryTrajectory(recoveryState, {
            stability: organismPacket.stability,
            boundaryIntegrity: this.homeostaticState?.boundaryIntegrity ?? 1,
        });
        const collapseMode = classifyCollapseMode(recoveryState, {
            meanActivity: metricsPacket.arousal,
            maxActivity: Math.abs(metricsPacket.sigma) * 8,
            boundaryIntegrity: this.homeostaticState?.boundaryIntegrity ?? 1,
        });
        const traceState = deriveTraceState({
            timestamp: this.simTime,
            recentPerturbationHistory: this.recentPerturbationHistory,
            mismatchHistory: this.recentPerturbationHistory,
            recoveryHistory: this.recentRecoveryHistory,
            repeatedPatternHistory: this.recentPatternHistory,
            externalInputLevel: perceptionPacket.rawTouchMean,
            arousalLevel: arousalAwarenessState.arousalLevel,
            awarenessWindow: arousalAwarenessState.awarenessWindow,
            restDepth: arousalAwarenessState.restDepth,
            settlingWindow: arousalAwarenessState.settlingWindow,
            restorationReadiness: feltState.restorationReadiness,
            boundaryIntegrity: feltState.boundaryIntegrity,
            collapseRisk: recoveryState.collapseRisk,
        });
        this.recentRecoveryHistory.push(recoveryState.recoveryPressure);
        if (this.recentRecoveryHistory.length > 180) this.recentRecoveryHistory.shift();
        this.recentPatternHistory.push(Math.min(1, (perceptionPacket.touchRepeatCount || 0) / 8));
        if (this.recentPatternHistory.length > 180) this.recentPatternHistory.shift();

        let actuationMismatchState = null;
        if ((perceptionPacket.activeTouchCount ?? 0) > 0 || (perceptionPacket.noveltyMean ?? 0) > 0.01) {
            try {
                const familiarity = this.touchExpectation
                    ? this.touchExpectation.touchHabituationField.reduce((a, b) => a + b, 0) / this.touchExpectation.touchHabituationField.length
                    : 0;
                const perturbEvent = derivePerturbationEvent('touch', perceptionPacket.rawTouchMean ?? 0, {
                    overload: organismPacket.overload ?? 0,
                    boundaryIntegrity: this.homeostaticState?.boundaryIntegrity ?? 0.8,
                    openness: feltState.openness ?? 0.5,
                    familiarity,
                    repetitionCount: familiarity * 10,
                    baselineLevel: baselinePacket.baselineLevel ?? 0,
                });
                actuationMismatchState = derivePredictionMismatch(perturbEvent, {
                    overload: organismPacket.overload ?? 0,
                    boundaryIntegrity: this.homeostaticState?.boundaryIntegrity ?? 0.8,
                    restorationBias: this.homeostaticState?.restorationBias ?? 0.5,
                    coherenceMemory: this.livingState?.coherenceMemory ?? 0.5,
                    stability: organismPacket.stability ?? 0.5,
                }, predictionPacket.meanPredictionError ?? 0);
            } catch (_e) {
                actuationMismatchState = null;
            }
        }

        this.lastBodySurfaceState = deriveBodySurfaceState({
            timestamp: this.simTime,
            recoveryState,
            mismatchState: actuationMismatchState,
            pressureState: this.lastPressureCompetitionState,
            traceState,
            meanActivity: metricsPacket.arousal,
            homeostaticBoundaryIntegrity: this.homeostaticState?.boundaryIntegrity,
            collapseRisk: this.homeostaticState?.collapseRisk,
            overload: organismPacket.overload ?? this.homeostaticState?.overloadLevel,
            recentPerturbationHistory: this.recentPerturbationHistory,
        });

        const quietness = clamp01(
            (1 - clampFinite((perceptionPacket.rawTouchMean ?? 0) / 1.2, 0, 1)) * 0.5 +
            arousalAwarenessState.restDepth * 0.25 +
            arousalAwarenessState.settlingWindow * 0.25
        );

        this.lastActuationPulse = deriveActuationPulse({
            timestamp: this.simTime,
            bodySurfaceState: this.lastBodySurfaceState,
            pressureState: this.lastPressureCompetitionState,
            recoveryState,
            traceState,
            mismatchState: actuationMismatchState,
            ongoingness: clamp01(
                organismPacket.stability * 0.35 +
                (1 - recoveryState.collapseRisk) * 0.45 +
                clampFinite((baselinePacket.baselineLevel ?? 0) / 0.2, 0, 1) * 0.2
            ),
            stability: organismPacket.stability,
            boundaryIntegrity: this.homeostaticState?.boundaryIntegrity ?? 1,
            collapseRisk: recoveryState.collapseRisk,
            overload: organismPacket.overload,
            quietness,
            meanActivity: metricsPacket.arousal,
        });

        if (this.lastActuationPulse) {
            this.actuationPulseGeneratedCount++;
            this.actuationPulseChannelCounts[this.lastActuationPulse.channel]++;
        } else {
            this.actuationPulseNullCount++;
        }

        // W3: Update World Medium (simulated external environment)
        // World receives Actuation Pulse and changes state accordingly
        const dt = 1 / 60; // Standard frame delta time
        this.previousWorldMediumState = this.worldMediumState;
        this.worldMediumState = updateWorldMedium(
            this.worldMediumState,
            this.lastActuationPulse,
            dt
        );

        // W4: Derive Sensory Return from World Medium state changes
        // Compare current and previous World Medium to generate sensory return packets
        this.lastSensoryReturnPackets = deriveSensoryReturn(
            this.worldMediumState,
            this.previousWorldMediumState,
            dt
        );

        // W5: Derive Reafference Comparison
        // Compare Actuation Pulse (what was sent) with Sensory Return (what came back)
        // This is pre-semantic comparison, NOT self-awareness
        this.lastReafferenceComparisonState = deriveReafferenceComparison(
            this.lastActuationPulse,
            this.lastSensoryReturnPackets,
            this.worldMediumState,
            dt
        );

        this.lastBodyWorldClosureState = deriveBodyWorldClosureState({
            timestamp: this.simTime,
            actuationPulse: this.lastActuationPulse,
            sensoryReturns: this.lastSensoryReturnPackets,
            worldMediumState: this.worldMediumState,
            reafferenceComparisonState: this.lastReafferenceComparisonState,
            previousState: this.lastBodyWorldClosureState,
        });

        this.lastMediumProfileState = deriveMediumProfileState({
            closure: this.lastBodyWorldClosureState,
            reafference: this.lastReafferenceComparisonState,
            world: this.worldMediumState,
            bodySurface: this.lastBodySurfaceState ?? null,
            pulse: this.lastActuationPulse,
            returns: this.lastSensoryReturnPackets,
            previousProfile: this.lastMediumProfileState,
            dt,
        });

        // W5: Optional weak feedback from reafference comparison
        // Currently observation-only; feedback intentionally minimal to avoid
        // overwhelming organism dynamics. Future phases may add subtle bias.
        // Candidates for future weak feedback:
        // - returnMismatch → slight prediction mismatch bias (if >0.7)
        // - selfCausedMatch → slight mismatch dampening (if >0.8)
        // - worldCausedDifference → slight novelty/surprise boost (if >0.7)
        // W5 keeps these as metrics only, not as active modulators.

        // Beautiful Loop L3: Compute thin modulation from packets
        // This returns weak bias deltas to organism core
        const rawModulation = computeBeautifulLoopModulation(
            interoceptionPacket,
            selfWorldModelPacket,
            this.lastSelfWorldModelPacket,
            this.blModulationConfig
        );
        // Apply smoothing to prevent sudden jumps
        const smoothedModulation = smoothModulation(rawModulation, this.lastModulation, this.blModulationConfig.smoothingFactor);
        // Clamp to safety bounds
        this.currentModulation = clampModulation(smoothedModulation);
        this.lastModulation = this.currentModulation;

        // Store for next frame
        this.lastInteroceptionPacket = interoceptionPacket;
        this.lastSelfWorldModelPacket = selfWorldModelPacket;
        this.lastArousalAwarenessState = arousalAwarenessState;
        this.lastTraceState = traceState;
        const complexFieldUpdate = this.updateComplexFieldObservation();
        if (complexFieldUpdate.renderRefreshNeeded) {
            this.updateRenderBuffers(diskNodeIdx);
        }

        return {
            ignitionRatio: metricsPacket.clusterRatio,
            phiApprox: metricsPacket.phiProxy,
            phaseCoherence: metricsPacket.phaseCoherence,
            fieldRuntimeMode: this.fieldRuntimeMode,
            complexFieldMode: complexFieldUpdate.complexMode,
            complexFieldEnabled: complexFieldUpdate.complexMode !== 'off',
            complexFieldMaxAmplitude: complexFieldUpdate.observation?.maxAmplitude ?? 0,
            complexFieldAverageAmplitude: complexFieldUpdate.observation?.averageAmplitude ?? 0,
            complexFieldPhaseCoherence: complexFieldUpdate.observation?.phaseCoherence ?? 0,
            complexFieldAveragePhaseGradient: complexFieldUpdate.vortexObservation?.averagePhaseGradient
                ?? complexFieldUpdate.observation?.phaseGradient.reduce((sum, value) => sum + value, 0) / Math.max(1, this.numNodes)
                ?? 0,
            complexFieldAverageVorticity: complexFieldUpdate.vortexObservation?.averageVorticity ?? 0,
            complexFieldNanOrInfinityCount: complexFieldUpdate.observation?.nanOrInfinityCount ?? 0,
            complexFieldAmplitudeClampCount: complexFieldUpdate.observation?.amplitudeClampCount ?? 0,
            complexFieldPhaseUnwrapWarningCount: complexFieldUpdate.vortexObservation?.phaseUnwrapWarningCount
                ?? complexFieldUpdate.observation?.phaseUnwrapWarningCount
                ?? 0,
            vortexCandidateCount: complexFieldUpdate.vortexObservation?.candidateCount ?? 0,
            vortexPositiveChargeCount: complexFieldUpdate.vortexObservation?.positiveChargeCount ?? 0,
            vortexNegativeChargeCount: complexFieldUpdate.vortexObservation?.negativeChargeCount ?? 0,
            vortexTotalTopologicalCharge: complexFieldUpdate.vortexObservation?.totalTopologicalCharge ?? 0,
            vortexAverageConfidence: complexFieldUpdate.vortexObservation?.averageConfidence ?? 0,
            vortexMaxConfidence: complexFieldUpdate.vortexObservation?.maxConfidence ?? 0,
            vortexObservationConfidence: complexFieldUpdate.vortexObservation?.observationConfidence ?? 0,
            metricMode: this.torusMetricConfig.metricMode,
            curvatureInfluence: this.torusMetricConfig.curvatureInfluence,
            areaNormalizationEnabled: this.torusMetricConfig.areaNormalizationEnabled,
            majorRadius: this.torusMetricConfig.majorRadius,
            minorRadius: this.torusMetricConfig.minorRadius,
            torusCurvatureObservation,
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
            soundLevel: this.soundLevel,
            soundDelta: this.soundDelta,
            soundBandLow: this.soundBandLow,
            soundBandMid: this.soundBandMid,
            soundBandHigh: this.soundBandHigh,
            soundNovelty: this.soundNovelty,
            soundPersistence: this.soundPersistence,
            soundRecurrence: this.soundRecurrence,
            soundDirectionality: this.soundDirectionality,
            soundActive: this.soundActive,
            lightLevel: this.lightLevel,
            lightDelta: this.lightDelta,
            lightNovelty: this.lightNovelty,
            lightPersistence: this.lightPersistence,
            lightActive: this.lightActive,
            motionLevel: this.motionLevel,
            motionDelta: this.motionDelta,
            motionNovelty: this.motionNovelty,
            motionPersistence: this.motionPersistence,
            motionActive: this.motionActive,
            timePhase: this.timePhase,
            timeLevel: this.timeLevel,
            timePersistence: this.timePersistence,
            timeActive: this.timeActive,
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
            dormantNodeCount: dormantDebug.dormantNodeCount,
            dormantWakeCount: dormantDebug.dormantWakeCount,
            activeDormantNodeCount: dormantDebug.activeDormantNodeCount,
            recentDormantWakeEvents: dormantDebug.recentDormantWakeEvents,
            hardwareRandomNoiseActivePath: dormantDebug.hardwareRandomNoiseActivePath,
            hardwareRandomNoiseSource: dormantDebug.hardwareRandomNoiseSource,
            noiseMagnitude: dormantDebug.noiseMagnitude,
            wakePressureMean: dormantDebug.wakePressureMean,
            wakePressureMax: dormantDebug.wakePressureMax,
            energyReserve: this.energyFlowState.energyReserve,
            energyInflow: this.energyFlowState.energyInflow,
            energyOutflow: this.energyFlowState.energyOutflow,
            maintenanceCost: this.energyFlowState.maintenanceCost,
            activityCost: this.energyFlowState.activityCost,
            rewriteCost: this.energyFlowState.rewriteCost,
            structuralIntegrity: this.energyFlowState.structuralIntegrity,
            lowEnergyPressure: this.energyFlowState.lowEnergyPressure,
            recoveryDrive: this.energyFlowState.recoveryDrive,
            energyIsDormant: this.energyFlowState.wasDormantByEnergy,
            // Phase 3: Touch expectation metrics
            expectedTouchInterval: this.touchExpectation?.expectedInterTouchInterval ?? 0,
            expectedTouchStrength: this.touchExpectation?.expectedTouchStrength ?? 0,
            touchExpectationConfidence: this.touchExpectation?.touchExpectationConfidence ?? 0,
            touchSpatialSurprise: this.touchSurpriseMetrics?.spatialSurprise ?? 0,
            touchTemporalSurprise: this.touchSurpriseMetrics?.temporalSurprise ?? 0,
            touchStrengthSurprise: this.touchSurpriseMetrics?.strengthSurprise ?? 0,
            touchMissingSurprise: this.touchSurpriseMetrics?.missingTouchSurprise ?? 0,
            touchReleaseSurprise: this.touchSurpriseMetrics?.releaseSurprise ?? 0,
            touchTotalSurprise: this.touchSurpriseMetrics?.totalSurprise ?? 0,
            meanTouchHabituation: this.touchExpectation ? (this.touchExpectation.touchHabituationField.reduce((a, b) => a + b, 0) / this.touchExpectation.touchHabituationField.length) : 0,
            holdContinuationExpectation: this.touchExpectation?.holdContinuationExpectation ?? 0,
            touchAbsenceError: this.touchExpectation?.absenceError ?? 0,
            isTouchHolding: this.touchExpectation?.isHolding ? 1 : 0,
            touchHoldDuration: this.touchExpectation?.holdDuration ?? 0,
            touchBackactionGain: this.touchBackactionState?.backactionGain ?? 1,
            touchBackactionSurpriseGain: this.touchBackactionState?.surpriseGain ?? 1,
            touchBackactionBoundaryModulation: this.touchBackactionState?.boundaryModulation ?? 1,
            touchBackactionOpennessModulation: this.touchBackactionState?.opennessModulation ?? 1,
            touchBackactionCoherenceShift: this.touchBackactionState?.coherenceShift ?? 0,
            touchBackactionAwarenessCoupling: this.touchBackactionState?.awarenessCoupling ?? 0,
            touchBackactionOverloadAmplification: this.touchBackactionState?.overloadAmplification ?? 0,
            touchBackactionFamiliarityDamping: this.touchBackactionState?.familiarityDamping ?? 0,
            touchBackactionEnabled: this.touchBackactionEnabled !== false,
            // Beautiful Loop L2: Observer packets
            bl_energySense: interoceptionPacket.energySense,
            bl_overloadSense: interoceptionPacket.overloadSense,
            bl_coherenceSense: interoceptionPacket.coherenceSense,
            bl_boundarySense: interoceptionPacket.boundarySense,
            bl_restorationSense: interoceptionPacket.restorationSense,
            bl_perturbationPressure: interoceptionPacket.perturbationPressure,
            bl_selfCoherence: selfWorldModelPacket.selfCoherence,
            bl_selfContinuity: selfWorldModelPacket.selfContinuity,
            bl_worldPressure: selfWorldModelPacket.worldPressure,
            bl_relationEngagement: selfWorldModelPacket.relationEngagement,
            bl_arousalLevel: arousalAwarenessState.arousalLevel,
            bl_awarenessWindow: arousalAwarenessState.awarenessWindow,
            bl_salienceOpenness: arousalAwarenessState.salienceOpenness,
            bl_foregroundPressure: arousalAwarenessState.foregroundPressure,
            bl_restDepth: arousalAwarenessState.restDepth,
            bl_hyperreactivity: arousalAwarenessState.hyperreactivity,
            bl_settlingWindow: arousalAwarenessState.settlingWindow,
            traceStrength: traceState.traceStrength,
            recurrenceWeight: traceState.recurrenceWeight,
            salienceResidue: traceState.salienceResidue,
            replayReadiness: traceState.replayReadiness,
            replaySuppression: traceState.replaySuppression,
            recentPatternWeight: traceState.recentPatternWeight ?? 0,
            settlingResidue: traceState.settlingResidue ?? 0,
            recoveryLinkedResidue: traceState.recoveryLinkedResidue ?? 0,
            recoveryPressure: recoveryState.recoveryPressure,
            relaxationLevel: recoveryState.relaxationLevel,
            stabilizationPull: recoveryState.stabilizationPull,
            collapseRisk: recoveryState.collapseRisk,
            restorationBias: recoveryState.restorationBias,
            boundaryRepairPressure: recoveryState.boundaryRepairPressure ?? 0,
            selfPreservationDrive: recoveryState.selfPreservationDrive ?? 0,
            overloadDrain: recoveryState.overloadDrain ?? 0,
            recoveryTrajectory,
            collapseMode,
            actuationPulseChannel: this.lastActuationPulse?.channel ?? null,
            actuationPulseIntensity: this.lastActuationPulse?.intensity ?? 0,
            actuationPulseCoherence: this.lastActuationPulse?.coherence ?? 0,
            actuationPulseRhythm: this.lastActuationPulse?.rhythm ?? 0,
            actuationPulseLocality: this.lastActuationPulse?.locality ?? 0,
            actuationPulseRecoveryLinked: this.lastActuationPulse?.recoveryLinked ?? 0,
            actuationPulseBoundaryLinked: this.lastActuationPulse?.boundaryLinked ?? 0,
            actuationPulseTraceLinked: this.lastActuationPulse?.traceLinked ?? 0,
            actuationPulseOutputReadiness: this.lastBodySurfaceState?.outputReadiness ?? 0,
            actuationPulseGeneratedCount: this.actuationPulseGeneratedCount,
            actuationPulseNullCount: this.actuationPulseNullCount,
            actuationPulseVisualCount: this.actuationPulseChannelCounts.visual,
            actuationPulseSimulatedForceCount: this.actuationPulseChannelCounts.simulatedForce,
            // W3: World Medium state
            worldAmbientLight: this.worldMediumState.ambientLight,
            worldAmbientNoise: this.worldMediumState.ambientNoise,
            worldSurfaceResistance: this.worldMediumState.surfaceResistance,
            worldEchoLevel: this.worldMediumState.echoLevel,
            worldMotionDrift: this.worldMediumState.motionDrift,
            worldFieldTemperature: this.worldMediumState.fieldTemperature,
            worldFeedbackDelay: this.worldMediumState.feedbackDelay,
            worldLastPulseImpact: this.worldMediumState.lastPulseImpact,
            worldMediumStability: this.worldMediumState.mediumStability,
            worldVisualResidue: this.worldMediumState.visualResidue ?? 0,
            worldForceResidue: this.worldMediumState.forceResidue ?? 0,
            worldTurbulence: this.worldMediumState.worldTurbulence ?? 0,
            worldReturnReadiness: this.worldMediumState.returnReadiness ?? 0,
            // W4: Sensory Return metrics
            sensoryReturnPacketCount: this.lastSensoryReturnPackets.length,
            // W5: Reafference Comparison (pre-semantic pulse-return comparison)
            reafferenceExpectedReturn: this.lastReafferenceComparisonState?.expectedReturn ?? 0,
            reafferenceActualReturn: this.lastReafferenceComparisonState?.actualReturn ?? 0,
            reafferenceReturnDelay: this.lastReafferenceComparisonState?.returnDelay ?? 0,
            reafferenceReturnMismatch: this.lastReafferenceComparisonState?.returnMismatch ?? 0,
            reafferenceSelfCausedMatch: this.lastReafferenceComparisonState?.selfCausedMatch ?? 0,
            reafferenceWorldCausedDifference: this.lastReafferenceComparisonState?.worldCausedDifference ?? 0,
            reafferenceUnresolvedReturn: this.lastReafferenceComparisonState?.unresolvedReturn ?? 0,
            reafferenceComparisonConfidence: this.lastReafferenceComparisonState?.comparisonConfidence ?? 0,
            reafferencePulseReturnCorrelation: this.lastReafferenceComparisonState?.pulseReturnCorrelation ?? 0,
            reafferenceReturnAttenuation: this.lastReafferenceComparisonState?.returnAttenuation ?? 0,
            reafferenceReturnAmplification: this.lastReafferenceComparisonState?.returnAmplification ?? 0,
            reafferenceDelayedEchoScore: this.lastReafferenceComparisonState?.delayedEchoScore ?? 0,
            mediumDelayAverageReturnDelay: this.lastMediumProfileState?.delay.averageReturnDelay ?? 0,
            mediumDelayMinReturnDelay: this.lastMediumProfileState?.delay.minReturnDelay ?? 0,
            mediumDelayMaxReturnDelay: this.lastMediumProfileState?.delay.maxReturnDelay ?? 0,
            mediumDelayVariance: this.lastMediumProfileState?.delay.delayVariance ?? 0,
            mediumDelayStableWindow: this.lastMediumProfileState?.delay.stableDelayWindow ?? 0,
            mediumDelayUnstableScore: this.lastMediumProfileState?.delay.unstableDelayScore ?? 0,
            mediumDelayDelayedEchoScore: this.lastMediumProfileState?.delay.delayedEchoScore ?? 0,
            mediumEchoStrength: this.lastMediumProfileState?.echo.echoStrength ?? 0,
            mediumEchoDecayRate: this.lastMediumProfileState?.echo.echoDecayRate ?? 0,
            mediumEchoPersistence: this.lastMediumProfileState?.echo.echoPersistence ?? 0,
            mediumEchoSaturationRisk: this.lastMediumProfileState?.echo.echoSaturationRisk ?? 0,
            mediumVisualEchoResidue: this.lastMediumProfileState?.echo.visualEchoResidue ?? 0,
            mediumForceEchoResidue: this.lastMediumProfileState?.echo.forceEchoResidue ?? 0,
            mediumReturnEchoCoupling: this.lastMediumProfileState?.echo.returnEchoCoupling ?? 0,
            mediumWorldResistance: this.lastMediumProfileState?.resistance.worldResistance ?? 0,
            mediumBoundaryResistance: this.lastMediumProfileState?.resistance.boundaryResistance ?? 0,
            mediumReturnAttenuation: this.lastMediumProfileState?.resistance.returnAttenuation ?? 0,
            mediumAbsorption: this.lastMediumProfileState?.resistance.mediumAbsorption ?? 0,
            mediumTransmissionRatio: this.lastMediumProfileState?.resistance.transmissionRatio ?? 0,
            mediumResistanceBalance: this.lastMediumProfileState?.resistance.resistanceBalance ?? 0,
            mediumResistanceVariance: this.lastMediumProfileState?.resistance.resistanceVariance ?? 0,
            mediumProfileConfidence: this.lastMediumProfileState?.profileConfidence ?? 0,
            // Beautiful Loop L3: Modulation deltas
            bl_noveltyBiasDelta: this.currentModulation.noveltyBiasDelta,
            bl_withdrawBiasDelta: this.currentModulation.withdrawBiasDelta,
            bl_rewritePressureDelta: this.currentModulation.rewritePressureDelta,
            bl_restorationBiasDelta: this.currentModulation.restorationBiasDelta,
            bl_touchOpennessDelta: this.currentModulation.touchOpennessDelta,
            bl_modulationEnabled: this.blModulationConfig.enabled,
        };
    }
}
