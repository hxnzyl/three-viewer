import { EventDispatcher } from 'three'
import { AnyObject } from '../types'
import { ThreeAnimator } from './Animator'
import { ThreeEventDispatcherObject, ThreeEventsObject } from './PluginDispatcher'

abstract class ThreeAnimate extends EventDispatcher<ThreeEventDispatcherObject> {
	id: string = 'Animate_0'
	name: string = 'Animate'
	options!: ThreeAnimateOptions

	abstract setOptions(options?: ThreeAnimateOptions): void

	abstract setEvent(): void

	abstract start(): void

	abstract stop(): void

	abstract update(): void

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
