/**
 * Checks that every `D3Usage` in the catalogues really builds with d3, and that
 * the resulting projection matches its proj4 counterpart.
 *
 * d3-geo, d3-geo-projection, d3-geo-polygon and proj4 are dev dependencies
 * only: the published library stays dependency-free.
 */
import { describe, it, expect } from 'vitest';
import * as d3geo from 'd3-geo';
import * as d3proj from 'd3-geo-projection';
import * as d3poly from 'd3-geo-polygon';
import proj4 from 'proj4';
import { projections, type D3Usage, type ProjParams } from './lib/list_proj_suggestions.js';
import { proj_countries } from './lib/list_proj_countries.js';

// d3-geo-polygon re-exports some d3-geo-projection names (e.g. geoPolyhedralWaterman)
// with a different clipping; d3-geo-projection takes precedence, as in the README.
const d3 = { ...d3poly, ...d3proj, ...d3geo } as unknown as Record<string, any>;

const PARAMS: ProjParams = { lon: 10, lat: 45, lat_1: 50, lat_2: 40 };

/** Builds a d3 projection from a `D3Usage`, failing loudly on any unknown factory or method. */
function build(usage: D3Usage): any {
	if (usage.snippet) {
		return new Function('d3', `return ${usage.snippet};`)(d3);
	}
	const factory = d3[usage.projection];
	if (typeof factory !== 'function') throw new Error(`unknown d3 factory ${usage.projection}`);
	const p = factory();
	const call = (method: string, value: unknown) => {
		if (value === undefined) return;
		if (typeof p[method] !== 'function') throw new Error(`${usage.projection} has no .${method}()`);
		p[method](value);
	};
	call('rotate', usage.rotate);
	call('center', usage.center);
	call('parallels', usage.parallels);
	call('parallel', usage.parallel);
	call('angle', usage.angle);
	return p;
}

const generic = projections
	.filter((p) => p._d3)
	.map((p) => ({ id: p.id, d3: p._d3!(PARAMS), proj4: p._proj4?.(PARAMS) }));
const national = proj_countries.map((c) => ({ id: c.id, d3: c.d3, proj4: c.proj4 }));

describe('D3Usage builds with d3', () => {
	it.each([...generic, ...national].map((d) => [d.id, d.d3] as const))('%s', (_id, usage) => {
		const p = build(usage);
		expect(typeof p).toBe('function');
		expect(typeof p.stream).toBe('function');
		const xy = p([2, 1]);
		expect(xy?.every(Number.isFinite)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Shape agreement with proj4, on the unit sphere and up to a translation:
// compare the vectors between projected points (d3's y axis points down).
// ---------------------------------------------------------------------------

/** Replaces datum, scale factor and offsets by a unit sphere. */
function unit_sphere(proj: string): string {
	// proj4js needs an ellipsoid for UTM: rewrite it as the equivalent tmerc.
	const utm = proj.match(/\+proj=utm \+zone=(\d+)/);
	if (utm) proj = proj.replace(utm[0], `+proj=tmerc +lon_0=${+utm[1] * 6 - 183}`);
	const stripped = proj
		.split(/\s+/)
		.filter((t) => !/^\+(ellps|datum|towgs84|units|no_defs|type|x_0|y_0|k|k_0|R|a|b|rf)\b/.test(t))
		.join(' ');
	// somerc is ellipsoidal by construction (Rosenmund's double projection).
	return stripped.includes('+proj=somerc')
		? `${stripped} +a=1 +rf=299.1528128`
		: `${stripped} +R=1`;
}

function proj4_forward(proj: string): ((lonlat: [number, number]) => [number, number]) | null {
	try {
		const p = proj4(unit_sphere(proj));
		p.forward([0, 0]);
		return (lonlat) => p.forward(lonlat) as [number, number];
	} catch {
		return null; // not supported by proj4js (times, bertin1953, imoll…)
	}
}

/** Maximum relative discrepancy between d3 and proj4 vectors around `center`. */
function discrepancy(
	usage: D3Usage,
	proj: string,
	center: [number, number],
	span = 5
): number | null {
	const fwd = proj4_forward(proj);
	if (!fwd) return null;
	const d3p = build(usage).scale(1).translate([0, 0]);
	const [lon, lat] = center;
	const pts: [number, number][] = [
		[lon, lat],
		[lon - span, lat - span],
		[lon + span, lat - span],
		[lon - span, lat + span],
		[lon + span, lat + span]
	];
	const a = pts.map((p) => d3p(p) as [number, number]);
	const b = pts.map((p) => {
		const [x, y] = fwd(p);
		return [x, -y];
	});
	const va = a.slice(1).map((p) => [p[0] - a[0][0], p[1] - a[0][1]]);
	const vb = b.slice(1).map((p) => [p[0] - b[0][0], p[1] - b[0][1]]);
	// Some d3 raw projections use a different nominal scale (e.g. stereographic
	// is half PROJ's): compare up to the least-squares uniform scale factor.
	let dot = 0,
		norm = 0;
	for (let i = 0; i < va.length; i++) {
		dot += va[i][0] * vb[i][0] + va[i][1] * vb[i][1];
		norm += va[i][0] ** 2 + va[i][1] ** 2;
	}
	const k = dot / norm;
	let worst = 0;
	for (let i = 0; i < va.length; i++) {
		worst = Math.max(
			worst,
			Math.hypot(k * va[i][0] - vb[i][0], k * va[i][1] - vb[i][1]) / Math.hypot(vb[i][0], vb[i][1])
		);
	}
	return worst;
}

describe('D3Usage matches the proj4 string (generic projections)', () => {
	const cases = generic.filter((d) => d.proj4 && !d.d3.snippet && proj4_forward(d.proj4));
	it.each(cases.map((d) => [d.id, d] as const))('%s', (_id, d) => {
		expect(discrepancy(d.d3, d.proj4!, [PARAMS.lon!, PARAMS.lat!])).toBeLessThan(1e-6);
	});
});

describe('D3Usage matches the proj4 string (national projections)', () => {
	// Ellipsoid vs sphere and scale factors (k ≠ 1) leave a small residual.
	it.each(national.map((d) => [d.id, d] as const))('%s', (_id, d) => {
		const c = proj_countries.find((p) => p.id === d.id)!;
		const center: [number, number] = [(c.bbox[0] + c.bbox[2]) / 2, (c.bbox[1] + c.bbox[3]) / 2];
		const span = Math.min(c.bbox[2] - c.bbox[0], c.bbox[3] - c.bbox[1]) / 3;
		expect(discrepancy(d.d3, d.proj4, center, span)).toBeLessThan(0.01);
	});
});

describe('transverse cylindrical equal area', () => {
	it('matches the spherical formulas (Snyder 1987, eq. 10-2/10-3)', () => {
		const lon0 = -70;
		const usage = projections.find((p) => p.id === 'transverse_cylindrical_equal_area')!._d3!({
			lon: lon0
		});
		const p = build(usage).scale(1).translate([0, 0]);
		const r = Math.PI / 180;
		for (const [lon, lat] of [
			[-72, -20],
			[-68, -50],
			[-66, -40]
		]) {
			const dl = (lon - lon0) * r;
			const x = Math.cos(lat * r) * Math.sin(dl);
			const y = Math.atan2(Math.tan(lat * r), Math.cos(dl));
			const [px, py] = p([lon, lat]);
			expect(px).toBeCloseTo(x, 9);
			expect(-py).toBeCloseTo(y, 9);
		}
	});
});
