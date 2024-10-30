import { AmbientLight, DirectionalLight, Light } from 'three'
import { extend } from '../utils/extend'
import { ThreePlugin } from './Plugin'
import { ThreeEventDispatcherParams } from './PluginDispatcher'
import { ThreeViewer } from './Viewer'

class ThreeLighter extends ThreePlugin {
	static Options: ThreeLighterOptions = {
		// 环境光
		ambientColor: 0xffffff,
		ambientIntensity: 2,
		// 平行光
		directNumber: 3,
		directColor: 0xffffff,
		directIntensity: 0.5
	}

	name = 'Lighter'
	viewer!: ThreeViewer
	options = {} as Required<ThreeLighterOptions>
	lights: Light[] = []

	constructor(options?: ThreeLighterOptions) {
		super()
		this.setOptions(options)
	}

	initialize(viewer: ThreeViewer): void {
		this.viewer = viewer
	}

	setOptions(options?: ThreeLighterOptions) {
		this.options = extend(true, {}, ThreeLighter.Options, options || {})
	}

	update(params: ThreeEventDispatcherParams): void {
		this.lights = []

		const { lights } = params
		if (lights && lights.length) return

		const { ambientColor, ambientIntensity, directNumber, directColor, directIntensity } = this.options

		// ambient light
		const light1 = new AmbientLight(ambientColor, ambientIntensity)
		light1.name = 'Ambient_Light'
		this.viewer.scene.add(light1)
		this.lights.push(light1)

		// add {directNumber} directional lights
		for (let i = 0; i < directNumber; i++) {
			const light2 = new DirectionalLight(directColor, directIntensity)
			light2.position.set(Math.random() * 10 - 5, Math.random() * 10, Math.random() * 10 - 5)
			light2.name = 'Directional_Light ' + (i + 1)
			this.viewer.scene.add(light2)
			this.lights.push(light2)
		}
	}

	show(): void {
		for (const light of this.lights) {
			light.visible = true
		}
	}

	hide(): void {
		for (const light of this.lights) {
			light.visible = false
		}
	}

	dispose(): void {
		for (const light of this.lights) {
			light.parent?.remove(light)
		}
		this.lights = []
	}
}

export interface ThreeLighterOptions {
	// 环境光
	ambientColor?: number
	ambientIntensity?: number
	// 平行光
	directNumber?: number
	directColor?: number
	directIntensity?: number
}

export { ThreeLighter }

