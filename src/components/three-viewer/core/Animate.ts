import { EventDispatcher } from 'three'
import { AnyObject, EventDispatcherObject, EventsObject } from '../types'
import { ThreeViewer } from './Viewer'

abstract class ThreeAnimate extends EventDispatcher<EventDispatcherObject> {
	options!: ThreeAnimateOptions

	abstract setOptions(options?: ThreeAnimateOptions): void

	abstract setEvent(): void

	abstract reconcile(viewer: ThreeViewer): ThreeAnimateReconcile | void | undefined
}

export interface ThreeAnimateOptions {
	events?: EventsObject
	duration?: number
	autoStart?: boolean
	easing?: (amount: number) => number
}

export interface ThreeAnimateReconcile {
	from: AnyObject
	to: AnyObject
	update?: (object: AnyObject) => void
	complete?: (object: AnyObject) => void
}

export { ThreeAnimate }

