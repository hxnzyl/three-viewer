import {
	BoxHelper,
	Color,
	ColorRepresentation,
	Material,
	Mesh,
	MeshPhongMaterial,
	MeshStandardMaterial,
	Vector2
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import { extend } from '../../utils/extend'
import { materialToArray } from '../../utils/three'

class ThreeShineEffect extends ThreePlugin {
	static Options: ThreeShineEffectOptions = {
		// 选中盒子边框颜色
		selectedBoxColor: 0x002fa7,
		// 呼吸显示的颜色
		visibleEdgeColor: 0x00ff00,
		// 呼吸消失的颜色
		hiddenEdgeColor: 0xff0000
	}

	name = 'Effects.Selected.Halation'
	options = {} as Required<ThreeShineEffectOptions>

	private mesh?: Mesh
	private boxHelper?: BoxHelper

	private composer!: EffectComposer
	private renderPass!: RenderPass
	private outlinePass!: OutlinePass
	private shaderPass!: ShaderPass

	// @overwrite
	constructor(options?: ThreeShineEffectOptions) {
		super()
		this.setOptions(options)
	}

	// @overwrite
	initialize(viewer: ThreeViewer) {
		if (this.viewer) return

		this.viewer = viewer
		const { renderer, scene, camera, width: clientWidth, height: clientHeight } = viewer
		const { visibleEdgeColor, hiddenEdgeColor } = this.options

		// 创建一个EffectComposer（效果组合器）对象，然后在该对象上添加后期处理通道。
		this.composer = new EffectComposer(renderer)

		// 新建一个场景通道  为了覆盖到原理来的场景上
		this.renderPass = new RenderPass(scene, camera)
		this.composer.addPass(this.renderPass)

		// 物体边缘发光通道
		this.outlinePass = new OutlinePass(new Vector2(clientWidth, clientHeight), scene, camera)
		this.outlinePass.edgeStrength = 10.0 // 边框的亮度
		this.outlinePass.edgeGlow = 1 // 光晕[0,1]
		this.outlinePass.usePatternTexture = false // 是否使用父级的材质
		this.outlinePass.edgeThickness = 0.5 // 边框宽度
		this.outlinePass.downSampleRatio = 2 // 边框弯曲度
		this.outlinePass.pulsePeriod = 5 // 呼吸闪烁的速度
		if (visibleEdgeColor) this.outlinePass.visibleEdgeColor.set(visibleEdgeColor) // 呼吸显示的颜色
		if (hiddenEdgeColor) this.outlinePass.hiddenEdgeColor.set(hiddenEdgeColor) // 呼吸消失的颜色
		this.outlinePass.clear = true
		this.composer.addPass(this.outlinePass)

		// 自定义的着色器通道 作为参数
		this.shaderPass = new ShaderPass(FXAAShader)
		this.shaderPass.uniforms.resolution.value.set(1 / viewer.width, 1 / viewer.height)
		this.shaderPass.renderToScreen = true
		this.composer.addPass(this.shaderPass)
	}

	// @overwrite
	setOptions(options?: ThreeShineEffectOptions) {
		this.options = extend(true, {}, ThreeShineEffect.Options, options || {})
	}

	// @overwrite
	update(): void {}

	// @overwrite
	render() {
		this.composer?.render()
		this.boxHelper?.update()
	}

	// @overwrite
	show() {
		if (!this.mesh) return

		const { selectedBoxColor } = this.options

		materialToArray(this.mesh.material).forEach((material: Material) => {
			if (material instanceof MeshStandardMaterial || material instanceof MeshPhongMaterial) {
				if (material.emissive) {
					// @ts-ignore private _emissiveHex
					material._emissiveHex = material._emissiveHex || material.emissive.getHex()
					material.emissive.set(selectedBoxColor)
				} else {
					material.emissive = new Color(selectedBoxColor)
				}
			}
		})

		if (this.outlinePass) {
			this.outlinePass.selectedObjects = [this.mesh]
		}

		if (this.boxHelper) {
			this.boxHelper.setFromObject(this.mesh)
		} else {
			this.boxHelper = new BoxHelper(this.mesh, selectedBoxColor)
			this.viewer.scene.add(this.boxHelper)
		}
	}

	// @overwrite
	hide() {
		if (this.mesh) {
			materialToArray(this.mesh.material).forEach((material: Material) => {
				// @ts-ignore private _emissiveHex
				if (material._emissiveHex) {
					// @ts-ignore private _emissiveHex
					material.emissive.set(material._emissiveHex)
				}
			})
		}

		if (this.outlinePass) {
			this.outlinePass.selectedObjects = []
		}

		if (this.boxHelper) {
			this.viewer.scene.remove(this.boxHelper)
		}
	}

	clear() {
		this.hide()
		this.mesh = undefined
		this.boxHelper = undefined
	}

	// @overwrite
	dispose() {
		if (this.composer) {
			this.clear()
			this.composer.dispose()
			this.composer = null as any
		}
	}

	// @overwrite
	capture(object?: Mesh) {
		if (!object || object !== this.mesh) this.clear()
		if (object) {
			this.setMesh(object)
			this.show()
		}
	}

	getMesh() {
		return this.mesh
	}

	setMesh(mesh: Mesh) {
		this.mesh = mesh
	}
}

export interface ThreeShineEffectOptions {
	//选中盒子边框颜色
	selectedBoxColor?: ColorRepresentation
	// 呼吸显示的颜色
	visibleEdgeColor?: ColorRepresentation
	// 呼吸消失的颜色
	hiddenEdgeColor?: ColorRepresentation
}

export { ThreeShineEffect }
