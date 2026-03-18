export type ScaleType = 'world' | 'hemisphere' | 'region' | 'local';
export type ShapeType = 'rectangular' | 'round' | 'discontinuous' | 'rectangle';

export interface ProjParams {
	lon?: number;
	lat?: number;
	lat_1?: number;
	lat_2?: number;
}

export interface Projection {
	id: string;
	name?: string;
	scale: ScaleType[];
	shape: ShapeType;
	equalarea?: boolean;
	proj4?: (params?: ProjParams) => string;
}

export interface ResolvedProjection extends Omit<Projection, 'proj4'> {
	proj4: string;
}

const end_proj = '+ellps=WGS84 +datum=WGS84 +units=m +no_defs';

export const projections: Projection[] = [
	{
		id: 'equirectangular',
		name: 'Equirectangular',
		scale: ['world', 'hemisphere', 'region', 'local'],
		shape: 'rectangular',
		proj4: ({ lon = 0 } = {}) => `+proj=eqc +lon_0=${lon} +lat_ts=0 ${end_proj}`
	},
	{
		id: 'mercator',
		name: 'Mercator',
		scale: ['world', 'hemisphere', 'region', 'local'],
		shape: 'rectangular',
		proj4: ({ lon = 0 } = {}) => `+proj=merc +lon_0=${lon} ${end_proj}`
	},
	{
		id: 'peters',
		name: 'Gall-Peters',
		scale: ['world'],
		shape: 'rectangular',
		proj4: () => `+proj=cea +lat_ts=45 ${end_proj}`
	},
	{
		id: 'times',
		name: 'Times',
		scale: ['world'],
		shape: 'rectangular',
		proj4: () => `+proj=times ${end_proj}`
	},

	// Projections not supported by proj4
	{ id: 'imago', scale: ['world'], shape: 'rectangular' },
	{ id: 'armadillo', scale: ['world'], shape: 'round' },

	{
		id: 'bertin1953',
		name: 'Bertin 1953',
		scale: ['world'],
		shape: 'round',
		proj4: () => `+proj=bertin1953 ${end_proj}`
	},
	{
		id: 'atlantis',
		name: 'Atlantis',
		scale: ['world'],
		shape: 'round',
		proj4: () =>
			`+proj=ob_tran +o_proj=moll +o_lat_p=0 +o_lon_p=0 +o_lon_c=30 +o_lat_c=-45 +o_alpha=90 ${end_proj}`
	},
	{
		id: 'bonne',
		name: 'Bonne',
		scale: ['world'],
		shape: 'round',
		proj4: () => `+proj=bonne +lat_1=45 ${end_proj}`
	},
	{ id: 'airocean', scale: ['world'], shape: 'discontinuous' },
	{ id: 'mollweide_2_hemisphere', scale: ['world'], shape: 'discontinuous' },
	{
		id: 'mollweide_interrupted',
		name: 'Mollweide Interrupted',
		scale: ['world'],
		shape: 'discontinuous',
		proj4: () => `+proj=imoll ${end_proj}`
	},
	{
		id: 'mollweide_ocean',
		name: 'Mollweide Interrupted Oceans',
		scale: ['world'],
		shape: 'discontinuous',
		proj4: () => `+proj=imoll_o +lon_0=-160 ${end_proj}`
	},
	{ id: 'waterman', scale: ['world'], shape: 'discontinuous' },

	// Equal area
	{
		id: 'albers_conic',
		name: 'Albers Conic',
		scale: ['region'],
		shape: 'round',
		equalarea: true,
		proj4: ({ lon = 0, lat = 0, lat_1 = 0, lat_2 = 0 } = {}) =>
			`+proj=aea +lon_0=${lon} +lat_1=${lat_1} +lat_2=${lat_2} +lat_0=${lat} ${end_proj}`
	},
	{
		id: 'equalearth',
		name: 'Equal Earth',
		scale: ['world'],
		shape: 'round',
		equalarea: true,
		proj4: () => `+proj=eqearth ${end_proj}`
	},
	{
		id: 'laea',
		name: 'Lambert Azimuthal Equal Area',
		scale: ['world', 'hemisphere', 'region'],
		shape: 'round',
		equalarea: true,
		proj4: ({ lon = 0, lat = 90 } = {}) => `+proj=laea +lon_0=${lon} +lat_0=${lat} ${end_proj}`
	},
	{
		id: 'cylindrical_equal_area',
		name: 'Cylindrical Equal Area',
		scale: ['hemisphere', 'region'],
		shape: 'rectangle',
		equalarea: true,
		proj4: ({ lon = 0 } = {}) => `+proj=cea +lon_0=${lon} ${end_proj}`
	},
	{
		id: 'transverse_cylindrical_equal_area',
		name: 'Transverse Cylindrical Equal Area',
		scale: ['region', 'local'],
		shape: 'rectangle',
		equalarea: true,
		proj4: ({ lon = 0 } = {}) => `+proj=tcea +lon_0=${lon} ${end_proj}`
	},

	// Conformal
	{
		id: 'lambert_conformal_conic',
		name: 'Lambert Conformal Conic',
		scale: ['region'],
		shape: 'round',
		proj4: ({ lon = 0, lat = 0, lat_1 = 0, lat_2 = 0 } = {}) =>
			`+proj=lcc +lon_0=${lon} +lat_1=${lat_1} +lat_2=${lat_2} +lat_0=${lat} ${end_proj}`
	},
	{
		id: 'stereographic',
		name: 'Stereographic',
		scale: ['region'],
		shape: 'round',
		proj4: ({ lon = 0, lat = 0 } = {}) => `+proj=stere +lon_0=${lon} +lat_0=${lat} ${end_proj}`
	},
	{
		id: 'transverse_mercator',
		name: 'Transverse Mercator',
		scale: ['region', 'local'],
		shape: 'round',
		proj4: ({ lon = 0 } = {}) => `+proj=tmerc +lon_0=${lon} ${end_proj}`
	},
	{
		id: 'orthographic',
		name: 'Orthographic',
		scale: ['hemisphere'],
		shape: 'round',
		proj4: ({ lon = 0, lat = 0 } = {}) => `+proj=ortho +lon_0=${lon} +lat_0=${lat} ${end_proj}`
	},

	// Equidistant
	{
		id: 'azimuthal_equidistant',
		name: 'Azimuthal Equidistant',
		scale: ['hemisphere'],
		shape: 'discontinuous',
		proj4: ({ lon = 0, lat = 0 } = {}) => `+proj=aeqd +lon_0=${lon} +lat_0=${lat} ${end_proj}`
	},
	{
		id: 'equidistant_conic',
		name: 'Equidistant Conic',
		scale: ['region'],
		shape: 'round',
		proj4: ({ lon = 0, lat = 0, lat_1 = 0, lat_2 = 0 } = {}) =>
			`+proj=eqdc +lon_0=${lon} +lat_1=${lat_1} +lat_2=${lat_2} +lat_0=${lat} ${end_proj}`
	},
	{
		id: 'cassini',
		name: 'Cassini',
		scale: ['region'],
		shape: 'round',
		proj4: ({ lon = 0 } = {}) => `+proj=cass +lon_0=${lon} ${end_proj}`
	}
];
