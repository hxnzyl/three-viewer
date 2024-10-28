import { GreaterDepth, Sprite, SpriteMaterial, Vector3 } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { ThreeViewCubeHelperColors } from '.'
import ThreeMaterialUtils from '../../utils/Material'
import ThreeVectorUtils from '../../utils/Vector'
import { ThreeViewCubeMeshHelper } from './Mesh'

class ThreeViewCubeArrowHelper extends ThreeViewCubeMeshHelper {
	private vertices: Vector3[]
	private indices: number[]
	width: number
	wireframeMeshBack!: Line2
	textMesh!: Sprite
	textMeshBack!: Sprite

	constructor(vertices: Vector3[], indices: number[], componentId: string, colors: ThreeViewCubeHelperColors) {
		super()
		this.colors = { ...colors } as Required<ThreeViewCubeHelperColors>
		this.width = 0
		this.vertices = vertices
		this.indices = indices
		this.componentId = componentId
		this.build()
	}

	build() {
		var e = this.indices[0],
			t = this.indices[1],
			i = this.vertices[e],
			n = this.vertices[t],
			o = i.clone().add(n).multiplyScalar(0.5).clone().multiplyScalar(-1),
			s = o.clone().normalize(),
			a = n.clone().sub(i).normalize(),
			l = i.clone(),
			h = i.clone().add(a.clone().multiplyScalar(105)),
			d = []
		if (0 !== o.x) {
			var c = o.x > 0 ? this.width : -this.width
			d.push(new Vector3().setX(c).add(s))
		}
		if (0 !== o.y) {
			var u = o.y > 0 ? this.width : -this.width
			d.push(new Vector3().setY(u).add(s))
		}
		if (0 !== o.z) {
			var g = o.z > 0 ? this.width : -this.width
			d.push(new Vector3().setZ(g).add(s))
		}
		if (2 === d.length) {
			this.mesh = this.createMesh([
				l.clone().add(s),
				l.clone().add(d[0]),
				h.clone().add(d[0]),
				h.clone().add(s),
				h.clone().add(d[1]),
				l.clone().add(d[1])
			])
			this.transparent(this.mesh)
			this.wireframeMesh = this.createWireframe([l, h])
		}
		var p = i.clone().add(a.clone().multiplyScalar('Z' == this.componentId ? 125 : 120))
		this.createTextWireframe(p)
		// this.hide()
	}

	createWireframe(vectors: Vector3[]) {
		const geometry = new LineGeometry(),
			color = this.componentId == 'X' ? 0xff0000 : this.componentId == 'Y' ? 0x00ff00 : 0x0000ff
		geometry.setPositions(ThreeVectorUtils.vector3sToArray(vectors))
		// create return mesh
		const returnMaterial = new LineMaterial({
			color,
			linewidth: 2
		})
		returnMaterial.resolution.set(160, 160)
		const returnMesh = new Line2(geometry, returnMaterial)
		// @ts-ignore
		returnMesh.componentId = this.componentId
		// create mesh back
		const meshMaterial = new LineMaterial({
			color,
			linewidth: 2,
			depthTest: true,
			transparent: true,
			opacity: 0.3,
			depthFunc: GreaterDepth
		})
		meshMaterial.resolution.set(160, 160)
		this.wireframeMeshBack = new Line2(geometry, meshMaterial)
		return returnMesh
	}

	createTextWireframe(vector: Vector3) {
		// create text mesh
		this.textMesh = ThreeMaterialUtils.createTextMaterial(
			this.componentId,
			64,
			64,
			'32px sans-serif',
			this.componentId == 'X' ? 'red' : this.componentId == 'Y' ? 'green' : 'blue'
		)
		this.textMesh.position.set(vector.x, vector.y, vector.z)
		this.textMesh.scale.set(45, 45, 45)
		// create text mesh back
		const textMeshBackMaterial = new SpriteMaterial({
			map: this.textMesh.material.map,
			transparent: true,
			opacity: 0.3,
			depthFunc: GreaterDepth
		})
		const textMeshBack = new Sprite(textMeshBackMaterial)
		textMeshBack.position.set(vector.x, vector.y, vector.z)
		textMeshBack.scale.set(45, 45, 45)
		textMeshBack.renderOrder = 100
		this.textMeshBack = textMeshBack
	}

	show() {
		this.mesh.visible = true
		this.wireframeMesh.visible = true
		this.wireframeMeshBack.visible = true
		this.textMesh.visible = true
		this.textMeshBack.visible = true
	}

	hide() {
		this.mesh.visible = false
		this.wireframeMesh.visible = false
		this.wireframeMeshBack.visible = false
		this.textMesh.visible = false
		this.textMeshBack.visible = false
	}

	getWireframeMeshBack() {
		return this.wireframeMeshBack
	}

	getTextMesh() {
		return this.textMesh
	}

	getTextMeshBack() {
		return this.textMeshBack
	}
}

export { ThreeViewCubeArrowHelper }
