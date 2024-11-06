import { EventDispatcher } from 'three'
import { ThreeEventDispatcherObject, ThreeEventsObject } from '../core/PluginDispatcher'
import { ThreeViewer } from '../core/Viewer'
import { AnyObject } from '../types'

abstract class ThreeAnimate extends EventDispatcher<ThreeEventDispatcherObject> {
	options!: ThreeAnimateOptions

	abstract setOptions(options?: ThreeAnimateOptions): void

	abstract setEvent(): void

	abstract reconcile(viewer: ThreeViewer): ThreeAnimateReconcile | void | undefined
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

