/**
 * Representative bounding box — reduce many per-feature bboxes to one.
 *
 * A single bounding box is a lossy proxy for a dataset's geometry. For a country
 * with detached overseas territories (USA + Alaska/Hawaii/Puerto Rico,
 * France + DOM-TOM, Portugal + Azores…) the box enclosing *everything* wildly
 * over-represents the mainland and defeats projection matching: it can span the
 * whole globe and collapses to a world/hemisphere scale.
 *
 * Modern spatial formats (GeoParquet, FlatGeobuf, GeoPackage's R-tree…) already
 * store one bbox per feature as a spatial-index proxy. Consuming that array lets
 * us recover the dominant landmass without touching the full geometry.
 *
 * Algorithm — geometry-light, three steps:
 *
 *   0. Flag features whose bbox is wider than 180°. In a −180..180 frame such a
 *      box straddles the antimeridian (e.g. Alaska's Aleutians) and its true
 *      extent cannot be reconstructed from the extremes alone — it is detached
 *      by construction, so it is set aside.
 *   1. Bin the remaining features into connected components: two features join
 *      the same component when the gap between their bboxes is ≤ `detach_gap`.
 *      This single physical threshold groups a contiguous landmass (adjacent
 *      polygons touch → gap 0) and absorbs near-shore islands across a strait
 *      (e.g. Corsica, ~0.7° from mainland France) while leaving overseas
 *      territories (tens of degrees away) as separate components.
 *   2. Keep the largest component (by spherical bbox area) and discard the other,
 *      detached components as long as their cumulative area stays within the
 *      `1 − retain` budget. Area weighting (computed after step 0) correctly
 *      ranks a large mainland above many small territories even when the dataset
 *      has only a handful of features.
 *
 * A guard short-circuits distributed data: if no single component holds at least
 * `retain` of the total area, there is no dominant subject to extract, so nothing
 * is trimmed (a multi-continent world map must stay a world map).
 *
 * @copyright 2026 Thomas Ansart / Atelier Cartographie
 * @license ISC
 */
import { get_bbox_area, get_bbox_centroid, get_bbox_gap, union_bbox, type BBox } from './utils.js';

export interface ReduceOptions {
	/**
	 * Maximum gap (in degrees) between two feature bboxes for them to belong to
	 * the same landmass. Strait-width islands fall below it; overseas territories
	 * exceed it. @default 3
	 */
	detach_gap?: number;
	/**
	 * Minimum share of total (bbox) area the result must retain. Detached
	 * components are dropped only while their cumulative area stays within
	 * `1 − retain`. @default 0.85
	 */
	retain?: number;
}

export interface RepresentativeBBox {
	/** The reduced bounding box, ready to feed the suggestion pipeline. */
	bbox: BBox;
	/** Number of input features kept in {@link bbox}. */
	kept: number;
	/** Bounding boxes of the features that were discarded (detached territories). */
	outliers: BBox[];
	/** Whether any feature was discarded. `false` means `bbox` encloses everything. */
	trimmed: boolean;
}

interface Node {
	bbox: BBox;
	area: number;
	members: BBox[];
}

interface Component {
	area: number;
	nodes: Node[];
}

/**
 * Reduces an array of per-feature bounding boxes to a single representative box
 * by discarding spatially detached, minor territories. See the module header
 * for the algorithm.
 *
 * @throws if `boxes` is empty.
 */
