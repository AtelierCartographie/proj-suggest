import { get_intersection_area, get_bbox_ratio_area, check_within } from './utils.js';
import { proj_countries } from './list_proj_countries.js';

/**
 * The threshold value used for determining the intersection match between two bbox.
 * @type {number}
 */
const intersection_threshold = 0.75;
/**
 * The threshold value used for comparing ratios.
 * @type {number}
 */
const ratio_threshold = 2;

/**
 * Checks the intersection between a reference bounding box and the bounding boxes of countries.
 * Returns the countries that intersect with the reference bounding box based on certain criteria.
 *
 * @param {Object} ref_bbox - The reference bounding box in EPSG:4326 coordinates [lon_min, lat_min, lon_max, lat_max].
 * @returns {Array} - The countries that intersect with the reference bounding box.
 */
export function get_matched_bbox(ref_bbox) {
	const intersected_bbox = get_intersected_bbox(ref_bbox);

	return intersected_bbox.filter(
		(d) => (d.share >= intersection_threshold && d.ratio < ratio_threshold) || d.within === true
	);
}

/**
 * Calculates the intersected bounding box between a reference bounding box and a list of countries bounding boxes.
 * All bbox are in EPSG:4326 coordinates [lon_min, lat_min, lon_max, lat_max].
 * @param {Object} ref_bbox - The reference bounding box.
 * @returns {Object[]} - The list of intersected bounding boxes.
 */
export function get_intersected_bbox(ref_bbox) {
	return proj_countries
		.map((d) => ({
			...d,
			share: get_intersection_area(ref_bbox, d.bbox),
			ratio: get_bbox_ratio_area(ref_bbox, d.bbox),
			within: check_within(ref_bbox, d.bbox)
		}))
		.filter((d) => d.share > 0);
}
