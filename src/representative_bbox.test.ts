import { describe, it, expect } from 'vitest';
import { representative_bbox, suggest_projections, get_bbox_gap, union_bbox } from './lib/index.js';
import type { BBox } from './lib/index.js';
import { us_states_20m } from './fixtures/us_states_20m.js';

// CONUS = lower-48 states + DC, i.e. the USA minus Alaska, Hawaii, Puerto Rico.
const CONUS: BBox = [-124.7258, 24.4981, -66.9499, 49.3844];

const close = (a: number, b: number, eps = 0.01) => Math.abs(a - b) <= eps;
const bboxClose = (a: BBox, b: BBox, eps = 0.01) => a.every((v, i) => close(v, b[i], eps));

describe('representative_bbox', () => {
	it('recovers the CONUS box from the real US states shapefile', () => {
		const { bbox, trimmed, outliers } = representative_bbox(us_states_20m);
		expect(trimmed).toBe(true);
		expect(bboxClose(bbox, CONUS)).toBe(true);
		// Alaska (flagged, antimeridian) + Hawaii + Puerto Rico discarded.
		expect(outliers).toHaveLength(3);
	});

	it('without reduction, the raw US extent spans the whole globe (the bug)', () => {
		const raw = union_bbox(us_states_20m);
		// Alaska's antimeridian wrap blows the longitude span past 180°.
		expect(raw[2] - raw[0]).toBeGreaterThan(180);
	});

	it('keeps a near-shore island across a strait (Corsica), drops overseas DOM', () => {
		const mainland: BBox = [-5.14, 42.33, 8.23, 51.09];
		const corsica: BBox = [8.53, 41.33, 9.56, 43.03]; // ~0.3° east of the mainland edge
		const guadeloupe: BBox = [-61.81, 15.83, -61.0, 16.51];
		const reunion: BBox = [55.21, -21.39, 55.84, -20.87];

		const { bbox, outliers } = representative_bbox([mainland, corsica, guadeloupe, reunion]);
		// Corsica extends the south/east edges; the two DOM are gone.
		expect(close(bbox[3], 51.09) && close(bbox[1], 41.33)).toBe(true);
		expect(close(bbox[2], 9.56)).toBe(true);
		expect(outliers).toHaveLength(2);
	});

	it('drops detached territories even with only a handful of features (area weighting)', () => {
		const mainland: BBox = [-5.14, 42.33, 8.23, 51.09];
		const dom: BBox[] = [
			[-61.81, 15.83, -61.0, 16.51], // Guadeloupe
			[-61.23, 14.39, -60.81, 14.88], // Martinique
			[-54.6, 2.11, -51.61, 5.75], // Guyane
			[55.21, -21.39, 55.84, -20.87], // Réunion
			[45.02, -13.0, 45.3, -12.64] // Mayotte
		];
		const { bbox, trimmed } = representative_bbox([mainland, ...dom]);
		expect(trimmed).toBe(true);
		expect(bboxClose(bbox, mainland)).toBe(true);
	});

	it('does not trim genuinely global, multi-continent data', () => {
		const continents: BBox[] = [
			[-16.1, 32.9, 40.2, 84.7], // Europe
			[-74, -34, -34, 6], // South America
			[-124.85, 24.55, -66.88, 49.38], // USA
			[112.92, -43.74, 153.64, -9.86], // Australia
			[73.62, 18.16, 134.77, 53.56], // China
			[16, -35, 33, -22] // South Africa
		];
		const { trimmed, outliers, kept } = representative_bbox(continents);
		expect(trimmed).toBe(false);
		expect(outliers).toEqual([]);
		expect(kept).toBe(continents.length);
	});

	it('returns a single box unchanged', () => {
		const box: BBox = [-5, 41, 10, 51];
		expect(representative_bbox([box])).toEqual({ bbox: box, kept: 1, outliers: [], trimmed: false });
	});

	it('throws on an empty array', () => {
		expect(() => representative_bbox([])).toThrow();
	});

	it('respects a stricter retain budget', () => {
		const mainland: BBox = [-5.14, 42.33, 8.23, 51.09];
		const dom: BBox[] = [
			[-61.81, 15.83, -61.0, 16.51],
			[-61.23, 14.39, -60.81, 14.88],
			[-54.6, 2.11, -51.61, 5.75],
			[55.21, -21.39, 55.84, -20.87],
			[45.02, -13.0, 45.3, -12.64]
		];
		// retain=1 forbids dropping anything → falls back to the full extent.
		const { trimmed } = representative_bbox([mainland, ...dom], { retain: 1 });
		expect(trimmed).toBe(false);
	});
});

describe('suggest_projections with per-feature bboxes', () => {
	it('matches the USA national projection from the raw shapefile boxes', () => {
		const result = suggest_projections(us_states_20m);
		expect(result.national.some((d) => d.id === 'usa')).toBe(true);
		expect(result.reduced?.trimmed).toBe(true);
		expect(bboxClose(result.reduced!.bbox, CONUS)).toBe(true);
	});

	it('the raw (un-reduced) extent fails to match the USA projection', () => {
		// Passing the single all-encompassing box yields no national match.
		const raw = union_bbox(us_states_20m);
		const result = suggest_projections(raw);
		expect(result.national.some((d) => d.id === 'usa')).toBe(false);
	});

	it('single-bbox calls are unchanged and carry no reduction info', () => {
		const result = suggest_projections([-5, 41, 10, 51]);
		expect(result.reduced).toBeUndefined();
		expect(result.national.some((d) => d.id === 'france')).toBe(true);
	});
});

describe('get_bbox_gap', () => {
	it('is 0 for overlapping boxes', () => {
		expect(get_bbox_gap([0, 0, 10, 10], [5, 5, 15, 15])).toBe(0);
	});

	it('measures the gap between separated boxes', () => {
		expect(close(get_bbox_gap([0, 0, 10, 10], [13, 0, 20, 10]), 3)).toBe(true);
	});

	it('measures the short way around the antimeridian', () => {
		// 175°E..179°E and 179°W..175°W are 2° apart across the dateline, not 354°.
		expect(close(get_bbox_gap([175, 0, 179, 10], [-179, 0, -175, 10]), 2)).toBe(true);
	});
});

describe('union_bbox', () => {
	it('encloses several boxes', () => {
		expect(union_bbox([[0, 0, 10, 10], [5, -5, 20, 8]])).toEqual([0, -5, 20, 10]);
	});

	it('produces a tight, wrap-aware box across the antimeridian', () => {
		const u = union_bbox([[175, 0, 179, 10], [-179, 2, -170, 12]]);
		// Crosses the dateline → lon_min > lon_max, narrow span (not ~350°).
		expect(u[0]).toBeGreaterThan(u[2]);
		expect(u[0]).toBe(175);
		expect(u[2]).toBe(-170);
	});
});
