<script>
	import { geoPath, geoIdentity } from 'd3-geo';
	import { select } from 'd3-selection';
	import { brush } from 'd3-brush';
	import land from '/src/assets/gisco_60M_land.json';
	import borders from '/src/assets/gisco_60M_borders.json';
	import { countries_projection } from '$lib/proj_list.js';
	import { get_intersected_bbox, get_matched_bbox } from '$lib/country_match.js';
	import { intersect, match, ref_bbox } from '../stores.js';

	let width = 900;

	// PROJECTION
	const projection = geoIdentity()
		.reflectY(true)
		.fitExtent(
			[
				[0, 0],
				[width, width / 2]
			],
			land
		);
	const path = geoPath(projection);

	// BBOX MATCH
	$: $intersect = get_intersected_bbox($ref_bbox, countries_projection);
	$: interset_bbox = $intersect.map((d) => d.bbox);
	$: $match = get_matched_bbox($ref_bbox, countries_projection);
	$: matched_bbox = $match.map((d) => d.bbox);

	// BRUSH
	let gBrush;

	// Create a brush
	const brushSelection = brush()
		.extent([
			[0, 0],
			[width, width / 2]
		])
		.on('brush', brushed);

	// Select the SVG element
	$: select(gBrush).call(brushSelection);

	// Function to handle the brush event
	function brushed(event) {
		// Get the brush selection coordinates
		const [[x0, y0], [x1, y1]] = event.selection;
		// Convert the coordinates to lon/lat
		const [lon_min, lat_max] = projection.invert([x0, y0]);
		const [lon_max, lat_min] = projection.invert([x1, y1]);
		// Update the ref_bbox
		$ref_bbox = [lon_min, lat_min, lon_max, lat_max];
	}

	/**
	 * Creates a GeoJSON polygon feature from a bounding box.
	 * The winding order of the polygon's coordinates is clockwise, which is conform to d3.geo.
	 * @param {number[]} bbox - [minX, minY, maxX, maxY].
	 * @returns {Object} A GeoJSON feature object representing a polygon.
	 */
	function get_polygon_from_bbox(bbox) {
		const [x0, y0, x1, y1] = bbox;
		return {
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[x0, y0],
						[x0, y1],
						[x1, y1],
						[x1, y0],
						[x0, y0]
					]
				]
			}
		};
	}
</script>

<svg
	id="mapSvg"
	viewBox="0 0 {width} {width / 2}"
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
>
	<!-- LAND -->
	<path d={path(land)} fill="#212c40" stroke="none" filter="drop-shadow(0 0 5px #913ffc)" />
	<!-- BORDERS -->
	<path d={path(borders)} fill="none" stroke="#fff" stroke-opacity="0.2" stroke-width="0.5" />
	<!-- INTERSECT -->
	{#each interset_bbox as bbox}
		<path d={path(get_polygon_from_bbox(bbox))} fill="aqua" fill-opacity="0.2" stroke="aqua" />
	{/each}
	<!-- MATCH -->
	{#each matched_bbox as bbox}
		<path d={path(get_polygon_from_bbox(bbox))} fill="none" stroke="lime" stroke-width="1.5" />
	{/each}

	<!-- BRUSH -->
	<g id="brush" bind:this={gBrush} />

	<!-- REFERENCE -->
	<path d={path(get_polygon_from_bbox($ref_bbox))} fill="none" stroke="deeppink" />
</svg>

<style>
</style>
