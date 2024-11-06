import { EventDispatcher } from 'three'
import { ThreeEventDispatcherObject, ThreeEventsObject } from '../core/PluginDispatcher'
import { AnyObject } from '../types'
import { ThreeAnimator } from './Animator'

abstract class ThreeAnimate extends EventDispatcher<ThreeEventDispatcherObject> {
	id!: string
	options!: ThreeAnimateOptions

	abstract setOptions(options?: ThreeAnimateOptions): void

	abstract setEvent(): void

	abstract start(animator?: ThreeAnimator): void

	abstract stop(animator?: ThreeAnimator): void

	abstract update(animator?: ThreeAnimator): void

	abstract reconcile(animator: ThreeAnimator): void
}

export interface ThreeAnimateOptions {
	events?: ThreeEventsObject
	duration?: number
	autoStart?: boolean
	easing?: (amount: number) => number
}

export interface ThreeAnimateReconcile<T = any> {
	from: AnyObject
	to: AnyObject
	duration?: number
	stop?: () => void
	update?: (object: T) => void
	complete?: (object: T) => void
}

export { ThreeAnimate }
