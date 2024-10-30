import { Vector3 } from 'three'
import { Easing } from 'three/examples/jsm/libs/tween.module'
import { ThreeViewer } from '../../core/Viewer'
import { NumberObject } from '../../types'
import ThreeVectorUtils from '../../utils/Vector'
import { extend } from '../../utils/extend'
import { ThreeAnimate, ThreeAnimateOptions } from '../Animate'
import { ThreeRotateAnimateMap, ThreeRotateIdAnimate } from './Map'

class ThreeRotateAnimate extends ThreeAnimate {
	static Options: ThreeRotateAnimateOptions = {
		autoStart: true,
		duration: 1000,
		easing: Easing.Sinusoidal.InOut
	}

	name = 'Animates.Rotate'
	options: ThreeRotateAnimateOptions = {}

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

	reconcile(viewer: ThreeViewer) {
		let { rotateId, position: toPosition, up: toUp } = this.options

		const { camera, controls, objectCenter, objectDistance } = viewer
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

		controls.enabled = false

		const stop = () => {
			controls.enabled = true
			this.dispatchEvent({ type: 'onStop' })
		}

		return {
			from: { t: 0 },
			to: { t: 1 },
			update(news: NumberObject) {
				if (fromPosition && toPosition) {
					position.lerpVectors(fromPosition, toPosition, news.t)
				}
				if (fromUp && toUp) {
					up.lerpVectors(fromUp, toUp, news.t)
				}
				target.lerpVectors(fromTarget, toTarget, news.t)
			},
			stop,
			complete: () => {
				stop()
				this.dispatchEvent({ type: 'onComplete' })
			}
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

