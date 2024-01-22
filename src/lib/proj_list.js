export const projections = [
	{ id: 'equirectangular', scale: ['world', 'hemisphere', 'local'], shape: 'rectangular' },
	{ id: 'mercator', scale: ['world', 'hemisphere', 'local'], shape: 'rectangular' },
	{ id: 'peters', scale: ['world'], shape: 'rectangular' },
	{ id: 'times', scale: ['world'], shape: 'rectangular' },
	{ id: 'imago', scale: ['world'], shape: 'rectangular' },
	{ id: 'times', scale: ['world'], shape: 'rectangular' },
	{ id: 'bertin1953', scale: ['world'], shape: 'round' },
	{ id: 'armadillo', scale: ['world'], shape: 'round' },
	{ id: 'equalearth', scale: ['world'], shape: 'round', equalarea: true },
	{ id: 'atlantis', scale: ['world'], shape: 'round' },
	{ id: 'laea', scale: ['world', 'hemisphere', 'region'], shape: 'round', equalarea: true },
	{ id: 'bonne', scale: ['world'], shape: 'round' },
	{ id: 'airocean', scale: ['world'], shape: 'discontinuous' },
	{ id: 'mollweide_2_hemisphere', scale: ['world'], shape: 'discontinuous' },
	{ id: 'mollweide_interrupted', scale: ['world'], shape: 'discontinuous' },
	{ id: 'mollweide_ocean', scale: ['world'], shape: 'discontinuous' },
	{ id: 'waterman', scale: ['world'], shape: 'discontinuous' },
	{ id: 'azimuthal_equidistant', scale: ['hemisphere'], shape: 'discontinuous' },
	{ id: 'cylindrical_equal_area', scale: ['hemisphere'], shape: 'rectangle' }
];

export const countries_projection = [
	{
		id: 'eu',
		epsg: '3035',
		projection: 'lambert azimuthal equal area',
		bbox: [-16.1, 32.9, 40.2, 84.7]
	},
	{ id: 'france', epsg: '2154', projection: 'lambert93', bbox: [-6, 41.2, 10.4, 51.6] },
	{ id: 'uk', epsg: '27700', projection: 'transverse mercator', bbox: [-9, 49.8, 2, 61] },
	{
		id: 'ireland',
		epsg: '2157',
		projection: 'transverse mercator',
		bbox: [-10.6, 51.4, -5.3, 55.4]
	},
	{
		id: 'switzerland',
		epsg: '2056',
		projection: 'swiss oblique mercator',
		bbox: [6, 45.8, 10.5, 47.8]
	},
	{ id: 'brazil', epsg: '29101', projection: 'polyconic', bbox: [-74, -34, -34, 6] }
];
