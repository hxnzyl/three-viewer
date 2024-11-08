import { OrthographicCamera, Raycaster, Vector2 } from 'three'
import { ThreeRotateAnimate } from '../../animates/RotateAnimate'
import { ThreeViewer } from '../../core/Viewer'
import ThreeEventUtils from '../../utils/Event'
import { ThreeViewCubeDataHelper } from './Data'
import { ThreeViewCubeDirectionMap } from './DirectionMap'

class ThreeViewCubeEditorHelper {
	domElement: HTMLElement
	private cubeData: ThreeViewCubeDataHelper
	private camera: OrthographicCamera
	private viewer: ThreeViewer
	private raycaster: Raycaster
	private componentId: string = ''
	private rotateAnimate: ThreeRotateAnimate

	constructor(
		domElement: HTMLElement,
		cubeData: ThreeViewCubeDataHelper,
		camera: OrthographicCamera,
		viewer: ThreeViewer
	) {
		this.domElement = domElement
		this.cubeData = cubeData
		this.camera = camera
		this.viewer = viewer
		this.raycaster = new Raycaster()
		this.rotateAnimate = new ThreeRotateAnimate()
		ThreeEventUtils.addMouse({
			viewer,
			dom: domElement,
			stop: true,
			// click of rotate
			click: (event: MouseEvent) => {
				const componentId = this.getComponentId(this.canvasToNormalized(event.offsetX, event.offsetY))
				if (componentId && this.componentId) {
					this.cubeData.getComponent(this.componentId)?.cancelHighlight()
					this.componentId = ''
					this.rotateAnimate.options.rotateId = ThreeViewCubeDirectionMap[componentId]
					this.viewer.animator.pauseAll(true).animate(this.rotateAnimate)
				}
			},
			// move of capture
			move: (event: MouseEvent) => {
				const newComponentId = this.getComponentId(this.canvasToNormalized(event.offsetX, event.offsetY)),
					oldComponentId = this.componentId,
					changed = newComponentId != oldComponentId
				if (!newComponentId) {
					this.componentId = ''
				} else if (changed) {
					this.cubeData.getComponent(newComponentId)?.highlight()
					this.componentId = newComponentId
				}
				if (oldComponentId && changed) {
					this.cubeData.getComponent(oldComponentId)?.cancelHighlight()
				}
			}
		})
	}

	canvasToNormalized(x: number, y: number) {
		const t = this.domElement.offsetWidth,
			i = this.domElement.offsetHeight
		return new Vector2((x / t) * 2 - 1, (-y / i) * 2 + 1)
	}

	getComponentId(vector: Vector2) {
		this.raycaster.setFromCamera(vector, this.camera)
		const meshes = this.cubeData.getMeshes(),
			objects = this.raycaster.intersectObjects(meshes, true),
			l = objects.length
		if (l > 0) {
			// @ts-ignore
			let s: string = objects[0].object.componentId
			if (l > 1) {
				// @ts-ignore
				const n: string = objects[1].object.componentId
				if (4 == s.length && 2 == n.length && objects[1].distance < objects[0].distance + 5) {
					s = n
				}
			}
			return s
		}
		return ''
	}

	dispose() {
		this.domElement = null as any
		this.cubeData = null as any
	}
}

export { ThreeViewCubeEditorHelper }
