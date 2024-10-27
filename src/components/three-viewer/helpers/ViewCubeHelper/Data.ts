import { Scene, TextureLoader, Vector3 } from 'three'
import { ThreeViewCubeHelperColors } from '.'
import { ThreeViewCubeArrowHelper } from './Arrow'
import { ThreeViewCubeCornerHelper } from './Corner'
import { ThreeViewCubeDirectionMap } from './data/DirectionMap'
import { ThreeViewCubeEdgeHelper } from './Edge'
import { ThreeViewCubeFaceHelper } from './Face'
import { ThreeViewCubeMeshHelper } from './Mesh'

class ThreeViewCubeDataHelper {
	private scene: Scene
	private colors: ThreeViewCubeHelperColors
	private length: number = 100
	private vertices: Vector3[] = []
	private vertexIds: string[] = []
	private edgeIndices: number[][] = []
	private edgeIds: string[] = []
	private faceIndices: number[][] = []
	private faceIds: string[] = []
	private componentList: ThreeViewCubeMeshHelper[] = []

	constructor(colors: ThreeViewCubeHelperColors) {
		var e = this.length
		this.vertices.push(new Vector3(-e / 2, -e / 2, e / 2))
		this.vertices.push(new Vector3(e / 2, -e / 2, e / 2))
		this.vertices.push(new Vector3(-e / 2, e / 2, e / 2))
		this.vertices.push(new Vector3(e / 2, e / 2, e / 2))
		this.vertices.push(new Vector3(-e / 2, -e / 2, -e / 2))
		this.vertices.push(new Vector3(e / 2, -e / 2, -e / 2))
		this.vertices.push(new Vector3(-e / 2, e / 2, -e / 2))
		this.vertices.push(new Vector3(e / 2, e / 2, -e / 2))
		for (var t = 0; t < 8; t++) {
			this.vertexIds.push(t + '')
			this.edgeIndices.push([0, 1], [1, 3], [3, 2], [2, 0])
			this.edgeIndices.push([0, 4], [1, 5], [2, 6], [3, 7])
			this.edgeIndices.push([4, 5], [5, 7], [7, 6], [6, 4])
		}
		for (t = 0; t < 12; t++) {
			var i = this.edgeIndices[t]
			this.edgeIds.push(i[0] + '' + i[1])
		}
		this.faceIndices.push([0, 2, 3, 1])
		this.faceIndices.push([4, 0, 1, 5])
		this.faceIndices.push([4, 6, 2, 0])
		this.faceIndices.push([2, 6, 7, 3])
		this.faceIndices.push([1, 3, 7, 5])
		this.faceIndices.push([5, 7, 6, 4])
		for (t = 0; t < 6; t++) {
			var o = this.faceIndices[t]
			this.faceIds.push(o[0] + '' + o[1] + o[2] + o[3])
		}
		this.scene = new Scene()
		this.colors = colors
		this.buildEdges()
		this.buildCorners()
		this.buildFaces()
		// this.buildArrows()
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
			.load('helpers/ViewCube/' + ThreeViewCubeDirectionMap[faceId] + '.png', (texture) => {
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
		var t = this.length + 10,
			e = [
				new Vector3(-t / 2, -t / 2, t / 2),
				new Vector3(t / 2, -t / 2, t / 2),
				new Vector3(-t / 2, -t / 2, -t / 2),
				new Vector3(-t / 2, t / 2, t / 2)
			],
			o = [
				[0, 1],
				[0, 2],
				[0, 3]
			],
			n = ['X', 'Y', 'Z']
		for (var i = 0; i < 3; i++) {
			const arrow = new ThreeViewCubeArrowHelper(e, o[i], n[i], this.colors)
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
		for (var e = [], t = this.scene.children, i = 0; i < t.length; i++) {
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
