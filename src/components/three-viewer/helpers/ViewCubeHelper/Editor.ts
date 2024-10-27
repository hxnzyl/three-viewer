import { Raycaster, Vector2, Vector3 } from 'three'
import { ThreeViewer } from '../../core/Viewer'
import { addMouseEventListener } from '../../utils/three'
import { ThreeViewCubeDataHelper } from './Data'
import { ThreeViewCubeDirectionMap } from './data/DirectionMap'
import { ThreeViewCubeRotateToMap } from './data/RotateToMap'
import { ThreeViewCubeRenderHelper } from './Render'

class ThreeViewCubeEditorHelper {
	domElement: HTMLElement
	private cubeData: ThreeViewCubeDataHelper
	private cubeRender: ThreeViewCubeRenderHelper
	private viewer: ThreeViewer
	private raycaster: Raycaster
	private componentId: string = ''

	constructor(
		domElement: HTMLElement,
		cubeData: ThreeViewCubeDataHelper,
		cubeRender: ThreeViewCubeRenderHelper,
		viewer: ThreeViewer
	) {
		this.domElement = domElement
		this.cubeData = cubeData
		this.cubeRender = cubeRender
		this.viewer = viewer
		this.raycaster = new Raycaster()
		addMouseEventListener(
			viewer,
			domElement,
			(event: MouseEvent) => {
				const componentId = this.getComponentId(this.canvasToNormalized(event.offsetX, event.offsetY))
				if (componentId) {
					if (this.componentId) {
						this.cubeData.getComponent(this.componentId)?.cancelHighlight()
						this.componentId = ''
					}
					const rotate = ThreeViewCubeRotateToMap[ThreeViewCubeDirectionMap[componentId]]
					this.viewer.animate(new Vector3(...rotate[0]), new Vector3(...rotate[1]))
				}
			},
			(event: MouseEvent) => {
				const newComponentId = this.getComponentId(this.canvasToNormalized(event.offsetX, event.offsetY)),
					oldComponentId = this.componentId
				if (!newComponentId) {
					this.componentId = ''
				} else if (newComponentId != oldComponentId) {
					this.cubeData.getComponent(newComponentId)?.highlight()
					this.componentId = newComponentId
				}
				if (oldComponentId && newComponentId != oldComponentId) {
					this.cubeData.getComponent(oldComponentId)?.cancelHighlight()
				}
			}
		)
	}

	canvasToNormalized(x: number, y: number) {
		const t = this.domElement.offsetWidth,
			i = this.domElement.offsetHeight
		return new Vector2((x / t) * 2 - 1, (-y / i) * 2 + 1)
	}

	getComponentId(vector: Vector2) {
		const camera = this.cubeRender.getActiveCamera()
		this.raycaster.setFromCamera(vector, camera)
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
		this.cubeRender = null as any
	}
}

export { ThreeViewCubeEditorHelper }
