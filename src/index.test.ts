import { describe, it, expect } from 'vitest';
import {
	suggest_projections,
	suggest_generic_projections,
	match_national_projections,
	validate_bbox
} from './lib/index.js';
import { get_intersection_area, check_within } from './lib/utils.js';
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

describe('suggest_generic_projections — README examples', () => {
	const ids = (bbox: BBox) => suggest_generic_projections(bbox).map((d) => d.id);

	it('metropolitan France is a local-scale bbox', () => {
		expect(ids([-5, 41, 10, 51])).toEqual([
			'equirectangular',
			'mercator',
			'transverse_cylindrical_equal_area',
			'transverse_mercator'
		]);
	});

	it('Europe gets the conic projections', () => {
		expect(ids([-20, 35, 30, 65])).toEqual(['albers_conic', 'lambert_conformal_conic', 'equidistant_conic']);
	});

	it('a polar landscape region gets the three azimuthal projections, centred on the pole', () => {
		const result = suggest_generic_projections([-180, 75, 180, 90]);
		expect(result.map((d) => d.id)).toEqual(['laea', 'stereographic', 'azimuthal_equidistant']);
		expect(result.every((d) => d.d3?.rotate?.[1] === -90)).toBe(true);
	});
});

describe('suggest_generic_projections — antimeridian', () => {
	it('measures the shape of a bbox crossing the antimeridian (portrait, not landscape)', () => {
		// 175° E → 175° W is 10° wide and 40° tall: a portrait region.
		const ids = suggest_generic_projections([175, -50, -175, -10]).map((d) => d.id);
		expect(ids).toEqual(['transverse_cylindrical_equal_area', 'transverse_mercator', 'cassini']);
	});

	it('gives the same result as the equivalent bbox that does not cross', () => {
		const crossing = suggest_generic_projections([175, -50, -175, -10]).map((d) => d.id);
		const shifted = suggest_generic_projections([-5, -50, 5, -10]).map((d) => d.id);
		expect(crossing).toEqual(shifted);
	});

	it('excludes Orthographic for a crossing hemisphere wider than 180°', () => {
		// 60° E → 60° W across the antimeridian is 240° wide.
		const ids = suggest_generic_projections([60, 20, -60, 80]).map((d) => d.id);
		expect(ids).not.toContain('orthographic');
		expect(ids).toContain('laea');
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

describe('match_national_projections — Italy', () => {
	// Mainland, Sardinia, Sicily and the Pelagie Islands (Khartis basemaps bbox, ISTAT 2026).
	const italy: BBox = [6.6266, 35.4929, 18.5204, 47.0918];

	it('matches Italy for the national bbox, with the IGM Fuso Italia', () => {
		const results = match_national_projections(italy);
		const match = results.find((d) => d.id === 'italy');
		expect(match).toBeDefined();
		expect(match!.within).toBe(true);
		// Must stay identical to ITALIE_PROJ4 in khartis-basemaps (lib/italie-metadata.sh).
		expect(match!.proj4).toBe(
			'+proj=tmerc +lat_0=0 +lon_0=12 +k=0.9985 +x_0=7000000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
		);
		expect(match!.epsg).toBe('7794');
		expect(match!.d3).toEqual({ projection: 'geoTransverseMercator', rotate: [-12, 0] });
		expect(results.some((d) => d.id === 'switzerland')).toBe(false);
	});

	it('matches Italy for a single region (Sicily, Apulia)', () => {
		const sicily: BBox = [12.42, 36.64, 15.65, 38.32];
		const apulia: BBox = [14.93, 39.79, 18.52, 42.23];
		for (const bbox of [sicily, apulia]) {
			expect(match_national_projections(bbox).map((d) => d.id)).toContain('italy');
		}
	});

	it('does not suggest Italy for Switzerland, Austria or Slovenia', () => {
		const switzerland: BBox = [5.96, 45.82, 10.49, 47.81];
		const austria: BBox = [9.53, 46.37, 17.16, 49.02];
		const slovenia: BBox = [13.38, 45.42, 16.61, 46.88];
		// Slovenia lies inside the Italian bbox, but its own projection fits closely.
		for (const bbox of [switzerland, austria, slovenia]) {
			expect(match_national_projections(bbox).map((d) => d.id)).not.toContain('italy');
		}
	});

	it('does not suggest Italy for metropolitan France', () => {
		const france: BBox = [-5, 41, 10, 51];
		expect(match_national_projections(france).map((d) => d.id)).not.toContain('italy');
	});
});

describe('match_national_projections — official national grids', () => {
	// [id, EPSG, land bbox of the territory (GISCO 2024, remote islands excluded)]
	const cases: [string, string, BBox][] = [
		['portugal', '3763', [-9.522, 36.971, -6.194, 42.154]],
		['austria', '3416', [9.531, 46.372, 17.161, 49.019]],
		['poland', '2180', [14.127, 49.003, 24.142, 54.832]],
		['denmark', '25832', [8.078, 54.564, 15.155, 57.743]],
		['norway', '25833', [4.572, 57.96, 31.162, 71.172]],
		['sweden', '3006', [10.983, 55.339, 24.156, 69.06]],
		['finland', '3067', [19.254, 59.764, 31.579, 70.09]],
		['iceland', '8088', [-24.479, 63.295, -13.512, 66.564]],
		['estonia', '3301', [21.773, 57.513, 28.206, 59.688]],
		['latvia', '3059', [20.973, 55.678, 28.235, 58.082]],
		['lithuania', '3346', [20.954, 53.899, 26.835, 56.445]],
		['luxembourg', '2169', [5.741, 49.449, 6.526, 50.183]],
		['slovenia', '3794', [13.378, 45.426, 16.597, 46.875]],
		['croatia', '3765', [13.504, 42.413, 19.443, 46.551]],
		['greece', '2100', [19.373, 34.81, 29.648, 41.747]],
		['romania', '3844', [20.264, 43.62, 29.695, 48.26]],
		['guadeloupe', '5490', [-61.811, 15.83, -61.013, 16.505]],
		['martinique', '5490', [-61.229, 14.399, -60.813, 14.877]],
		['french_guiana', '2972', [-54.6, 2.118, -51.624, 5.748]],
		['reunion', '2975', [55.217, -21.387, 55.835, -20.874]],
		['mayotte', '4471', [45.015, -12.995, 45.296, -12.638]],
		['saint_pierre_miquelon', '4467', [-56.408, 46.755, -56.119, 47.134]],
		['alaska', '3338', [172.481, 51.218, -130.007, 71.371]],
		['hawaii', 'ESRI:102007', [-160.554, 18.914, -154.809, 22.228]],
		['new_zealand', '2193', [166.442, -47.283, 178.543, -34.123]],
		['south_korea', '5179', [124.607, 33.108, 130.923, 38.615]],
		['taiwan', '3826', [119.32, 21.9, 122.0, 25.29]],
		['israel', '2039', [34.267, 29.491, 35.68, 33.284]]
	];

	it.each(cases)('matches %s (EPSG %s) for its territory', (id, epsg, bbox) => {
		const match = match_national_projections(bbox).find((d) => d.id === id);
		expect(match).toBeDefined();
		expect(match!.within).toBe(true);
		expect(match!.epsg).toBe(epsg);
	});

	it('UTM entries are rotated to their central meridian in d3', () => {
		for (const d of proj_countries.filter((d) => d.proj4.startsWith('+proj=utm'))) {
			const zone = Number(d.proj4.match(/\+zone=(\d+)/)![1]);
			expect(d.d3.projection, d.id).toBe('geoTransverseMercator');
			expect(d.d3.rotate, d.id).toEqual([183 - zone * 6, 0]);
		}
	});

	it('French overseas departments use the same proj4 strings as the khartis-basemaps presets', () => {
		const proj4 = (id: string) => proj_countries.find((d) => d.id === id)!.proj4;
		const utm = (zone: string) =>
			`+proj=utm +zone=${zone} +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs`;
		expect(proj4('guadeloupe')).toBe(utm('20'));
		expect(proj4('martinique')).toBe(utm('20'));
		expect(proj4('saint_pierre_miquelon')).toBe(utm('21'));
		expect(proj4('french_guiana')).toBe(utm('22'));
		expect(proj4('mayotte')).toBe(utm('38 +south'));
		expect(proj4('reunion')).toBe(utm('40 +south'));
	});

	it('keeps neighbouring countries apart', () => {
		const ids = (bbox: BBox) => match_national_projections(bbox).map((d) => d.id);
		const spain: BBox = [-9.3015, 35.2655, 4.3278, 43.7924];
		const germany: BBox = [5.87, 47.27, 15.04, 55.06];
		const sweden: BBox = [10.983, 55.339, 24.156, 69.06];
		const finland: BBox = [19.254, 59.764, 31.579, 70.09];
		const denmark: BBox = [8.078, 54.564, 15.155, 57.743];
		const austria: BBox = [9.531, 46.372, 17.161, 49.019];
		const guadeloupe: BBox = [-61.811, 15.83, -61.013, 16.505];
		const reunion: BBox = [55.217, -21.387, 55.835, -20.874];
		expect(ids(spain)).not.toContain('portugal');
		expect(ids(germany)).not.toContain('denmark');
		expect(ids(germany)).not.toContain('austria');
		expect(ids(denmark)).not.toContain('germany');
		expect(ids(austria)).not.toContain('germany');
		expect(ids(sweden)).not.toContain('norway');
		expect(ids(sweden)).not.toContain('finland');
		expect(ids(finland)).not.toContain('sweden');
		expect(ids(finland)).not.toContain('norway');
		expect(ids(guadeloupe)).not.toContain('martinique');
		expect(ids(reunion)).not.toContain('mayotte');
	});

	it('Alaska and Hawaii are not suggested for the contiguous United States', () => {
		const ids = match_national_projections([-124.85, 24.55, -66.88, 49.38]).map((d) => d.id);
		expect(ids).toContain('usa');
		expect(ids).not.toContain('alaska');
		expect(ids).not.toContain('hawaii');
	});

	it('Alaska matches a bbox cut at the antimeridian (Aleutians east of 180° dropped)', () => {
		const ids = match_national_projections([-180, 51.2, -130, 71.4]).map((d) => d.id);
		expect(ids).toContain('alaska');
		expect(ids).not.toContain('canada');
	});
});

describe('match_national_projections — closest fit wins over containment', () => {
	const ids = (bbox: BBox) => match_national_projections(bbox).map((d) => d.id);

	it('drops a larger country that merely contains a closely fitting one', () => {
		expect(ids([5.741, 49.449, 6.526, 50.183])).not.toContain('france'); // Luxembourg
		expect(ids([2.54, 49.5, 6.4, 51.5])).not.toContain('france'); // Belgium
		expect(ids([-54.6, 2.118, -51.624, 5.748])).not.toContain('brazil'); // French Guiana
		expect(ids([-56.408, 46.755, -56.119, 47.134])).not.toContain('canada'); // Saint-Pierre-et-Miquelon
		expect(ids([124.607, 33.108, 130.923, 38.615])).toEqual(['south_korea']);
		expect(ids([119.32, 21.9, 122.0, 25.29])).toEqual(['taiwan']);
		for (const bbox of [
			[21.773, 57.513, 28.206, 59.688], // Estonia
			[20.973, 55.678, 28.235, 58.082], // Latvia
			[20.954, 53.899, 26.835, 56.445], // Lithuania
			[20.264, 43.62, 29.695, 48.26] // Romania
		] as BBox[]) {
			expect(ids(bbox)).not.toContain('russia');
		}
	});

	it('keeps the supranational EU projection alongside the country', () => {
		const luxembourg = ids([5.741, 49.449, 6.526, 50.183]);
		expect(luxembourg).toContain('luxembourg');
		expect(luxembourg).toContain('eu');
	});

	it('keeps every containing country when none fits closely', () => {
		// Corsica lies in both the French and the Italian bboxes.
		const corsica = ids([8.53, 41.33, 9.56, 43.03]);
		expect(corsica).toContain('france');
		expect(corsica).toContain('italy');
		// A region still gets its country.
		expect(ids([-5.14, 47.28, -1.02, 48.9])).toContain('france'); // Brittany
	});
});

describe('match_national_projections — Russia', () => {
	const ids = (bbox: BBox) => match_national_projections(bbox).map((d) => d.id);

	it('matches Russia with or without Kaliningrad and Chukotka', () => {
		expect(ids([26.85, 41.18, 180, 81.86])).toContain('russia'); // mainland, clipped at 180°
		expect(ids([19.6, 41.18, 180, 81.86])).toContain('russia'); // with Kaliningrad
		expect(ids([19.6, 41.18, -169, 81.86])).toContain('russia'); // and Chukotka, across 180°
		expect(ids([35.1, 54.2, 40.2, 56.97])).toContain('russia'); // Moscow Oblast
	});

	it('does not suggest Russia for Belarus, Ukraine, Moldova or Bulgaria', () => {
		for (const bbox of [
			[23.18, 51.26, 32.74, 56.17],
			[22.14, 44.39, 40.22, 52.38],
			[26.63, 45.47, 30.16, 48.49],
			[22.36, 41.24, 28.6, 44.22]
		] as BBox[]) {
			expect(ids(bbox)).not.toContain('russia');
		}
	});
});

describe('bbox intersection across the antimeridian', () => {
	it('measures the overlap of a box crossing the antimeridian', () => {
		// Two 20°-wide boxes sharing the 10° west of the antimeridian.
		expect(get_intersection_area([170, 0, -170, 10], [160, 0, 180, 10])).toBeCloseTo(0.5);
		expect(get_intersection_area([160, 0, 180, 10], [170, 0, -170, 10])).toBeCloseTo(0.5);
		// Overlap on both sides of the antimeridian.
		expect(get_intersection_area([175, 0, -175, 10], [170, 0, -170, 10])).toBeCloseTo(0.5);
		// Disjoint.
		expect(get_intersection_area([170, 0, -170, 10], [0, 0, 10, 10])).toBe(0);
	});

	it('checks containment of a box crossing the antimeridian', () => {
		expect(check_within([175, 0, -175, 10], [170, 0, -170, 10])).toBe(true);
		expect(check_within([175, 0, -175, 10], [-180, -90, 180, 90])).toBe(true);
		expect(check_within([175, 0, -175, 10], [170, 0, 180, 10])).toBe(false);
		expect(check_within([-179, 0, -171, 10], [170, 0, -170, 10])).toBe(true);
		expect(check_within([0, 0, 10, 10], [170, 0, -170, 10])).toBe(false);
	});

	it('is unchanged for ordinary boxes', () => {
		expect(get_intersection_area([0, 0, 10, 10], [5, 0, 15, 10])).toBeCloseTo(0.5);
		expect(check_within([1, 1, 2, 2], [0, 0, 10, 10])).toBe(true);
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
