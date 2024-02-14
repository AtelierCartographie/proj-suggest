<script>
	import '../global.css';
	import Map from './Map.svelte';
	import ProjPreview from './Proj_preview.svelte';
	import Table from './Table.svelte';

	// TODO
	// - [X] Add d3-zoom to the map
	// - [ ] Use Carbon Design System for the UI, https://carbon-components-svelte.onrender.com/
	// - [ ] Add a page with the list of projections (suggested and national)
	// - [ ] Add a page with the methodology
	// - [ ] Add a menu to switch between the pages
	// - [ ] Add an input to customize the bbox
	// - [ ] Link the bbox to page url as query params
	// - [ ] Add a button to copy to clipboard suggestions in proj4 or d3.geo
	// - [ ] Use proj4d3, https://observablehq.com/@fil/proj4js-d3#proj4d3
	// - [ ] Add previews as a collection of map in canvas of the suggested projections
</script>

<h1>Suggestions de projections</h1>
<p>À partir d'une bbox, suggère des projections adaptées y compris des projections nationales</p>

<p>
	Précisions sur les projections nationales. Trois critères sont utilisées pour valider la
	correspondance entre une bbox et la bbox d'un pays :
</p>
<ul>
	<li>(1) Un taux de recouvrement supérieure à 75 %</li>
	<li>
		(2) Un ratio de surface inférieur à 2 (soit une bbox qui ne doit pas faire plus de deux fois la
		taille de la bbox du pays)
	</li>
	<li>(3) Une inclusion totale de la bbox du fichier dans la bbox du pays</li>
</ul>
<p><b>Validation si...</b> les critères (1) ET (2) sont remplies OU seulement le critère (3)</p>

<h2>🛝 Playground</h2>
<Map />

<Table />

<h2>Preview</h2>

<ProjPreview />
