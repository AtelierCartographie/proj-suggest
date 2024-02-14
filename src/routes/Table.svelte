<script>
	import { intersect, match, suggestions, ref_bbox } from '../stores.js';
	import { get_proj_suggestions } from '$lib/suggestions.js';

	// MATCH --------------------------------------------------
	// Ajouter les match sous forme d'émoji
	// et trier les résultats par match puis par share
	$: intersect_sorted = $intersect.map(add_emoji).sort((a, b) => {
		if (a.match === '✅' && b.match !== '✅') return -1;
		if (b.match === '✅' && a.match !== '✅') return 1;
		return b.share - a.share;
	});

	function add_emoji(item) {
		return $match.some((d) => d.id === item.id)
			? { ...item, match: '✅' }
			: { ...item, match: '❌' };
	}

	function to_string_rounded_percent(value) {
		const percent = Math.round(value * 100);
		return percent.toLocaleString() + ' %';
	}

	// SUGGESTIONS ---------------------------------------------
	$: $suggestions = get_proj_suggestions($ref_bbox);
</script>

<div id="results">
	<div id="match">
		<p><b>Intersection et correspondance</b> avec des bbox de projections nationales</p>
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>projection</th>
						<th>share</th>
						<th>ratio</th>
						<th>within</th>
						<th>match</th>
					</tr>
				</thead>
				<tbody>
					{#each intersect_sorted as item}
						<tr style={item.match === '✅' ? 'background:#126115;' : 'transparent'}>
							<td>{item.id}</td>
							<td>{item.projection}</td>
							<td>{to_string_rounded_percent(item.share)}</td>
							<td>{to_string_rounded_percent(item.ratio)}</td>
							<td>{item.within}</td>
							<td>{item.match}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	<div id="suggestions">
		<p><b>Suggestions</b> de projections</p>
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>projection</th>
						<th>scale</th>
						<th>shape</th>
						{#if $suggestions[0].center}
							<th>center</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each $suggestions as item}
						<tr>
							<td>{item.id}</td>
							<td>{item.scale.join()}</td>
							<td>{item.shape}</td>
							{#if item.center}
								<td>lon: {item.center.lon}, lat: {item.center.lat}</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	#results {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: 1fr;
		grid-column-gap: 40px;
		grid-row-gap: 0px;
	}
	.table-container {
		overflow-x: auto;
		min-height: 200px;
	}
	table {
		border-collapse: collapse;
	}
	table,
	th,
	td {
		border: 1px solid lightgray;
	}
	th,
	td {
		padding: 0.5rem;
	}
	td {
		font-size: 14px;
	}
</style>
