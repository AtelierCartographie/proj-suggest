<script>
	import { onMount } from 'svelte';
	import { geoPath, geoIdentity } from 'd3-geo';
	import land from '/src/assets/gisco_60M_land.json';
	import borders from '/src/assets/gisco_60M_borders.json';
	import { ref_bbox } from './stores.js';

	export let id = 'proj_preview';
	export let width = 300;
	export let height = width;
	export let proj = geoIdentity().reflectY(true);

	proj = proj.fitExtent(
		[
			[0, 0],
			[width, height]
		],
		polygon_to_bbox($ref_bbox, 0.1)
	);
	let canvas;
	let context;

	onMount(() => {
		context = canvas.getContext('2d');
	});

	$: if (canvas && context) {
		init_canvas(canvas, context);
		draw_map(context);
	}

	function init_canvas(canvas, context) {
		const dpi = window.devicePixelRatio || 1;
		canvas.width = width * dpi;
		canvas.height = height * dpi;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		context.scale(dpi, dpi);
	}

	function draw_map(ctx) {
		const path = geoPath(proj, ctx);

		// LAND
		ctx.beginPath();
		path(land);
		ctx.fillStyle = '#ccc';
		ctx.fill();

		// BORDERS
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.beginPath();
		path(borders);
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 1;
		ctx.stroke();

		// BBOX
		ctx.beginPath();
		path(polygon_to_bbox($ref_bbox));
		ctx.strokeStyle = 'deeppink';
		// ctx.lineWidth = 1;
		ctx.stroke();
	}

	function polygon_to_bbox(bbox, offset = 0) {
		let [x0, y0, x1, y1] = bbox;
		x0 = Math.max(-180, x0 - offset);
		y0 = Math.max(-90, y0 - offset);
		x1 = Math.min(180, x1 + offset);
		y1 = Math.min(90, y1 + offset);
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
</script>

<canvas bind:this={canvas} {id}></canvas>

<style>
	canvas {
		border: solid 1px white;
		background-color: rgb(7, 52, 97);
	}
</style>
