/**
 * recentEventsForCell.test.ts
 * v1.7: Deep Inspector / Time Replay — getRecentEventsForCell tests
 *
 * Verifies:
 * - Events matching the cell's regionId are returned
 * - Non-matching events are excluded
 * - Empty event list returns empty result
 * - Global fallback works when no cell match
 * - maxEvents limit is respected
 * - Events are NEVER fabricated
 * - Event fabrication guard: output only contains input events
 */

import { describe, it, expect } from 'vitest';
import { getRecentEventsForCell, type AeternaEventLike } from '../../observer/getRecentEventsForCell.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent(id: string, tick: number, source: string): AeternaEventLike {
    return { id, tick, source };
}

// ── Basic matching ────────────────────────────────────────────────────────────

describe('getRecentEventsForCell: source matching', () => {
    it('returns events matching cell regionId', () => {
        const events: AeternaEventLike[] = [
            makeEvent('evt-1', 10, 'u2-v3'),
            makeEvent('evt-2', 20, 'u5-v1'),
            makeEvent('evt-3', 30, 'u2-v3'),
        ];
        const result = getRecentEventsForCell({
            cellIndex: 2 * 8 + 3,
            segments: 8,
            events,
            regionId: 'u2-v3',
        });
        expect(result.matchedByRegion).toBe(true);
        expect(result.isGlobalFallback).toBe(false);
        expect(result.cellEvents).toHaveLength(2);
        expect(result.cellEvents.every((e) => e.source === 'u2-v3')).toBe(true);
    });

    it('excludes events with non-matching sources', () => {
        const events: AeternaEventLike[] = [
            makeEvent('evt-1', 10, 'u1-v1'),
            makeEvent('evt-2', 20, 'u9-v9'),
        ];
        const result = getRecentEventsForCell({
            cellIndex: 0,
            segments: 4,
            events,
            regionId: 'u0-v0',
            fallbackToGlobal: false,
        });
        expect(result.cellEvents).toHaveLength(0);
        expect(result.matchedByRegion).toBe(false);
    });

    it('derives regionId from cellIndex and segments when not provided', () => {
        const events: AeternaEventLike[] = [
            makeEvent('evt-A', 5, 'u1-v2'),
        ];
        // cellIndex = 1 * 4 + 2 = 6, segments = 4 → regionId = 'u1-v2'
        const result = getRecentEventsForCell({
            cellIndex: 6,
            segments: 4,
            events,
        });
        expect(result.matchedByRegion).toBe(true);
        expect(result.cellEvents).toHaveLength(1);
    });
});

// ── Empty events ──────────────────────────────────────────────────────────────

describe('getRecentEventsForCell: empty events', () => {
    it('returns empty result for empty events array', () => {
        const result = getRecentEventsForCell({
            cellIndex: 0,
            segments: 4,
            events: [],
        });
        expect(result.cellEvents).toHaveLength(0);
        expect(result.matchedByRegion).toBe(false);
        expect(result.isGlobalFallback).toBe(false);
    });
});

// ── Global fallback ───────────────────────────────────────────────────────────

describe('getRecentEventsForCell: fallback', () => {
    it('falls back to global events when no cell match and fallbackToGlobal=true', () => {
        const events: AeternaEventLike[] = [
            makeEvent('g1', 1, 'global'),
            makeEvent('g2', 2, 'global'),
        ];
        const result = getRecentEventsForCell({
            cellIndex: 0,
            segments: 4,
            events,
            regionId: 'u0-v0',
            fallbackToGlobal: true,
        });
        expect(result.isGlobalFallback).toBe(true);
        expect(result.cellEvents).toHaveLength(2);
    });

    it('returns empty when no cell match and fallbackToGlobal=false', () => {
        const events: AeternaEventLike[] = [
            makeEvent('g1', 1, 'global'),
        ];
        const result = getRecentEventsForCell({
            cellIndex: 0,
            segments: 4,
            events,
            regionId: 'u0-v0',
            fallbackToGlobal: false,
        });
        expect(result.cellEvents).toHaveLength(0);
        expect(result.isGlobalFallback).toBe(false);
    });
});

// ── maxEvents limit ───────────────────────────────────────────────────────────

describe('getRecentEventsForCell: maxEvents', () => {
    it('limits results to maxEvents', () => {
        const events = Array.from({ length: 20 }, (_, i) =>
            makeEvent(`e${i}`, i, 'u0-v0'),
        );
        const result = getRecentEventsForCell({
            cellIndex: 0,
            segments: 4,
            events,
            regionId: 'u0-v0',
            maxEvents: 5,
        });
        expect(result.cellEvents).toHaveLength(5);
    });
});

// ── No fabrication guard ──────────────────────────────────────────────────────

describe('getRecentEventsForCell: no event fabrication', () => {
    it('output events are a strict subset of input events', () => {
        const events: AeternaEventLike[] = [
            makeEvent('real-1', 10, 'u1-v1'),
            makeEvent('real-2', 20, 'u2-v2'),
        ];
        const result = getRecentEventsForCell({
            cellIndex: 1 * 4 + 1,
            segments: 4,
            events,
            regionId: 'u1-v1',
        });
        const inputIds = new Set(events.map((e) => e.id));
        for (const ev of result.cellEvents) {
            expect(inputIds.has(ev.id)).toBe(true);
        }
    });

    it('never returns more events than were in the input', () => {
        const events: AeternaEventLike[] = [
            makeEvent('x1', 1, 'u0-v0'),
        ];
        const result = getRecentEventsForCell({
            cellIndex: 0,
            segments: 4,
            events,
            regionId: 'u0-v0',
        });
        expect(result.cellEvents.length).toBeLessThanOrEqual(events.length);
    });
});
