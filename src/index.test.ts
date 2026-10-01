import { describe, it, expect } from 'vitest';
import {
	suggest_projections,
	suggest_generic_projections,
	match_national_projections,
	validate_bbox
} from './lib/index.js';
import type { BBox } from './lib/index.js';
import { proj_countries } from './lib/list_proj_countries.js';

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
		// All world projections have at least one of proj4 or d3
		expect(results.every((d) => d.proj4 !== undefined || d.d3 !== undefined)).toBe(true);
		// proj4-supported ones have a non-empty string
		const withProj4 = results.filter((d) => d.proj4 !== null);
		expect(withProj4.every((d) => typeof d.proj4!.string === 'string' && d.proj4!.string.length > 0)).toBe(true);
	});

	it('includes d3-only projections (no proj4) for world bbox', () => {
		const bbox: BBox = [-180, -90, 180, 90];
		const results = suggest_generic_projections(bbox);
		const d3only = results.filter((d) => d.proj4 === null);
		expect(d3only.length).toBeGreaterThan(0);
		expect(d3only.every((d) => d.d3 !== null && typeof d.d3!.projection === 'string')).toBe(true);
	});

	it('returns region projections for France bbox with proj4 and d3', () => {
		const bbox: BBox = [-5, 41, 10, 51];
		const results = suggest_generic_projections(bbox);
		expect(results.length).toBeGreaterThan(0);
		// All region projections support both proj4 and d3
		expect(results.every((d) => d.proj4 !== null && d.d3 !== null)).toBe(true);
	});

	it('proj4 strings are dynamic and vary with bbox', () => {
		const france: BBox = [-5, 41, 10, 51];
		const chile: BBox = [-76, -56, -66, -17];
		const r_france = suggest_generic_projections(france);
		const r_chile = suggest_generic_projections(chile);
		// Both return landscape/portrait region projections but with different params
		expect(r_france[0].proj4!.string).not.toBe(r_chile[0].proj4!.string);
	});

	it('d3 config has correct rotate for a known projection', () => {
		// region-landscape in temperate zone → albers_conic + others
		const bbox: BBox = [-20, 35, 30, 65];
		const results = suggest_generic_projections(bbox);
		const albers = results.find((d) => d.id === 'albers_conic');
		expect(albers).toBeDefined();
		expect(albers!.d3!.projection).toBe('geoAlbers');
		expect(albers!.d3!.rotate).toBeDefined();
		expect(albers!.d3!.parallels).toBeDefined();
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

	it('national projections have standalone proj4 strings', () => {
		const bbox: BBox = [-4, 42, 8, 50]; // France
		const results = match_national_projections(bbox);
		expect(results.length).toBeGreaterThan(0);
		expect(results.every((d) => typeof d.proj4 === 'string' && d.proj4.includes('+proj='))).toBe(true);
	});

	it('national projections have d3 config', () => {
		const bbox: BBox = [-4, 42, 8, 50]; // France
		const results = match_national_projections(bbox);
		expect(results.every((d) => d.d3 !== null && typeof d.d3.projection === 'string')).toBe(true);
	});

	it('France proj4 has correct lon_0', () => {
		const bbox: BBox = [-4, 42, 8, 50];
		const results = match_national_projections(bbox);
		const france = results.find((d) => d.id === 'france');
		expect(france).toBeDefined();
		expect(france!.proj4).toContain('+lon_0=3');
	});

	it('USA proj4 has correct lon_0 (not neutralized)', () => {
		const bbox: BBox = [-124.85, 24.55, -66.88, 49.38];
		const results = match_national_projections(bbox);
		const usa = results.find((d) => d.id === 'usa');
		expect(usa).toBeDefined();
		expect(usa!.proj4).toContain('+lon_0=-96');
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

describe('proj_countries', () => {
	it('d3 rotate[0] matches -lon_0 of the proj4 string', () => {
		const with_lon_0 = proj_countries.filter((d) => /\+lon_0=/.test(d.proj4));
		expect(with_lon_0.length).toBeGreaterThan(0);
		for (const d of with_lon_0) {
			const lon_0 = Number(d.proj4.match(/\+lon_0=(-?[\d.]+)/)![1]);
			const rotate_lon = d.d3.rotate?.[0];
			expect(rotate_lon, d.id).toBeDefined();
			// tolerance covers rounded entries (e.g. belgium, switzerland)
			expect(Math.abs(rotate_lon! + lon_0), d.id).toBeLessThanOrEqual(0.05);
		}
	});
});
