import { Box3, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, Texture, Vector2, Vector3 } from 'three'
import { ThreeViewCubeHelperColors } from '.'
import ThreeVectorUtils from '../../utils/Vector'
import { ThreeViewCubeMeshHelper } from './Mesh'

class ThreeViewCubeFaceHelper extends ThreeViewCubeMeshHelper {
	private length: number
	private vertices: Vector3[]
	private indices: number[]
	private vertexUvs: Vector2[]
	private texture: Texture
	private highlightMesh!: Mesh<BufferGeometry, MeshBasicMaterial>

	constructor(
		vertices: Vector3[],
		indices: number[],
		componentId: string,
		texture: Texture,
		colors: ThreeViewCubeHelperColors
	) {
		super()
		this.length = 60
		this.vertices = vertices
		this.indices = indices
		this.colors = colors as Required<ThreeViewCubeHelperColors>
		this.componentId = componentId
		this.texture = texture
		this.vertexUvs = [
			new Vector2(0, 0.2),
			new Vector2(0, 0.8),
			new Vector2(0.2, 1),
			new Vector2(0.8, 1),
			new Vector2(1, 0.8),
			new Vector2(1, 0.2),
			new Vector2(0.8, 0),
			new Vector2(0.2, 0)
		]
		this.build()
	}

	build() {
		const textVectors: Vector3[] = []
		for (let o = 0, s = this.indices.length; o < s; o++) {
			const n = this.indices[o],
				r = this.indices[o + 1],
				t = this.vertices[n],
				i = o === s - 1 ? this.vertices[this.indices[0]] : this.vertices[r],
				a = i.clone().sub(t).normalize(),
				l = t.clone().add(i).multiplyScalar(0.5),
				m = a.clone().multiplyScalar(this.length / 2)
			textVectors.push(l.clone().sub(m))
			textVectors.push(l.clone().add(m))
		}
		this.createTextureMesh(textVectors)

		const box3 = new Box3()
		for (let g = 0, n = this.indices.length; g < n; g++) {
			const c = this.indices[g]
			box3.expandByPoint(this.vertices[c])
		}

		const meshVectors: Vector3[] = [],
			center = box3.getCenter(new Vector3()).normalize()
		for (let p = 0, m = textVectors.length; p < m; p++) {
			meshVectors.push(textVectors[p].clone().add(center))
		}

		this.highlightMesh = this.createMesh(meshVectors)
		this.highlightMesh.visible = false
		// @ts-ignore
		this.highlightMesh.isHighlightMesh = true

		meshVectors.push(meshVectors[0])
		this.wireframeMesh = this.createWireframe(meshVectors)
	}

	highlight() {
		const h = this.highlightMesh
		if (h) {
			h.visible = true
			const hm = h.material
			hm.transparent = true
			hm.color.set(this.colors.faceHighlightColor)
			hm.opacity = this.colors.faceHighlightOpacity
		}
		const w = this.wireframeMesh
		if (w) {
			const wm = w.material
			wm.color.set(this.colors.wireframeHighlightColor)
			wm.opacity = this.colors.wireframeHighlightOpacity
		}
	}

	cancelHighlight() {
		const h = this.highlightMesh
		if (h) {
			h.visible = false
		}
		const w = this.wireframeMesh
		if (w) {
			const m = w.material
			m.color.set(this.colors.wireframeDefaultColor)
			m.opacity = this.colors.wireframeDefaultOpacity
		}
	}

	createTextureMesh(vectors: Vector3[]) {
		const geometry = new BufferGeometry(),
			material = new MeshBasicMaterial({ map: this.texture, side: DoubleSide, transparent: false })

		geometry.setAttribute('position', ThreeVectorUtils.createBufferAttribute3(vectors))
		geometry.setAttribute('uv', ThreeVectorUtils.createBufferAttribute2(this.vertexUvs))
		geometry.setIndex(ThreeVectorUtils.createBufferAttributeIndex(vectors))

		this.mesh = new Mesh<BufferGeometry, MeshBasicMaterial>(geometry, material)
		// @ts-ignore
		this.mesh.componentId = this.componentId
	}

	getHighlightMesh() {
		return this.highlightMesh
	}

	buildVertexUvs(vectors: Vector3[]) {
		const s2 = [],
			box3 = new Box3().setFromPoints(vectors),
			min3 = box3.min,
			s3 = new Vector3()
		box3.getSize(s3)
		const n = 0 == s3.x ? 'x' : 0 == s3.y ? 'y' : 'z'
		for (let i = 0, l = vectors.length; i < l; i++) {
			const a = vectors[i],
				m = (s3.x + s3.y + s3.z) / 2,
				h = a
					.clone()
					.sub(min3)
					.multiplyScalar(1 / m)
			if ('x' == n) {
				s2.push(new Vector2(h.y, h.z))
			} else if ('y' == n) {
				s2.push(new Vector2(h.x, h.z))
			} else {
				s2.push(new Vector2(h.x, h.y))
			}
		}
		return s2
	}
}

export { ThreeViewCubeFaceHelper }
