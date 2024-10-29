import { AxesHelper } from 'three'
import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import ThreeMaterialUtils from '../../utils/Material'
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
		this.helper.onBeforeRender = (renderer) => renderer.clearDepth()

		// create X text
		const xTextMesh = ThreeMaterialUtils.createTextMaterial('X', 64, 64, '32px sans-serif', 'red')
		xTextMesh.position.set(0.5, 0, 0)
		this.helper.add(xTextMesh)

		// create Y text
		const yTextMesh = ThreeMaterialUtils.createTextMaterial('Y', 64, 64, '32px sans-serif', 'green')
		yTextMesh.rotation.z = Math.PI / 2
		yTextMesh.position.set(0, 0.5, 0)
		this.helper.add(yTextMesh)

		// create Z text
		const zTextMesh = ThreeMaterialUtils.createTextMaterial('Z', 64, 64, '32px sans-serif', 'blue')
		zTextMesh.rotation.x = -Math.PI / 2
		zTextMesh.position.set(0, 0, 0.5)
		this.helper.add(zTextMesh)
	}

	// @overwrite
	setOptions(options?: ThreeAxesHelperOptions) {
		this.options = extend(true, {}, ThreeAxesHelper.Options, options || {})
	}

	// @overwrite
	render() {}

	// @overwrite
	update() {
		const { x, y, z } = this.viewer.objectSize
		const { scale, children } = this.helper
		if (scale.x !== x * 2) {
			this.hide()
			scale.set(x * 2, y * 2, z * 2)
			// keep children scale
			children.forEach((mesh) => mesh.scale.set(0.5 / (x * 2), 0.5 / (y * 2), 0.5 / (z * 2)))
			this.show()
		}
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

