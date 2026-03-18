# proj-suggest

Bibliothèque TypeScript, sans dépendance, qui suggère des projections cartographiques adaptées à partir d'une bounding box (bbox), y compris des projections nationales officielles.

L'algorithme de sélection est une **réimplémentation indépendante** de l'arbre de décision cartographique publié par Snyder (1987) et formalisé par Šavrič et al. (2016).

Created by: [Thomas Ansart — Atelier de cartographie de Sciences Po](https://www.sciencespo.fr/cartographie/)
License: ISC

## Installation

```bash
npm install proj-suggest
```

## Utilisation rapide

```ts
import { suggest_projections } from 'proj-suggest';
import type { BBox } from 'proj-suggest';

// Définir une bbox [lon_min, lat_min, lon_max, lat_max]
const bbox: BBox = [-5, 41, 10, 51]; // France métropolitaine

// Obtenir toutes les suggestions en un seul appel
const { national, generic } = suggest_projections(bbox);

console.log(national);
// [
//   { id: 'france', epsg: '2154', projection: 'lambert93',
//     bbox: [-6, 41.2, 10.4, 51.6], proj4: '+proj=lcc ...', share: 0.93, ratio: 1.1, within: true }
// ]

console.log(generic);
// [
//   { id: 'albers_conic', name: 'Albers Conic', scale: ['region'], shape: 'round',
//     equalarea: true, proj4: '+proj=aea +lon_0=2.5 +lat_1=47.67 ...' },
//   { id: 'lambert_conformal_conic', ... },
//   { id: 'equidistant_conic', ... }
// ]

// Sans projections nationales
const { generic: genericOnly } = suggest_projections(bbox, { national: false });
```

## API

### `suggest_projections(bbox: BBox, options?: SuggestOptions): ProjectionSuggestions`

Point d'entrée principal. Retourne un objet structuré avec les projections nationales (prioritaires) et les projections génériques issues de l'arbre de décision.

### `suggest_generic_projections(bbox: BBox): ResolvedProjection[]`

Retourne uniquement les projections génériques suggérées pour la bbox donnée.

### `match_national_projections(bbox: BBox): MatchedCountry[]`

Retourne les pays dont la projection nationale correspond à la bbox de référence.

### `get_intersecting_countries(bbox: BBox): MatchedCountry[]`

Retourne tous les pays dont la bbox intersecte la bbox de référence, avec les métriques d'intersection (`share`, `ratio`, `within`), sans appliquer de filtre de correspondance.

### Types

```ts
type BBox = [number, number, number, number]; // [lon_min, lat_min, lon_max, lat_max] en EPSG:4326

interface SuggestOptions {
	national?: boolean; // Inclure les projections nationales (défaut: true)
}

interface ProjectionSuggestions {
	national: MatchedCountry[]; // Projections nationales correspondantes (prioritaires)
	generic: ResolvedProjection[]; // Projections génériques issues de l'arbre de décision
}

interface ResolvedProjection {
	id: string;
	name?: string;
	scale: ScaleType[]; // 'world' | 'hemisphere' | 'region' | 'local'
	shape: ShapeType; // 'rectangular' | 'round' | 'discontinuous' | 'rectangle'
	equalarea?: boolean;
	proj4: string; // Chaîne proj4 résolue avec les paramètres calculés
}

interface MatchedCountry {
	id: string;
	epsg: string;
	projection: string;
	bbox: BBox;
	proj4: string;
	rotate?: [number, number];
	share: number; // Part de la bbox pays couverte par l'intersection (0-1)
	ratio: number; // Ratio de surface bbox référence / bbox pays
	within: boolean; // La bbox référence est-elle entièrement contenue dans la bbox pays ?
}
```

---

## Algorithme de suggestion de projections

L'algorithme implémenté dans `suggest_generic_projections` suit un raisonnement en cascade qui part de la bbox fournie pour déterminer l'échelle, le ratio de forme, et la position géographique de la zone, puis sélectionne les projections les plus adaptées.

### Étape 1 — Déterminer l'échelle

La surface sphérique de la bbox est calculée puis rapportée à la surface totale de la Terre (4π stéradians). Ce ratio, appelé `earth_share`, détermine l'échelle :

| `earth_share`   | Échelle        |
| --------------- | -------------- |
| ≥ 2/3 (~66 %)   | **world**      |
| ≥ 1/6 (~17 %)   | **hemisphere** |
| ≥ 1/200 (0,5 %) | **region**     |
| < 1/200         | **local**      |

### Étape 2 — Déterminer le ratio de forme

Le ratio hauteur/largeur de la bbox (en degrés) classe la forme :

| Ratio (h/l)    | Type          |
| -------------- | ------------- |
| ≤ 0,8          | **landscape** |
| ≥ 1,25         | **portrait**  |
| entre les deux | **square**    |

### Étape 3 — Calculer les paramètres de centrage

Pour toutes les échelles sauf `world`, le centroïde de la bbox est calculé. Les paramètres de projection sont :

- **`lon`** : longitude du centroïde
- **`lat`** : latitude du centroïde
- **`lat_1`, `lat_2`** : parallèles standard, calculés symétriquement autour du centroïde

Le calcul des parallèles standard utilise un intervalle différent selon la position :

- **Zone polaire** (|latitude centroïde| > 75°) ou **zone équatoriale** (|latitude centroïde| < 15°) : l'intervalle est de **1/4** de la hauteur de la bbox
- **Autres zones** : l'intervalle est de **1/6** de la hauteur de la bbox

### Étape 4 — Sélection en cascade selon échelle × forme × position

La sélection des projections suit un arbre de décision combinant l'échelle et le ratio de forme. La position géographique (polaire, tropicale, équatoriale) affine le choix.

#### Échelle `world`

Aucun paramètre de centrage n'est nécessaire. Toutes les projections mondiales disponibles sont retournées : Equal Earth, Bertin 1953, Mollweide interrompue, etc.

#### Échelle `hemisphere`

Quel que soit le ratio de forme (`square`, `landscape`, `portrait`) :

- **Si la zone est entièrement dans les tropiques** (|lat_min| < 23,44° et |lat_max| < 23,44°) : la latitude de centrage est ramenée à 0° et les projections sélectionnées sont **Mercator**, **Cylindrical Equal Area**, **Equirectangular** — adaptées aux faibles déformations en zone équatoriale.
- **Sinon** :
  - Si la largeur est ≤ 180° : **Orthographic** est ajoutée (la bbox tient dans un hémisphère visible).
  - Dans tous les cas : **Lambert Azimuthal Equal Area**, **Azimuthal Equidistant**.

#### Échelle `region` — `square`

- Si proche des pôles (|lat centroïde| > 75°) : la latitude est ramenée à ±90°.
- Si proche de l'équateur (|lat centroïde| < 15°) : la latitude est ramenée à 0°.
- Projections : **Lambert Azimuthal Equal Area**, **Stereographic**, **Equidistant Conic**.

#### Échelle `region` — `landscape`

- **Proche des pôles** (|lat centroïde| > 75°) : latitude ramenée à ±90°, projections azimutales — **LAEA**, **Stereographic**, **Azimuthal Equidistant**.
- **Équateur ou tropiques** (|lat centroïde| < 15° ou zone entièrement tropicale) : latitude ramenée à 0°, projections cylindriques — **Cylindrical Equal Area**, **Mercator**, **Equirectangular**.
- **Zones tempérées** (cas par défaut) : projections coniques — **Albers Conic**, **Lambert Conformal Conic**, **Equidistant Conic**. Ces projections coniques sont adaptées aux zones de latitude intermédiaire avec une extension est-ouest.

#### Échelle `region` — `portrait`

- Projections transverses, adaptées aux zones avec une extension nord-sud : **Transverse Cylindrical Equal Area**, **Transverse Mercator**, **Cassini**.

#### Échelle `local` — `portrait`

- **Transverse Cylindrical Equal Area**, **Transverse Mercator**.

#### Échelle `local` — `square` ou `landscape`

Pas de filtre spécifique sur les identifiants. Toutes les projections compatibles avec l'échelle `local` sont retournées (Equirectangular, Mercator, Transverse Mercator, Transverse CEA).

### Résumé de l'arbre de décision

```
bbox
 ├── earth_share ≥ 2/3 → world → toutes les projections mondiales
 └── earth_share < 2/3
      ├── centrage + parallèles standard calculés
      │
      ├── hemisphere (earth_share ≥ 1/6)
      │    ├── zone tropicale → Mercator, CEA, Equirectangular (lat=0)
      │    └── sinon → Orthographic (si ≤180°), LAEA, Azimuthal Equidistant
      │
      ├── region (earth_share ≥ 1/200)
      │    ├── square → LAEA, Stereographic, Equidistant Conic
      │    ├── landscape
      │    │    ├── pôle → LAEA, Stereographic, Azimuthal Equidistant (lat=±90)
      │    │    ├── tropiques → CEA, Mercator, Equirectangular (lat=0)
      │    │    └── tempéré → Albers, Lambert CC, Equidistant Conic
      │    └── portrait → Transverse CEA, Transverse Mercator, Cassini
      │
      └── local (earth_share < 1/200)
           ├── portrait → Transverse CEA, Transverse Mercator
           └── square/landscape → toutes les projections locales
```

---

## Rapprochement avec les projections nationales

L'algorithme de `match_national_projections` compare la bbox de référence avec les bbox de pays disposant d'une projection nationale officielle. Trois métriques sont calculées :

### Métriques

1. **`share`** — Part d'intersection : surface de l'intersection entre la bbox de référence et la bbox du pays, rapportée à la surface de la bbox du pays. Valeur entre 0 et 1. Un `share` de 0,9 signifie que 90 % de la bbox du pays est couverte par la bbox de référence.

2. **`ratio`** — Ratio de surface : surface de la bbox de référence divisée par la surface de la bbox du pays. Un ratio de 1 signifie des surfaces identiques ; un ratio de 3 signifie que la bbox de référence fait 3 fois la taille de la bbox du pays.

3. **`within`** — Inclusion : vrai si la bbox de référence est entièrement contenue dans la bbox du pays.

Toutes les surfaces sont calculées en coordonnées sphériques (stéradians) pour tenir compte de la convergence des méridiens.

### Critères de correspondance

Une projection nationale est considérée comme correspondante si :

- **(1) `share` ≥ 0,75** ET **(2) `ratio` < 2** — la bbox de référence couvre au moins 75 % du pays et ne fait pas plus de 2 fois sa taille.
- **OU (3) `within` = true** — la bbox de référence est entièrement contenue dans la bbox du pays, quelle que soit sa taille.

```
Correspondance = ( share ≥ 0.75 ET ratio < 2 ) OU within
```

### Pays disponibles

| ID          | EPSG        | Projection                   |
| ----------- | ----------- | ---------------------------- |
| eu          | 3035        | Lambert Azimuthal Equal Area |
| france      | 2154        | Lambert 93                   |
| uk          | 27700       | Transverse Mercator          |
| ireland     | 2157        | Transverse Mercator          |
| switzerland | 2056        | Swiss Oblique Mercator       |
| brazil      | 10857       | Albers Equal Area            |
| belgium     | 31370       | Lambert Conic Conformal      |
| netherlands | 28992       | Stereographic                |
| germany     | 25832       | Transverse Mercator (UTM 32) |
| usa         | 5070        | Albers Equal Area            |
| canada      | 3347        | Lambert Conic Conformal      |
| mexico      | 6372        | Lambert Conic Conformal      |
| australia   | 9473        | Albers Equal Area            |
| india       | 7755        | Lambert Conic Conformal      |
| japan       | —           | Albers Equal Area            |
| china       | ESRI:102025 | Albers Equal Area            |
| russia      | 3576        | Lambert Azimuthal Equal Area |

---

## Exemples

### Suggestion pour la France métropolitaine

```ts
import { suggest_projections } from 'proj-suggest';

const france: BBox = [-5, 41, 10, 51];

const { national, generic } = suggest_projections(france);
// national → [{ id: 'france', epsg: '2154', projection: 'lambert93', share: ~0.93, ratio: ~1.1, within: true }]
// generic  → Albers Conic, Lambert Conformal Conic, Equidistant Conic
//            Centrées sur lon≈2.5, lat≈46, avec parallèles standard adaptés
```

### Suggestion pour le monde entier

```ts
const world: BBox = [-180, -90, 180, 90];

suggest_projections(world);
// → generic : Equal Earth, Equirectangular, Mercator, Bertin 1953, Gall-Peters, Times,
//   Bonne, Atlantis, Mollweide Interrupted, Mollweide Interrupted Oceans, LAEA
```

### Suggestion pour une zone polaire

```ts
const arctic: BBox = [-180, 75, 180, 90];

suggest_projections(arctic);
// → generic : LAEA (lat=90), Stereographic (lat=90), Azimuthal Equidistant (lat=90)
```

### Suggestion pour une zone tropicale allongée est-ouest

```ts
const tropics: BBox = [-30, -10, 50, 10];

suggest_projections(tropics);
// → generic : Mercator (lat=0), Cylindrical Equal Area (lat=0), Equirectangular (lat=0)
```

### Suggestion pour une zone en portrait (allongée nord-sud)

```ts
const chile: BBox = [-76, -56, -66, -17];

suggest_projections(chile);
// → generic : Transverse Cylindrical Equal Area, Transverse Mercator, Cassini
```

### Vérifier l'intersection sans filtrer

```ts
import { get_intersecting_countries } from 'proj-suggest';

const bbox: BBox = [0, 45, 12, 55];

get_intersecting_countries(bbox);
// → Tous les pays dont la bbox intersecte [0, 45, 12, 55],
//   avec share, ratio et within calculés pour chaque pays.
//   Utile pour comprendre pourquoi un pays est (ou n'est pas) retenu.
```

### Utiliser la chaîne proj4 avec proj4js

```ts
import proj4 from 'proj4';
import { suggest_projections } from 'proj-suggest';

const bbox: BBox = [-5, 41, 10, 51];
const { generic } = suggest_projections(bbox);

// Projeter un point avec la première suggestion
const proj4string = generic[0].proj4;
const [x, y] = proj4(proj4string).forward([2.35, 48.86]); // Paris
```

## Développement

```bash
pnpm install
pnpm dev       # Serveur de développement avec playground interactif
pnpm test      # Tests unitaires (vitest)
pnpm package   # Construire la bibliothèque
```

## References

The projection selection algorithm is based on the decision tree published by:

- Snyder, J. P. (1987). _Map Projections — A Working Manual_. USGS Professional Paper 1395, p. 34–35. [doi:10.3133/pp1395](https://doi.org/10.3133/pp1395)
- Šavrič, B., Jenny, B. and Jenny, H. (2016). Projection Wizard – An online map projection selection tool. _The Cartographic Journal_, 53(2), p. 177–185. [doi:10.1080/00087041.2015.1131938](https://doi.org/10.1080/00087041.2015.1131938)

The online tool [Projection Wizard](https://projectionwizard.org) by Bojan Šavrič served as an inspiration. This library is an **independent reimplementation** of the published decision tree: the code was written from scratch in TypeScript as a framework-agnostic developer library and an original national-projection matching module.

## Licence

ISC
