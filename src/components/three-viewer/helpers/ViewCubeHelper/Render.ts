import { Camera, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three'

class ThreeViewCubeRenderHelper {
	domElement: HTMLElement

	private scene: Scene
	private camera: OrthographicCamera
	private renderer: WebGLRenderer
	private cameraTarget: Vector3

	constructor(domElement: HTMLElement, scene: Scene) {
		this.domElement = domElement
		this.scene = scene
		this.camera = new OrthographicCamera(-110, 110, 110, -110, 0.01, 500)
		this.camera.position.set(0, 0, 200)
		this.renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
		const style = this.domElement.style,
			width = this.domElement.offsetWidth || parseFloat(style.width.replace('px', '')),
			height = this.domElement.offsetHeight || parseFloat(style.height.replace('px', ''))
		this.renderer.setSize(width, height)
		this.cameraTarget = new Vector3(0, 0, 0)
		this.domElement.appendChild(this.renderer.domElement)
	}

	getCamera() {
		return this.camera
	}

	render(camera?: Camera) {
		if (camera) {
			this.camera.position.copy(new Vector3(0, 0, 200).applyQuaternion(camera.quaternion))
			this.camera.up.copy(camera.up)
			this.camera.lookAt(this.cameraTarget)
			this.camera.updateMatrixWorld()
		}
		this.renderer.autoClear = true
		this.renderer.render(this.scene, this.camera)
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
