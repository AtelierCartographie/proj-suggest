<script>
	import * as Plot from '@observablehq/plot';
	import { select } from 'd3-selection';
	import { brush } from 'd3-brush';
	export let options;
	export let width;

	function addChart(node) {
		node.appendChild(Plot.plot({ width, ...options }));
	}

	// export let rect; // = [0, 0, 0, 0];
	let drawing = false;
	let bbox;

	// function mousedown(e) {
	// 	console.log('down');
	// 	bbox = e.target.getBoundingClientRect();
	// 	const pos = [e.clientX - bbox.x, e.clientY - bbox.y];
	// 	rect[0] = pos[0];
	// 	rect[1] = pos[1];
	// 	drawing = true;
	// }

	// function mouseup(e) {
	// 	console.log('up');
	// 	drawing = false;
	// }

	// function mousemove(e) {
	// 	if (!drawing) return;
	// 	console.log('move');
	// 	const pos = [e.clientX - bbox.x, e.clientY - bbox.y];
	// 	rect[2] = pos[0];
	// 	rect[3] = pos[1];
	// }
</script>

{#key options}
	<div
		bind:clientWidth={width}
		on:mousedown
		on:mouseup
		on:mousemove
		use:addChart
		{...$$restProps}
	/>
{/key}
