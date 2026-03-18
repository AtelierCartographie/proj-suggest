import type { BBox } from './utils.js';

export interface ProjCountry {
	id: string;
	epsg: string;
	projection: string;
	bbox: BBox;
	proj4: string;
	rotate?: [number, number];
}

export const proj_countries: ProjCountry[] = [
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
		epsg: '10857',
		projection: 'albers equal area',
		bbox: [-74, -34, -34, 6],
		proj4:
			'+proj=aea +lat_0=-12 +lon_0=0 +lat_1=-2 +lat_2=-22 +x_0=5000000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		rotate: [54, 0]
	},
	// Europe
	{
		id: 'belgium',
		epsg: '31370',
		projection: 'lambert conic conformal',
		bbox: [2.5, 49.5, 6.4, 51.5],
		proj4:
			'+proj=lcc +lat_0=90 +lon_0=4.36748666666667 +lat_1=51.1666672333333 +lat_2=49.8333339 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +units=m +no_defs'
	},
	{
		id: 'netherlands',
		epsg: '28992',
		projection: 'stereographic',
		bbox: [3.2, 50.75, 7.22, 53.51],
		proj4:
			'+proj=sterea +lat_0=52.1561605555556 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +no_defs'
	},
	{
		id: 'germany',
		epsg: '25832',
		projection: 'transverse mercator',
		bbox: [5.87, 47.27, 15.04, 55.06],
		proj4: '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
	},
	// Americas
	{
		id: 'usa',
		epsg: '5070',
		projection: 'albers equal area',
		bbox: [-124.85, 24.55, -66.88, 49.38],
		proj4:
			'+proj=aea +lat_0=23 +lon_0=0 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs',
		rotate: [96, 0]
	},
	{
		id: 'canada',
		epsg: '3347',
		projection: 'lambert conic conformal',
		bbox: [-141.02, 41.67, -52.62, 83.12],
		proj4:
			'+proj=lcc +lat_0=63.390675 +lon_0=0 +lat_1=49 +lat_2=77 +x_0=6200000 +y_0=3000000 +datum=NAD83 +units=m +no_defs',
		rotate: [91.87, 0]
	},
	{
		id: 'mexico',
		epsg: '6372',
		projection: 'lambert conic conformal',
		bbox: [-122.19, 12.1, -84.64, 32.72],
		proj4:
			'+proj=lcc +lat_0=12 +lon_0=0 +lat_1=17.5 +lat_2=29.5 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		rotate: [102, 0]
	},
	// Asia-Pacific
	{
		id: 'australia',
		epsg: '9473',
		projection: 'albers equal area',
		bbox: [112.92, -43.74, 153.64, -9.86],
		proj4:
			'+proj=aea +lat_0=0 +lon_0=0 +lat_1=-18 +lat_2=-36 +x_0=0 +y_0=0 +ellps=GRS80 +units=m +no_defs',
		rotate: [-132, 0]
	},
	{
		id: 'india',
		epsg: '7755',
		projection: 'lambert conic conformal',
		bbox: [68.11, 8.07, 97.42, 37.1],
		proj4:
			'+proj=lcc +lat_0=24 +lon_0=0 +lat_1=12.472955 +lat_2=35.1728044444444 +x_0=4000000 +y_0=4000000 +datum=WGS84 +units=m +no_defs',
		rotate: [-80, 0]
	},
	{
		id: 'japan',
		epsg: '',
		projection: 'albers equal area',
		bbox: [122.93, 24.04, 153.99, 45.56],
		proj4:
			'+proj=aea +lat_0=38 +lon_0=0 +lat_1=28 +lat_2=42 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
		rotate: [-137, 0]
	},
	{
		id: 'china',
		epsg: 'ESRI:102025',
		projection: 'albers equal area',
		bbox: [73.62, 18.16, 134.77, 53.56],
		proj4:
			'+proj=aea +lat_1=15 +lat_2=65 +lat_0=30 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
		rotate: [-105, 0]
	},
	// Russia
	{
		id: 'russia',
		epsg: '3576',
		projection: 'lambert azimuthal equal area',
		bbox: [19.65, 41.19, 180, 81.9],
		proj4: '+proj=laea +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
		rotate: [-90, -90]
	}
];
