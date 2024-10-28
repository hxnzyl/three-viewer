import { AxesHelper } from 'three'
import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import { extend } from '../../utils/extend'
import ThreeMaterialUtils from '../../utils/Material'

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

		// scale to object size
		const { x, y, z } = this.viewer.objectSize
		this.helper.scale.set(x, y, z)

		// create X text
		const xTextMesh = ThreeMaterialUtils.createTextMaterial('X', 64, 64, '32px sans-serif', 'red')
		xTextMesh.position.set(1, 0, 0)
		xTextMesh.scale.set(1 / x, 1 / y, 1 / z)
		this.helper.add(xTextMesh)

		// create Y text
		const yTextMesh = ThreeMaterialUtils.createTextMaterial('Y', 64, 64, '32px sans-serif', 'green')
		yTextMesh.rotation.z = Math.PI / 2
		yTextMesh.position.set(0, 1, 0)
		yTextMesh.scale.set(1 / x, 1 / y, 1 / z)
		this.helper.add(yTextMesh)

		// create Z text
		const zTextMesh = ThreeMaterialUtils.createTextMaterial('Z', 64, 64, '32px sans-serif', 'blue')
		zTextMesh.rotation.x = -Math.PI / 2
		zTextMesh.position.set(0, 0, 1)
		zTextMesh.scale.set(1 / x, 1 / y, 1 / z)
		this.helper.add(zTextMesh)

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
