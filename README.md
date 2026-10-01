# proj-suggest

## English

A dependency-free TypeScript library that suggests suitable map projections from a bounding box (bbox), including official national projections.

The selection algorithm is an **independent reimplementation** of the cartographic decision tree published by Snyder (1987) and formalized by Šavrič et al. (2016).

Created by: [Thomas Ansart — Atelier de cartographie de Sciences Po](https://www.sciencespo.fr/cartographie/)
License: ISC

## Français

Bibliothèque TypeScript, sans dépendance, qui suggère des projections cartographiques adaptées à partir d'une bounding box (bbox), y compris des projections nationales officielles.

L'algorithme de sélection est une **réimplémentation indépendante** de l'arbre de décision cartographique publié par Snyder (1987) et formalisé par Šavrič et al. (2016).

Created by: [Thomas Ansart — Atelier de cartographie de Sciences Po](https://www.sciencespo.fr/cartographie/)
License: ISC

## Installation

```bash
npm install @ateliercartographie/proj-suggest
```

## Quick usage

```ts
import { suggest_projections, validate_bbox } from '@ateliercartographie/proj-suggest';
import type { BBox } from '@ateliercartographie/proj-suggest';

// Define a bbox [lon_min, lat_min, lon_max, lat_max]
const bbox: BBox = [-5, 41, 10, 51]; // Metropolitan France

const validation = validate_bbox(bbox);
if (!validation.valid) {
	throw new Error(`Invalid bbox: ${validation.errors.join(' | ')}`);
}

// Get all suggestions in a single call
const { national, generic } = suggest_projections(bbox);

console.log(national);
// [
//   {
//     id: 'france', epsg: '2154', projection: 'lambert93',
//     bbox: [-6, 41.2, 10.4, 51.6],
//     proj4: '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 ...',
//     d3: { projection: 'geoConicConformal', rotate: [-3, 0], parallels: [44, 49] },
//     share: 0.93, ratio: 1.1, within: true
//   }
// ]

console.log(generic);
// [
//   {
//     id: 'albers_conic', name: 'Albers Conic', scale: ['region'], shape: 'round', equalarea: true,
//     proj4: { string: '+proj=aea +lon_0=2.5 +lat_1=47.67 +lat_2=44.33 +lat_0=46 ...' },
//     d3: { projection: 'geoAlbers', rotate: [-2.5, 0], parallels: [44.33, 47.67] }
//   },
//   { id: 'lambert_conformal_conic', ... },
//   { id: 'equidistant_conic', ... }
// ]

// Without national projections
const { generic: genericOnly } = suggest_projections(bbox, { national: false });
```

## API

### `suggest_projections(bbox: BBox | BBox[], options?: SuggestOptions): ProjectionSuggestions`

Main entry point. Returns a structured object with the matching national projections (given priority) and the generic projections produced by the decision tree.

Accepts either a single bbox or **an array of per-feature bboxes** (one per entity). In the latter case, the bboxes are first reduced to a single representative bbox — detached territories (Alaska, French overseas territories…) that would artificially inflate the extent are discarded — before matching takes place. The details of the reduction are exposed on the `reduced` field. See [`representative_bbox`](#representative_bboxboxes-bbox-options-reduceoptions-representativebbox) and the [Multi-bbox reduction](#multi-bbox-reduction) section.

### `representative_bbox(boxes: BBox[], options?: ReduceOptions): RepresentativeBBox`

Reduces an array of per-feature bboxes to a single representative bbox by discarding minor detached territories. Useful when a dataset's overall bbox is misleading because of far-flung territories (USA + Alaska/Hawaii/Puerto Rico, France + overseas territories…).

### `suggest_generic_projections(bbox: BBox): ResolvedProjection[]`

Returns only the generic projections suggested for the given bbox.

### `match_national_projections(bbox: BBox): MatchedCountry[]`

Returns the countries whose national projection matches the reference bbox.

### `validate_bbox(bbox: BBox): BBoxValidation`

Validates a bbox before calling the suggestion functions. Returns an object:

- `valid`: `true` if the bbox is valid
- `errors`: array of detailed error messages

Checks performed:

- 4 finite values (`number`, no `NaN` or `Infinity`)
- `lon_min` and `lon_max` within [−180, 180]
- `lat_min` and `lat_max` within [−90, 90]
- `lat_min <= lat_max`
- non-degenerate bbox (non-zero width and height)

Note: `lon_min > lon_max` is allowed and interpreted as crossing the antimeridian (±180°).

### `get_intersecting_countries(bbox: BBox): MatchedCountry[]`

Returns all countries whose bbox intersects the reference bbox, along with the intersection metrics (`share`, `ratio`, `within`), without applying any matching filter.

### Types

```ts
type BBox = [number, number, number, number]; // [lon_min, lat_min, lon_max, lat_max] in EPSG:4326

interface SuggestOptions extends ReduceOptions {
	national?: boolean; // Include national projections (default: true)
}

interface ProjectionSuggestions {
	national: MatchedCountry[]; // Matching national projections (given priority)
	generic: ResolvedProjection[]; // Generic projections produced by the decision tree
	reduced?: RepresentativeBBox; // Present only if an array of bboxes was provided
}

interface ReduceOptions {
	detach_gap?: number; // Max gap (degrees) between two bboxes belonging to the same landmass (default: 3)
	retain?: number; // Minimum share of area to keep in the result (default: 0.85)
}

interface RepresentativeBBox {
	bbox: BBox; // The reduced bbox, used for the suggestion
	kept: number; // Number of features kept
	outliers: BBox[]; // Bboxes of the discarded features (detached territories)
	trimmed: boolean; // false ⇒ bbox encompasses everything (nothing discarded)
}

interface BBoxValidation {
	valid: boolean;
	errors: string[];
}

/** Usage with proj4js: `proj4(result.proj4.string, [lon, lat])` */
interface Proj4Usage {
	string: string; // Full proj4 string with parameters computed from the bbox
}

/**
 * Usage with d3-geo / d3-geo-projection.
 * If `snippet` is present, use this code instead of the individual parameters.
 */
interface D3Usage {
	projection: string; // Factory function name, e.g. "geoAlbers", "geoOrthographic"
	rotate?: [number, number] | [number, number, number]; // .rotate([λ, φ]) or .rotate([λ, φ, γ])
	center?: [number, number]; // .center([lon, lat])
	parallels?: [number, number]; // .parallels([lat1, lat2])
	snippet?: string; // Manual construction code (interrupted projections, etc.)
}

interface ResolvedProjection {
	id: string;
	name?: string;
	scale: ScaleType[]; // 'world' | 'hemisphere' | 'region' | 'local'
	shape: ShapeType; // 'rectangular' | 'round' | 'discontinuous' | 'rectangle'
	equalarea?: boolean;
	proj4: Proj4Usage | null; // null if proj4js does not support this projection
	d3: D3Usage | null; // null if there is no native d3 equivalent
}

interface MatchedCountry {
	id: string;
	epsg: string; // EPSG code ('2154'), 'AUTHORITY:code' ('ESRI:102025'), or '' when unregistered
	projection: string;
	bbox: BBox;
	proj4: string; // Full proj4 string with geographically correct lon_0/lat_0
	d3: D3Usage; // d3-geo config
	share: number; // Share of the country bbox covered by the intersection (0-1)
	ratio: number; // Area ratio of reference bbox / country bbox
	within: boolean; // Is the reference bbox entirely contained within the country bbox?
}
```

### Limitations of `validate_bbox`

`validate_bbox` only checks the geometric and numeric validity of the bbox. Some cases remain outside its scope:

- A valid bbox that is not very meaningful cartographically (e.g. an extremely small area)
- Coordinates outside the intended EPSG:4326 usage but numerically within the allowed ranges

In these cases, the validation function may return `valid: true`, even though the suggestions remain technically computable but potentially not very useful.

---

## Available generic projections

For scales other than `world`, the library can return the following projections depending on the bbox's characteristics.

| Projection                        | Equal area | Scale                     | Aspect ratio                                           | Shape         |
| --------------------------------- | :--------: | -------------------------- | ------------------------------------------------------ | ------------- |
| Orthographic                      |            | hemisphere                  | all¹                                                  | round         |
| Lambert Azimuthal Equal Area      |     ✓      | hemisphere · region         | hem.: all¹ · reg.: square, landscape                   | round         |
| Azimuthal Equidistant             |            | hemisphere · region         | hem.: all¹ · reg.: landscape²                         | discontinuous   |
| Mercator                          |            | hemisphere · region · local | hem.: all³ · reg.: landscape⁴ · loc.: square, landscape | rectangular |
| Cylindrical Equal Area            |     ✓      | hemisphere · region         | hem.: all³ · reg.: landscape⁴                         | rectangular |
| Equirectangular                   |            | hemisphere · region · local | hem.: all³ · reg.: landscape⁴ · loc.: square, landscape | rectangular |
| Albers Conic                      |     ✓      | region                      | landscape⁵                                               | round         |
| Lambert Conformal Conic           |            | region                      | landscape⁵                                               | round         |
| Equidistant Conic                 |            | region                      | square · landscape⁵                                       | round         |
| Stereographic                     |            | region                      | square · landscape²                                       | round         |
| Transverse Cylindrical Equal Area |     ✓      | region · local              | reg.: portrait · loc.: all                          | rectangular |
| Transverse Mercator               |            | region · local              | reg.: portrait · loc.: all                          | round         |
| Cassini                           |            | region                      | portrait                                               | round         |

> ¹ Outside the tropical zone · only if the bbox width ≤ 180° for Orthographic.
> ² Polar zone (centroid |lat| > 75°).
> ³ Zone entirely within the tropics (|lat| < 23.44°).
> ⁴ Equatorial zone (centroid |lat| < 15°) or tropical.
> ⁵ Temperate zone (outside the equator and outside polar zones).

> **Shape**: _round_ — oval or circular outline · _rectangular_ — map in a full frame · _discontinuous_ — map with geographic interruptions.

---

## Projection suggestion algorithm

The algorithm implemented in `suggest_generic_projections` follows a cascading logic that starts from the provided bbox to determine the scale, the aspect ratio, and the geographic position of the area, then selects the most suitable projections.

### Step 1 — Determine the scale

The spherical area of the bbox is computed and compared to the total surface of the Earth (4π steradians). This ratio, called `earth_share`, determines the scale:

| `earth_share`   | Scale          |
| --------------- | -------------- |
| ≥ 2/3 (~66 %)   | **world**      |
| ≥ 1/6 (~17 %)   | **hemisphere** |
| ≥ 1/200 (0.5 %) | **region**     |
| < 1/200         | **local**      |

### Step 2 — Determine the aspect ratio

The height/width ratio of the bbox (in degrees) classifies its shape:

| Ratio (h/w)    | Type          |
| -------------- | ------------- |
| ≤ 0.8          | **landscape** |
| ≥ 1.25         | **portrait**  |
| in between     | **square**    |

### Step 3 — Compute the centering parameters

For every scale except `world`, the bbox centroid is computed. The projection parameters are:

- **`lon`**: longitude of the centroid
- **`lat`**: latitude of the centroid
- **`lat_1`, `lat_2`**: standard parallels, computed symmetrically around the centroid

The calculation of the standard parallels uses a different interval depending on the position:

- **Polar zone** (|centroid latitude| > 75°) or **equatorial zone** (|centroid latitude| < 15°): the interval is **1/4** of the bbox height
- **Other zones**: the interval is **1/6** of the bbox height

### Step 4 — Cascading selection based on scale × shape × position

The projection selection follows a decision tree combining scale and aspect ratio. Geographic position (polar, tropical, equatorial) refines the choice.

#### `world` scale

No centering parameter is needed. All available world projections are returned: Equal Earth, Bertin 1953, Interrupted Mollweide, etc.

#### `hemisphere` scale

Regardless of the aspect ratio (`square`, `landscape`, `portrait`):

- **If the area lies entirely within the tropics** (|lat_min| < 23.44° and |lat_max| < 23.44°): the centering latitude is set to 0° and the selected projections are **Mercator**, **Cylindrical Equal Area**, **Equirectangular** — suited to low distortion in the equatorial zone.
- **Otherwise**:
  - If the width is ≤ 180°: **Orthographic** is added (the bbox fits within a visible hemisphere).
  - In all cases: **Lambert Azimuthal Equal Area**, **Azimuthal Equidistant**.

#### `region` scale — `square`

- If close to the poles (|centroid lat| > 75°): the latitude is set to ±90°.
- If close to the equator (|centroid lat| < 15°): the latitude is set to 0°.
- Projections: **Lambert Azimuthal Equal Area**, **Stereographic**, **Equidistant Conic**.

#### `region` scale — `landscape`

- **Close to the poles** (|centroid lat| > 75°): latitude set to ±90°, azimuthal projections — **LAEA**, **Stereographic**, **Azimuthal Equidistant**.
- **Equator or tropics** (|centroid lat| < 15° or a zone entirely within the tropics): latitude set to 0°, cylindrical projections — **Cylindrical Equal Area**, **Mercator**, **Equirectangular**.
- **Temperate zones** (default case): conic projections — **Albers Conic**, **Lambert Conformal Conic**, **Equidistant Conic**. These conic projections are well suited to mid-latitude zones with an east-west extent.

#### `region` scale — `portrait`

- Transverse projections, suited to areas with a north-south extent: **Transverse Cylindrical Equal Area**, **Transverse Mercator**, **Cassini**.

#### `local` scale — `portrait`

- **Transverse Cylindrical Equal Area**, **Transverse Mercator**.

#### `local` scale — `square` or `landscape`

No specific filter on identifiers. All projections compatible with the `local` scale are returned (Equirectangular, Mercator, Transverse Mercator, Transverse CEA).

### Decision tree summary

```
bbox
 ├── earth_share ≥ 2/3 → world → all world projections
 └── earth_share < 2/3
      ├── centering + standard parallels computed
      │
      ├── hemisphere (earth_share ≥ 1/6)
      │    ├── tropical zone → Mercator, CEA, Equirectangular (lat=0)
      │    └── otherwise → Orthographic (if ≤180°), LAEA, Azimuthal Equidistant
      │
      ├── region (earth_share ≥ 1/200)
      │    ├── square → LAEA, Stereographic, Equidistant Conic
      │    ├── landscape
      │    │    ├── pole → LAEA, Stereographic, Azimuthal Equidistant (lat=±90)
      │    │    ├── tropics → CEA, Mercator, Equirectangular (lat=0)
      │    │    └── temperate → Albers, Lambert CC, Equidistant Conic
      │    └── portrait → Transverse CEA, Transverse Mercator, Cassini
      │
      └── local (earth_share < 1/200)
           ├── portrait → Transverse CEA, Transverse Mercator
           └── square/landscape → all local projections
```

---

## Matching against national projections

The algorithm implemented in `match_national_projections` compares the reference bbox with the bboxes of countries that have an official national projection. Three metrics are computed:

### Metrics

1. **`share`** — Intersection share: the area of the intersection between the reference bbox and the country bbox, relative to the area of the country bbox. A value between 0 and 1. A `share` of 0.9 means that 90% of the country's bbox is covered by the reference bbox.

2. **`ratio`** — Area ratio: the area of the reference bbox divided by the area of the country bbox. A ratio of 1 means the areas are identical; a ratio of 3 means the reference bbox is 3 times the size of the country bbox.

3. **`within`** — Containment: true if the reference bbox is entirely contained within the country bbox.

All areas are computed in spherical coordinates (steradians) to account for the convergence of meridians.

### Matching criteria

A national projection is considered a match if:

- **(1) `share` ≥ 0.75** AND **(2) `ratio` < 2** — the reference bbox covers at least 75% of the country and is no more than 2 times its size.
- **OR (3) `within` = true** — the reference bbox is entirely contained within the country bbox, regardless of its size.

```
Match = ( share ≥ 0.75 AND ratio < 2 ) OR within
```

### Available countries

| ID             | EPSG        | Projection                   |
| -------------- | ----------- | ---------------------------- |
| eu             | 3035        | Lambert Azimuthal Equal Area |
| france         | 2154        | Lambert 93                   |
| uk             | 27700       | Transverse Mercator          |
| ireland        | 2157        | Transverse Mercator          |
| switzerland    | 2056        | Swiss Oblique Mercator       |
| brazil         | 10857       | Albers Equal Area            |
| belgium        | 31370       | Lambert Conic Conformal      |
| netherlands    | 28992       | Stereographic                |
| germany        | 25832       | Transverse Mercator (UTM 32) |
| spain          | —           | Lambert Conic Conformal      |
| canary_islands | —           | Lambert Conic Conformal      |
| usa            | 5070        | Albers Equal Area            |
| canada         | 3347        | Lambert Conic Conformal      |
| mexico         | 6372        | Lambert Conic Conformal      |
| australia      | 9473        | Albers Equal Area            |
| india          | 7755        | Lambert Conic Conformal      |
| japan          | —           | Albers Equal Area            |
| china          | ESRI:102025 | Albers Equal Area            |
| russia         | 3576        | Lambert Azimuthal Equal Area |

`—`: the projection has no registered code; `epsg` is then an empty string.

**Spain** — Lambert conic conformal on ETRS89, mandated by Real Decreto 1071/2007 (art. 5) for maps at 1:500,000 and smaller, with the parameters set by the IGN for the _Atlas Nacional de España_ (J. J. Alonso, [_Proyecciones cartográficas en los mapas del Atlas Nacional de España_](https://www.ign.es/web/resources/docs/IGNCnig/ProyeccionesMapasANE.pdf), IGN, 2014):

- `spain` — mainland, Balearic Islands, Ceuta and Melilla: origin 40° N 3° W, standard parallels 42° 50′ N and 37° 07′ N, false easting and northing 600,000 m.
- `canary_islands` — tangent cone at 28° 30′ N, central meridian 16° W, false easting and northing 300,000 m.

The Canary Islands are kept out of the `spain` bbox: including them would stretch it over northern Morocco. A dataset covering all of Spain matches `spain` when passed as per-feature bboxes (the islands are discarded as a detached territory, see [Multi-bbox reduction](#multi-bbox-reduction)); a dataset covering only the Canaries matches `canary_islands`.

---

## Multi-bbox reduction

A single bbox is a *lossy* proxy for a geometry. For a country with detached territories, the bbox that encompasses **everything** vastly over-represents the main landmass and causes the national matching to fail.

The textbook case: the `cb_2018_us_state_20m` shapefile (US states). Its total extent is `[-179.17, 17.91, 179.77, 71.35]` — about 358° of longitude wide, because Alaska's Aleutian Islands cross the antimeridian. `suggest_projections` would classify it at "world" scale and would never suggest the US Albers projection (EPSG:5070).

Modern spatial formats (GeoParquet, FlatGeobuf, GeoPackage R-tree index…) already store a per-feature bbox as a spatial index proxy. By consuming this array, `representative_bbox` recovers the dominant landmass without touching the full geometry.

### Algorithm

0. **Antimeridian** — Features whose bbox is more than 180° wide cross the date line; their true extent cannot be recovered from the extremes alone, so they are discarded outright (the Alaska case).
1. **Connected components** — Two features join the same landmass when the gap between their bboxes is ≤ `detach_gap` (default 3°). This single physical threshold groups a continuous landmass (adjacent entities → zero gap) and absorbs islands close to a strait (Corsica, ~0.7° from the mainland), while still isolating overseas territories (tens of degrees away).
2. **Discarding** — The largest component (by spherical bbox area) is kept, and detached components are discarded as long as their cumulative area stays under the `1 − retain` budget. Weighting by area correctly ranks a large mainland ahead of small territories, even when the dataset only has a handful of features.

A safeguard short-circuits **scattered** data: if no component accounts for at least `retain` of the total area, there is no dominant subject to extract, and nothing is trimmed (a multi-continent world map remains a world map).

### Example

```ts
import { suggest_projections, representative_bbox } from '@ateliercartographie/proj-suggest';
import type { BBox } from '@ateliercartographie/proj-suggest';

// One bbox per state/territory (as provided by a GeoParquet, FlatGeobuf…)
const boxes: BBox[] = [
	/* …, */ [-124.41, 32.53, -114.14, 42.01] /* California, …48 contiguous states… */,
	[-179.17, 51.22, 179.77, 71.35], // Alaska (crosses the antimeridian)
	[-160.25, 18.92, -154.81, 22.23], // Hawaii
	[-67.96, 17.91, -65.22, 18.51] // Puerto Rico
];

const { national, reduced } = suggest_projections(boxes);

console.log(reduced);
// {
//   bbox: [-124.73, 24.5, -66.95, 49.38],  // ≈ CONUS (48 contiguous states + DC)
//   kept: 49,
//   outliers: [ /* Hawaii, Puerto Rico, Alaska */ ],
//   trimmed: true
// }

console.log(national.some((d) => d.id === 'usa')); // true → Albers EPSG:5070

// Tuning: detachment threshold and retained share
representative_bbox(boxes, { detach_gap: 5, retain: 0.9 });
```

> **Performance.** Binning the features runs in O(n); clustering the components runs in O(m²), where `m` is the number of *occupied cells* (≪ n) — dense datasets such as the ~35,000 French communes reduce to a small `m`. For sparse inputs covering the whole globe at high resolution, a spatial index over the nodes would lift this ceiling (a deferred optimization).

---

## Examples

### Suggestion for metropolitan France

```ts
import { suggest_projections, validate_bbox } from '@ateliercartographie/proj-suggest';

const france: BBox = [-5, 41, 10, 51];

const validation = validate_bbox(france);
if (!validation.valid) {
	throw new Error(`Invalid bbox: ${validation.errors.join(' | ')}`);
}

const { national, generic } = suggest_projections(france);

// National projections: proj4 and d3 ready to use
console.log(national[0].proj4); // '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 ...'
console.log(national[0].d3); // { projection: 'geoConicConformal', rotate: [-3, 0], parallels: [44, 49] }

// Generic projections: results calibrated on the bbox
console.log(generic[0].id); // 'albers_conic'
console.log(generic[0].proj4.string); // '+proj=aea +lon_0=2.5 +lat_0=46 +lat_1=44.33 +lat_2=47.67 ...'
console.log(generic[0].d3); // { projection: 'geoAlbers', rotate: [-2.5, 0], parallels: [44.33, 47.67] }
```

### Detailed validation example

```ts
import { validate_bbox } from '@ateliercartographie/proj-suggest';

const invalidBbox = [10, 60, 10, 40] as const;
const result = validate_bbox(invalidBbox as [number, number, number, number]);

if (!result.valid) {
	console.error(result.errors);
	// [
	//   'lat_min (60) must be ≤ lat_max (40).',
	//   'lon_min and lon_max are equal — bbox has no width.'
	// ]
}
```

### Suggestion for the whole world

```ts
const world: BBox = [-180, -90, 180, 90];

suggest_projections(world);
// → generic: Equal Earth, Equirectangular, Mercator, Bertin 1953, Gall-Peters, Times,
//   Bonne, Atlantis, Mollweide Interrupted, Mollweide Interrupted Oceans, LAEA
```

### Suggestion for a polar area

```ts
const arctic: BBox = [-180, 75, 180, 90];

suggest_projections(arctic);
// → generic: LAEA (lat=90), Stereographic (lat=90), Azimuthal Equidistant (lat=90)
```

### Suggestion for a tropical area elongated east-west

```ts
const tropics: BBox = [-30, -10, 50, 10];

suggest_projections(tropics);
// → generic: Mercator (lat=0), Cylindrical Equal Area (lat=0), Equirectangular (lat=0)
```

### Suggestion for a portrait-oriented area (elongated north-south)

```ts
const chile: BBox = [-76, -56, -66, -17];

suggest_projections(chile);
// → generic: Transverse Cylindrical Equal Area, Transverse Mercator, Cassini
```

### Checking intersection without filtering

```ts
import { get_intersecting_countries } from '@ateliercartographie/proj-suggest';

const bbox: BBox = [0, 45, 12, 55];

get_intersecting_countries(bbox);
// → All countries whose bbox intersects [0, 45, 12, 55],
//   with share, ratio and within computed for each country.
//   Useful for understanding why a country is (or isn't) matched.
```

### Using proj4js

```ts
import proj4 from 'proj4';
import { suggest_projections } from '@ateliercartographie/proj-suggest';

const bbox: BBox = [-20, 35, 30, 65]; // Europe
const { generic, national } = suggest_projections(bbox);

// Generic projections — proj4 is null for d3-only projections
const first = generic.find((d) => d.proj4 !== null);
if (first) {
	const [x, y] = proj4(first.proj4.string).forward([2.35, 48.86]); // Paris
}

// National projections — proj4 is always a directly usable string
if (national.length > 0) {
	const [x, y] = proj4(national[0].proj4).forward([2.35, 48.86]);
}
```

### Using d3-geo

```ts
import * as d3 from 'd3';
import * as d3geo from 'd3-geo-projection';
import { suggest_projections } from '@ateliercartographie/proj-suggest';

const bbox: BBox = [-20, 35, 30, 65]; // Europe
const { generic, national } = suggest_projections(bbox);

// Generic projections
const suggestion = generic[0];
if (suggestion.d3) {
	const { projection, rotate, parallels, snippet } = suggestion.d3;

	if (snippet) {
		// Special case: a projection that must be built manually (e.g. mollweide_ocean)
		// Evaluate or display the snippet as construction documentation
		console.log(snippet);
	} else {
		const factory = d3[projection] ?? d3geo[projection];
		const proj = factory();
		if (rotate) proj.rotate(rotate);
		if (parallels) proj.parallels(parallels);
	}
}

// National projections — d3 is always present
const { projection, rotate, parallels } = national[0].d3;
const factory = d3[projection] ?? d3geo[projection];
const proj = factory();
if (rotate) proj.rotate(rotate);
if (parallels) proj.parallels(parallels);
```

## Development

```bash
pnpm install
pnpm dev       # Development server with an interactive playground
pnpm test      # Unit tests (vitest)
pnpm package   # Build the library
```

## References

The projection selection algorithm is based on the decision tree published by:

- Snyder, J. P. (1987). _Map Projections — A Working Manual_. USGS Professional Paper 1395, p. 34–35. [doi:10.3133/pp1395](https://doi.org/10.3133/pp1395)
- Šavrič, B., Jenny, B. and Jenny, H. (2016). Projection Wizard – An online map projection selection tool. _The Cartographic Journal_, 53(2), p. 177–185. [doi:10.1080/00087041.2015.1131938](https://doi.org/10.1080/00087041.2015.1131938)

The online tool [Projection Wizard](https://projectionwizard.org) by Bojan Šavrič served as an inspiration. This library is an **independent reimplementation** of the published decision tree: the code was written from scratch in TypeScript as a framework-agnostic developer library and an original national-projection matching module.

## License

ISC
