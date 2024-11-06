import {
    AnimationClip,
    Camera,
    ColorRepresentation,
    EventDispatcher,
    Group,
    Light,
    Mesh,
    Skeleton,
    Texture
} from 'three'
import { ThreeBackgroundShaderUniforms } from '../shaders/BackgroundShader'
import { AnyObject } from '../types'
import { ThreePlugin, ThreePlugins } from './Plugin'

class ThreePluginDispatcher extends EventDispatcher<ThreeEventDispatcherObject> {
	plugins: ThreePlugins = {}

	getPlugin(name: string) {
		return this.plugins[name]
	}

	getPlugins(expName: string) {
		return Object.keys(this.plugins).reduce(
			(plugins: ThreePlugin[], name) =>
				expName === name || name.startsWith(expName + '.') ? plugins.concat(this.plugins[name]) : plugins,
			[]
		)
	}

	hasPlugin(expName: string) {
		return expName in this.plugins || Object.keys(this.plugins).some((name) => name.startsWith(expName + '.'))
	}

	addPlugin(plugin: ThreePlugin) {
		this.plugins[plugin.name] = plugin
		plugin.initialize(this)
	}

	addPlugins(plugins: ThreePlugin[]) {
		for (const plugin of plugins) {
			this.addPlugin(plugin)
		}
	}

	removePlugin(name: string | ThreePlugin) {
		const pluginName = name instanceof ThreePlugin ? name.name : name + ''
		const plugin = this.plugins[pluginName]
		if (plugin) {
			plugin.dispose()
			delete this.plugins[pluginName]
		}
	}

	dispatchPlugin(name: ThreeEventDispatcherMethod, params?: ThreeEventDispatcherParams) {
		try {
			if (name === 'dispose') {
				const plugins = this.plugins
				this.plugins = {}
				for (let key in plugins) {
					plugins[key][name]()
				}
			} else {
				for (let key in this.plugins) {
					this.plugins[key][name](params)
				}
			}

		} catch (exp) {
			console.error(exp)
		}
	}
}

export type ThreeEventsObject<K = any> = AnyObject<(...args: any[]) => void, K>

export type ThreeEventDispatcherMethod = 'update' | 'render' | 'dispose' | 'resize' | 'capture'

export type ThreeEventDispatcherObject<K = any> = AnyObject<ThreeEventDispatcherParams, K>

export interface ThreeEventDispatcherParams {
	error?: any
	event?: any
	group?: Group
	skeletons?: Skeleton[]
	texture?: Texture
	mesh?: Mesh
	morphs?: Mesh[]
	lights?: Light[]
	cameras?: Camera[]
	clips?: AnimationClip[]
	color1?: ColorRepresentation
	color2?: ColorRepresentation
	uniforms?: ThreeBackgroundShaderUniforms
}

export { ThreePluginDispatcher }

