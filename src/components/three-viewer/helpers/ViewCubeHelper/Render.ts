import { Camera, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three'
import { ThreeViewCubeDataHelper } from './Data'

class ThreeViewCubeRenderHelper {
	domElement: HTMLElement

	private threeCubeData: ThreeViewCubeDataHelper
	private camera: OrthographicCamera
	private renderer: WebGLRenderer
	private cameraTarget: Vector3
	private activeScene?: Scene

	constructor(domElement: HTMLElement, cubeData: ThreeViewCubeDataHelper) {
		this.domElement = domElement
		this.threeCubeData = cubeData
		this.camera = new OrthographicCamera(-110, 110, 110, -110, 0.01, 500)
		this.camera.position.set(0, 0, 200)
		this.renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
		this.domElement.appendChild(this.renderer.domElement)
		const style = this.domElement.style,
			width = this.domElement.offsetWidth || parseFloat(style.width.replace('px', '')),
			height = this.domElement.offsetHeight || parseFloat(style.height.replace('px', ''))
		this.renderer.setSize(width, height)
		this.cameraTarget = new Vector3(0, 0, 0)
	}

	getActiveCamera() {
		return this.camera
	}

	setActiveScene(scene: Scene) {
		this.activeScene = scene
	}

	render(camera?: Camera) {
		if (camera) {
			this.camera.position.copy(new Vector3(0, 0, 200).applyQuaternion(camera.quaternion))
			this.camera.up.copy(camera.up)
			this.camera.lookAt(this.cameraTarget)
			this.camera.updateMatrixWorld()
		}
		this.renderer.autoClear = true
		this.renderer.render(this.activeScene || this.threeCubeData.getScene(), this.camera)
	}

	dispose() {
		if (this.renderer) {
			this.renderer.dispose()
			this.domElement.removeChild(this.renderer.domElement)
			this.renderer = null as any
		}
	}
}

export { ThreeViewCubeRenderHelper }
