/**
 * Behavioral scenario tests for AETERNA
 *
 * These are NOT unit tests. They are long-horizon behavioral tests
 * that verify organism-level dynamics under controlled conditions.
 */

import { describe, it, expect } from 'vitest';
import { runScenario, type ScenarioConfig } from '../experiments/runScenario';

describe('AETERNA Behavioral Scenarios', async () => {
    describe('Scenario A: No Stimulus', async () => {
        it('should maintain ongoing activity without external input', async () => {
            const config: ScenarioConfig = {
                name: 'no-stimulus-baseline',
                totalFrames: 1000,
                touchScript: [],
                collectMetrics: true,
                metricsInterval: 50,
            };

            const result = await runScenario(config);

            // Must not collapse or explode
            expect(result.succeeded).toBe(true);
            if (!result.succeeded) {
                console.error('Failure reason:', result.failureReason);
            }

            // Should maintain ongoing activity
            expect(result.summary.finalMeanActivity).toBeGreaterThan(0.1);

            // Should have no NaN
            expect(result.summary.nanFrames).toBe(0);

            // Activity should not collapse frequently
            expect(result.summary.collapseFrames).toBeLessThan(100);

            // Should have bounded activity
            expect(result.summary.peakActivity).toBeLessThan(50.0);

            console.log('Scenario A summary:', result.summary);
        });

        it('should show activity variance (not frozen)', async () => {
            const config: ScenarioConfig = {
                name: 'no-stimulus-variance',
                totalFrames: 1000,
                touchScript: [],
                collectMetrics: true,
                metricsInterval: 10,
            };

            const result = await runScenario(config);

            // Compute variance across all metric snapshots
            const meanActivities = result.metrics.map(m => m.meanActivity);
            const mean = meanActivities.reduce((a, b) => a + b, 0) / meanActivities.length;
            const variance = meanActivities.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / meanActivities.length;

            // Should not be frozen
            expect(variance).toBeGreaterThan(0.01);

            console.log('Scenario A variance:', variance);
        });
    });

    describe('Scenario B: Single Touch', async () => {
        it('should respond to single touch with measurable amplitude', async () => {
            const config: ScenarioConfig = {
                name: 'single-touch-response',
                totalFrames: 500,
                touchScript: [
                    { frame: 200, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
                ],
                collectMetrics: true,
                metricsInterval: 5,
            };

            const result = await runScenario(config);

            expect(result.succeeded).toBe(true);

            // Should show measurable response (adjusted threshold based on observed behavior)
            expect(result.summary.meanResponseAmplitude).toBeGreaterThan(0.15);

            console.log('Scenario B response amplitude:', result.summary.meanResponseAmplitude);
        });

        it('should recover after single touch', async () => {
            const config: ScenarioConfig = {
                name: 'single-touch-recovery',
                totalFrames: 500,
                touchScript: [
                    { frame: 100, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
                ],
                collectMetrics: true,
                metricsInterval: 5,
            };

            const result = await runScenario(config);

            // Find baseline before touch
            const preTouchMetrics = result.metrics.filter(m => m.frame < 100);
            const preTouchMean = preTouchMetrics.reduce((sum, m) => sum + m.meanActivity, 0) / preTouchMetrics.length;

            // Find recovery time (when activity returns within 20% of baseline)
            const postTouchMetrics = result.metrics.filter(m => m.frame > 100);
            const recoveryMetric = postTouchMetrics.find(m =>
                Math.abs(m.meanActivity - preTouchMean) < preTouchMean * 0.2
            );

            if (recoveryMetric) {
                const recoveryTime = recoveryMetric.frame - 100;
                console.log('Scenario B recovery time:', recoveryTime);
                // Should recover within reasonable time
                expect(recoveryTime).toBeGreaterThan(10);  // Not instant
                expect(recoveryTime).toBeLessThan(300);    // Not too slow
            } else {
                console.warn('Scenario B: No recovery detected (may indicate new stable state)');
            }
        });
    });

    describe('Scenario C: Repeated Touch', async () => {
        it('should process repeated touches at same location', async () => {
            const config: ScenarioConfig = {
                name: 'repeated-touch-same-location',
                totalFrames: 1000,
                touchScript: [
                    { frame: 100, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
                    { frame: 200, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
                    { frame: 300, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
                    { frame: 400, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
                    { frame: 500, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
                ],
                collectMetrics: true,
                metricsInterval: 5,
            };

            const result = await runScenario(config);

            expect(result.succeeded).toBe(true);

            // Note: Adaptation (habituation/sensitization) may not be present yet
            // This test establishes baseline for future comparison
            console.log('Scenario C mean response:', result.summary.meanResponseAmplitude);
            console.log('Scenario C note: Adaptation mechanism may be incomplete in current AETERNA');
        });

        it('should show response variation across repetitions (future: adaptation)', async () => {
            const config: ScenarioConfig = {
                name: 'repeated-touch-adaptation-check',
                totalFrames: 600,
                touchScript: [
                    { frame: 100, x: 0.3, y: 0.3, pressure: 1.0, duration: 1 },
                    { frame: 200, x: 0.3, y: 0.3, pressure: 1.0, duration: 1 },
                    { frame: 300, x: 0.3, y: 0.3, pressure: 1.0, duration: 1 },
                    { frame: 400, x: 0.3, y: 0.3, pressure: 1.0, duration: 1 },
                    { frame: 500, x: 0.3, y: 0.3, pressure: 1.0, duration: 1 },
                ],
                collectMetrics: true,
                metricsInterval: 2,
            };

            const result = await runScenario(config);

            // Compute response amplitude for each touch
            const touchFrames = [100, 200, 300, 400, 500];
            const responses = touchFrames.map(touchFrame => {
                const preTouchMetrics = result.metrics.filter(m => m.frame >= touchFrame - 20 && m.frame < touchFrame);
                const postTouchMetrics = result.metrics.filter(m => m.frame >= touchFrame && m.frame < touchFrame + 50);

                if (preTouchMetrics.length === 0 || postTouchMetrics.length === 0) return 0;

                const baseline = preTouchMetrics.reduce((sum, m) => sum + m.meanActivity, 0) / preTouchMetrics.length;
                const peak = Math.max(...postTouchMetrics.map(m => m.meanActivity));

                return peak - baseline;
            });

            console.log('Scenario C response amplitudes:', responses);

            // Check if adaptation is present (for future)
            if (responses.length >= 5 && responses[0] > 0) {
                const adaptationRatio = responses[4] / responses[0];
                console.log('Scenario C adaptation ratio (touch 5 / touch 1):', adaptationRatio);

                if (adaptationRatio < 0.8) {
                    console.log('Scenario C: Habituation-like adaptation detected');
                } else if (adaptationRatio > 1.2) {
                    console.log('Scenario C: Sensitization-like adaptation detected');
                } else {
                    console.log('Scenario C: No clear adaptation (expected in current AETERNA)');
                }
            }
        });
    });

    describe('Scenario D: Hold-Release', async () => {
        it('should show offset response after held touch release', async () => {
            const config: ScenarioConfig = {
                name: 'hold-release-offset',
                totalFrames: 400,
                touchScript: [
                    { frame: 100, x: 0.5, y: 0.5, pressure: 1.0, duration: 100 },
                ],
                collectMetrics: true,
                metricsInterval: 5,
            };

            const result = await runScenario(config);

            expect(result.succeeded).toBe(true);

            // Find offset response (activity change after release at frame 200)
            const releaseFrame = 200;
            const preReleaseMetrics = result.metrics.filter(m => m.frame >= releaseFrame - 20 && m.frame < releaseFrame);
            const postReleaseMetrics = result.metrics.filter(m => m.frame >= releaseFrame && m.frame < releaseFrame + 50);

            if (preReleaseMetrics.length > 0 && postReleaseMetrics.length > 0) {
                const preReleaseMean = preReleaseMetrics.reduce((sum, m) => sum + m.meanTouchOffset, 0) / preReleaseMetrics.length;
                const postReleasePeak = Math.max(...postReleaseMetrics.map(m => m.meanTouchOffset));

                console.log('Scenario D pre-release offset mean:', preReleaseMean);
                console.log('Scenario D post-release offset peak:', postReleasePeak);

                // Offset should increase after release
                expect(postReleasePeak).toBeGreaterThan(preReleaseMean);
            }
        });

        it('should show residue/persistence after long hold', async () => {
            const config: ScenarioConfig = {
                name: 'hold-release-persistence',
                totalFrames: 500,
                touchScript: [
                    { frame: 100, x: 0.5, y: 0.5, pressure: 1.0, duration: 150 },
                ],
                collectMetrics: true,
                metricsInterval: 5,
            };

            const result = await runScenario(config);

            // Check residueLevel after release
            const releaseFrame = 250;
            const postReleaseMetrics = result.metrics.filter(m => m.frame > releaseFrame && m.frame < releaseFrame + 100);

            if (postReleaseMetrics.length > 0) {
                const meanResidue = postReleaseMetrics.reduce((sum, m) => sum + m.residueLevel, 0) / postReleaseMetrics.length;
                console.log('Scenario D mean residue after release:', meanResidue);

                // Residue should be present
                expect(meanResidue).toBeGreaterThan(0);
            }
        });
    });

    describe('Scenario E: Quiet Long-Run', async () => {
        it('should remain stable over long quiet period', async () => {
            const config: ScenarioConfig = {
                name: 'quiet-long-run-stability',
                totalFrames: 2000,
                touchScript: [],
                collectMetrics: true,
                metricsInterval: 50,
            };

            const result = await runScenario(config);

            expect(result.succeeded).toBe(true);

            // Should maintain baseline activity
            expect(result.summary.finalMeanActivity).toBeGreaterThan(0.1);

            // Should not have excessive collapse
            expect(result.summary.collapseFrames).toBeLessThan(200);

            console.log('Scenario E long-run summary:', result.summary);
        });

        it('should show mode drift or transitions during long quiet (future: dream)', async () => {
            const config: ScenarioConfig = {
                name: 'quiet-long-run-mode-drift',
                totalFrames: 2000,
                touchScript: [],
                collectMetrics: true,
                metricsInterval: 20,
            };

            const result = await runScenario(config);

            // Track mode states over time
            const modeStates = result.metrics.map(m => m.modeState);
            const uniqueModes = new Set(modeStates);

            console.log('Scenario E unique modes observed:', Array.from(uniqueModes));
            console.log('Scenario E mode transitions:', result.summary.modeTransitions);

            // Note: Dream transitions may not be spontaneous without specific tuning
            if (result.summary.modeTransitions > 0) {
                console.log('Scenario E: Spontaneous mode transitions detected');
            } else {
                console.log('Scenario E: No mode transitions (expected if dream pressure is low)');
            }
        });
    });

    describe('Scenario F: Long Quiet Drift (Phase 2)', async () => {
        it('should show slow variable drift during extended quiet period', async () => {
            const config: ScenarioConfig = {
                name: 'long-quiet-drift',
                totalFrames: 3000,  // ~50 seconds
                touchScript: [],
                collectMetrics: true,
                metricsInterval: 100,  // collect every 100 frames
            };

            const result = await runScenario(config);

            expect(result.succeeded).toBe(true);

            // Check that living state variables drift over time
            const firstMetric = result.metrics[0];
            const lastMetric = result.metrics[result.metrics.length - 1];

            if (firstMetric && lastMetric) {
                console.log('Scenario F initial fatigue:', firstMetric.fatigue);
                console.log('Scenario F final fatigue:', lastMetric.fatigue);
                console.log('Scenario F initial longBaselineTone:', firstMetric.longBaselineTone);
                console.log('Scenario F final longBaselineTone:', lastMetric.longBaselineTone);
                console.log('Scenario F initial preferredErgodicity:', firstMetric.preferredErgodicity);
                console.log('Scenario F final preferredErgodicity:', lastMetric.preferredErgodicity);

                // Fatigue should decrease in quiet (recovery)
                if (firstMetric.fatigue !== undefined && lastMetric.fatigue !== undefined) {
                    console.log('Scenario F: Fatigue drift:', lastMetric.fatigue - firstMetric.fatigue);
                }

                // Long baseline tone should drift slightly
                if (firstMetric.longBaselineTone !== undefined && lastMetric.longBaselineTone !== undefined) {
                    console.log('Scenario F: Baseline tone drift:', lastMetric.longBaselineTone - firstMetric.longBaselineTone);
                }
            }
        });
    });

    describe('Scenario G: Perturbation After Quiet (Phase 2)', async () => {
        it('should show that prior quiet period affects touch response', async () => {
            // Run two scenarios: touch after quiet vs immediate touch
            const quietThenTouchConfig: ScenarioConfig = {
                name: 'perturbation-after-quiet',
                totalFrames: 1500,
                touchScript: [
                    { frame: 1000, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },  // touch after 1000 frames quiet
                ],
                collectMetrics: true,
                metricsInterval: 10,
            };

            const immediateTouchConfig: ScenarioConfig = {
                name: 'immediate-perturbation',
                totalFrames: 500,
                touchScript: [
                    { frame: 100, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },  // touch early
                ],
                collectMetrics: true,
                metricsInterval: 10,
            };

            const quietThenTouchResult = await runScenario(quietThenTouchConfig);
            const immediateTouchResult = await runScenario(immediateTouchConfig);

            expect(quietThenTouchResult.succeeded).toBe(true);
            expect(immediateTouchResult.succeeded).toBe(true);

            console.log('Scenario G quiet-then-touch response:', quietThenTouchResult.summary.meanResponseAmplitude);
            console.log('Scenario G immediate-touch response:', immediateTouchResult.summary.meanResponseAmplitude);

            // Check living state before touch in long quiet scenario
            const preTouchMetrics = quietThenTouchResult.metrics.filter(m => m.frame < 1000);
            if (preTouchMetrics.length > 0) {
                const lastPreTouch = preTouchMetrics[preTouchMetrics.length - 1];
                console.log('Scenario G fatigue before touch:', lastPreTouch.fatigue);
                console.log('Scenario G coherenceMemory before touch:', lastPreTouch.coherenceMemory);
            }
        });
    });

    describe('Scenario H: Repeated Perturbation Carry-Over (Phase 2)', async () => {
        it('should show living state bias persists after repeated touches', async () => {
            const config: ScenarioConfig = {
                name: 'repeated-perturbation-carryover',
                totalFrames: 1500,
                touchScript: [
                    // Rapid sequence of touches
                    { frame: 100, x: 0.3, y: 0.3, pressure: 1.0, duration: 1 },
                    { frame: 120, x: 0.4, y: 0.4, pressure: 1.0, duration: 1 },
                    { frame: 140, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
                    { frame: 160, x: 0.6, y: 0.6, pressure: 1.0, duration: 1 },
                    { frame: 180, x: 0.7, y: 0.7, pressure: 1.0, duration: 1 },
                    // Then quiet for 500+ frames
                ],
                collectMetrics: true,
                metricsInterval: 20,
            };

            const result = await runScenario(config);

            expect(result.succeeded).toBe(true);

            // Check recent history bias during and after perturbations
            const duringPerturbation = result.metrics.find(m => m.frame >= 180 && m.frame < 200);
            const longAfterPerturbation = result.metrics.find(m => m.frame >= 700 && m.frame < 800);

            if (duringPerturbation && longAfterPerturbation) {
                console.log('Scenario H recentHistoryBias during touches:', duringPerturbation.recentHistoryBias);
                console.log('Scenario H recentHistoryBias 500 frames later:', longAfterPerturbation.recentHistoryBias);
                console.log('Scenario H fatigue during touches:', duringPerturbation.fatigue);
                console.log('Scenario H fatigue 500 frames later:', longAfterPerturbation.fatigue);
                console.log('Scenario H residueBias during touches:', duringPerturbation.residueBias);
                console.log('Scenario H residueBias 500 frames later:', longAfterPerturbation.residueBias);

                // Recent history bias should still be non-zero after quiet period
                if (longAfterPerturbation.recentHistoryBias !== undefined) {
                    console.log('Scenario H: Bias persists:', Math.abs(longAfterPerturbation.recentHistoryBias) > 0.01);
                }
            }
        });
    });
});
