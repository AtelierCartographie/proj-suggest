import { get_earth_share, get_bbox_centroid } from './utils.js';
import { projections } from './list_proj_suggestions.js';

/**
 * Retrieves a list of projection suggestions based on the given bounding box in EPSG:4326 coordinates.
 *
 * @param {number[]} bbox - The bounding box coordinates [x0, y0, x1, y1] (lon_min, lat_min, lon_max, lat_max).
 * @returns {Object[]} - The list of projection suggestions.
 */
export function get_proj_suggestions(bbox) {
	const [x0, y0, x1, y1] = bbox;

	const earth_share = get_earth_share(bbox);
	// Scale: "world", "hemisphere", "region" or "local"
	const scale_type = get_scale(earth_share);
	// Extent format: "square", "portrait" or "landscape"
	const ratio = (y1 - y0) / (x1 - x0);
	const ratio_type = get_ratio_type(ratio);

	// WORLD
	// No parameter needed
	if (scale_type === 'world') return projections.filter((d) => d.scale.includes(scale_type));

	// bbox centroid
	const [cx, cy] = get_bbox_centroid(bbox);

	const proj = { lon: +cx.toFixed(2), lat: +cy.toFixed(2) };
	let filters = { scale: scale_type, id: [] }; // store projection filters criteria

	// HEMISPHERE + REGION
	// need snapping to pole or equator ?
	const snap_to_pole_75 = Math.abs(cy) > 75;
	const snap_to_pole_85 = Math.abs(cy) > 85;
	const snap_to_equator = Math.abs(cy) < 15;
	const within_tropics = Math.abs(y0) < 23.44 && Math.abs(y1) < 23.44;
	const sign = Math.sign(cy);

	// CALCUL STANDARD PARALLELS
	if (snap_to_pole_75 || snap_to_equator) {
		const interval = (y1 - y0) / 4;
		proj.lat_1 = +(cy + interval).toFixed(2);
		proj.lat_2 = +(cy - interval).toFixed(2);
	}
	const interval = (y1 - y0) / 6;
	proj.lat_1 = +(cy + interval).toFixed(2);
	proj.lat_2 = +(cy - interval).toFixed(2);

	const id = scale_type + '-' + ratio_type;
	switch (id) {
		case 'hemisphere-square':
		case 'hemisphere-landscape':
		case 'hemisphere-portrait':
			if (within_tropics) {
				proj.lat = 0;
				filters.id.push('mercator', 'cylindrical_equal_area', 'equirectangular');
				break;
			}
			// Add orthographic when sure to stay within the visible part of the globe
			if (x1 - x0 <= 180) filters.id.push('orthographic');
			filters.id.push('laea', 'azimuthal_equidistant');
			break;

		case 'region-square':
			if (snap_to_pole_75) proj.lat = sign * 90;
			if (snap_to_equator) proj.lat = 0;
			filters.id.push('laea', 'stereographic', 'equidistant_conic');
			break;

		case 'region-landscape':
			if (snap_to_pole_75) {
				proj.lat = sign * 90;
				filters.id.push('laea', 'stereographic', 'azimuthal_equidistant');
				break;
			}
			if (snap_to_equator || within_tropics) {
				proj.lat = 0;
				filters.id.push('cylindrical_equal_area', 'mercator', 'equirectangular');
				break;
			}
			filters.id.push('albers_conic', 'lambert_conformal_conic', 'equidistant_conic');
			break;

		case 'region-portrait':
			filters.id.push('transverse_cylindrical_equal_area', 'transverse_mercator', 'cassini');
			break;

		case 'local-portrait':
			filters.id.push('transverse_cylindrical_equal_area', 'transverse_mercator');
			break;
	}

	const list = projections.filter(
		(d) =>
			d.scale.includes(scale_type) && (filters.id.length > 0 ? filters.id.includes(d.id) : true)
	);

	return list.map((d) => ({ ...d, proj4: d.proj4(proj) }));

	function get_scale(earth_share) {
		if (earth_share >= 2 / 3) return 'world';
		if (earth_share >= 1 / 6) return 'hemisphere';
		if (earth_share >= 1 / 200) return 'region';
		return 'local';
	}

	function get_ratio_type(ratio) {
		if (ratio <= 0.8) return 'landscape';
		if (ratio >= 1.25) return 'portrait';
		return 'square';
	}
}
