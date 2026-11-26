/**
 * National projection matching — original module.
 *
 * Compares a reference bounding box against a curated dataset of countries that
 * have an official national projection (EPSG-registered). For each country whose
 * bbox intersects the reference, three spatial metrics are computed on a sphere:
 *
 *   - `share`  — fraction of the country bbox covered by the intersection (0–1)
 *   - `ratio`  — area of the reference bbox relative to the country bbox
 *   - `within` — whether the reference bbox is fully contained in the country bbox
 *
 * A country is considered a match when the reference bbox is sufficiently
 * representative of it: ( share ≥ 0.75 AND ratio < 2 ) OR within.
 *
 * When at least one country fits the reference bbox closely (share ≥ 0.75 AND
 * ratio < 2), countries matched only because the reference bbox lies within
 * their (larger) bbox are dropped: Luxembourg does not get France, nor Estonia
 * Russia. Supranational entries (`eu`) are always kept.
 *
 * This module has no equivalent in Projection Wizard and is original to proj-suggest.
 *
 * @copyright 2026 Thomas Ansart / Atelier Cartographie
 * @license ISC
 */
import { get_intersection_area, get_bbox_ratio_area, check_within, type BBox } from './utils.js';
import { proj_countries, type ProjCountry } from './list_proj_countries.js';

const intersection_threshold = 0.75;
const ratio_threshold = 2;

export interface MatchedCountry extends ProjCountry {
	share: number;
	ratio: number;
	within: boolean;
}

/**
 * Returns countries whose official national projection matches the reference
 * bounding box, based on intersection share, area ratio, and containment.
 */
export function match_national_projections(ref_bbox: BBox): MatchedCountry[] {
	const fits = (d: MatchedCountry) => d.share >= intersection_threshold && d.ratio < ratio_threshold;
	const matches = get_intersecting_countries(ref_bbox).filter((d) => fits(d) || d.within);
	// A country that fits closely wins over countries that merely contain the bbox.
	const has_close_fit = matches.some((d) => !d.supranational && fits(d));
	return has_close_fit ? matches.filter((d) => d.supranational || fits(d)) : matches;
}

/**
 * Returns all countries whose bounding box intersects the reference bounding box,
 * with intersection metrics (share, ratio, within).
 */
export function get_intersecting_countries(ref_bbox: BBox): MatchedCountry[] {
	return proj_countries
		.map((d) => ({
			...d,
			share: get_intersection_area(ref_bbox, d.bbox),
			ratio: get_bbox_ratio_area(ref_bbox, d.bbox),
			within: check_within(ref_bbox, d.bbox)
		}))
		.filter((d) => d.share > 0);
}
