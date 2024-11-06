import { Vector3 } from 'three'
import { Easing } from 'three/examples/jsm/libs/tween.module'
import { ThreeViewer } from '../../core/Viewer'
import { extend } from '../../utils/extend'
import { ThreeAnimate, ThreeAnimateOptions } from '../Animate'
import { NumberObject } from './../../types.d'

class ThreeWalkAnimate extends ThreeAnimate {
	static Options: ThreeWalkAnimateOptions = {
		autoStart: true,
		duration: 1000,
		easing: Easing.Linear.None
	}

	name = 'Animates.Walk'
	options: ThreeWalkAnimateOptions = {}

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

	reconcile(viewer: ThreeViewer) {
		const { object, controls, camera, animator } = viewer
		if (!object) return

		// 目标位置
		const { position: toPosition } = this.options
		if (!toPosition) return
		const { position, quaternion } = object

		// 当前位置
		const fromPosition = position.clone()

		// 计算移动距离
		const distance = fromPosition.distanceTo(toPosition) * controls.getDistance()

		// 当前距离与目标距离之间的距离差值小于等于1则目标点在当前点的位置,不需要移动
		if (distance <= 1) return

		// 旋转模型到目标点的方向(指定目标点相对于当前目标点的相对角度)
		const direction = new Vector3().subVectors(toPosition, position).normalize()

		// 使用Quaternion来设置模型的朝向
		quaternion.setFromUnitVectors(new Vector3(0, 0, 1), direction)

		// 距离远执行跑，近执行走
		const isFar = distance > 300
		const duration = isFar ? distance * 250 : distance * 500
        console.log(distance)

		// 停止所有用户动画
		animator.pauseAll(true)

		// 停止闲置
		animator.pause('Idle')

		// 开始奔跑或走
		animator.play(isFar ? 'Running' : 'Walking', isFar ? 1 : 2)

		// 冻结控制器
		controls.enabled = false

		const stop = () => {
			controls.enabled = true
			this.dispatchEvent({ type: 'onStop' })
		}

		return {
			from: { t: 0 },
			to: { t: 1 },
			duration,
			update(news: NumberObject) {
				position.lerpVectors(fromPosition, toPosition, news.t)
			},
			stop,
			complete: () => {
				stop()
				this.dispatchEvent({ type: 'onComplete' })
			}
		}
	}
}

export interface ThreeWalkAnimateOptions extends ThreeAnimateOptions {
	position?: Vector3
}

export { ThreeWalkAnimate }

