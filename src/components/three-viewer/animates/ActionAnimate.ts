import {
	ColorRepresentation,
	Mesh,
	MeshToonMaterial,
	Quaternion,
	TetrahedronGeometry,
	TorusGeometry,
	Vector3
} from 'three'
import { Easing } from 'three/examples/jsm/libs/tween.module'
import { ThreeAnimate, ThreeAnimateOptions } from '../core/Animate'
import { ThreeAnimator } from '../core/Animator'
import { extend } from '../utils/extend'

class ThreeActionAnimate extends ThreeAnimate {
	static Options: ThreeActionAnimateOptions = {
		autoStart: true,
		duration: 1000,
		speed: 0.2,
		easing: Easing.Linear.None,
		indicatorColor: 0x87ceeb
	}

	name = 'Animates.Walk'
	options = {} as Required<ThreeActionAnimateOptions>
	moving = false
	animator!: ThreeAnimator
	characterSize = 1
	indicatorTop!: Mesh
	indicatorBottom!: Mesh
	toQuaternion!: Quaternion

	constructor(options?: ThreeActionAnimateOptions) {
		super()
		this.setOptions(options)
		this.setEvent()
	}

	setOptions(options?: ThreeActionAnimateOptions) {
		this.options = extend(true, {}, ThreeActionAnimate.Options, options || {})
	}

	setEvent() {
		const { events } = this.options
		for (const type in events) {
			this.addEventListener(type, events[type])
		}
	}

	reconcile(animator: ThreeAnimator) {
		this.animator = animator
		this.indicator()
		this.start()
	}

	indicator() {
		if (this.indicatorTop) return

		// Create the top indicator.
		const topSize = this.characterSize / 8
		const topGeometry = new TetrahedronGeometry(topSize, 0)
		const topMaterial = new MeshToonMaterial({ color: 0x00ccff, emissive: 0x00ccff })
		this.indicatorTop = new Mesh(topGeometry, topMaterial)
		this.indicatorTop.position.y = 0.05 // Flat surface so hardcode Y position for now.
		this.indicatorTop.rotation.x = -0.97
		this.indicatorTop.rotation.y = Math.PI / 4
		this.indicatorTop.name = 'ThreeViewer_Indicator_Top'

		// Create the bottom indicator.
		const bottomRadius = this.characterSize / 4
		const bottomGeometry = new TorusGeometry(bottomRadius, bottomRadius * 0.25, 2, 12)
		const bottomMaterial = new MeshToonMaterial({ color: 0x00ccff, emissive: 0x00ccff })
		this.indicatorBottom = new Mesh(bottomGeometry, bottomMaterial)
		this.indicatorBottom.position.y = 0.025
		this.indicatorBottom.rotation.x = -Math.PI / 2
		this.indicatorBottom.name = 'ThreeViewer_Indicator_Bottom'
	}

	start(): void {
		const { object, scene } = this.animator.viewer
		if (!object) return

		const { position } = object
		const { position: toPosition } = this.options

		// 旋转模型到目标点的方向（指定目标点相对于当前目标点的相对角度）
		const direction = new Vector3().subVectors(toPosition, position).normalize()

		// 使用 Quaternion 来设置模型的朝向
		this.toQuaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction)

		// 停止所有用户动画，注意：会回调到this.stop()
		this.animator.pauseAll(true)

		// 加入路标上
		const top = this.indicatorTop.position
		top.x = toPosition.x
		top.z = toPosition.z
		scene.add(this.indicatorTop)

		// 加入路标圈
		const bottom = this.indicatorBottom.position
		bottom.x = toPosition.x
		bottom.z = toPosition.z
		scene.add(this.indicatorBottom)

		// 开始奔跑或走
		const fromX = position.x
		const fromZ = position.z
		const toX = toPosition.x
		const toZ = toPosition.z
		const diffX = Math.abs(fromX - toX)
		const diffZ = Math.abs(fromZ - toZ)
		const distance = Math.sqrt(diffX * diffX + diffZ * diffZ)
		if (distance > 10) {
			this.animator.play('Running', 1)
		} else {
			this.animator.play('Walking', 2)
		}

		this.moving = true
	}

	stop(): void {
		if (this.moving) {
			const { scene } = this.animator.viewer
			this.animator.pauseAll().play('Idle', 2)
			delete this.animator.animates[this.id]
			scene.remove(this.indicatorTop)
			scene.remove(this.indicatorBottom)
			this.moving = false
		}
	}

	update() {
		if (!this.moving) return

		const { position, quaternion } = this.animator.viewer.object!
		const { position: toPosition, speed } = this.options
		const indicator = this.indicatorTop.position

		// Calcuate Distance
		const fromX = position.x
		const fromZ = position.z
		const toX = toPosition.x
		const toZ = toPosition.z
		const diffX = Math.abs(fromX - toX)
		const diffZ = Math.abs(fromZ - toZ)
		const distance = Math.sqrt(diffX * diffX + diffZ * diffZ)

		const multiplierX = fromX > toX ? -1 : 1
		const multiplierZ = fromZ > toZ ? -1 : 1

		// Update position.
		position.x += speed * (diffX / distance) * multiplierX
		position.z += speed * (diffZ / distance) * multiplierZ

		// Update indicator
		indicator.y = indicator.y > 0.1 ? indicator.y - 0.01 : 0.5

		// Smooth steering
		quaternion.rotateTowards(this.toQuaternion, speed)

		// Move Complete
		position.x <= toX + speed &&
			position.x >= toX - speed &&
			position.z <= toZ + speed &&
			position.z >= toZ - speed &&
			this.stop()
	}
}

export interface ThreeActionAnimateOptions extends ThreeAnimateOptions {
	position?: Vector3
	speed?: number
	indicatorColor?: ColorRepresentation
}

export { ThreeActionAnimate }
