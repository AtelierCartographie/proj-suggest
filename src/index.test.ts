import { describe, it, expect } from 'vitest';
import {
	suggest_projections,
	suggest_generic_projections,
	match_national_projections,
	validate_bbox
} from './lib/index.js';
import type { BBox } from './lib/index.js';

describe('suggest_projections', () => {
	it('returns both national and generic for France bbox', () => {
		const bbox: BBox = [-5, 41, 10, 51];
		const result = suggest_projections(bbox);
		expect(result.generic.length).toBeGreaterThan(0);
		expect(result.national.some((d) => d.id === 'france')).toBe(true);
	});

	it('returns empty national when option is disabled', () => {
		const bbox: BBox = [-5, 41, 10, 51];
		const result = suggest_projections(bbox, { national: false });
		expect(result.national).toEqual([]);
		expect(result.generic.length).toBeGreaterThan(0);
	});

	it('returns empty national for unmatched bbox', () => {
		const bbox: BBox = [100, 10, 110, 20];
		const result = suggest_projections(bbox);
		expect(result.national).toEqual([]);
	});
});

describe('suggest_generic_projections', () => {
	it('returns world projections for a large bbox', () => {
		const bbox: BBox = [-180, -90, 180, 90];
		const results = suggest_generic_projections(bbox);
		expect(results.length).toBeGreaterThan(0);
		expect(results.every((d) => d.proj4)).toBe(true);
	});

	it('returns region projections for France bbox', () => {
		const bbox: BBox = [-5, 41, 10, 51];
		const results = suggest_generic_projections(bbox);
		expect(results.length).toBeGreaterThan(0);
	});
});

describe('match_national_projections', () => {
	it('matches France for a French bbox', () => {
		const bbox: BBox = [-4, 42, 8, 50];
		const results = match_national_projections(bbox);
		const ids = results.map((d) => d.id);
		expect(ids).toContain('france');
	});

	it('returns empty for unmatched bbox', () => {
		const bbox: BBox = [100, 10, 110, 20];
		const results = match_national_projections(bbox);
		expect(results).toEqual([]);
	});
});

describe('validate_bbox', () => {
	it('accepts a valid bbox', () => {
		const result = validate_bbox([-5, 41, 10, 51]);
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it('accepts antimeridian crossing (lon_min > lon_max)', () => {
		const result = validate_bbox([170, -10, -170, 10]);
		expect(result.valid).toBe(true);
	});

	it('accepts full world bbox', () => {
		const result = validate_bbox([-180, -90, 180, 90]);
		expect(result.valid).toBe(true);
	});

	it('rejects NaN values', () => {
		const result = validate_bbox([NaN, 0, 10, 10]);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
	});

	it('rejects Infinity values', () => {
		const result = validate_bbox([-Infinity, 0, 10, 10]);
		expect(result.valid).toBe(false);
	});

	it('rejects longitude out of range', () => {
		const result = validate_bbox([-200, 0, 10, 10]);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain('lon_min');
	});

	it('rejects latitude out of range', () => {
		const result = validate_bbox([0, -100, 10, 10]);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain('lat_min');
	});

	it('rejects inverted latitudes', () => {
		const result = validate_bbox([0, 50, 10, 40]);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain('lat_min');
	});

	it('rejects zero-width bbox', () => {
		const result = validate_bbox([10, 0, 10, 10]);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain('no width');
	});

	it('rejects zero-height bbox', () => {
		const result = validate_bbox([0, 10, 10, 10]);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain('no height');
	});

	it('accumulates multiple errors', () => {
		const result = validate_bbox([0, 200, 0, -200]);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(1);
	});
});
