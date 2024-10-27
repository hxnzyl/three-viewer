import type { GUI, GUIController, GUIParams } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'
import { ThreeEnvironments } from '../../config/Environments'
import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import { ThreeBackgroundShader } from '../../shaders/BackgroundShader'
import { AnyObject, BooleanObject } from '../../types'
import { extend } from '../../utils/extend'
import { ThreeAxesHelper } from '../AxesHelper'
import { ThreeGridHelper } from '../GridHelper'
import './gui.css'

class ThreeGUIHelper extends ThreePlugin {
	static Options: ThreeGUIHelperOptions = {
		// domElement: undefined,
		kiosk: false,
		visibility: 'hidden',
		width: 260
	}

	name = 'Helpers.GUI'
	options = {} as Required<ThreeGUIHelperOptions>
	state: AnyObject = {}
	actionStates: BooleanObject = {}
	animCtrls: GUIController<object>[] = []
	morphCtrls: GUIController<object>[] = []
	lightCtrls: GUIController<object>[] = []
	cameraCtrl!: GUIController<object>

	domElement!: HTMLElement
	gui!: GUI
	animationsFolder!: GUI
	morphsFolder!: GUI
	camerasFolder!: GUI
	lightsFolder!: GUI
	stats!: Stats

	// @overwrite
	constructor(options?: ThreeGUIHelperOptions) {
		super()
		this.setOptions(options)
	}

	// @overwrite
	initialize(viewer: ThreeViewer) {
		this.viewer = viewer
	}

	// @overwrite
	setOptions(options?: ThreeGUIHelperOptions) {
		this.options = extend(true, {}, ThreeGUIHelper.Options, options || {})
	}

	// @overwrite
	createDomElement() {
		if (this.gui) return

		const { domElement, visibility, kiosk, ...guiParams } = this.options
		const { GUI: DatGUI } = require('dat.gui')
		const gui: GUI = new DatGUI(guiParams)

		const viewer = this.viewer
		const { renderer, controls, options } = viewer
		const backShader = viewer.getPlugin('Shaders.Background') as ThreeBackgroundShader
		const gridHelper = viewer.getPlugin('Helpers.Grid') as ThreeGridHelper
		const axesHelper = viewer.getPlugin('Helpers.Axes') as ThreeAxesHelper

		const state: AnyObject = {
			wireframe: false,
			skeleton: viewer.skeletons.length > 0,
			environment: viewer.environment?.name || 'None',
			grid: !!gridHelper,
			axes: !!axesHelper,
			background: !!backShader,
			color1: backShader?.options.color1.getHex() || 0xffffff,
			color2: backShader?.options.color2.getHex(),
			light: true,
			playAll: false
		}

		//#region Plugins
		const pluginsFolder = gui.addFolder('Plguins')
		pluginsFolder.add(state, 'wireframe').onChange(() => viewer.updateWireframe(state.wireframe))
		pluginsFolder.add(state, 'skeleton').onChange(() => viewer.updateSkeleton(state.skeleton))
		gridHelper && pluginsFolder.add(state, 'grid').onChange((value) => (value ? gridHelper.show() : gridHelper.hide()))
		axesHelper && pluginsFolder.add(state, 'axes').onChange((value) => (value ? axesHelper.show() : axesHelper.hide()))
		//#endregion Plugins

		//#region Controls
		const controlsFolder = gui.addFolder('Controls')
		'enableZoom' in controls && controlsFolder.add(controls, 'enableZoom')
		controlsFolder.add(controls, 'zoomSpeed', 0, 3)
		'autoRotate' in controls && controlsFolder.add(controls, 'autoRotate')
		'autoRotateSpeed' in controls && controlsFolder.add(controls, 'autoRotateSpeed', 0, 3)
		'enablePan' in controls && controlsFolder.add(controls, 'enablePan')
		controlsFolder.add(controls, 'panSpeed', 0, 3)
		'screenSpacePanning' in controls && controlsFolder.add(controls, 'screenSpacePanning')
		//#endregion Controls

		//#region Cameras
		this.camerasFolder = gui.addFolder('Cameras')
		this.camerasFolder.hide()
		//#endregion Cameras

		//#region Lights
		this.lightsFolder = gui.addFolder('Lights')
		this.lightsFolder.hide()
		//#endregion Lights

		//#region Textures
		const texturesFolder = gui.addFolder('Textures')
		texturesFolder.add(renderer, 'toneMappingExposure', 0, 2)
		texturesFolder
			.add(options, 'textureColorSpace', ['sRGB', 'Linear'])
			.onChange((value) => viewer.updateTexturesColorSpace(value))
		texturesFolder
			.add(options, 'outputColorSpace', ['sRGB', 'Linear'])
			.onChange((value) => viewer.updateOutputColorSpace(value))
		const environmentNames = ThreeEnvironments.map((env) => env.name)
		texturesFolder
			.add(state, 'background')
			.onChange(() => viewer.updateEnvironment(state.environment, state.background))
		texturesFolder
			.add(state, 'environment', environmentNames)
			.onChange(() => viewer.updateEnvironment(state.environment, state.background))
		texturesFolder.addColor(state, 'color1').onChange(() => viewer.updateBackground(state.color1, state.color2))
		backShader &&
			texturesFolder.addColor(state, 'color2').onChange(() => viewer.updateBackground(state.color1, state.color2))
		//#endregion Textures

		//#region Animations
		this.animationsFolder = gui.addFolder('Animations')
		this.animationsFolder.hide()
		//#endregion Animations

		//#region Morphs
		this.morphsFolder = gui.addFolder('Morphs')
		this.morphsFolder.hide()
		//#endregion Morphs

		//#region Performance
		const stats = new Stats()
		const performanceFolder = gui.addFolder('Performance')
		const performmanceLi = document.createElement('li')
		performmanceLi.appendChild(stats.dom)
		performmanceLi.id = 'three-gui-stats'
		// @ts-ignore
		performanceFolder.__ul.appendChild(performmanceLi)
		performanceFolder.open()
		this.stats = stats
		//#endregion Performance

		//#region Push DOM
		this.domElement = document.createElement('div')
		this.domElement.id = 'three-gui'
		this.domElement.appendChild(gui.domElement)
		viewer.domElement?.appendChild(this.domElement)
		kiosk && gui.close()
		this.gui = gui
		//#endregion Push DOM

		this.state = state
	}

