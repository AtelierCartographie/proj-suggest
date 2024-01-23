<script>
	import { intersect, match, ref_bbox } from '../stores.js';
	import { get_proj_suggestions } from '$lib/suggestions.js';

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

	// Faire deux colonnes. 1) avec national 2) avec toutes les projections
</script>

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

<style>
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
