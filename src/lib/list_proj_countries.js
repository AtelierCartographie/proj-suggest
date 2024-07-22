export const proj_countries = [
	{
		id: 'eu',
		epsg: '3035',
		projection: 'lambert azimuthal equal area',
		bbox: [-16.1, 32.9, 40.2, 84.7],
		proj4:
			'+proj=laea +lat_0=0 +lon_0=0 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
		rotate: [-10, -52]
	},
	{
		id: 'france',
		epsg: '2154',
		projection: 'lambert93',
		bbox: [-6, 41.2, 10.4, 51.6],
		proj4:
			'+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
	},
	{
		id: 'uk',
		epsg: '27700',
		projection: 'transverse mercator',
		bbox: [-9, 49.8, 2, 61],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=0 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +units=m +no_defs',
		rotate: [2, -49]
	},
	{
		id: 'ireland',
		epsg: '2157',
		projection: 'transverse mercator',
		bbox: [-10.6, 51.4, -5.3, 55.4],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=0 +k=0.99982 +x_0=600000 +y_0=750000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		rotate: [8, -53.5]
	},
	{
		id: 'switzerland',
		epsg: '2056',
		projection: 'swiss oblique mercator',
		bbox: [6, 45.8, 10.5, 47.8],
		proj4:
			'+proj=somerc +lat_0=0 +lon_0=0 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
		rotate: [-7.4, -46.9]
	},
	{
		id: 'brazil',
		epsg: '29101',
		projection: 'polyconic',
		bbox: [-74, -34, -34, 6],
		proj4:
			'+proj=poly +lat_0=0 +lon_0=0 +x_0=5000000 +y_0=10000000 +ellps=aust_SA +towgs84=-67.35,3.88,-38.22,0,0,0,0 +units=m +no_defs',
		rotate: [54, 0]
	}
];