	// @overwrite
	render() {
		this.stats.update()
	}

	// @overwrite
	update() {
		this.createDomElement()
		this.updateCamerasFolder()
		this.updateLightsFolder()
		this.updateMorphsFolder()
		this.updateAnimationsFolder()
		this.show()
	}

	updateCamerasFolder() {
		if (this.cameraCtrl) this.cameraCtrl.remove()

		const { cameras } = this.viewer
		if (cameras.length == 0) {
			this.camerasFolder?.hide()
		} else {
			this.camerasFolder.domElement.style.display = ''
			this.cameraCtrl = this.camerasFolder.add(
				this.state,
				'camera',
				['[default]'].concat(cameras.map((mesh) => mesh.name))
			)
			this.cameraCtrl.onChange((name) => this.viewer.updateCamera(name))
		}
	}

	updateLightsFolder() {
		this.lightCtrls.forEach((ctrl) => ctrl.remove())
		this.lightCtrls = []

		const three = this.viewer
		const { lights } = three

		if (lights.length == 0) {
			this.lightsFolder.hide()
		} else {
			const colors: AnyObject[] = []

			this.lightsFolder
				.add(this.state, 'light', true)
				.onChange((value) => (value ? three.showLights() : three.hideLights()))

			for (const key in lights) {
				const light = lights[key]
				colors[key] = { color: light.color.getHex() }
				this.lightCtrls.push(
					this.lightsFolder.add({ name: light.name }, 'name'),
					this.lightsFolder.addColor(colors[key], 'color'),
					this.lightsFolder.add(light, 'intensity', 0, 3)
				)
			}

			this.lightsFolder.show()
		}
	}

	updateMorphsFolder() {
		this.morphCtrls.forEach((ctrl) => ctrl.remove())
		this.morphCtrls = []

		const { morphs } = this.viewer
		if (morphs.length == 0) {
			this.morphsFolder.hide()
		} else {
			for (const mesh of morphs) {
				const s = mesh.morphTargetInfluences || []
				const d = Object.keys(mesh.morphTargetDictionary || {})
				const l = s.length || 0
				if (l > 0) {
					this.morphCtrls.push(this.morphsFolder.add({ name: mesh.name || 'Untitled' }, 'name'))
				}
				for (let i = 0; i < l; i++) {
					this.morphCtrls.push(this.morphsFolder.add(s, i, 0, 1, 0.01).name(d[i]).listen())
				}
			}
			this.morphsFolder.show()
		}
	}

	updateAnimationsFolder() {
		this.animCtrls.forEach((ctrl) => ctrl.remove())
		this.animCtrls = []

		const three = this.viewer
		const { mixer, clips, runningActions } = three
		if (!mixer || clips.length == 0) {
			this.animationsFolder.hide()
		} else {
			const state = this.state
			const status: BooleanObject = {}

			let lock = false

			this.animCtrls.push(
				this.animationsFolder.add(mixer, 'timeScale', 0.1, 3),
				this.animationsFolder.add(state, 'playAll', false).onChange((value) => {
					if (lock) return
					lock = true
					const ctrls = this.animCtrls.slice(2)
					for (let ctrl of ctrls) {
						ctrl.setValue(value)
					}
					value ? three.playAllClips() : three.pauseAllClips()
					lock = false
				})
			)

			for (const clip of clips) {
				status[clip.name] = runningActions.includes(clip.name)
				this.animCtrls.push(
					this.animationsFolder.add(status, clip.name).onChange((value) => {
						if (lock) return
						lock = true
						value ? three.playClip(clip) : three.pauseClip(clip)
						this.animCtrls[1].setValue(three.runningActions.length == clips.length)
						lock = false
					})
				)
			}

			this.animationsFolder.show()
		}
	}

	// @overwrite
	show() {
		this.domElement.style.visibility = ''
	}

	// @overwrite
	hide() {
		this.domElement.style.visibility = 'hidden'
	}

	// @overwrite
	onResize() {}

	// @overwrite
	dispose() {
		if (this.domElement) {
			this.viewer.domElement.removeChild(this.domElement)
			this.domElement = null as any
		}
	}
}

export interface ThreeGUIHelperOptions extends GUIParams {
	domElement?: HTMLElement
	visibility?: 'hidden' | 'visible'
	kiosk?: boolean
}

export { ThreeGUIHelper }
