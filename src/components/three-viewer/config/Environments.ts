export interface ThreeEnvironment {
	id: string
	name: string
	path: string
	format: string
}

export const ThreeEnvironments: ThreeEnvironment[] = [
	{
		id: '',
		name: 'None',
		path: '',
		format: '.hdr'
	},
	{
		id: 'venice_sunset_1k',
		name: 'Venice Sunset 1K',
		path: 'environments/venice_sunset_1k.hdr',
		format: '.hdr'
	},
	{
		id: 'footprint_court_2k',
		name: 'Footprint Court 2K',
		path: 'environments/footprint_court_2k.hdr',
		format: '.hdr'
	}
]
