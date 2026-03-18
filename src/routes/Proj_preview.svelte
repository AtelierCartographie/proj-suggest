<script>
	import { geoProjection } from 'd3-geo';
	import proj4 from 'proj4';
	import { match, ref_bbox } from './stores.js';
	import MapCanvas from './Map_canvas.svelte';

	// TODO
	// - [ ] ajouter un bouton pour copier la projection dans le presse-papier au format proj4 ou d3.geo

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
