import { BufferAttribute, Vector2, Vector3 } from 'three'

class ThreeVectorUtils {
	static EPSILON_3 = 0.0001
	static EPSILON_2 = 1

	static createBufferAttribute3(vectors: Vector3[]) {
		const l = vectors.length,
			positionArray = new Float32Array(l * 3)
		for (let i = 0; i < l; i++) {
			positionArray[i * 3] = vectors[i].x
			positionArray[i * 3 + 1] = vectors[i].y
			positionArray[i * 3 + 2] = vectors[i].z
		}
		return new BufferAttribute(positionArray, 3)
	}

	static createBufferAttribute2(vectors: Vector2[]) {
		const l = vectors.length,
			uvArray = new Float32Array(l * 2)
		for (let i = 0; i < l; i++) {
			uvArray[i * 2] = vectors[i].x
			uvArray[i * 2 + 1] = vectors[i].y
		}
		return new BufferAttribute(uvArray, 2)
	}

	static createBufferAttributeIndex(vectors: Vector3[]) {
		const t = vectors.length - 2,
			intArray = new Uint32Array(3 * t)
		for (let o = 0, s = 1; s <= t; s++) {
			intArray[o++] = 0
			intArray[o++] = s
			intArray[o++] = s + 1
		}
		return new BufferAttribute(intArray, 1)
	}

	static vector3sToArray(vectors: Vector3[]) {
		const l = vectors.length,
			array = []
		for (let o = 0; o < l; o++) {
			const s = vectors[o]
			array.push(s.x, s.y, s.z)
		}
		return array
	}

	static areExpand2Close(x1: number, y1: number, x2: number, y2: number, epsilon = ThreeVectorUtils.EPSILON_2) {
		return Math.abs(x1 - x2) < epsilon && Math.abs(y1 - y2) < epsilon
	}

	static areVector2Close(vector1: Vector2, vector2: Vector2, epsilon = ThreeVectorUtils.EPSILON_2) {
		return ThreeVectorUtils.areExpand2Close(vector1.x, vector1.y, vector2.x, vector2.y, epsilon)
	}

	static areExpand3Close(
		x1: number,
		y1: number,
		z1: number,
		x2: number,
		y2: number,
		z2: number,
		epsilon = ThreeVectorUtils.EPSILON_3
	) {
		return Math.abs(x1 - x2) < epsilon && Math.abs(y1 - y2) < epsilon && Math.abs(z1 - z2) < epsilon
	}

	static areVector3Close(vector1: Vector3, vector2: Vector3, epsilon = ThreeVectorUtils.EPSILON_3) {
		return ThreeVectorUtils.areExpand3Close(vector1.x, vector1.y, vector1.z, vector2.x, vector2.y, vector2.z, epsilon)
	}
}

export default ThreeVectorUtils
