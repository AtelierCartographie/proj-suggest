import { get_earth_share, get_bbox_centroid } from './utils.js';
import { projections } from './proj_list.js';

/**
 * Retrieves a list of projection suggestions based on the given bounding box.
 *
 * @param {number[]} bbox - The bounding box coordinates [x0, y0, x1, y1].
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
	if (scale_type === 'world') return proj_list.filter((d) => d.scale.includes(scale_type));

	// bbox centroid
	const [cx, cy] = get_bbox_centroid(bbox);

	const proj = { center: { lon: +cx.toFixed(2), lat: +cy.toFixed(2) } };
	let filters = { scale: scale_type, id: [] }; // store projection filters criteria

	// HEMISPHERE + REGION
	const id = scale_type + '-' + ratio_type;
	switch (id) {
		case 'region-square':
			// Snap to pole
			if (cy > 75) proj.center.lat = 90;
			if (cy < -75) proj.center.lat = -90;
			// Snap to equator
			if (cy > -15 && cy < 15) proj.center.lat = 0;
			break;

		case 'region-landscape':
			// Snap to pole
			if (cy > 75) proj.center.lat = 90;
			if (cy < -75) proj.center.lat = -90;
			// Snap to equator
			if (cy > -15 && cy < 15) proj.center.lat = 0;
			// Also snap to equator if within tropics
			if (Math.abs(y0) < 23.44 && Math.abs(y1) < 23.44) proj.center.lat = 0;
			break;

		case 'hemisphere-landscape':
			// Snap to pole
			if (cy > 85) proj.center.lat = 90;
			if (cy < -85) proj.center.lat = -90;
			// Snap to equator if within tropics
			if (Math.abs(y0) < 23.44 && Math.abs(y1) < 23.44) {
				console.log(id);
				proj.center.lat = 0;
				filters.id.push('mercator', 'cylindrical_equal_area', 'equirectangular');
			}
			break;
	}

	const list = projections.filter(
		(d) =>
			d.scale.includes(scale_type) && (filters.id.length > 0 ? filters.id.includes(d.id) : true)
	);

	return list;

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
