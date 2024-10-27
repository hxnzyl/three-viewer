/**
 * @Source https://github.com/mattdesl/three-vignette-background
 * @License MIT
 */

import { Color, DoubleSide, IUniform, Mesh, PlaneGeometry, RawShaderMaterial, Vector2 } from 'three'
import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import { StringObject } from '../../types'
import { isIOS } from '../../utils/detect'
import { extend } from '../../utils/extend'

// @ts-ignore
import fragmentShader from './shader.fs'
// @ts-ignore
import vertexShader from './shader.vs'

class ThreeBackgroundShader extends ThreePlugin {
	static Uniforms: StringObject<keyof ThreeBackgroundShaderUniforms> = {
		color1: 'c',
		color2: 'c',
		smooth: 'v2',
		offset: 'v2',
		scale: 'v2',
		aspect: 'f',
		grainScale: 'f',
		grainTime: 'f',
		noiseAlpha: 'f',
		aspectCorrection: 'b'
	}
	static Options: ThreeBackgroundShaderOptions = {
		color1: new Color(0xffffff),
		color2: new Color(0x000000),
		smooth: new Vector2(0.0, 1.0),
		offset: new Vector2(0, 0),
		scale: new Vector2(1, 1),
		aspect: 1,
		grainScale: isIOS() ? 0 : 0.001,
		grainTime: 0,
		noiseAlpha: 0.25,
		aspectCorrection: false
	}

	name = 'Shaders.Background'
	options = {} as Required<ThreeBackgroundShaderOptions>

	mesh!: Mesh
	geometry!: PlaneGeometry
	material!: RawShaderMaterial

	// @overwrite
	constructor(options?: ThreeBackgroundShaderOptions) {
		super()
		this.setOptions(options)
	}

	// @overwrite
	initialize(viewer: ThreeViewer) {
		if (this.viewer) return
		this.viewer = viewer
		this.geometry = new PlaneGeometry(2, 2, 1)
		this.material = new RawShaderMaterial({
			vertexShader,
			fragmentShader,
			side: DoubleSide,
			depthTest: false,
			uniforms: Object.keys(ThreeBackgroundShader.Uniforms).reduce(
				(unis, key) => ((unis[key] = { value: this.options[key as keyof ThreeBackgroundShaderOptions] }), unis),
				{} as { [uniform: string]: IUniform }
			)
		})
		this.mesh = new Mesh(this.geometry, this.material)
		this.mesh.name = 'Shader Background'
		this.mesh.frustumCulled = false
		this.mesh.renderOrder = -1
	}

	// @overwrite
	setOptions(options?: ThreeBackgroundShaderOptions) {
		this.options = extend(true, {}, ThreeBackgroundShader.Options, options || {})
	}

	// @overwrite
	render() {}

	// @overwrite
	update(uniforms?: ThreeBackgroundShaderUniforms) {
		if (this.material && uniforms) {
			Object.keys(uniforms).forEach((key: string) => {
				const keyAs = key as keyof ThreeBackgroundShaderUniforms
				this.material.uniforms[key].value = uniforms[keyAs]
			})
		}
		this.show()
	}

	// @overwrite
	show() {
		this.viewer.scene.add(this.mesh)
	}

	// @overwrite
	hide() {
		this.viewer.scene.remove(this.mesh)
	}

	// @overwrite
	onResize() {
		this.material.uniforms.aspect.value = this.viewer.width / this.viewer.height
	}

	// @overwrite
	dispose() {
		if (this.material) {
			this.viewer.scene.remove(this.mesh)
			this.material.dispose()
			this.material = null as any
		}
	}
}

export type ThreeBackgroundShaderUniforms = {
	color1: Color
	color2: Color
	smooth?: Vector2
	offset?: Vector2
	scale?: Vector2
	aspect?: number
	grainScale?: number
	grainTime?: number
	noiseAlpha?: number
	aspectCorrection?: boolean
}

export interface ThreeBackgroundShaderOptions extends ThreeBackgroundShaderUniforms {
	// geometry?: PlaneGeometry
}

export { ThreeBackgroundShader }
