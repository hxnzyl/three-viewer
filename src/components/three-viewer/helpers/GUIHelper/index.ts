import type { GUI, GUIController, GUIParams } from 'dat.gui'
import { Camera, Mesh } from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import { ThreeEnvironments } from '../../config/Environments'
import { ThreePlugin } from '../../core/Plugin'
import { ThreeEventDispatcherParams } from '../../core/PluginDispatcher'
import { ThreeViewer } from '../../core/Viewer'
import { ThreeBackgroundShader } from '../../shaders/BackgroundShader'
import { AnyObject, BooleanObject } from '../../types'
import { extend } from '../../utils/extend'
import { ThreeAxesHelper } from '../AxesHelper'
import { ThreeGridHelper } from '../GridHelper'
import { ThreeSkeletonHelper } from '../SkeletonHelper'
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

	gui!: GUI
	domElement?: HTMLElement
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

		const viewer = this.viewer!
		const { renderer, controls, options } = viewer
		const backgroundShader = viewer.getPlugin('Shaders.Background') as ThreeBackgroundShader
		const gridHelper = viewer.getPlugin('Helpers.Grid') as ThreeGridHelper
		const axesHelper = viewer.getPlugin('Helpers.Axes') as ThreeAxesHelper
		const skeletonHelper = viewer.getPlugin('Helpers.Skeleton') as ThreeSkeletonHelper

		const state: AnyObject = {
			wireframe: false,
			skeleton: !!skeletonHelper,
			grid: !!gridHelper,
			axes: !!axesHelper,
			environment: viewer.environment?.name || 'None',
			background: !!backgroundShader,
			color1: backgroundShader?.options.color1.getHex() || 0xffffff,
			color2: backgroundShader?.options.color2.getHex(),
			light: true,
			playAll: false
		}

		//#region Helpers
		const helpersFolder = gui.addFolder('Helpers')
		skeletonHelper &&
			helpersFolder.add(state, 'skeleton').onChange((value) => (value ? skeletonHelper.show() : skeletonHelper.hide()))
		gridHelper && helpersFolder.add(state, 'grid').onChange((value) => (value ? gridHelper.show() : gridHelper.hide()))
		axesHelper && helpersFolder.add(state, 'axes').onChange((value) => (value ? axesHelper.show() : axesHelper.hide()))
		//#endregion Helpers

		//#region Shaders
		const shadersFolder = gui.addFolder('Shaders')
		backgroundShader &&
			shadersFolder
				.add(state, 'background')
				.onChange((value) => (value ? backgroundShader.show() : backgroundShader.hide()))
		backgroundShader &&
			shadersFolder.addColor(state, 'color1').onChange(() => viewer.updateBackground(state.color1, state.color2))
		backgroundShader &&
			shadersFolder.addColor(state, 'color2').onChange(() => viewer.updateBackground(state.color1, state.color2))
		//#endregion Helpers

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
		helpersFolder.add(state, 'wireframe').onChange(() => viewer.updateWireframe(state.wireframe))
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
		this.stats?.update()
	}

	// @overwrite
	update({ cameras, morphs }: ThreeEventDispatcherParams) {
		if (!this.viewer) return
		this.createDomElement()
		this.updateCamerasFolder(cameras)
		this.updateLightsFolder()
		this.updateMorphsFolder(morphs)
		this.updateAnimationsFolder()
		this.show()
	}

	updateCamerasFolder(cameras?: Camera[]) {
		if (this.cameraCtrl) this.cameraCtrl.remove()

		if (!cameras || cameras.length == 0) {
			this.camerasFolder?.hide()
		} else {
			this.camerasFolder.domElement.style.display = ''
			this.cameraCtrl = this.camerasFolder.add(
				this.state,
				'camera',
				['[default]'].concat(cameras.map((mesh) => mesh.name))
			)
			this.cameraCtrl.onChange((name) => this.viewer!.updateCamera(name))
		}
	}

	updateLightsFolder() {
		for (const ctrl of this.lightCtrls) {
			ctrl.remove()
		}

		this.lightCtrls = []

		const { lighter } = this.viewer!
		const { lights } = lighter

		if (!lights || lights.length == 0) {
			this.lightsFolder.hide()
		} else {
			const colors: AnyObject[] = []

			this.lightsFolder.add(this.state, 'light', true).onChange((value) => (value ? lighter.show() : lighter.hide()))

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

	updateMorphsFolder(morphs?: Mesh[]) {
		for (const ctrl of this.morphCtrls) {
			ctrl.remove()
		}

		this.morphCtrls = []

		if (!morphs || morphs.length == 0) {
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
		for (const ctrl of this.animCtrls) {
			ctrl.remove()
		}

		this.animCtrls = []

		const three = this.viewer!
		const { animator } = three
		const { mixer, clips, runningActions } = animator
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
					value ? animator.playAll() : animator.pauseAll()
					lock = false
				})
			)

			for (const clip of clips) {
				status[clip.name] = runningActions.includes(clip.name)
				this.animCtrls.push(
					this.animationsFolder.add(status, clip.name).onChange((value) => {
						if (lock) return
						lock = true
						value ? animator.play(clip) : animator.pause(clip)
						this.animCtrls[1].setValue(runningActions.length == clips.length)
						lock = false
					})
				)
			}

			this.animationsFolder.show()
		}
	}

	// @overwrite
	show() {
		if (this.domElement) {
			this.domElement.style.visibility = ''
		}
	}

	// @overwrite
	hide() {
		if (this.domElement) {
			this.domElement.style.visibility = 'hidden'
		}
	}

	// @overwrite
	resize() {}

	// @overwrite
	dispose() {
		if (this.viewer) {
			this.domElement && this.viewer.domElement.removeChild(this.domElement)
			this.domElement = null as any
			this.viewer = undefined
		}
	}
}

export interface ThreeGUIHelperOptions extends GUIParams {
	domElement?: HTMLElement
	visibility?: 'hidden' | 'visible'
	kiosk?: boolean
}

export { ThreeGUIHelper }
