import { ColorRepresentation, GridHelper, Group } from 'three'

import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import { extend } from '../../utils/extend'

class ThreeGridHelper extends ThreePlugin {
	static Options: ThreeGridHelperOptions = {
		size: 200,
		divisions: 10,
		colorGrid: 0x999999,
		colorCenterLine: 0xcccccc
	}

	name = 'Helpers.Grid'
	options = {} as Required<ThreeGridHelperOptions>
	private gridHelper?: Group

	// @overwrite
	constructor(options?: ThreeGridHelperOptions) {
		super()
		this.setOptions(options)
	}

	// @overwrite
	initialize(viewer: ThreeViewer) {
		this.viewer = viewer
	}

	// @overwrite
	setOptions(options?: ThreeGridHelperOptions) {
		this.options = extend(true, {}, ThreeGridHelper.Options, options || {})
	}

	// @overwrite
	update() {
		this.hide()
		const { size, divisions, colorGrid, colorCenterLine } = this.options
		this.gridHelper = new Group()
		this.gridHelper.add(new GridHelper(size, divisions * 5, colorCenterLine, colorCenterLine))
		this.gridHelper.add(new GridHelper(size, divisions, colorGrid, colorGrid))
		this.gridHelper.position.set(0, 0, -1)
		this.show()
	}

	// @overwrite
	show() {
		if (this.gridHelper) {
			this.viewer.scene.add(this.gridHelper)
		}
	}

	// @overwrite
	hide() {
		if (this.gridHelper) {
			this.viewer.scene.remove(this.gridHelper)
		}
	}

	// @overwrite
	onResize() {}

	// @overwrite
	dispose() {
		if (this.gridHelper) {
			this.hide()
			this.gridHelper.clear()
			this.gridHelper = undefined
		}
	}
}

export interface ThreeGridHelperOptions {
	size?: number
	divisions?: number
	colorCenterLine?: ColorRepresentation
	colorGrid?: ColorRepresentation
}

export { ThreeGridHelper }

