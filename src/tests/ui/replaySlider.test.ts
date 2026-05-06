/**
 * replaySlider.test.ts
 * v1.7: Deep Inspector / Time Replay — ReplaySlider tests
 *
 * Verifies:
 * - Slider renders with correct min/max/value attributes
 * - Replay Mode badge appears in replay mode
 * - Live indicator shows live tick
 * - Disclaimer text is present
 * - Return to Live button present
 */

import { describe, it, expect } from 'vitest';
import { renderReplaySliderHTML } from '../../ui/replay/ReplaySlider.js';

describe('ReplaySlider: rendering', () => {
    it('renders slider with correct min/max/value', () => {
        const html = renderReplaySliderHTML({
            minTick: 10,
            maxTick: 100,
            currentReplayTick: 50,
            liveTick: 150,
            isReplayMode: true,
            onTickSelect: () => {},
            onReturnToLive: () => {},
        });
        expect(html).toContain('min="10"');
        expect(html).toContain('max="100"');
        expect(html).toContain('value="50"');
    });

    it('shows Replay Mode badge in replay mode', () => {
        const html = renderReplaySliderHTML({
            minTick: 0,
            maxTick: 50,
            currentReplayTick: 25,
            liveTick: 60,
            isReplayMode: true,
            onTickSelect: () => {},
            onReturnToLive: () => {},
        });
        expect(html).toContain('Replay Mode');
    });

    it('does not show Replay Mode badge in live mode', () => {
        const html = renderReplaySliderHTML({
            minTick: 0,
            maxTick: 50,
            currentReplayTick: 25,
            liveTick: 60,
            isReplayMode: false,
            onTickSelect: () => {},
            onReturnToLive: () => {},
        });
        expect(html).not.toContain('replay-slider__mode-badge');
    });

    it('shows live tick', () => {
        const html = renderReplaySliderHTML({
            minTick: 0,
            maxTick: 50,
            currentReplayTick: 25,
            liveTick: 999,
            isReplayMode: true,
            onTickSelect: () => {},
            onReturnToLive: () => {},
        });
        expect(html).toContain('999');
    });

    it('contains Return to Live button', () => {
        const html = renderReplaySliderHTML({
            minTick: 0,
            maxTick: 50,
            currentReplayTick: 10,
            liveTick: 60,
            isReplayMode: true,
            onTickSelect: () => {},
            onReturnToLive: () => {},
        });
        expect(html).toContain('Return to Live');
    });

    it('contains replay disclaimer', () => {
        const html = renderReplaySliderHTML({
            minTick: 0,
            maxTick: 50,
            currentReplayTick: 10,
            liveTick: 60,
            isReplayMode: true,
            onTickSelect: () => {},
            onReturnToLive: () => {},
        });
        expect(html.toLowerCase()).toContain('does not imply the runtime itself has moved backward');
    });

    it('slider is disabled when maxTick <= minTick', () => {
        const html = renderReplaySliderHTML({
            minTick: 10,
            maxTick: 10,
            currentReplayTick: 10,
            liveTick: 20,
            isReplayMode: false,
            onTickSelect: () => {},
            onReturnToLive: () => {},
        });
        expect(html).toContain('disabled');
    });
});
