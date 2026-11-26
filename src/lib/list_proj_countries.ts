import type { BBox } from './utils.js';
import type { D3Usage } from './list_proj_suggestions.js';

export interface ProjCountry {
	id: string;
	/**
	 * Registry code: EPSG number (`'2154'`) or `AUTHORITY:code` for another
	 * registry (`'ESRI:102025'`). Empty string when the projection has no
	 * registered code (e.g. `japan`, `spain`).
	 */
	epsg: string;
	projection: string;
	bbox: BBox;
	/**
	 * Complete, standalone proj4 string — works as-is with proj4js.
	 * `lon_0` and `lat_0` are set to the correct geographic values.
	 */
	proj4: string;
	/** Configuration for use with d3-geo / d3-geo-projection. */
	d3: D3Usage;
}

export const proj_countries: ProjCountry[] = [
	{
		id: 'eu',
		epsg: '3035',
		projection: 'lambert azimuthal equal area',
		bbox: [-16.1, 32.9, 40.2, 84.7],
		proj4:
			'+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
		d3: { projection: 'geoAzimuthalEqualArea', rotate: [-10, -52] }
	},
	{
		id: 'france',
		epsg: '2154',
		projection: 'lambert93',
		bbox: [-6, 41.2, 10.4, 51.6],
		proj4:
			'+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoConicConformal', rotate: [-3, 0], parallels: [44, 49] }
	},
	{
		id: 'uk',
		epsg: '27700',
		projection: 'transverse mercator',
		bbox: [-9, 49.8, 2, 61],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [2, -49] }
	},
	{
		id: 'ireland',
		epsg: '2157',
		projection: 'transverse mercator',
		bbox: [-10.6, 51.4, -5.3, 55.4],
		proj4:
			'+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=0.99982 +x_0=600000 +y_0=750000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [8, -53.5] }
	},
	{
		id: 'switzerland',
		epsg: '2056',
		projection: 'swiss oblique mercator',
		bbox: [6, 45.8, 10.5, 47.8],
		proj4:
			'+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
		// Spherical oblique Mercator whose central line runs east-west through the
		// origin (Bern) — the spherical core of somerc. Rotating the normal Mercator
		// brings the origin onto the equator. Differs from proj4 (Bessel ellipsoid,
		// Rosenmund's double projection) by < 0.5 km over Switzerland.
		d3: { projection: 'geoMercator', rotate: [-7.44, -46.95] }
	},
	{
		id: 'brazil',
		epsg: '10857',
		projection: 'albers equal area',
		bbox: [-74, -34, -34, 6],
		proj4:
			'+proj=aea +lat_0=-12 +lon_0=-54 +lat_1=-2 +lat_2=-22 +x_0=5000000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoAlbers', rotate: [54, 0], parallels: [-2, -22] }
	},
	// Europe
	{
		id: 'belgium',
		epsg: '31370',
		projection: 'lambert conic conformal',
		bbox: [2.5, 49.5, 6.4, 51.5],
		proj4:
			'+proj=lcc +lat_0=90 +lon_0=4.36748666666667 +lat_1=51.1666672333333 +lat_2=49.8333339 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +units=m +no_defs',
		d3: {
			projection: 'geoConicConformal',
			rotate: [-4.37, 0],
			parallels: [49.83, 51.17]
		}
	},
	{
		id: 'netherlands',
		epsg: '28992',
		projection: 'stereographic',
		bbox: [3.2, 50.75, 7.22, 53.51],
		proj4:
			'+proj=sterea +lat_0=52.1561605555556 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +no_defs',
		d3: { projection: 'geoStereographic', rotate: [-5.39, -52.16] }
	},
	{
		id: 'germany',
		epsg: '25832',
		projection: 'transverse mercator',
		bbox: [5.87, 47.27, 15.04, 55.06],
		proj4: '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-9, 0] }
	},
	// Italy: "Fuso Italia" of the IGM (RDN2008 / Italy zone, EPSG:7794), a single
	// transverse Mercator zone on 12° E introduced to map the whole country without
	// the UTM 32/33 split. bbox includes Sardinia, Sicily and the Pelagie Islands.
	{
		id: 'italy',
		epsg: '7794',
		projection: 'transverse mercator',
		bbox: [6.62, 35.49, 18.53, 47.1],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=12 +k=0.9985 +x_0=7000000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-12, 0] }
	},
	// Portugal: PT-TM06 (ETRS89), mainland only; the Azores and Madeira use UTM 26/28.
	{
		id: 'portugal',
		epsg: '3763',
		projection: 'transverse mercator',
		bbox: [-9.53, 36.97, -6.19, 42.16],
		proj4:
			'+proj=tmerc +lat_0=39.6682583333333 +lon_0=-8.13310833333333 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [8.13, -39.67] }
	},
	{
		id: 'austria',
		epsg: '3416',
		projection: 'lambert conic conformal',
		bbox: [9.53, 46.37, 17.17, 49.02],
		proj4:
			'+proj=lcc +lat_0=47.5 +lon_0=13.3333333333333 +lat_1=49 +lat_2=46 +x_0=400000 +y_0=400000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: {
			projection: 'geoConicConformal',
			rotate: [-13.3333, 0],
			parallels: [46, 49]
		}
	},
	// Poland: PL-1992, a single TM zone on 19° E for the whole country.
	{
		id: 'poland',
		epsg: '2180',
		projection: 'transverse mercator',
		bbox: [14.12, 49, 24.15, 54.84],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-19, 0] }
	},
	// Nordic countries: national UTM zones (SWEREF 99 TM is UTM 33, ETRS-TM35FIN is UTM 35).
	// Greenland, the Faroe Islands and Svalbard are not covered.
	{
		id: 'denmark',
		epsg: '25832',
		projection: 'transverse mercator',
		bbox: [8.07, 54.56, 15.16, 57.75],
		proj4: '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-9, 0] }
	},
	{
		id: 'norway',
		epsg: '25833',
		projection: 'transverse mercator',
		bbox: [4.57, 57.96, 31.17, 71.18],
		proj4: '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-15, 0] }
	},
	{
		id: 'sweden',
		epsg: '3006',
		projection: 'transverse mercator',
		bbox: [10.98, 55.33, 24.16, 69.06],
		proj4: '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-15, 0] }
	},
	{
		id: 'finland',
		epsg: '3067',
		projection: 'transverse mercator',
		bbox: [19.25, 59.76, 31.58, 70.09],
		proj4: '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-27, 0] }
	},
	{
		id: 'iceland',
		epsg: '8088',
		projection: 'lambert conic conformal',
		bbox: [-24.48, 63.29, -13.51, 66.57],
		proj4:
			'+proj=lcc +lat_0=65 +lon_0=-19 +lat_1=64.25 +lat_2=65.75 +x_0=2700000 +y_0=300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: {
			projection: 'geoConicConformal',
			rotate: [19, 0],
			parallels: [64.25, 65.75]
		}
	},
	{
		id: 'estonia',
		epsg: '3301',
		projection: 'lambert conic conformal',
		bbox: [21.77, 57.51, 28.21, 59.69],
		proj4:
			'+proj=lcc +lat_0=57.5175539305556 +lon_0=24 +lat_1=59.3333333333333 +lat_2=58 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: {
			projection: 'geoConicConformal',
			rotate: [-24, 0],
			parallels: [58, 59.3333]
		}
	},
	{
		id: 'latvia',
		epsg: '3059',
		projection: 'transverse mercator',
		bbox: [20.97, 55.67, 28.24, 58.09],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=-6000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-24, 0] }
	},
	{
		id: 'lithuania',
		epsg: '3346',
		projection: 'transverse mercator',
		bbox: [20.95, 53.89, 26.84, 56.45],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9998 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-24, 0] }
	},
	{
		id: 'luxembourg',
		epsg: '2169',
		projection: 'transverse mercator',
		bbox: [5.74, 49.44, 6.53, 50.19],
		proj4:
			'+proj=tmerc +lat_0=49.8333333333333 +lon_0=6.16666666666667 +k=1 +x_0=80000 +y_0=100000 +ellps=intl +towgs84=-189.6806,18.3463,-42.7695,-0.33746,-3.09264,2.53861,0.4598 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-6.17, -49.83] }
	},
	{
		id: 'slovenia',
		epsg: '3794',
		projection: 'transverse mercator',
		bbox: [13.37, 45.42, 16.6, 46.88],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-15, 0] }
	},
	{
		id: 'croatia',
		epsg: '3765',
		projection: 'transverse mercator',
		bbox: [13.5, 42.41, 19.45, 46.56],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=16.5 +k=0.9999 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-16.5, 0] }
	},
	{
		id: 'greece',
		epsg: '2100',
		projection: 'transverse mercator',
		bbox: [19.37, 34.8, 29.65, 41.75],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-24, 0] }
	},
	// Romania: Stereo 70, oblique stereographic on 46° N 25° E.
	{
		id: 'romania',
		epsg: '3844',
		projection: 'stereographic',
		bbox: [20.26, 43.62, 29.7, 48.27],
		proj4:
			'+proj=sterea +lat_0=46 +lon_0=25 +k=0.99975 +x_0=500000 +y_0=500000 +ellps=krass +units=m +no_defs',
		d3: { projection: 'geoStereographic', rotate: [-25, -46] }
	},
	// French overseas departments: official UTM projections of the IGN, as used by
	// the France composite of khartis-basemaps. Guadeloupe and Martinique share RGAF09 / UTM 20N.
	{
		id: 'guadeloupe',
		epsg: '5490',
		projection: 'transverse mercator',
		bbox: [-61.82, 15.83, -61.01, 16.51],
		proj4: '+proj=utm +zone=20 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [63, 0] }
	},
	{
		id: 'martinique',
		epsg: '5490',
		projection: 'transverse mercator',
		bbox: [-61.23, 14.39, -60.81, 14.88],
		proj4: '+proj=utm +zone=20 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [63, 0] }
	},
	{
		id: 'french_guiana',
		epsg: '2972',
		projection: 'transverse mercator',
		bbox: [-54.61, 2.11, -51.62, 5.75],
		proj4: '+proj=utm +zone=22 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [51, 0] }
	},
	{
		id: 'reunion',
		epsg: '2975',
		projection: 'transverse mercator',
		bbox: [55.21, -21.39, 55.84, -20.87],
		proj4: '+proj=utm +zone=40 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-57, 0] }
	},
	{
		id: 'mayotte',
		epsg: '4471',
		projection: 'transverse mercator',
		bbox: [45.01, -13, 45.3, -12.63],
		proj4: '+proj=utm +zone=38 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-45, 0] }
	},
	{
		id: 'saint_pierre_miquelon',
		epsg: '4467',
		projection: 'transverse mercator',
		bbox: [-56.41, 46.75, -56.11, 47.14],
		proj4: '+proj=utm +zone=21 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [57, 0] }
	},
	// Spain: Lambert conic conformal mandated by Real Decreto 1071/2007 (art. 5) for
	// maps at 1:500,000 and smaller, with the parameters set by the IGN for the
	// Atlas Nacional de España. No EPSG code. The Canary Islands have their own
	// tangent cone and are excluded from the mainland bbox, which would otherwise
	// span northern Morocco.
	{
		id: 'spain',
		epsg: '',
		projection: 'lambert conic conformal',
		bbox: [-9.31, 35.26, 4.33, 43.8],
		proj4:
			'+proj=lcc +lat_0=40 +lon_0=-3 +lat_1=42.8333333333333 +lat_2=37.1166666666667 +x_0=600000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: {
			projection: 'geoConicConformal',
			rotate: [3, 0],
			parallels: [37.1166666666667, 42.8333333333333]
		}
	},
	{
		id: 'canary_islands',
		epsg: '',
		projection: 'lambert conic conformal',
		bbox: [-18.17, 27.63, -13.33, 29.42],
		proj4:
			'+proj=lcc +lat_0=28.5 +lon_0=-16 +lat_1=28.5 +x_0=300000 +y_0=300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoConicConformal', rotate: [16, 0], parallels: [28.5, 28.5] }
	},
	// Americas
	{
		id: 'usa',
		epsg: '5070',
		projection: 'albers equal area',
		bbox: [-124.85, 24.55, -66.88, 49.38],
		proj4:
			'+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoAlbers', rotate: [96, 0], parallels: [29.5, 45.5] }
	},
	// Alaska and Hawaii: the Albers insets of the USA composite of khartis-basemaps.
	// The Alaska bbox crosses the antimeridian (Aleutian Islands).
	{
		id: 'alaska',
		epsg: '3338',
		projection: 'albers equal area',
		bbox: [172.48, 51.21, -130, 71.38],
		proj4:
			'+proj=aea +lat_0=50 +lon_0=-154 +lat_1=55 +lat_2=65 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: {
			projection: 'geoAlbers',
			rotate: [154, 0],
			parallels: [55, 65]
		}
	},
	// Main Hawaiian Islands; the Northwestern Hawaiian Islands are excluded.
	{
		id: 'hawaii',
		epsg: 'ESRI:102007',
		projection: 'albers equal area',
		bbox: [-160.56, 18.91, -154.8, 22.23],
		proj4:
			'+proj=aea +lat_0=13 +lon_0=-157 +lat_1=8 +lat_2=18 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: {
			projection: 'geoAlbers',
			rotate: [157, 0],
			parallels: [8, 18]
		}
	},
	{
		id: 'canada',
		epsg: '3347',
		projection: 'lambert conic conformal',
		bbox: [-141.02, 41.67, -52.62, 83.12],
		proj4:
			'+proj=lcc +lat_0=63.390675 +lon_0=-91.8666666666667 +lat_1=49 +lat_2=77 +x_0=6200000 +y_0=3000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoConicConformal', rotate: [91.87, 0], parallels: [49, 77] }
	},
	{
		id: 'mexico',
		epsg: '6372',
		projection: 'lambert conic conformal',
		bbox: [-122.19, 12.1, -84.64, 32.72],
		proj4:
			'+proj=lcc +lat_0=12 +lon_0=-102 +lat_1=17.5 +lat_2=29.5 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoConicConformal', rotate: [102, 0], parallels: [17.5, 29.5] }
	},
	// Asia-Pacific
	{
		id: 'australia',
		epsg: '9473',
		projection: 'albers equal area',
		bbox: [112.92, -43.74, 153.64, -9.86],
		proj4:
			'+proj=aea +lat_0=0 +lon_0=132 +lat_1=-18 +lat_2=-36 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoAlbers', rotate: [-132, 0], parallels: [-18, -36] }
	},
	{
		id: 'india',
		epsg: '7755',
		projection: 'lambert conic conformal',
		bbox: [68.11, 8.07, 97.42, 37.1],
		proj4:
			'+proj=lcc +lat_0=24 +lon_0=80 +lat_1=12.472955 +lat_2=35.1728044444444 +x_0=4000000 +y_0=4000000 +datum=WGS84 +units=m +no_defs',
		d3: { projection: 'geoConicConformal', rotate: [-80, 0], parallels: [12.47, 35.17] }
	},
	{
		id: 'japan',
		epsg: '',
		projection: 'albers equal area',
		bbox: [122.93, 24.04, 153.99, 45.56],
		proj4:
			'+proj=aea +lat_0=38 +lon_0=137 +lat_1=28 +lat_2=42 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
		d3: { projection: 'geoAlbers', rotate: [-137, 0], parallels: [28, 42] }
	},
	{
		id: 'china',
		epsg: 'ESRI:102025',
		projection: 'albers equal area',
		bbox: [73.62, 18.16, 134.77, 53.56],
		proj4:
			'+proj=aea +lat_1=15 +lat_2=65 +lat_0=30 +lon_0=95 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
		d3: { projection: 'geoAlbers', rotate: [-95, 0], parallels: [15, 65] }
	},
	// New Zealand: NZTM2000, North, South and Stewart Islands (Chatham and outlying islands excluded).
	{
		id: 'new_zealand',
		epsg: '2193',
		projection: 'transverse mercator',
		bbox: [166.44, -47.29, 178.55, -34.12],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-173, 0] }
	},
	{
		id: 'south_korea',
		epsg: '5179',
		projection: 'transverse mercator',
		bbox: [124.6, 33.1, 130.93, 38.62],
		proj4:
			'+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-127.5, -38] }
	},
	// Taiwan: TWD97 / TM2 zone 121, main island and Penghu (Kinmen and Matsu excluded).
	{
		id: 'taiwan',
		epsg: '3826',
		projection: 'transverse mercator',
		bbox: [119.31, 21.89, 122.01, 25.3],
		proj4:
			'+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-121, 0] }
	},
	{
		id: 'israel',
		epsg: '2039',
		projection: 'transverse mercator',
		bbox: [34.26, 29.49, 35.69, 33.29],
		proj4:
			'+proj=tmerc +lat_0=31.7343936111111 +lon_0=35.2045169444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +units=m +no_defs',
		d3: { projection: 'geoTransverseMercator', rotate: [-35.2, -31.73] }
	},
	// Russia
	{
		id: 'russia',
		epsg: '3576',
		projection: 'lambert azimuthal equal area',
		bbox: [19.65, 41.19, 180, 81.9],
		proj4:
			'+proj=laea +lat_0=90 +lon_0=90 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
		d3: { projection: 'geoAzimuthalEqualArea', rotate: [-90, -90] }
	}
];
