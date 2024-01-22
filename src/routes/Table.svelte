<script>
	import { intersect, match } from '../stores.js';

	// trier les items de intersect et match par share et ratio
	$: intersect_sorted = $intersect.sort((a, b) => {
		if (b.within === a.within) {
			return b.share - a.share;
		}
		return b.within - a.within;
	});

	// TODO n'utiliser qu'un seul tableau pour intersect et match et ajouter un champ avec l'emoji ✅ ou ❌

	function add_emoji(item) {
		// if ($match.length === 0) {
		// 	return { ...item, match: '❌' };
		// }
		return $match.some((d) => d.id === item.id)
			? { ...item, match: '✅' }
			: { ...item, match: '❌' };
	}

	function to_string_rounded_percent(value) {
		const percent = Math.round(value * 100);
		return percent.toLocaleString() + ' %';
	}
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
			{#each intersect_sorted.map(add_emoji) as item}
				<tr>
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
		border: 1px solid black;
	}
	th,
	td {
		padding: 0.5rem;
	}
</style>
