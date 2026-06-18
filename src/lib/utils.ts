/**
 * Bounding box as [lon_min, lat_min, lon_max, lat_max] in EPSG:4326.
 *
 * Follows the GeoJSON / OGC convention: `[west, south, east, north]`.
 *
 * `lon_min > lon_max` is interpreted as crossing the antimeridian (±180°).
 *
 * Use {@link validate_bbox} to check validity before passing to suggestion
 * functions. Without validation, invalid bbox values will produce silently
 * incorrect results rather than errors.
 */
export type BBox = [number, number, number, number];

export interface BBoxValidation {
	valid: boolean;
	errors: string[];
}

/**
 * Validates a bounding box.
 *
 * Checks performed:
 * - All four values are finite numbers (no `NaN`, `Infinity`).
 * - Longitudes are in [−180, 180].
 * - Latitudes are in [−90, 90].
 * - `lat_min ≤ lat_max` (inverted latitudes are always invalid).
 * - The bbox has non-zero area (not a point or a line).
 *
 * Note: `lon_min > lon_max` is considered **valid** — it represents a bbox
 * crossing the antimeridian, which the library handles correctly.
 *
 * **Edge cases not caught by this function:**
 * - Bboxes that are geometrically valid but nonsensical for projection
 *   selection (e.g. a 1 m² bbox — the algorithm will return results, but
 *   they are unlikely to be meaningful).
 * - Coordinate reference systems other than EPSG:4326 — values may fall
 *   within the valid ranges but represent a completely different location.
 */
export function validate_bbox(bbox: BBox): BBoxValidation {
	const [lon_min, lat_min, lon_max, lat_max] = bbox;
	const errors: string[] = [];

	// Finite check
	if (!bbox.every(Number.isFinite)) {
		errors.push('All values must be finite numbers (no NaN or Infinity).');
		return { valid: false, errors };
	}

	// Longitude range
	if (lon_min < -180 || lon_min > 180) {
		errors.push(`lon_min (${lon_min}) is out of range [−180, 180].`);
	}
	if (lon_max < -180 || lon_max > 180) {
		errors.push(`lon_max (${lon_max}) is out of range [−180, 180].`);
	}

	// Latitude range
	if (lat_min < -90 || lat_min > 90) {
		errors.push(`lat_min (${lat_min}) is out of range [−90, 90].`);
	}
	if (lat_max < -90 || lat_max > 90) {
		errors.push(`lat_max (${lat_max}) is out of range [−90, 90].`);
	}

	// Latitude order
	if (lat_min > lat_max) {
		errors.push(`lat_min (${lat_min}) must be ≤ lat_max (${lat_max}).`);
	}

	// Degenerate bbox (zero area)
	if (lon_min === lon_max) {
		errors.push('lon_min and lon_max are equal — bbox has no width.');
	}
	if (lat_min === lat_max) {
		errors.push('lat_min and lat_max are equal — bbox has no height.');
	}

	return { valid: errors.length === 0, errors };
}

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

/**
 * Minimum angular separation (in degrees) between two bounding boxes.
 *
 * Returns `0` when the boxes touch or overlap. Longitude is treated as
 * circular, so the gap is measured the short way around the globe and boxes
 * straddling the antimeridian (`lon_min > lon_max`) are handled correctly.
 *
 * Used to decide whether two features belong to the same connected landmass
 * (see {@link representative_bbox}).
 */
export function get_bbox_gap(bbox_1: BBox, bbox_2: BBox): number {
	const lat_gap =
		bbox_1[1] > bbox_2[3]
			? bbox_1[1] - bbox_2[3]
			: bbox_2[1] > bbox_1[3]
				? bbox_2[1] - bbox_1[3]
				: 0;
	return Math.hypot(lon_gap(bbox_1, bbox_2), lat_gap);
}

/** Circular longitudinal gap (degrees) between two bboxes, 0 if they overlap. */
function lon_gap(bbox_1: BBox, bbox_2: BBox): number {
	// Unwrap each interval so its end ≥ its start (handles antimeridian crossing).
	let [a0, , a1] = bbox_1;
	let [b0, , b1] = bbox_2;
	if (a1 < a0) a1 += 360;
	if (b1 < b0) b1 += 360;
	// Measure the gap in three rotations and keep the smallest (circularity).
	const gap = (x0: number, x1: number, y0: number, y1: number) =>
		x1 < y0 ? y0 - x1 : y1 < x0 ? x0 - y1 : 0;
	return Math.min(gap(a0, a1, b0, b1), gap(a0 + 360, a1 + 360, b0, b1), gap(a0, a1, b0 + 360, b1 + 360));
}

/**
 * Smallest bounding box enclosing all the given boxes.
 *
 * Longitude is handled on the circle: the frame (0–360° or −180–180°) that
 * yields the narrowest box is chosen, so a cluster straddling the antimeridian
 * produces a tight box returned with the `lon_min > lon_max` convention rather
 * than a spurious near-global width.
 *
 * @throws if `boxes` is empty.
 */
export function union_bbox(boxes: BBox[]): BBox {
	if (boxes.length === 0) throw new Error('union_bbox: no boxes provided');

	// Candidate envelope in a given longitude frame (optionally shifting
	// negative longitudes into 0–360 before unwrapping).
	const envelope = (shift: boolean): { w: number; s: number; e: number; n: number } => {
		let w = Infinity,
			s = Infinity,
			e = -Infinity,
			n = -Infinity;
		for (const b of boxes) {
			let x0 = b[0];
			let x1 = b[2];
			if (shift) {
				if (x0 < 0) x0 += 360;
				if (x1 < 0) x1 += 360;
			}
			if (x1 < x0) x1 += 360; // antimeridian-crossing feature
			w = Math.min(w, x0);
			e = Math.max(e, x1);
			s = Math.min(s, b[1]);
			n = Math.max(n, b[3]);
		}
		return { w, s, e, n };
	};

	const a = envelope(false);
	const b = envelope(true);
	const pick = a.e - a.w <= b.e - b.w ? a : b;

	// Bring lon_min into [−180, 180).
	let { w, e } = pick;
	while (w >= 180) {
		w -= 360;
		e -= 360;
	}
	while (w < -180) {
		w += 360;
		e += 360;
	}
	// If the box now crosses the antimeridian, express it with lon_min > lon_max.
	const lon_max = e > 180 ? e - 360 : e;
	return [round(w), round(pick.s), round(lon_max), round(pick.n)];
}

function round(n: number): number {
	return +n.toFixed(6);
}

function to_radian(degree: number): number {
	return (degree * Math.PI) / 180;
}
