import { suggest_generic_projections } from './suggestions.js';
import { match_national_projections } from './country_match.js';
import { representative_bbox } from './representative_bbox.js';
import type { BBox } from './utils.js';
import type { ResolvedProjection } from './list_proj_suggestions.js';
import type { MatchedCountry } from './country_match.js';
import type { RepresentativeBBox, ReduceOptions } from './representative_bbox.js';

export interface ProjectionSuggestions {
	/** National projections matching the bbox (priority). */
	national: MatchedCountry[];
	/** Generic projections derived from the decision tree. */
	generic: ResolvedProjection[];
	/**
	 * Reduction details — present only when an array of per-feature bboxes was
	 * passed. Reports the representative bbox actually used and which detached
	 * territories were discarded (see {@link representative_bbox}).
	 */
	reduced?: RepresentativeBBox;
}

export interface SuggestOptions extends ReduceOptions {
	/** Include national projection matching. @default true */
	national?: boolean;
}

/**
 * Suggests map projections for the given bounding box.
 *
 * Accepts either a single bounding box, or an array of per-feature bounding
 * boxes. In the array form, the boxes are first reduced to a single
 * representative box — detached overseas territories that would otherwise
 * inflate the extent are discarded — before matching (see
 * {@link representative_bbox}). The reduction is reported on `reduced`.
 *
 * Returns national projections (when available) alongside generic suggestions.
 */
export function suggest_projections(
	bbox: BBox | BBox[],
	options: SuggestOptions = {}
): ProjectionSuggestions {
	const { national = true, ...reduce_options } = options;

	if (is_bbox_array(bbox)) {
		const reduced = representative_bbox(bbox, reduce_options);
		return { ...suggest_projections(reduced.bbox, { national }), reduced };
	}

	return {
		national: national ? match_national_projections(bbox) : [],
		generic: suggest_generic_projections(bbox)
	};
}

/** Distinguishes an array of bboxes from a single `[number, number, number, number]` bbox. */
function is_bbox_array(bbox: BBox | BBox[]): bbox is BBox[] {
	// An empty array routes to representative_bbox, which throws a clear error.
	return bbox.length === 0 || Array.isArray(bbox[0]);
}

export { suggest_generic_projections } from './suggestions.js';
export { match_national_projections, get_intersecting_countries } from './country_match.js';
export { representative_bbox } from './representative_bbox.js';
export { validate_bbox, get_bbox_gap, union_bbox } from './utils.js';
export type { RepresentativeBBox, ReduceOptions } from './representative_bbox.js';
export type { BBox, BBoxValidation } from './utils.js';
export type { MatchedCountry } from './country_match.js';
export type {
	Projection,
	ResolvedProjection,
	Proj4Usage,
	D3Usage,
	ProjParams,
	ScaleType,
	ShapeType
} from './list_proj_suggestions.js';
export type { ProjCountry } from './list_proj_countries.js';
