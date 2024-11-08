import { Scene, TextureLoader, Vector3 } from 'three'
import { ThreeViewCubeHelperColors } from '.'
import { ThreeViewCubeArrowHelper } from './Arrow'
import { ThreeViewCubeCornerHelper } from './Corner'
import { ThreeViewCubeDirectionMap } from './DirectionMap'
import { ThreeViewCubeEdgeHelper } from './Edge'
import { ThreeViewCubeFaceHelper } from './Face'
import { ThreeViewCubeMeshHelper } from './Mesh'

class ThreeViewCubeDataHelper {
	private scene: Scene
	private colors: ThreeViewCubeHelperColors
	private vertices: Vector3[] = [
		new Vector3(-50, -50, 50),
		new Vector3(50, -50, 50),
		new Vector3(-50, 50, 50),
		new Vector3(50, 50, 50),
		new Vector3(-50, -50, -50),
		new Vector3(50, -50, -50),
		new Vector3(-50, 50, -50),
		new Vector3(50, 50, -50)
	]
	private vertexIds: string[] = []
	private edgeIndices: number[][] = [
		[0, 1],
		[1, 3],
		[3, 2],
		[2, 0],
		[0, 4],
		[1, 5],
		[2, 6],
		[3, 7],
		[4, 5],
		[5, 7],
		[7, 6],
		[6, 4]
	]
	private edgeIds: string[] = []
	private faceIndices: number[][] = [
		[0, 2, 3, 1],
		[4, 0, 1, 5],
		[4, 6, 2, 0],
		[2, 6, 7, 3],
		[1, 3, 7, 5],
		[5, 7, 6, 4]
	]
	private faceIds: string[] = []
	private arrowVertices: Vector3[] = [
		new Vector3(-55, -55, 55),
		new Vector3(55, -55, 55),
		new Vector3(-55, -55, -55),
		new Vector3(-55, 55, 55)
	]
	private arrowIndices: number[][] = [
		[0, 1],
		[0, 2],
		[0, 3]
	]
	private componentList: ThreeViewCubeMeshHelper[] = []

	constructor(colors: ThreeViewCubeHelperColors) {
		for (var id = 0; id < 8; id++) {
			this.vertexIds.push(id + '')
		}
		for (id = 0; id < 12; id++) {
			var edge = this.edgeIndices[id]
			this.edgeIds.push(edge[0] + '' + edge[1])
		}
		for (id = 0; id < 6; id++) {
			var face = this.faceIndices[id]
			this.faceIds.push(face[0] + '' + face[1] + face[2] + face[3])
		}
		this.scene = new Scene()
		this.colors = colors
		this.buildEdges()
		this.buildCorners()
		this.buildFaces()
		this.buildArrows()
	}

	buildFaces() {
		for (let i = 0; i < 6; i++) {
			this.buildFace(i)
		}
	}

	buildFace(index: number) {
		const faceId = this.faceIds[index]
		new TextureLoader()
			.setCrossOrigin('anonymous')
			.load('/three-viewer/helpers/ViewCube/' + ThreeViewCubeDirectionMap[faceId] + '.png', (texture) => {
				const face = new ThreeViewCubeFaceHelper(this.vertices, this.faceIndices[index], faceId, texture, this.colors)
				this.componentList.push(face)
				this.scene.add(face.getMesh()).add(face.getWireframe()).add(face.getHighlightMesh())
			})
	}

	buildEdges() {
		for (var e = this.vertices, t = this.edgeIndices, i = this.edgeIds, o = 0; o < 12; o++) {
			var edge = new ThreeViewCubeEdgeHelper(e, t[o], i[o], this.colors)
			this.componentList.push(edge)
			this.scene.add(edge.getMesh()).add(edge.getWireframe()).add(edge.getHighlightWireframeMesh())
		}
	}

	buildCorners() {
		for (var e = this.vertices, t = this.vertexIds, i = 0; i < 8; i++) {
			var corner = new ThreeViewCubeCornerHelper(e[i], t[i], this.colors)
			this.componentList.push(corner)
			this.scene
				.add(corner.getMesh())
				.add(corner.getWireframe())
				.add(corner.getCornerFace())
				.add(corner.getCornerWireframe())
		}
	}

	buildArrows() {
		for (var n = ['X', 'Y', 'Z'], i = 0; i < 3; i++) {
			const arrow = new ThreeViewCubeArrowHelper(this.arrowVertices, this.arrowIndices[i], n[i], this.colors)
			this.componentList.push(arrow)
			this.scene
				.add(arrow.getMesh())
				.add(arrow.getWireframe())
				.add(arrow.getWireframeMeshBack())
				.add(arrow.getTextMesh())
				.add(arrow.getTextMeshBack())
		}
	}

	getComponent(componentId: string) {
		for (var i = 0, l = this.componentList.length; i < l; i++) {
			var comp = this.componentList[i]
			if (comp.getComponentId() === componentId) {
				return comp
			}
		}
	}

	getScene() {
		return this.scene
	}

	getMeshes() {
		for (var e = [], t = this.scene.children, i = 0, l = t.length; i < l; i++) {
			var o = t[i]
			// @ts-ignore
			if ('Mesh' === o.type && true !== o.isHighlightMesh) {
				e.push(o)
			}
		}
		return e
	}

	dispose() {
		// this.scene = null
		this.vertices = []
		this.vertexIds = []
		this.edgeIndices = []
		this.edgeIds = []
		this.faceIndices = []
		this.faceIds = []
		this.componentList = []
	}
}

export { ThreeViewCubeDataHelper }
