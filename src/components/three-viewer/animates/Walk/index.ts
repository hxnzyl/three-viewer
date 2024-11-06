import { Object3D, Vector3 } from 'three'
import { Easing } from 'three/examples/jsm/libs/tween.module'
import { extend } from '../../utils/extend'
import { ThreeAnimate, ThreeAnimateOptions } from '../Animate'
import { ThreeAnimator } from '../Animator'

class ThreeWalkAnimate extends ThreeAnimate {
	static Options: ThreeWalkAnimateOptions = {
		autoStart: true,
		duration: 1000,
		speed: 0.2,
		easing: Easing.Linear.None
	}

	name = 'Animates.Walk'
	options = {} as Required<ThreeWalkAnimateOptions>
	object?: Object3D
	moving = false

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
		this.object = animator.viewer.object
		if (this.options.autoStart) {
			this.start(animator)
		}
	}

	start(animator?: ThreeAnimator): void {
		if (!this.object) return

		const { position, quaternion } = this.object
		const { position: toPosition } = this.options

		// 旋转模型到目标点的方向(指定目标点相对于当前目标点的相对角度)
		const direction = new Vector3().subVectors(toPosition, position).normalize()
		// 使用Quaternion来设置模型的朝向
		quaternion.setFromUnitVectors(new Vector3(0, 0, 1), direction)

		if (animator) {
			// 停止所有用户动画
			animator.pauseAll(true)
			// 停止闲置
			animator.pause('Idle')
			// 开始奔跑或走
			const fromX = position.x
			const fromZ = position.z
			const toX = toPosition.x
			const toZ = toPosition.z
			const diffX = Math.abs(fromX - toX)
			const diffZ = Math.abs(fromZ - toZ)
			const distance = Math.sqrt(diffX * diffX + diffZ * diffZ)
			const isFar = distance > 10
			if (isFar) {
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
			this.moving = false
			this.object = undefined
		}
	}

	update(animator?: ThreeAnimator) {
		if (!this.object || !this.moving) return

		const { position } = this.object
		const { position: toPosition, speed } = this.options

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

		// Move Complete
		if (
			position.x <= toX + speed &&
			position.x >= toX - speed &&
			position.z <= toZ + speed &&
			position.z >= toZ - speed
		) {
			this.stop(animator)
		}
	}
}

export interface ThreeWalkAnimateOptions extends ThreeAnimateOptions {
	position?: Vector3
	speed?: number
}

export { ThreeWalkAnimate }
