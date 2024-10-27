import { EventDispatcher } from 'three'
import { DataAnyObject, MethodNames } from '../types'
import { ThreePlugin, ThreePlugins } from './Plugin'

class ThreePluginDispatcher extends EventDispatcher<DataAnyObject> {
	private plugins: ThreePlugins = {}

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
		plugins.forEach((plugin) => this.addPlugin(plugin))
	}

	removePlugin(name: string | ThreePlugin) {
		if (typeof name === 'string') {
			delete this.plugins[name]
		} else {
			delete this.plugins[name.name]
		}
	}

	dispatchPlugin(name: MethodNames<ThreePlugin>, args?: any) {
		for (let key in this.plugins) {
			this.plugins[key][name](args)
		}
		if (name === 'dispose') {
			this.plugins = {}
		}
	}
}

export { ThreePluginDispatcher }
