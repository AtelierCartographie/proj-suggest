/**
 * Calculates the share of the area of the second bbox that is intersected by the first bbox.
 * @param {number[]} bbox_1 - [lon_min, lat_min, lon_max, lat_max].
 * @param {number[]} bbox_2 - [lon_min, lat_min, lon_max, lat_max].
 * @returns {number} The share of the area of `bbox_2` that is intersected by `bbox_1`. The result is a number between 0 and 1.
 */
export function get_intersection_area(bbox_1, bbox_2) {
	const min = Math.min;
	const max = Math.max;
	const [min_x1, min_y1, max_x1, max_y1] = bbox_1;
	const [min_x2, min_y2, max_x2, max_y2] = bbox_2;

	const overlap_bbox = [
		max(min_x1, min_x2),
		max(min_y1, min_y2),
		min(max_x1, max_x2),
		min(max_y1, max_y2)
	];

	// exit if bbox 1 and 2 don't overlap
	if (overlap_bbox[2] - overlap_bbox[0] < 0 || overlap_bbox[3] - overlap_bbox[1] < 0) return 0;

	const overlap_area = get_bbox_area(overlap_bbox);
	const bbox_2_area = get_bbox_area(bbox_2);

	const overlap_share = overlap_area / bbox_2_area;
	return overlap_share;
}

/**
 * Calculates the ratio of the areas of two bounding boxes.
 *
 * @param {Array<number>} bbox_1 - [lon_min, lat_min, lon_max, lat_max].
 * @param {Array<number>} bbox_2 - [lon_min, lat_min, lon_max, lat_max].
 * @returns {number} The ratio of the area of the first box to the area of the second box.
 */
export function get_bbox_ratio_area(bbox_1, bbox_2) {
	const bbox_1_area = get_bbox_area(bbox_1);
	const bbox_2_area = get_bbox_area(bbox_2);

	return bbox_1_area / bbox_2_area;
}

/**
 * Checks if the first bounding box is within the second bounding box.
 *
 * @param {Array<number>} bbox_1 - [lon_min, lat_min, lon_max, lat_max].
 * @param {Array<number>} bbox_2 - [lon_min, lat_min, lon_max, lat_max].
 * @returns {boolean} Returns true if the first bbox is within the second bbox, false otherwise.
 */
export function check_within(bbox_1, bbox_2) {
	const [min_x1, min_y1, max_x1, max_y1] = bbox_1;
	const [min_x2, min_y2, max_x2, max_y2] = bbox_2;
	//prettier-ignore
	return min_x1 >= min_x2 &&
           min_y1 >= min_y2 &&
           max_x1 <= max_x2 &&
           max_y1 <= max_y2;
}

/**
 * Earth surface area in steradians.
 * @type {number}
 */
const earth = 4 * Math.PI;

/**
 * Calculates the earth share in spherical area based on the given bounding box.
 * @param {Array<number>} bbox - [lon_min, lat_min, lon_max, lat_max].
 * @returns {number} The earth share value.
 */
export function get_earth_share(bbox) {
	const area = get_bbox_area(bbox);
	return area / earth;
}

/**
 * Calculates the area of a bounding box on a sphere.
 * Can handles bounding boxes that cross the 180th meridian.
 *
 * @param {number[]} bbox - [lon_min, lat_min, lon_max, lat_max].
 * @returns {number} The area of the bounding box.
 */
export function get_bbox_area(bbox) {
	// Convert latitude and longitude to radians
	let [lon_min, lat_min, lon_max, lat_max] = bbox.map(to_radian);

	// Check if the bounding box crosses the 180th meridian
	if (lon_min > lon_max) lon_max += 2 * Math.PI; // Add 360 degrees to maxLon

	// Calculate the area
	const area = Math.abs((lon_max - lon_min) * (Math.sin(lat_max) - Math.sin(lat_min)));

	return area;
}

/**
 * Calculates the centroid of a bounding box.
 * Can handle bbox that cross the 180th meridian.
 *
 * @param {number[]} bbox - [lon_min, lat_min, lon_max, lat_max].
 * @returns {number[]} The centroid of the bounding box as [lon, lat].
 */
export function get_bbox_centroid(bbox) {
	let [lon_min, lat_min, lon_max, lat_max] = bbox;

	// Check if the bounding box crosses the 180th meridian
	if (lon_min > lon_max) lon_max += 360; // Add 360 degrees to maxLon

	// Calculate the centroid
	let lon = (lon_min + lon_max) / 2;
	let lat = (lat_min + lat_max) / 2;

	// Adjust the longitude to fall within -180 to 180 degrees
	if (lon > 180) lon -= 360;

	return [lon, lat];
}

/**
 * Converts degrees to radians.
 * @param {number} degree - The degree value to be converted.
 * @returns {number} The radian value.
 */
function to_radian(degree) {
	return (degree * Math.PI) / 180;
}
