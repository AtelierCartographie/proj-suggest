/**
 * Projection suggestion algorithm — independent TypeScript reimplementation.
 *
 * The decision tree (scale → shape ratio → geographic position → projection family)
 * is derived from published cartographic methodology:
 *
 *   Snyder, J. P. (1987). Map Projections — A Working Manual.
 *   USGS Professional Paper 1395, p. 34–35. https://doi.org/10.3133/pp1395
 *
 *   Šavrič, B., Jenny, B. and Jenny, H. (2016). Projection Wizard — An Online
 *   Map Projection Selection Tool. The Cartographic Journal, 53(2), p. 177–185.
 *   https://doi.org/10.1080/00087041.2015.1131938
 *
 * @copyright 2026 Thomas Ansart - Atelier Cartographie de Sciences Po
 * @license ISC
 */
import { get_earth_share, get_bbox_centroid, type BBox } from './utils.js';
import {
	projections,
	type Projection,
	type ProjParams,
	type ResolvedProjection,
	type ScaleType
} from './list_proj_suggestions.js';

function resolve(p: Projection, params: ProjParams): ResolvedProjection {
	return {
		id: p.id,
		name: p.name,
		scale: p.scale,
		shape: p.shape,
		...(p.equalarea !== undefined && { equalarea: p.equalarea }),
		proj4: p._proj4 ? { string: p._proj4(params) } : null,
		d3: p._d3 ? p._d3(params) : null
	};
}

type RatioType = 'landscape' | 'portrait' | 'square';

function get_scale(earth_share: number): ScaleType {
	if (earth_share >= 2 / 3) return 'world';
	if (earth_share >= 1 / 6) return 'hemisphere';
	if (earth_share >= 1 / 200) return 'region';
	return 'local';
}

function get_ratio_type(ratio: number): RatioType {
	if (ratio <= 0.8) return 'landscape';
	if (ratio >= 1.25) return 'portrait';
	return 'square';
}

/**
 * Returns a list of generic projection suggestions based on the given bounding box.
 */
export function suggest_generic_projections(bbox: BBox): ResolvedProjection[] {
	const [x0, y0, x1, y1] = bbox;

	const earth_share = get_earth_share(bbox);
	const scale_type = get_scale(earth_share);
	const ratio = (y1 - y0) / (x1 - x0);
	const ratio_type = get_ratio_type(ratio);

	// World: no parameters needed
	if (scale_type === 'world') {
		return projections
			.filter((d) => d.scale.includes(scale_type))
			.map((d) => resolve(d, {}));
	}

	const [cx, cy] = get_bbox_centroid(bbox);

	const proj: { lon: number; lat: number; lat_1: number; lat_2: number } = {
		lon: +cx.toFixed(2),
		lat: +cy.toFixed(2),
		lat_1: 0,
		lat_2: 0
	};

	const filter_ids: string[] = [];

	const snap_to_pole_75 = Math.abs(cy) > 75;
	const snap_to_pole_85 = Math.abs(cy) > 85;
	const snap_to_equator = Math.abs(cy) < 15;
	const within_tropics = Math.abs(y0) < 23.44 && Math.abs(y1) < 23.44;
	const sign = Math.sign(cy);

	// Standard parallels: use 1/4 interval for polar/equatorial, 1/6 otherwise
	if (snap_to_pole_75 || snap_to_equator) {
		const interval = (y1 - y0) / 4;
		proj.lat_1 = +(cy + interval).toFixed(2);
		proj.lat_2 = +(cy - interval).toFixed(2);
	} else {
		const interval = (y1 - y0) / 6;
		proj.lat_1 = +(cy + interval).toFixed(2);
		proj.lat_2 = +(cy - interval).toFixed(2);
	}

	const id = `${scale_type}-${ratio_type}`;
	switch (id) {
		case 'hemisphere-square':
		case 'hemisphere-landscape':
		case 'hemisphere-portrait':
			if (within_tropics) {
				proj.lat = 0;
				filter_ids.push('mercator', 'cylindrical_equal_area', 'equirectangular');
				break;
			}
			if (x1 - x0 <= 180) filter_ids.push('orthographic');
			filter_ids.push('laea', 'azimuthal_equidistant');
			break;

		case 'region-square':
			if (snap_to_pole_75) proj.lat = sign * 90;
			if (snap_to_equator) proj.lat = 0;
			filter_ids.push('laea', 'stereographic', 'equidistant_conic');
			break;

		case 'region-landscape':
			if (snap_to_pole_75) {
				proj.lat = sign * 90;
				filter_ids.push('laea', 'stereographic', 'azimuthal_equidistant');
				break;
			}
			if (snap_to_equator || within_tropics) {
				proj.lat = 0;
				filter_ids.push('cylindrical_equal_area', 'mercator', 'equirectangular');
				break;
			}
			filter_ids.push('albers_conic', 'lambert_conformal_conic', 'equidistant_conic');
			break;

		case 'region-portrait':
			filter_ids.push('transverse_cylindrical_equal_area', 'transverse_mercator', 'cassini');
			break;

		case 'local-portrait':
			filter_ids.push('transverse_cylindrical_equal_area', 'transverse_mercator');
			break;
	}

	return projections
		.filter(
			(d) =>
				d.scale.includes(scale_type) &&
				(filter_ids.length > 0 ? filter_ids.includes(d.id) : true)
		)
		.map((d) => resolve(d, proj));
}
