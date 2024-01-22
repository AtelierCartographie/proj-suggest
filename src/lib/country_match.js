import { get_intersection_area, get_bbox_ratio_area, check_within } from './utils.js';

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
 * @param {Object} ref_bbox - The reference bounding box.
 * @returns {Array} - The countries that intersect with the reference bounding box.
 */
export function get_matched_bbox(ref_bbox, bbox_list) {
	const intersected_bbox = get_intersected_bbox(ref_bbox, bbox_list);

	return intersected_bbox.filter(
		(d) => (d.share >= intersection_threshold && d.ratio < ratio_threshold) || d.within === true
	);
}

/**
 * Calculates the intersected bounding box between a reference bounding box and a list of bounding boxes.
 * @param {Object} ref_bbox - The reference bounding box.
 * @param {Object[]} bbox_list - The list of bounding boxes.
 * @returns {Object[]} - The list of intersected bounding boxes.
 */
export function get_intersected_bbox(ref_bbox, bbox_list) {
	return bbox_list
		.map((d) => ({
			...d,
			share: get_intersection_area(ref_bbox, d.bbox),
			ratio: get_bbox_ratio_area(ref_bbox, d.bbox),
			within: check_within(ref_bbox, d.bbox)
		}))
		.filter((d) => d.share > 0);
}
