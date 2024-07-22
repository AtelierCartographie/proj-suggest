import proj4 from 'proj4';

const end_proj = '+ellps=WGS84 +datum=WGS84 +units=m +no_defs';

// ⚠️ la projection transverse cylindrical n'existe pas dans d3, il faut la faire
// ce que Bojan Savric à fait, https://github.com/ProjectionWizard/projectionwizard.github.io/blob/master/lib/transverseCylindricalEqualArea.js
// c'est similaire à la transvere Mercator qui elle existe bien dans d3, https://github.com/d3/d3-geo/blob/main/src/projection/transverseMercator.js
export const projections = [
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

	// TODO: find a solution for projection not supported by proj4
	{ id: 'imago', scale: ['world'], shape: 'rectangular' }, // NOT IN PROJ4
	{ id: 'armadillo', scale: ['world'], shape: 'round' }, // NOT IN PROJ4

	{
		id: 'bertin1953',
		name: 'Bertin 1953',
		scale: ['world'],
		shape: 'round',
		proj4: () => `+proj=bertin1953 ${end_proj}`
	},
	// Atlantis is an oblique aspect of the Mollweide projection
	// use the General Oblique Transformation of proj4 to create it
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
	{ id: 'airocean', scale: ['world'], shape: 'discontinuous' }, // NOT IN PROJ4
	{ id: 'mollweide_2_hemisphere', scale: ['world'], shape: 'discontinuous' }, // NOT IN PROJ4
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
	{ id: 'waterman', scale: ['world'], shape: 'discontinuous' }, // NOT IN PROJ4
	// EQUAL AREA
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
	// conformal
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
	// equidistant
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
		proj4: (lon) => `+proj=cass +lon_0=${lon} ${end_proj}`
	}
];
