import { AnyObject } from '../types'
import { ThreeEventDispatcherParams, ThreePluginDispatcher } from './PluginDispatcher'
import { ThreeViewer } from './Viewer'

abstract class ThreePlugin {
	viewer!: ThreeViewer

	abstract name: string
	abstract options: AnyObject

	abstract initialize(dispatcher: ThreePluginDispatcher): void

	abstract setOptions(options?: AnyObject): void

	abstract update(params?: ThreeEventDispatcherParams): void

	abstract show(): void

	abstract hide(): void

	abstract dispose(): void

	capture(params?: ThreeEventDispatcherParams) {}

	render() {}

	resize() {}
}

export type ThreePlugins = AnyObject<ThreePlugin>

export { ThreePlugin as ThreePlugin }

