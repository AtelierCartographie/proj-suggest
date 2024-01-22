<script>
	import Map from './Map.svelte';
	import Table from './Table.svelte';
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

<h2>Carte interactive</h2>
<Map />

<h2>Résultats</h2>
<Table />
