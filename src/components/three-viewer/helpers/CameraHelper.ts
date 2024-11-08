import { CameraHelper, PerspectiveCamera } from 'three'

import { ThreePlugin } from '../core/Plugin'
import { ThreeViewer } from '../core/Viewer'
import { extend } from '../utils/extend'

class ThreeCameraHelper extends ThreePlugin {
	static Options: ThreeCameraHelperOptions = {}

	name = 'Helpers.Grid'
	options = {} as Required<ThreeCameraHelperOptions>

	private cameraHelper!: CameraHelper
	private camera!: PerspectiveCamera

	// @overwrite
	constructor(options?: ThreeCameraHelperOptions) {
		super()
		this.setOptions(options)
	}

	// @overwrite
	initialize(viewer: ThreeViewer) {
		if (this.viewer) return
		this.viewer = viewer

		const { width, height, options } = this.viewer
		const { fov, near, far } = options
		this.camera = new PerspectiveCamera(fov, width / height, near, far)
		this.cameraHelper = new CameraHelper(this.camera)
	}

	// @overwrite
	setOptions(options?: ThreeCameraHelperOptions) {
		this.options = extend(true, {}, ThreeCameraHelper.Options, options || {})
	}

	// @overwrite
	render() {
		this.cameraHelper?.update()
	}

	// @overwrite
	update() {
		if (!this.viewer) return
		const { camera, controls } = this.viewer
		this.camera.position.copy(camera.position)
		this.camera.up.copy(camera.up)
		this.camera.quaternion.copy(camera.quaternion)
		this.camera.lookAt(controls.target)
		this.camera.updateProjectionMatrix()
		this.show()
	}

	// @overwrite
	show() {
		if (this.viewer) {
			this.viewer.scene.add(this.cameraHelper)
		}
	}

	// @overwrite
	hide() {
		if (this.viewer) {
			this.viewer.scene.remove(this.cameraHelper)
		}
	}

	// @overwrite
	resize() {}

	// @overwrite
	dispose() {
		if (this.viewer) {
			this.hide()
			this.cameraHelper.dispose()
			this.viewer = undefined
		}
	}
}

export interface ThreeCameraHelperOptions {}

export { ThreeCameraHelper }
