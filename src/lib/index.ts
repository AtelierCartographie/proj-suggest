import { suggest_generic_projections } from './suggestions.js';
import { match_national_projections } from './country_match.js';
import type { BBox } from './utils.js';
import type { ResolvedProjection } from './list_proj_suggestions.js';
import type { MatchedCountry } from './country_match.js';

export interface ProjectionSuggestions {
	/** National projections matching the bbox (priority). */
	national: MatchedCountry[];
	/** Generic projections derived from the decision tree. */
	generic: ResolvedProjection[];
}

export interface SuggestOptions {
	/** Include national projection matching. @default true */
	national?: boolean;
}

/**
 * Suggests map projections for the given bounding box.
 * Returns national projections (when available) alongside generic suggestions.
 */
export function suggest_projections(
	bbox: BBox,
	options: SuggestOptions = {}
): ProjectionSuggestions {
	const { national = true } = options;
	return {
		national: national ? match_national_projections(bbox) : [],
		generic: suggest_generic_projections(bbox)
	};
}

export { suggest_generic_projections } from './suggestions.js';
export { match_national_projections, get_intersecting_countries } from './country_match.js';
export type { BBox } from './utils.js';
export type { MatchedCountry } from './country_match.js';
export type {
	Projection,
	ResolvedProjection,
	ProjParams,
	ScaleType,
	ShapeType
} from './list_proj_suggestions.js';
export type { ProjCountry } from './list_proj_countries.js';
