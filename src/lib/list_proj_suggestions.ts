export type ScaleType = 'world' | 'hemisphere' | 'region' | 'local';
export type ShapeType = 'rectangular' | 'round' | 'discontinuous' | 'rectangle';

export interface ProjParams {
	lon?: number;
	lat?: number;
	lat_1?: number;
	lat_2?: number;
}

/**
 * Configuration to use this projection with proj4js.
 * `string` is a complete, standalone proj4 string — ready to use as-is:
 * `proj4(string, [lon, lat])`.
 *
 * Note: not all valid PROJ strings are supported by the standard proj4js build.
 * Non-standard projections (e.g. `+proj=bertin1953`, `+proj=times`, `+proj=imoll`)
 * may not be available — use the `d3` field as a fallback in such cases.
 */
export interface Proj4Usage {
	string: string;
}

/**
 * Configuration to use this projection with d3-geo (or d3-geo-projection).
 * `projection` is the factory function name (e.g. `"geoAlbers"`, `"geoOrthographic"`).
 * Parameters map directly to d3 method calls:
 * - `rotate`    → `.rotate([λ, φ])`
 * - `center`    → `.center([lon, lat])`
 * - `parallels` → `.parallels([lat1, lat2])`
 */
export interface D3Usage {
	/** d3 factory function name, e.g. `"geoAlbers"`. From `d3-geo` or `d3-geo-projection`. */
	projection: string;
	/** `.rotate([λ, φ])` or `.rotate([λ, φ, γ])` for oblique rotations. */
	rotate?: [number, number] | [number, number, number];
	center?: [number, number];
	parallels?: [number, number];
	/**
	 * For projections that require custom setup beyond standard parameters
	 * (e.g. interrupted projections built with `geoInterrupt()`). When present,
	 * use this standalone code snippet instead of the individual parameter fields.
	 */
	snippet?: string;
}

export interface Projection {
	id: string;
	name?: string;
	scale: ScaleType[];
	shape: ShapeType;
	equalarea?: boolean;
	/** Returns a proj4 string computed from the given params. null if proj4 doesn't support this projection. */
	_proj4?: (params?: ProjParams) => string;
	/** Returns d3 config computed from the given params. null if no native d3 equivalent. */
	_d3?: (params?: ProjParams) => D3Usage;
}

export interface ResolvedProjection {
	id: string;
	name?: string;
	scale: ScaleType[];
	shape: ShapeType;
	equalarea?: boolean;
	/**
	 * Use with proj4js: `proj4(proj4.string, [lon, lat])`.
	 * `null` if proj4 doesn't support this projection (use `d3` instead).
	 */
	proj4: Proj4Usage | null;
	/**
	 * Use with d3-geo / d3-geo-projection.
	 * `null` if no native d3 equivalent (use `proj4` instead).
	 */
	d3: D3Usage | null;
}

const end_proj = '+ellps=WGS84 +datum=WGS84 +units=m +no_defs';

