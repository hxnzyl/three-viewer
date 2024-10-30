import { EventDispatcher } from 'three'
import { ThreeEventsObject } from '../core/PluginDispatcher'
import { ThreeViewer } from '../core/Viewer'

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

export interface ThreeAnimateReconcile {
	from: AnyObject
	to: AnyObject
	stop?: () => void
	update?: (object: AnyObject) => void
	complete?: (object: AnyObject) => void
}

export { ThreeAnimate }

