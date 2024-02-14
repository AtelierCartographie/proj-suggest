<script>
	import { geoProjection, geoIdentity, geoEqualEarth } from 'd3-geo';
	import { geoClipPolygon } from 'd3-geo-polygon';
	import proj4 from 'proj4';
	import { match, suggestions, ref_bbox } from '../stores.js';
	import MapCanvas from './Map_canvas.svelte';

	// TODO
	// - [ ] si match le clacul de la projection ralenti tout, ne pas reclaculer les matchs à chaque fois
	// - [ ] si brush en cours, ne pas recalculer les matchs
	// - [ ] clip de la projection à la bbox. Projeter les coordonnées de la bbox dans l'absolue avant mise à l'échelle par d3.
	// - [ ] ajouter un bouton pour copier la projection dans le presse-papier au format proj4 ou d3.geo

	function polygon_to_bbox(bbox) {
		let [x0, y0, x1, y1] = bbox;
		x0 = Math.max(-180, x0 - 2);
		y0 = Math.max(-90, y0 - 2);
		x1 = Math.min(180, x1 + 2);
		y1 = Math.min(90, y1 + 2);
		return {
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
		};
	}

	function proj4d3(proj4string) {
		const degrees = 180 / Math.PI;
		const radians = 1 / degrees;
		const raw = proj4(proj4string);
		const p = function (lambda, phi) {
			return raw.forward([lambda * degrees, phi * degrees]);
		};
		p.invert = function (x, y) {
			return raw.inverse([x, y]).map(function (d) {
				return d * radians;
			});
		};
		const projection = geoProjection(p).scale(1).translate([0, 0]);
		projection.raw = raw;
		return projection;
	}
</script>

<div id="grid-proj-preview">
	{#each $match as { id, proj4, rotate } (id)}
		{@const proj = rotate
			? proj4d3(proj4).rotate(rotate).clipAngle(60)
			: proj4d3(proj4).clipAngle(60)}
		{@const bbox = polygon_to_bbox($ref_bbox)}
		<div class="proj-preview">
			{#key $ref_bbox}
				<MapCanvas {proj} />
				<p>{id}</p>
			{/key}
		</div>
	{/each}
</div>

<style>
	#grid-proj-preview {
		display: flex;
		flex-direction: row;
		gap: 10px;
	}
</style>
