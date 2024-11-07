import {
    ColorRepresentation,
    Mesh,
    MeshToonMaterial,
    Object3D,
    Scene,
    TetrahedronGeometry,
    TorusGeometry,
    Vector3
} from 'three'
import { Easing } from 'three/examples/jsm/libs/tween.module'
import { extend } from '../../utils/extend'
import { ThreeAnimate, ThreeAnimateOptions } from '../Animate'
import { ThreeAnimator } from '../Animator'

class ThreeWalkAnimate extends ThreeAnimate {
	static Options: ThreeWalkAnimateOptions = {
		autoStart: true,
		duration: 1000,
		speed: 0.2,
		easing: Easing.Linear.None,
		indicatorColor: 0x87ceeb
	}

	name = 'Animates.Walk'
	options = {} as Required<ThreeWalkAnimateOptions>
	object?: Object3D
	scene!: Scene
	moving = false
	characterSize = 1
	indicatorTop!: Mesh
	indicatorBottom!: Mesh

	constructor(options?: ThreeWalkAnimateOptions) {
		super()
		this.setOptions(options)
		this.setEvent()
	}

	setOptions(options?: ThreeWalkAnimateOptions) {
		this.options = extend(true, {}, ThreeWalkAnimate.Options, options || {})
	}

	setEvent() {
		// 添加参数中的事件
		const { events } = this.options
		for (const type in events) {
			this.addEventListener(type, events[type])
		}
	}

	reconcile(animator: ThreeAnimator) {
		const { object, scene } = animator.viewer
		const { autoStart } = this.options
		this.scene = scene
		this.object = object
		this.indicator()
		autoStart && this.start(animator)
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
		this.indicatorTop.name = 'ThreeView_Indicator_Top'
		// Create the bottom indicator.
		const bottomRadius = this.characterSize / 4
		const bottomGeometry = new TorusGeometry(bottomRadius, bottomRadius * 0.25, 2, 12)
		const bottomMaterial = new MeshToonMaterial({ color: 0x00ccff, emissive: 0x00ccff })
		this.indicatorBottom = new Mesh(bottomGeometry, bottomMaterial)
		this.indicatorBottom.position.y = 0.025
		this.indicatorBottom.rotation.x = -Math.PI / 2
		this.indicatorBottom.name = 'ThreeView_Indicator_Bottom'
	}

	start(animator?: ThreeAnimator): void {
		if (!this.object) return

		const { position, quaternion } = this.object
		const { position: toPosition } = this.options

		// 旋转模型到目标点的方向(指定目标点相对于当前目标点的相对角度)
		const direction = new Vector3().subVectors(toPosition, position).normalize()
		// 使用Quaternion来设置模型的朝向
		quaternion.setFromUnitVectors(new Vector3(0, 0, 1), direction)

		const top = this.indicatorTop.position
		top.x = toPosition.x
		top.z = toPosition.z
		this.scene.add(this.indicatorTop)

		const bottom = this.indicatorBottom.position
		bottom.x = toPosition.x
		bottom.z = toPosition.z
		this.scene.add(this.indicatorBottom)

		if (animator) {
			// 停止所有用户动画
			animator.pauseAll(true)
			// 开始奔跑或走
			const fromX = position.x
			const fromZ = position.z
			const toX = toPosition.x
			const toZ = toPosition.z
			const diffX = Math.abs(fromX - toX)
			const diffZ = Math.abs(fromZ - toZ)
			const distance = Math.sqrt(diffX * diffX + diffZ * diffZ)
			if (distance > 10) {
				animator.play('Running', 1)
			} else {
				animator.play('Walking', 2)
			}
		}

		this.moving = true
	}

	stop(animator?: ThreeAnimator): void {
		if (this.moving) {
			animator?.pauseAll().play('Idle', 2)
			this.scene.remove(this.indicatorTop)
			this.scene.remove(this.indicatorBottom)
			this.moving = false
			this.object = undefined
		}
	}

	update(animator?: ThreeAnimator) {
		if (!this.object || !this.moving) return

		const { position } = this.object
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

		// Move Complete
		position.x <= toX + speed &&
			position.x >= toX - speed &&
			position.z <= toZ + speed &&
			position.z >= toZ - speed &&
			this.stop(animator)
	}
}

export interface ThreeWalkAnimateOptions extends ThreeAnimateOptions {
	position?: Vector3
	speed?: number
	indicatorColor?: ColorRepresentation
}

export { ThreeWalkAnimate }

