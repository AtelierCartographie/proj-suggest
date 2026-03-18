/** Bounding box as [lon_min, lat_min, lon_max, lat_max] in EPSG:4326. */
export type BBox = [number, number, number, number];

/**
 * Calculates the share of the area of bbox_2 that is intersected by bbox_1.
 * @returns A number between 0 and 1.
 */
export function get_intersection_area(bbox_1: BBox, bbox_2: BBox): number {
	const [min_x1, min_y1, max_x1, max_y1] = bbox_1;
	const [min_x2, min_y2, max_x2, max_y2] = bbox_2;

	const overlap_bbox: BBox = [
		Math.max(min_x1, min_x2),
		Math.max(min_y1, min_y2),
		Math.min(max_x1, max_x2),
		Math.min(max_y1, max_y2)
	];

	// Exit if bbox_1 and bbox_2 don't overlap
	if (overlap_bbox[2] - overlap_bbox[0] < 0 || overlap_bbox[3] - overlap_bbox[1] < 0) return 0;

	const overlap_area = get_bbox_area(overlap_bbox);
	const bbox_2_area = get_bbox_area(bbox_2);

	return overlap_area / bbox_2_area;
}

/**
 * Calculates the ratio of the areas of two bounding boxes.
 */
export function get_bbox_ratio_area(bbox_1: BBox, bbox_2: BBox): number {
	return get_bbox_area(bbox_1) / get_bbox_area(bbox_2);
}

/**
 * Checks if bbox_1 is within bbox_2.
 */
export function check_within(bbox_1: BBox, bbox_2: BBox): boolean {
	const [min_x1, min_y1, max_x1, max_y1] = bbox_1;
	const [min_x2, min_y2, max_x2, max_y2] = bbox_2;

	return min_x1 >= min_x2 && min_y1 >= min_y2 && max_x1 <= max_x2 && max_y1 <= max_y2;
}

/** Earth surface area in steradians. */
const earth = 4 * Math.PI;

/**
 * Calculates the fraction of earth surface covered by the given bounding box.
 */
export function get_earth_share(bbox: BBox): number {
	return get_bbox_area(bbox) / earth;
}

/**
 * Calculates the spherical area of a bounding box.
 * Handles bounding boxes that cross the 180th meridian.
 */
export function get_bbox_area(bbox: BBox): number {
	let [lon_min, lat_min, lon_max, lat_max] = bbox.map(to_radian);

	// Handle crossing the 180th meridian
	if (lon_min > lon_max) lon_max += 2 * Math.PI;

	return Math.abs((lon_max - lon_min) * (Math.sin(lat_max) - Math.sin(lat_min)));
}

/**
 * Calculates the centroid of a bounding box.
 * Handles bounding boxes that cross the 180th meridian.
 */
export function get_bbox_centroid(bbox: BBox): [number, number] {
	let [lon_min, lat_min, lon_max, lat_max] = bbox;

	if (lon_min > lon_max) lon_max += 360;

	let lon = (lon_min + lon_max) / 2;
	const lat = (lat_min + lat_max) / 2;

	if (lon > 180) lon -= 360;

	return [lon, lat];
}

function to_radian(degree: number): number {
	return (degree * Math.PI) / 180;
}
