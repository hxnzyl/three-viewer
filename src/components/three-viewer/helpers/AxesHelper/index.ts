import { AxesHelper } from 'three'
import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import { extend } from '../../utils/extend'

class ThreeAxesHelper extends ThreePlugin {
	static Options: ThreeAxesHelperOptions = {
		// domElement: undefined,
		visibility: 'hidden'
	}

	name = 'Helpers.Axes'
	options = {} as Required<ThreeAxesHelperOptions>
	helper!: AxesHelper

	// @overwrite
	constructor(options?: ThreeAxesHelperOptions) {
		super()
		this.setOptions(options)
	}

	// @overwrite
	initialize(viewer: ThreeViewer) {
		if (this.viewer) return
		this.viewer = viewer
		this.helper = new AxesHelper()
		this.helper.renderOrder = 999
		this.helper.onBeforeRender = (renderer) => renderer.clearDepth()
	}

	// @overwrite
	setOptions(options?: ThreeAxesHelperOptions) {
		this.options = extend(true, {}, ThreeAxesHelper.Options, options || {})
	}

	// @overwrite
	render() {}

	// @overwrite
	update() {
		this.hide()
		const { x, y, z } = this.viewer.objectSize
		this.helper.scale.set(x, y, z)
		this.show()
	}

	// @overwrite
	show() {
		this.viewer.scene.add(this.helper)
	}

	// @overwrite
	hide() {
		this.viewer.scene.remove(this.helper)
	}

	// @overwrite
	onResize() {}

	// @overwrite
	dispose() {
		if (!this.helper) return
		this.helper.dispose()
		this.helper = null as any
	}
}

export interface ThreeAxesHelperOptions {
	domElement?: HTMLElement
	visibility?: 'hidden' | 'visible'
}

export { ThreeAxesHelper }
