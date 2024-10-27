/**
 * CubeView Widget
 *
 * @author OWen<733433@qq.com>
 */

import { ColorRepresentation, Scene } from 'three'
import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import { extend } from '../../utils/extend'
import { ThreeViewCubeDataHelper } from './Data'
import { ThreeViewCubeEditorHelper } from './Editor'
import { ThreeViewCubeRenderHelper } from './Render'

class ThreeViewCubeHelper extends ThreePlugin {
	static Options: ThreeViewCubeHelperOptions = {
		// domElement: undefined,
		visibility: 'hidden',
		width: 150,
		height: 150,
		colors: {
			faceDefaultColor: 0xe3e9ec,
			faceDefaultOpacity: 1,
			wireframeDefaultColor: 0xcccccc,
			wireframeDefaultOpacity: 1,
			faceHighlightColor: 0x3366ff,
			faceHighlightOpacity: 0.5,
			wireframeHighlightColor: 0x3399ff,
			wireframeHighlightOpacity: 0.5
		}
	}

	name = 'Helpers.ViewCube'
	options = {} as Required<ThreeViewCubeHelperOptions>
	domElement!: HTMLElement

	private events: ('show' | 'hide')[] = []
	private cubeData!: ThreeViewCubeDataHelper
	private cubeRender!: ThreeViewCubeRenderHelper
	private cubeEditor!: ThreeViewCubeEditorHelper

	// @overwrite
	constructor(options?: ThreeViewCubeHelperOptions) {
		super()
		this.setOptions(options)
	}

	// @overwrite
	initialize(viewer: ThreeViewer) {
		if (this.viewer) return
		this.viewer = viewer
		this.createDomElement()
		this.cubeData = new ThreeViewCubeDataHelper(this.options.colors)
		this.cubeRender = new ThreeViewCubeRenderHelper(this.domElement, this.cubeData)
		this.cubeEditor = new ThreeViewCubeEditorHelper(this.domElement, this.cubeData, this.cubeRender, this.viewer)
		this.events.forEach((fun) => this[fun]())
		this.events = []
	}

	// @overwrite
	setOptions(options?: ThreeViewCubeHelperOptions) {
		this.options = extend(true, {}, ThreeViewCubeHelper.Options, options || {})
	}

	// @overwrite
	createDomElement() {
		if (this.domElement) return
		const { width, height, visibility, domElement } = this.options
		let el = domElement || document.getElementById('three-widget-cube-view')
		if (!el) (el = document.createElement('div')), this.viewer?.domElement?.appendChild(el)
		el.id = 'three-widget-cube-view'
		el.style.cssText = `position:fixed;top:0;right:0;visibility:${visibility};width:${width}px;height:${height}px`
		this.domElement = el
	}

	// @overwrite
	render() {
		this.cubeRender?.render(this.viewer.camera)
	}

	// @overwrite
	update() {
		this.show()
	}

	// @overwrite
	show() {
		if (this.domElement) {
			this.cubeRender.setActiveScene(this.cubeData.getScene())
			this.cubeRender.render()
			this.domElement.style.visibility = ''
		} else {
			this.events.push('show')
		}
	}

	// @overwrite
	hide() {
		if (this.domElement) {
			this.cubeRender.setActiveScene(new Scene())
			this.cubeRender.render()
			this.domElement.style.visibility = 'hidden'
		} else {
			this.events.push('hide')
		}
	}

	// @overwrite
	dispose() {
		if (!this.cubeRender) return
		this.cubeData.dispose()
		this.cubeEditor.dispose()
		this.cubeRender.dispose()
		this.events = []
		this.cubeRender = null as any
	}
}

export interface ThreeViewCubeHelperColors {
	faceDefaultColor?: ColorRepresentation
	faceDefaultOpacity?: number
	wireframeDefaultColor?: ColorRepresentation
	wireframeDefaultOpacity?: number
	faceHighlightColor?: ColorRepresentation
	faceHighlightOpacity?: number
	wireframeHighlightColor?: ColorRepresentation
	wireframeHighlightOpacity?: number
}

export interface ThreeViewCubeHelperOptions {
	domElement?: HTMLElement
	visibility?: 'hidden' | 'visible'
	width?: number
	height?: number
	colors?: ThreeViewCubeHelperColors
}

export { ThreeViewCubeHelper }
