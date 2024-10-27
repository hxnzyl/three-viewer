import { BufferAttribute, Material, Vector2, Vector3 } from 'three'
import { ThreeViewer } from '../core/Viewer'

const EPSILON = 0.0001

export function getBufferAttributePositionFromVector3sArray(vectors: Vector3[]) {
	const l = vectors.length,
		positionArray = new Float32Array(l * 3)
	for (let i = 0; i < l; i++) {
		positionArray[i * 3] = vectors[i].x
		positionArray[i * 3 + 1] = vectors[i].y
		positionArray[i * 3 + 2] = vectors[i].z
	}
	return new BufferAttribute(positionArray, 3)
}

export function getBufferAttributeUvFromVector2sArray(vectors: Vector2[]) {
	const l = vectors.length,
		uvArray = new Float32Array(l * 2)
	for (let i = 0; i < l; i++) {
		uvArray[i * 2] = vectors[i].x
		uvArray[i * 2 + 1] = vectors[i].y
	}
	return new BufferAttribute(uvArray, 2)
}

export function getBufferAttributeIndexFromVector3sArray(vectors: Vector3[]) {
	const t = vectors.length - 2,
		intArray = new Uint32Array(3 * t)
	for (let o = 0, s = 1; s <= t; s++) {
		intArray[o++] = 0
		intArray[o++] = s
		intArray[o++] = s + 1
	}
	return new BufferAttribute(intArray, 1)
}

export function vector3sToArray(vectors: Vector3[]) {
	const l = vectors.length,
		array = []
	for (let o = 0; o < l; o++) {
		var s = vectors[o]
		array.push(s.x, s.y, s.z)
	}
	return array
}

export function materialToArray<T = Material>(materials: Material | Material[]): T[] {
	return Array.isArray(materials) ? (materials as T[]) : [materials as T]
}

export function areVector3Close(vector1: Vector3, vector2: Vector3, epsilon = EPSILON) {
	return (
		Math.abs(vector1.x - vector2.x) < epsilon &&
		Math.abs(vector1.y - vector2.y) < epsilon &&
		Math.abs(vector1.z - vector2.z) < epsilon
	)
}

export function addMouseEventListener(
	viewer: ThreeViewer,
	dom: HTMLElement,
	click?: false | ((event: MouseEvent, from: 'down' | 'up' | 'click') => void | boolean),
	move?: false | ((event: MouseEvent) => void),
	drag?: boolean
) {
	let mouseDownActive = false
	viewer.listener.push(
		dom,
		'mousedown',
		function down(downEvent: MouseEvent) {
			if (mouseDownActive) return
			mouseDownActive = true
			if (!click) return
			const draggable = move && drag && click(downEvent, 'down')
			viewer.activate()
			draggable && dom.addEventListener('mousemove', move, false)
			window.addEventListener(
				'mouseup',
				function up(upEvent: MouseEvent) {
					if (!mouseDownActive) return
					draggable && dom.removeEventListener('mousemove', move)
					window.removeEventListener('mouseup', up)
					if (downEvent.offsetX == upEvent.offsetX && downEvent.offsetY == upEvent.offsetY) {
						// no move
						click(downEvent, 'click')
					} else {
						// moved
						draggable && click(upEvent, 'up')
					}
					mouseDownActive = false
				},
				false
			)
		},
		false
	)
	if (move && !drag) {
		viewer.listener.push(
			dom,
			'mousemove',
			function (moveEvent: MouseEvent) {
				mouseDownActive || move(moveEvent)
			},
			false
		)
	}
}