export function representative_bbox(boxes: BBox[], options: ReduceOptions = {}): RepresentativeBBox {
	const { detach_gap = 3, retain = 0.85 } = options;

	if (boxes.length === 0) throw new Error('representative_bbox: no boxes provided');
	if (boxes.length === 1) return { bbox: boxes[0], kept: 1, outliers: [], trimmed: false };

	// --- step 0: set aside antimeridian-straddling features ---
	const flagged: BBox[] = [];
	const live: BBox[] = [];
	for (const b of boxes) ((b[2] - b[0] > 180 ? flagged : live) as BBox[]).push(b);
	if (live.length === 0) return { bbox: union_bbox(boxes), kept: boxes.length, outliers: [], trimmed: false };

	// --- step 1: connected components by bbox gap ≤ detach_gap ---
	const nodes = bin(live, detach_gap / 4);
	const components = connect(nodes, detach_gap).sort((a, b) => b.area - a.area);
	const main = components[0];
	const total_area = components.reduce((sum, c) => sum + c.area, 0);

	// Guard: no dominant subject (e.g. a multi-continent world map) → keep everything.
	if (main.area / total_area < retain) {
		return { bbox: union_bbox(boxes), kept: boxes.length, outliers: [], trimmed: false };
	}

	// --- step 2: drop detached minor components within the area budget ---
	const budget = 1 - retain;
	const kept_components: Component[] = [main];
	const dropped: Component[] = [];
	let dropped_share = 0;

	// Drop smallest detached components first.
	for (const c of components.slice(1).sort((a, b) => a.area - b.area)) {
		const share = c.area / total_area;
		if (dropped_share + share <= budget) {
			dropped.push(c);
			dropped_share += share;
		} else {
			kept_components.push(c);
		}
	}

	const kept_boxes = kept_components.flatMap((c) => c.nodes.flatMap((n) => n.members));
	const outliers = dropped.flatMap((c) => c.nodes.flatMap((n) => n.members)).concat(flagged);

	return {
		bbox: union_bbox(kept_boxes),
		kept: kept_boxes.length,
		outliers,
		trimmed: dropped.length > 0 || flagged.length > 0
	};
}

/**
 * Bins features into grid cells (collapsing dense data), so connectivity runs on
 * a small number of nodes rather than every feature. Each occupied cell becomes
 * one node whose bbox is the union of its members'. Cell size is a quarter of
 * `detach_gap`, fine enough not to merge distinct nearby landmasses.
 */
function bin(boxes: BBox[], cell: number): Node[] {
	const cells = new Map<string, Node>();
	for (const b of boxes) {
		const [cx, cy] = get_bbox_centroid(b);
		const key = `${Math.floor(cx / cell)},${Math.floor(cy / cell)}`;
		const node = cells.get(key);
		if (node) {
			node.bbox = [
				Math.min(node.bbox[0], b[0]),
				Math.min(node.bbox[1], b[1]),
				Math.max(node.bbox[2], b[2]),
				Math.max(node.bbox[3], b[3])
			];
			node.members.push(b);
		} else {
			cells.set(key, { bbox: [...b] as BBox, area: 0, members: [b] });
		}
	}
	const nodes = [...cells.values()];
	for (const node of nodes) node.area = node.members.reduce((sum, b) => sum + get_bbox_area(b), 0);
	return nodes;
}

/**
 * Single-linkage clustering: nodes within `detach_gap` of one another form a
 * component (a connected landmass).
 *
 * Runs in O(m²) where `m` is the number of nodes — i.e. occupied cells, not
 * features. Dense datasets (the 35k-communes case) collapse to a small `m` in
 * {@link bin}, so this stays cheap. A spatial index on nodes would lift the
 * remaining ceiling for sparse, globe-spanning high-resolution inputs.
 */
function connect(nodes: Node[], detach_gap: number): Component[] {
	const m = nodes.length;
	const parent = [...Array(m).keys()];
	const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
	for (let i = 0; i < m; i++) {
		for (let j = i + 1; j < m; j++) {
			if (get_bbox_gap(nodes[i].bbox, nodes[j].bbox) <= detach_gap) parent[find(i)] = find(j);
		}
	}
	const groups = new Map<number, Component>();
	for (let i = 0; i < m; i++) {
		const root = find(i);
		const group = groups.get(root);
		if (group) {
			group.area += nodes[i].area;
			group.nodes.push(nodes[i]);
		} else {
			groups.set(root, { area: nodes[i].area, nodes: [nodes[i]] });
		}
	}
	return [...groups.values()];
}
