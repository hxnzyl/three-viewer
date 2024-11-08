import { ThreeRotateIdAnimate } from '@/components/three-viewer/animates/RotateAnimateMap'

export const ThreeViewCubeDirectionMap: { [key: string]: ThreeRotateIdAnimate } = {
	// 6 faces
	'2673': 'Top',
	'4015': 'Bottom',
	'0231': 'Front',
	'5764': 'Back',
	'1375': 'Right',
	'4620': 'Left',
	// top corner
	'3': 'RoofSouthEast',
	'2': 'RoofSouthWest',
	'7': 'RoofNorthEast',
	'6': 'RoofNorthWest',
	// bottom corner
	'1': 'BottomSouthEast',
	'0': 'BottomSouthWest',
	'4': 'BottomNorthWest',
	'5': 'BottomNorthEast',
	// top line
	'32': 'RoofFront',
	'76': 'RoofBack',
	'37': 'RoofRight',
	'26': 'RoofLeft',
	// bottom line
	'01': 'BottomFront',
	'45': 'BottomBack',
	'15': 'BottomRight',
	'04': 'BottomLeft',
	// middle line
	'13': 'SouthEast',
	'20': 'SouthWest',
	'57': 'NorthEast',
	'64': 'NorthWest'
}