export const projections: Projection[] = [
	{
		id: 'equirectangular',
		name: 'Equirectangular',
		scale: ['world', 'hemisphere', 'region', 'local'],
		shape: 'rectangular',
		_proj4: ({ lon = 0 } = {}) => `+proj=eqc +lon_0=${lon} +lat_ts=0 ${end_proj}`,
		_d3: ({ lon = 0 } = {}) => ({ projection: 'geoEquirectangular', rotate: [-lon, 0] })
	},
	{
		id: 'mercator',
		name: 'Mercator',
		scale: ['world', 'hemisphere', 'region', 'local'],
		shape: 'rectangular',
		_proj4: ({ lon = 0 } = {}) => `+proj=merc +lon_0=${lon} ${end_proj}`,
		_d3: ({ lon = 0 } = {}) => ({ projection: 'geoMercator', rotate: [-lon, 0] })
	},
	{
		id: 'peters',
		name: 'Gall-Peters',
		scale: ['world'],
		shape: 'rectangular',
		_proj4: () => `+proj=cea +lat_ts=45 ${end_proj}`,
		_d3: () => ({ projection: 'geoCylindricalEqualArea', parallels: [45, 45] })
	},
	{
		id: 'times',
		name: 'Times',
		scale: ['world'],
		shape: 'rectangular',
		_proj4: () => `+proj=times ${end_proj}`,
		_d3: () => ({ projection: 'geoTimes' })
	},

	// Projections not supported by proj4 (d3-geo-projection only)
	{
		id: 'imago',
		name: 'Imago',
		scale: ['world'],
		shape: 'rectangular',
		_d3: () => ({ projection: 'geoImago' })
	},
	{
		id: 'armadillo',
		name: 'Armadillo',
		scale: ['world'],
		shape: 'round',
		_d3: () => ({ projection: 'geoArmadillo' })
	},

	{
		id: 'bertin1953',
		name: 'Bertin 1953',
		scale: ['world'],
		shape: 'round',
		_proj4: () => `+proj=bertin1953 ${end_proj}`,
		_d3: () => ({ projection: 'geoBertin1953' })
	},
	{
		id: 'atlantis',
		name: 'Atlantis',
		scale: ['world'],
		shape: 'round',
		_proj4: () =>
			`+proj=ob_tran +o_proj=moll +o_lat_p=0 +o_lon_p=0 +o_lon_c=30 +o_lat_c=-45 +o_alpha=90 ${end_proj}`,
		_d3: () => ({ projection: 'geoMollweide', rotate: [30, -45, 90] })
	},
	{
		id: 'bonne',
		name: 'Bonne',
		scale: ['world'],
		shape: 'round',
		_proj4: () => `+proj=bonne +lat_1=45 ${end_proj}`,
		_d3: () => ({ projection: 'geoBonne', parallels: [45, 45] })
	},
	{
		id: 'airocean',
		name: 'Air Ocean',
		scale: ['world'],
		shape: 'discontinuous',
		_d3: () => ({ projection: 'geoAirocean' })
	},
	{
		id: 'mollweide_2_hemisphere',
		name: 'Mollweide 2 Hemispheres',
		scale: ['world'],
		shape: 'discontinuous',
		_d3: () => ({ projection: 'geoInterruptedMollweideHemispheres' })
	},
	{
		id: 'mollweide_interrupted',
		name: 'Mollweide Interrupted',
		scale: ['world'],
		shape: 'discontinuous',
		_proj4: () => `+proj=imoll ${end_proj}`,
		_d3: () => ({ projection: 'geoInterruptedMollweide' })
	},
	{
		id: 'mollweide_ocean',
		name: 'Mollweide Interrupted Oceans',
		scale: ['world'],
		shape: 'discontinuous',
		_proj4: () => `+proj=imoll_o +lon_0=-160 ${end_proj}`,
		_d3: () => ({
			projection: 'geoInterrupt',
			// geoInterruptedMollweideOceans does not exist as a named export;
			// the projection must be assembled manually — see `snippet`.
			snippet:
				'd3.geoInterrupt(d3.geoMollweideRaw, [\n' +
				'  [ // northern hemisphere\n' +
				'    [[-180, 0], [-130, 90], [-90, 5]],\n' +
				'    [[-90, 5], [-30, 90], [60, 5]],\n' +
				'    [[60, 5], [120, 90], [180, 0]]\n' +
				'  ],\n' +
				'  [ // southern hemisphere\n' +
				'    [[-180, 0], [-120, -90], [-60, -5]],\n' +
				'    [[-60, -5], [20, -90], [90, -5]],\n' +
				'    [[90, -5], [140, -90], [180, 0]]\n' +
				'  ]\n' +
				']).rotate([-200, 0])'
		})
	},
	{
		id: 'waterman',
		name: 'Waterman Butterfly',
		scale: ['world'],
		shape: 'discontinuous',
		_d3: () => ({ projection: 'geoPolyhedralWaterman' })
	},

	// Equal area
	{
		id: 'albers_conic',
		name: 'Albers Conic',
		scale: ['region'],
		shape: 'round',
		equalarea: true,
		_proj4: ({ lon = 0, lat = 0, lat_1 = 0, lat_2 = 0 } = {}) =>
			`+proj=aea +lon_0=${lon} +lat_1=${lat_1} +lat_2=${lat_2} +lat_0=${lat} ${end_proj}`,
		_d3: ({ lon = 0, lat_1 = 0, lat_2 = 0 } = {}) => ({
			projection: 'geoAlbers',
			rotate: [-lon, 0],
			parallels: [lat_1, lat_2]
		})
	},
	{
		id: 'equalearth',
		name: 'Equal Earth',
		scale: ['world'],
		shape: 'round',
		equalarea: true,
		_proj4: () => `+proj=eqearth ${end_proj}`,
		_d3: () => ({ projection: 'geoEqualEarth' })
	},
	{
		id: 'laea',
		name: 'Lambert Azimuthal Equal Area',
		scale: ['world', 'hemisphere', 'region'],
		shape: 'round',
		equalarea: true,
		_proj4: ({ lon = 0, lat = 90 } = {}) => `+proj=laea +lon_0=${lon} +lat_0=${lat} ${end_proj}`,
		_d3: ({ lon = 0, lat = 90 } = {}) => ({
			projection: 'geoAzimuthalEqualArea',
			rotate: [-lon, -lat]
		})
	},
	{
		id: 'cylindrical_equal_area',
		name: 'Cylindrical Equal Area',
		scale: ['hemisphere', 'region'],
		shape: 'rectangle',
		equalarea: true,
		_proj4: ({ lon = 0 } = {}) => `+proj=cea +lon_0=${lon} +lat_ts=0 ${end_proj}`,
		_d3: ({ lon = 0 } = {}) => ({ projection: 'geoCylindricalEqualArea', rotate: [-lon, 0] })
	},
	{
		id: 'transverse_cylindrical_equal_area',
		name: 'Transverse Cylindrical Equal Area',
		scale: ['region', 'local'],
		shape: 'rectangle',
		equalarea: true,
		_proj4: ({ lon = 0 } = {}) => `+proj=tcea +lon_0=${lon} ${end_proj}`,
		_d3: ({ lon = 0 } = {}) => ({ projection: 'geoTransverseMercator', rotate: [-lon, 0] })
	},

	// Conformal
	{
		id: 'lambert_conformal_conic',
		name: 'Lambert Conformal Conic',
		scale: ['region'],
		shape: 'round',
		_proj4: ({ lon = 0, lat = 0, lat_1 = 0, lat_2 = 0 } = {}) =>
			`+proj=lcc +lon_0=${lon} +lat_1=${lat_1} +lat_2=${lat_2} +lat_0=${lat} ${end_proj}`,
		_d3: ({ lon = 0, lat_1 = 0, lat_2 = 0 } = {}) => ({
			projection: 'geoConicConformal',
			rotate: [-lon, 0],
			parallels: [lat_1, lat_2]
		})
	},
	{
		id: 'stereographic',
		name: 'Stereographic',
		scale: ['region'],
		shape: 'round',
		_proj4: ({ lon = 0, lat = 0 } = {}) => `+proj=stere +lon_0=${lon} +lat_0=${lat} ${end_proj}`,
		_d3: ({ lon = 0, lat = 0 } = {}) => ({
			projection: 'geoStereographic',
			rotate: [-lon, -lat]
		})
	},
	{
		id: 'transverse_mercator',
		name: 'Transverse Mercator',
		scale: ['region', 'local'],
		shape: 'round',
		_proj4: ({ lon = 0 } = {}) => `+proj=tmerc +lon_0=${lon} ${end_proj}`,
		_d3: ({ lon = 0 } = {}) => ({ projection: 'geoTransverseMercator', rotate: [-lon, 0] })
	},
	{
		id: 'orthographic',
		name: 'Orthographic',
		scale: ['hemisphere'],
		shape: 'round',
		_proj4: ({ lon = 0, lat = 0 } = {}) => `+proj=ortho +lon_0=${lon} +lat_0=${lat} ${end_proj}`,
		_d3: ({ lon = 0, lat = 0 } = {}) => ({
			projection: 'geoOrthographic',
			rotate: [-lon, -lat]
		})
	},

	// Equidistant
	{
		id: 'azimuthal_equidistant',
		name: 'Azimuthal Equidistant',
		scale: ['hemisphere'],
		shape: 'discontinuous',
		_proj4: ({ lon = 0, lat = 0 } = {}) =>
			`+proj=aeqd +lon_0=${lon} +lat_0=${lat} ${end_proj}`,
		_d3: ({ lon = 0, lat = 0 } = {}) => ({
			projection: 'geoAzimuthalEquidistant',
			rotate: [-lon, -lat]
		})
	},
	{
		id: 'equidistant_conic',
		name: 'Equidistant Conic',
		scale: ['region'],
		shape: 'round',
		_proj4: ({ lon = 0, lat = 0, lat_1 = 0, lat_2 = 0 } = {}) =>
			`+proj=eqdc +lon_0=${lon} +lat_1=${lat_1} +lat_2=${lat_2} +lat_0=${lat} ${end_proj}`,
		_d3: ({ lon = 0, lat_1 = 0, lat_2 = 0 } = {}) => ({
			projection: 'geoConicEquidistant',
			rotate: [-lon, 0],
			parallels: [lat_1, lat_2]
		})
	},
	{
		id: 'cassini',
		name: 'Cassini',
		scale: ['region'],
		shape: 'round',
		_proj4: ({ lon = 0 } = {}) => `+proj=cass +lon_0=${lon} ${end_proj}`,
		_d3: ({ lon = 0 } = {}) => ({ projection: 'geoCassini', rotate: [-lon, 0] })
	}
];
