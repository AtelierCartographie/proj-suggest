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

describe('match_national_projections — Spain', () => {
	// Mainland + Balearics + Ceuta and Melilla, Canary Islands excluded (Khartis basemaps bbox).
	const spain: BBox = [-9.3015, 35.2655, 4.3278, 43.7924];
	const canaries: BBox = [-18.16, 27.64, -13.34, 29.42];

	it('matches Spain for the mainland bbox, with the IGN (ANE) Lambert conic conformal', () => {
		const results = match_national_projections(spain);
		const match = results.find((d) => d.id === 'spain');
		expect(match).toBeDefined();
		expect(match!.within).toBe(true);
		// Must stay identical to ESPAGNE_PROJ4 in khartis-basemaps (lib/espagne-metadata.sh).
		expect(match!.proj4).toBe(
			'+proj=lcc +lat_0=40 +lon_0=-3 +lat_1=42.8333333333333 +lat_2=37.1166666666667 +x_0=600000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
		);
		// No EPSG code for this projection.
		expect(match!.epsg).toBe('');
		expect(match!.d3).toEqual({
			projection: 'geoConicConformal',
			rotate: [3, 0], // lon_0 = -3 → rotate[0] = +3
			parallels: [37.1166666666667, 42.8333333333333]
		});
		expect(results.some((d) => d.id === 'canary_islands')).toBe(false);
	});

	it('matches Spain for a single region (Galicia)', () => {
		const galicia: BBox = [-9.3, 41.8, -6.73, 43.79];
		expect(match_national_projections(galicia).map((d) => d.id)).toContain('spain');
	});

	it('matches the Canary Islands on their own tangent cone, not mainland Spain', () => {
		const results = match_national_projections(canaries);
		const ids = results.map((d) => d.id);
		expect(ids).toContain('canary_islands');
		expect(ids).not.toContain('spain');
		const match = results.find((d) => d.id === 'canary_islands')!;
		// Must stay identical to CANARIAS_PROJ4 in khartis-basemaps (lib/espagne-metadata.sh).
		expect(match.proj4).toBe(
			'+proj=lcc +lat_0=28.5 +lon_0=-16 +lat_1=28.5 +x_0=300000 +y_0=300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
		);
		expect(match.epsg).toBe('');
		expect(match.d3).toEqual({
			projection: 'geoConicConformal',
			rotate: [16, 0],
			parallels: [28.5, 28.5]
		});
	});

	it('matches the Canary Islands for a single island (Tenerife)', () => {
		const tenerife: BBox = [-16.92, 27.99, -16.12, 28.59];
		expect(match_national_projections(tenerife).map((d) => d.id)).toContain('canary_islands');
	});

	it('does not suggest Spain for mainland Portugal', () => {
		const portugal: BBox = [-9.53, 36.96, -6.19, 42.15];
		expect(match_national_projections(portugal).map((d) => d.id)).not.toContain('spain');
	});

	it('does not suggest Spain or the Canary Islands for Morocco', () => {
		const morocco: BBox = [-13.17, 27.66, -0.99, 35.92];
		const morocco_with_western_sahara: BBox = [-17.1, 20.77, -0.99, 35.92];
		for (const bbox of [morocco, morocco_with_western_sahara]) {
			const ids = match_national_projections(bbox).map((d) => d.id);
			expect(ids).not.toContain('spain');
			expect(ids).not.toContain('canary_islands');
		}
	});

	it('does not suggest Spain for metropolitan France', () => {
		const france: BBox = [-5, 41, 10, 51];
		expect(match_national_projections(france).map((d) => d.id)).not.toContain('spain');
	});

	it('suggests Spain for per-feature bboxes including the Canary Islands', () => {
		// The single bbox spanning the Canaries is too large to match…
		const with_canaries: BBox = [-18.16, 27.64, 4.33, 43.79];
		expect(match_national_projections(with_canaries).map((d) => d.id)).not.toContain('spain');
		// …but the multi-bbox reduction discards them as a detached territory.
		const boxes: BBox[] = [
			[-9.3, 41.8, -6.73, 43.79], // Galicia
			[-7.5, 38.0, -1.0, 42.0], // Castile
			[-7.53, 36.0, -1.63, 38.73], // Andalusia
			[0.16, 40.52, 3.33, 42.86], // Catalonia
			[1.15, 38.64, 4.33, 40.09], // Balearic Islands
			[-5.38, 35.87, -5.27, 35.92], // Ceuta
			[-2.98, 35.26, -2.92, 35.32], // Melilla
			canaries
		];
		const result = suggest_projections(boxes);
		expect(result.reduced?.outliers).toHaveLength(1);
		const ids = result.national.map((d) => d.id);
		expect(ids).toContain('spain');
		expect(ids).not.toContain('canary_islands');
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
