import { AnyObject } from '../types'
import { ThreeViewer } from './Viewer'

abstract class ThreeAnimate {
	options!: ThreeAnimateOptions

	abstract setOptions(options?: ThreeAnimateOptions): void

	abstract reconcile(viewer: ThreeViewer): ThreeAnimateReconcile | void | undefined
}

export interface ThreeAnimateOptions {
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
