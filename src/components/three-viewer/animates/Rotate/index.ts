import { Vector3 } from 'three'
import { Easing } from 'three/examples/jsm/libs/tween.module'
import { ThreeAnimate, ThreeAnimateOptions } from '../../core/Animate'
import { ThreeViewer } from '../../core/Viewer'
import { NumberObject } from '../../types'
import { extend } from '../../utils/extend'
import { areVector3Close } from '../../utils/three'
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
	}

	setOptions(options?: ThreeRotateAnimateOptions) {
		this.options = extend(true, {}, ThreeRotateAnimate.Options, options || {})
	}

	reconcile(viewer: ThreeViewer) {
		let { fromRotateId, toRotateId, position: toPosition, up: toUp } = this.options

		const { camera, controls, objectCenter, objectDistance } = viewer
		const { position, up } = camera
		const { target, enabled } = controls

		// reconcile by rotate ID
		if (toRotateId && !toPosition && !toUp) {
			const result = this.reconcileByRotateId(toRotateId, position.clone(), up.clone(), fromRotateId)
			if (result) {
				toPosition = result.toPosition
				toUp = result.toUp
			}
		}

		// lookAt center
		const toTarget = objectCenter.normalize()

		// calculate new position and keep distance
		if (toPosition) {
			toPosition.subVectors(toTarget, toPosition.setLength(objectDistance))
		}

		// position and up same then return
		if ((!toPosition || areVector3Close(position, toPosition)) && (!toUp || areVector3Close(up, toUp))) {
			console.warn('ThreeViewer.ThreeRotateAnimate: same or undefined position and up.')
			return
		}

		const from: NumberObject = {
			x3: target.x,
			y3: target.y,
			z3: target.z
		}

		const to: NumberObject = {
			x3: toTarget.x,
			y3: toTarget.y,
			z3: toTarget.z
		}

		if (toPosition) {
			Object.assign(from, {
				x1: position.x,
				y1: position.y,
				z1: position.z
			})

			Object.assign(to, {
				x1: toPosition.x,
				y1: toPosition.y,
				z1: toPosition.z
			})
		}

		if (toUp) {
			Object.assign(from, {
				x2: up.x,
				y2: up.y,
				z2: up.z
			})

			Object.assign(to, {
				x2: toUp.x,
				y2: toUp.y,
				z2: toUp.z
			})
		}

		controls.enabled = false

		return {
			from,
			to,
			update(news: NumberObject) {
				if (toPosition) {
					position.x = news.x1
					position.y = news.y1
					position.z = news.z1
				}
				if (toUp) {
					up.x = news.x2
					up.y = news.y2
					up.z = news.z2
				}
				target.x = news.x3
				target.y = news.y3
				target.z = news.z3
			},
			complete() {
				controls.enabled = enabled
			}
		}
	}

	reconcileByRotateId(
		toRotateId: ThreeRotateIdAnimate,
		position: Vector3,
		up: Vector3,
		fromRotateId?: ThreeRotateIdAnimate
	): {
		toPosition: Vector3
		toUp: Vector3
	} {
		let toPosition = new Vector3(...ThreeRotateAnimateMap[toRotateId][0]),
			toUp = new Vector3(...ThreeRotateAnimateMap[toRotateId][1])

		console.info(`ThreeViewer.ThreeRotateAnimate: toRotateId=${toRotateId},fromRotateId=${fromRotateId}`)

		if (fromRotateId) {
			if (toRotateId === 'RoofBack' && fromRotateId === 'Top') {
				// 继续朝上旋转时
				// toUp.applyAxisAngle(up, Math.PI * 2)
				// toUp.applyAxisAngle(up, Math.PI)
			}
		}

		return { toPosition, toUp }
	}
}

export interface ThreeRotateAnimateOptions extends ThreeAnimateOptions {
	fromRotateId?: ThreeRotateIdAnimate
	toRotateId?: ThreeRotateIdAnimate
	position?: Vector3
	up?: Vector3
	target?: Vector3
}

export { ThreeRotateAnimate }
