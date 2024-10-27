import { Mesh } from 'three'
import { AnyObject } from '../types'
import { ThreePluginDispatcher } from './PluginDispatcher'
import { ThreeViewer } from './Viewer'

abstract class ThreePlugin {
	viewer!: ThreeViewer

	abstract name: string
	abstract options: AnyObject

	abstract initialize(dispatcher: ThreePluginDispatcher): void

	abstract setOptions(options?: {}): void

	abstract update(args?: any): void

	abstract show(): void

	abstract hide(): void

	abstract dispose(): void

	capture(objects?: Mesh) {}

	render() {}

	onResize() {}
}

export type ThreePlugins = AnyObject<ThreePlugin>

export { ThreePlugin as ThreePlugin }
