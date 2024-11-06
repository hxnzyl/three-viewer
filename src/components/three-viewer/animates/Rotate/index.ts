import { Vector3 } from 'three'
import { Easing, Tween } from 'three/examples/jsm/libs/tween.module'
import { NumberObject } from '../../types'
import ThreeVectorUtils from '../../utils/Vector'
import { extend } from '../../utils/extend'
import { ThreeAnimate, ThreeAnimateOptions } from '../Animate'
import { ThreeAnimator } from '../Animator'
import { ThreeRotateAnimateMap, ThreeRotateIdAnimate } from './Map'

class ThreeRotateAnimate extends ThreeAnimate {
	static Options: ThreeRotateAnimateOptions = {
		autoStart: true,
		duration: 1000,
		easing: Easing.Sinusoidal.InOut
	}

	name = 'Animates.Rotate'
	options: ThreeRotateAnimateOptions = {}
	tween?: Tween<NumberObject>

	constructor(options?: ThreeRotateAnimateOptions) {
		super()
		this.setOptions(options)
		this.setEvent()
	}

	setOptions(options?: ThreeRotateAnimateOptions) {
		this.options = extend(true, {}, ThreeRotateAnimate.Options, options || {})
	}

	setEvent() {
		// 添加参数中的事件
		const { events } = this.options
		for (const type in events) {
			this.addEventListener(type, events[type])
		}
	}

	start(): void {
		if (this.tween) {
			this.tween.start()
			this.dispatchEvent({ type: 'onStart' })
		}
	}

	stop(): void {
		if (this.tween) {
			this.tween = undefined
			this.dispatchEvent({ type: 'onStop' })
		}
	}

	update(): void {
		this.tween?.update()
	}

	reconcile(animator: ThreeAnimator) {
		let { rotateId, position: toPosition, up: toUp } = this.options

		animator.viewer.updateObject()

		const { camera, controls, objectCenter, objectDistance } = animator.viewer
		const { position, up } = camera
		const { target } = controls

		// reconcile by rotate ID
		if (rotateId && !toPosition && !toUp) {
			toPosition = new Vector3(...ThreeRotateAnimateMap[rotateId][0])
			toUp = new Vector3(...ThreeRotateAnimateMap[rotateId][1])
		}

		// lookAt object center
		const toTarget = objectCenter.clone().normalize()

		// calculate new position and keep distance
		if (toPosition) {
			toPosition.subVectors(toTarget, toPosition.setLength(objectDistance))
		}

		// position and up same then return
		if (
			(!toPosition || ThreeVectorUtils.areVector3Close(position, toPosition)) &&
			(!toUp || ThreeVectorUtils.areVector3Close(up, toUp))
		) {
			console.warn('ThreeViewer.ThreeRotateAnimate: same or undefined position and up.')
			this.dispatchEvent({ type: 'onComplete' })
			return
		}

		const fromTarget = target.clone()
		const fromPosition = toPosition && position.clone()
		const fromUp = toUp && up.clone()

		const update = (news: NumberObject) => {
			if (fromPosition && toPosition) {
				position.lerpVectors(fromPosition, toPosition, news.t)
			}
			if (fromUp && toUp) {
				up.lerpVectors(fromUp, toUp, news.t)
			}
			target.lerpVectors(fromTarget, toTarget, news.t)
		}

		const stop = () => {
			controls.enabled = true
			this.stop()
		}

		const complete = () => {
			// Required
			delete animator.animates[this.id]
			stop()
			this.dispatchEvent({ type: 'onComplete' })
		}

		const { autoStart, duration, easing } = this.options

		const tween = new Tween({ t: 0 }).to({ t: 1 }, duration).easing(easing)

		this.id = tween.getId() + ''
		this.tween = tween.onUpdate(update).onStop(stop).onComplete(complete)

		if (autoStart) {
			controls.enabled = false

			this.start()
		}
	}
}

export interface ThreeRotateAnimateOptions extends ThreeAnimateOptions {
	rotateId?: ThreeRotateIdAnimate
	position?: Vector3
	up?: Vector3
	target?: Vector3
}

export { ThreeRotateAnimate }
