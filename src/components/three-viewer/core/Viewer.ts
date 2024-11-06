import { EventListenerQueue } from 'events-ns'
import {
	Box3,
	Cache,
	Camera,
	Color,
	Group,
	Light,
	LinearSRGBColorSpace,
	Material,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	MeshPhongMaterial,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	Object3D,
	Object3DEventMap,
	PerspectiveCamera,
	Plane,
	Raycaster,
	SRGBColorSpace,
	Scene,
	Skeleton,
	SkinnedMesh,
	Texture,
	Vector2,
	Vector3,
	WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { ThreeAnimator, ThreeAnimatorOptions } from '../animates/Animator'
import { ThreeWalkAnimate } from '../animates/Walk'
import { ThreeEnvironment, ThreeEnvironments } from '../config/Environments'
import ThreeEventUtils from '../utils/Event'
import ThreeMaterialUtils from '../utils/Material'
import { extend } from '../utils/extend'
import { ThreeLighter, ThreeLighterOptions } from './Lighter'
import { ThreeLoader } from './Loader'
import { ThreePlugin } from './Plugin'
import { ThreeEventDispatcherParams, ThreeEventsObject } from './PluginDispatcher'

Cache.enabled = true

class ThreeViewer extends ThreeLoader {
	static Options: ThreeViewerOptions = {
		// domElement: undefined,
		visibility: 'hidden',
		width: '',
		height: '',
		kiosk: false,
		// 渲染的生命周期(秒)
		lifeTime: 3,
		textureColorSpace: 'sRGB',
		outputColorSpace: 'sRGB',
		// 插件
		plugins: [],
		// 相机配置项
		// position: undefined,
		fov: 75,
		near: 0.1,
		far: 2000
	}

	private renderTimer?: number
	private renderLookAt: number[][] = []
	private inactivateTimer?: NodeJS.Timeout
	private activated: boolean = false

	private renderBinded: () => void
	private activateBinded: () => void
	private inactivateBinded: () => void

	listener: EventListenerQueue
	animator: ThreeAnimator
	lighter: ThreeLighter
	raycaster?: Raycaster
	options = {} as Required<ThreeViewerOptions>
	width: number = 0
	height: number = 0
	meshes: Mesh[] = []
	materials: Material[] = []
	domElement!: HTMLElement
	renderer!: WebGLRenderer
	controls!: OrbitControls
	camera!: Camera
	scene!: Scene
	environment?: ThreeEnvironment
	object?: Group
	objectBox3!: Box3
	objectCenter!: Vector3
	objectSize!: Vector3
	objectDistance: number = 0

	constructor(options?: ThreeViewerOptions) {
		super()
		this.setOptions(options)
		this.animator = new ThreeAnimator(this.options.animator)
		this.listener = new EventListenerQueue([])
		this.animator.initialize(this)
		this.lighter = new ThreeLighter(this.options.lighter)
		// Bind internal event, Transfer this
		this.renderBinded = this.render.bind(this)
		this.activateBinded = this.activate.bind(this)
		this.inactivateBinded = this.inactivate.bind(this)
		this.createDomElement()
		this.setRender()
		this.setScene()
		this.setCamera()
		this.setControls()
		this.setEvent()
	}

	setOptions(options?: ThreeViewerOptions) {
		this.options = extend(true, {}, ThreeViewer.Options, options || {})
	}

	private setEvent() {
		ThreeEventUtils.addMouseEventListener({
			viewer: this,
			dom: this.domElement,
			// 点击模型捕获
			click: (event: MouseEvent) => {
				const x = (event.clientX / this.width) * 2 - 1,
					y = -(event.clientY / this.height) * 2 + 1,
					{ objects, point } = this.capture(new Vector2(x, y))
				let mesh
				for (const object3d of objects) {
					if (object3d.object instanceof Mesh) {
						mesh = object3d.object
						break
					}
				}
				this.dispatchPlugin('capture', { mesh })
				if (!mesh && point) {
					this.animator.animate(
						new ThreeWalkAnimate({
							position: point
						})
					)
				}
			}
		})

		// listening visibility change
		this.listener.push(
			document,
			'visibilitychange',
			() => {
				if (document.visibilityState === 'visible') {
					this.start()
				} else {
					this.pause()
				}
			},
			false
		)

		// listening the window resize
		this.listener.push(
			window,
			'resize',
			() => {
				if (!this.updateDomElementSize()) return

				this.activate()

				if (this.camera instanceof PerspectiveCamera) {
					this.camera.aspect = this.width / this.height
					this.camera.updateProjectionMatrix()
				}

				this.renderer.setSize(this.width, this.height)

				this.dispatchPlugin('resize')
			},
			false
		)

		// add events from options
		const { events, plugins } = this.options
		for (const type in events) {
			this.addEventListener(type, events[type])
		}

		// Add loader event
		this.addEventListener('loadScene', this.update)
		this.addEventListener('loadObject', ({ group }) => group && this.add(group))

		// Add Plugins
		this.addPlugin(this.animator)
		this.addPlugin(this.lighter)
		this.addPlugins(plugins)

		// Unified addition of events
		this.listener.addEventListener()
	}

	private createDomElement() {
		if (this.domElement) return
		const { width, height, visibility, domElement } = this.options
		let el = domElement || document.getElementById('three-viewer')
		if (!el) (el = document.createElement('div')), document.body.appendChild(el)
		el.style.cssText = `visibility:${visibility};width:${width};height:${height}`
		el.id = 'three-viewer'
		this.domElement = el
		this.updateDomElementSize()
	}

	private updateDomElementSize() {
		const { clientWidth, clientHeight } = this.domElement
		if (clientWidth === this.width && clientHeight === this.height) return false
		this.width = clientWidth
		this.height = clientHeight
		return true
	}

	private setRender() {
		this.renderer = new WebGLRenderer({
			//canvas是否包含alpha (透明度)。默认为 false
			alpha: true,
			//是否执行抗锯齿。默认为false
			antialias: true,
			//着色器精度。渲染成图片的颜色精度。值：highp/mediump/lowp。默认为highp
			precision: 'highp',
			//提示用户代理怎样的配置更适用于当前WebGL环境。可能是high-performance,low-power或default。默认是default
			powerPreference: 'high-performance',
			//是否保留缓直到手动清除或被覆盖。默认false
			preserveDrawingBuffer: true,
			//是否使用对数深度缓存。如果要在单个场景中处理巨大的比例差异，就有必要使用。默认false
			logarithmicDepthBuffer: true
		})

		this.updateOutputColorSpace(this.options.outputColorSpace)

		// this.renderer.setClearColor(0xffffff, 1)
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(this.width, this.height)

		this.domElement.appendChild(this.renderer.domElement)
	}

	private setControls() {
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.enabled = true
		// this.controls = new TrackballControls(this.camera, this.renderer.domElement)
		// this.controls.rotateSpeed = 3
		// this.controls.autoRotate = false
		// this.controls.screenSpacePanning = true
		// up
		// this.controls.minPolarAngle = 0
		// down
		// this.controls.maxPolarAngle = Math.PI
		this.listener.push(this.controls, 'change', this.activateBinded, 'controls-change')
	}

	private setScene() {
		this.scene = new Scene()
		// this.listener.push(this.scene, 'childadded', this.activateBinded, 'scene-childadded')
		this.listener.push(this.scene, 'childremoved', this.activateBinded, 'scene-childremoved')
	}

	private setCamera() {
		const { near, far, fov } = this.options
		const aspect = this.width / this.height
		this.camera = new PerspectiveCamera(fov, aspect, near, far)
		this.camera.name = 'ThreeViewer_Camera_Default'
		this.scene.add(this.camera)
	}

	update({ group, clips }: ThreeEventDispatcherParams) {
		this.hide()
		if (!group) return

		this.object = group
		this.updateObject()

		this.meshes = []
		this.materials = []

		const lights: Light[] = []
		const cameras: Camera[] = []
		const morphs: Mesh[] = []
		const skeletons: Skeleton[] = []

		this.object.traverse((node: Object3D<Object3DEventMap>) => {
			// 设置模型生成阴影并接收阴影
			node.castShadow = true
			node.receiveShadow = true
			if (node instanceof Light) {
				// 灯光
				lights.push(node)
			} else if (node instanceof Camera) {
				// 相机
				node.name = node.name || `ThreeViewer_Camera_${cameras.length + 1}`
				cameras.push(node)
			} else if (node instanceof Mesh) {
				// 网格
				const mesh = node as Mesh
				this.meshes.push(mesh)
				// 遍历材料
				const materials = ThreeMaterialUtils.materialToArray(mesh.material)
				for (const material of materials) {
					this.updateTextureColorSpace(material as ThreeMaterialAndTexture, this.options.textureColorSpace)
					this.materials.push(material)
				}
				if (mesh.morphTargetInfluences) {
					// 变形动画
					morphs.push(mesh)
				} else if (mesh instanceof SkinnedMesh) {
					// 骨骼
					skeletons.push(mesh.skeleton)
				}
			}
		})

		this.dispatchPlugin('update', { clips, lights, morphs, skeletons })

		this.show()

		// 开始渲染
		this.start()
	}

	capture(vector: Vector2) {
		const raycaster = new Raycaster()
		raycaster.setFromCamera(vector, this.camera)
		// gltf文件需要深度查找
		// const objects = this.raycaster.intersectObjects(this.scene.children, true)
		const objects = raycaster.intersectObject(this.scene, true)
		// 创建平面 设置平面法向量Vector3 和 原点到平面距离(这里表示无限平面以Y轴为标准平铺在threejs场景中的)
		const plane = new Plane(new Vector3(0, 1, 0), 0)
		// 接受射线和平面的交点(也就是鼠标点击的3D坐标)
		const point = new Vector3()
		// 计算射线和平面的交点
		raycaster.ray.intersectPlane(plane, point)
		return { objects, point }
	}

	add(object: Object3D) {
		this.scene.add(object)
		this.activate()
	}

	show() {
		if (this.object) {
			this.domElement.style.visibility = ''
			this.scene.add(this.object)
		}
	}

	hide() {
		if (this.object) {
			this.domElement.style.visibility = 'hidden'
			this.scene.remove(this.object)
		}
	}

	render() {
		if (this.activated) {
			// const lookAt = this.renderLookAt.shift()
			// lookAt && this.camera.lookAt(lookAt[0], lookAt[1], lookAt[2])

			this.renderer.render(this.scene, this.camera)

			this.controls.update()

			this.dispatchPlugin('render')
		}

		this.renderTimer = requestAnimationFrame(this.renderBinded)
	}

	start() {
		if (this.object && !this.renderTimer) {
			console.info('ThreeViewer: start.', Date.now())
			this.activate()
			this.render()
		}
	}

	pause() {
		if (this.renderTimer) {
			console.info('ThreeViewer: pause.', Date.now())
			cancelAnimationFrame(this.renderTimer)
			this.inactivate()
			this.renderTimer = 0
		}
	}

	activate() {
		// debounce
		clearTimeout(this.inactivateTimer)
		if (this.activated) return
		this.activated = true
		console.info('ThreeViewer: activate.', Date.now())
		if (!this.animator.runningActions.length) {
			// no running animates
			this.inactivateTimer = setTimeout(this.inactivateBinded, this.options.lifeTime * 1000)
		}
	}

	inactivate() {
		if (this.activated) {
			console.info('ThreeViewer: inactivate.', Date.now())
			clearTimeout(this.inactivateTimer)
			this.activated = false
		}
	}

	clear() {
		if (this.object) {
			this.scene.remove(this.object)
			this.object = undefined
		}
	}

	dispose() {
		if (!this.renderer) return
		// 暂停渲染
		this.pause()
		// 清空场景
		this.clear()
		// 移除three事件
		this.listener.removeAllEventListeners()
		// 移除hooks事件
		this.dispatchEvent({ type: 'dispose' })
		// 销毁插件
		this.dispatchPlugin('dispose')
		// 销毁渲染器
		this.renderer.dispose()
		// 移除渲染器节点
		this.domElement.removeChild(this.renderer.domElement)
		// 释放一些资源（不是必要的，JS会自行回收）
		this.renderer = null as any
	}

	updateCamera(name: string) {
		// @TODO
	}

	updateObject() {
		if (this.object) {
			this.objectBox3 = new Box3().setFromObject(this.object)
			this.objectCenter = this.objectBox3.getCenter(new Vector3())
			this.objectSize = this.objectBox3.getSize(new Vector3())
			this.objectDistance = Math.max(this.objectSize.x, this.objectSize.y, this.objectSize.z) * 3
			const { position } = this.options
			if (position) {
				this.camera.position.fromArray(position)
				this.camera.lookAt(new Vector3())
			} else {
				this.camera.position.set(this.objectCenter.x, this.objectCenter.y, this.objectCenter.z + this.objectDistance)
				this.camera.lookAt(this.objectCenter)
			}
		}
	}

	updateBackground(color1: string | number, color2: string | number) {
		const backgroundShader = this.getPlugin('Shaders.Background')
		if (backgroundShader) {
			backgroundShader.update({ color1: new Color(color1), color2: new Color(color2) })
		} else {
			this.scene.background = new Color(color1)
		}
	}

	async updateEnvironment(name: string, background: boolean) {
		this.environment = ThreeEnvironments.find((entry) => entry.name === name)
		if (!this.environment) return
		// Load environment map
		const { path } = this.environment
		const envMap: Texture | null = path ? await this.loadEnvrionment(this.renderer, path, true) : null
		const backgroundShader = this.getPlugin('Shaders.Background')
		if (backgroundShader) !envMap && background ? backgroundShader.show() : backgroundShader.hide()
		this.scene.background = background ? envMap : null
		this.scene.environment = envMap
	}

	updateWireframe(wireframe: boolean) {
		for (const material of this.materials) {
			// @ts-ignore
			material.wireframe = wireframe
		}
	}

	updateTextureColorSpace(material: ThreeMaterialAndTexture, colorSpace: string) {
		// TODO(https://github.com/mrdoob/three.js/pull/18235): Clean up.
		material.depthWrite = !material.transparent
		if (material.color && material.emissive && material.emissive.getHex() === 0x000000) {
			// the self emissive color is the basic color
			// Resolve the black model issue.
			material.emissive = material.color
		}
		if (material.map) {
			// set texture mapping color
			material.map.colorSpace = colorSpace === 'sRGB' ? SRGBColorSpace : LinearSRGBColorSpace
		}
		if (material.emissiveMap) {
			// set self emissive texture color
			material.emissiveMap.colorSpace = colorSpace === 'sRGB' ? SRGBColorSpace : LinearSRGBColorSpace
		} else if (material.map) {
			// set self emissive texture color is the texture mapping color
			material.emissiveMap = material.map
		}
		material.needsUpdate = true
	}

	updateTexturesColorSpace(colorSpace: string) {
		for (const material of this.materials) {
			this.updateTextureColorSpace(material as ThreeMaterialAndTexture, colorSpace)
		}
	}

	updateOutputColorSpace(colorSpace: string) {
		this.renderer.outputColorSpace = colorSpace === 'sRGB' ? SRGBColorSpace : LinearSRGBColorSpace
		for (const material of this.materials) {
			material.needsUpdate = true
		}
	}
}

export type ThreeMaterialAndTexture =
	// 显示基于光照的线框效果
	| MeshLambertMaterial
	// 适用于具有高光和反射的材质，支持线框显示
	| MeshPhongMaterial
	// 现代材质，支持物理渲染，也可以使用线框显示
	| MeshStandardMaterial
	// 与 MeshStandardMaterial 类似，但提供更多的物理特性，也支持线框显示
	| MeshPhysicalMaterial

export type ThreeMaterialAndWireframe =
	// 显示基本材质的线框
	MeshBasicMaterial | ThreeMaterialAndTexture

export interface ThreeViewerOptions {
	domElement?: HTMLElement
	visibility?: 'hidden' | 'visible'
	// kiosk mode
	kiosk?: boolean
	// size
	width?: string | number
	height?: string | number
	// textures
	textureColorSpace?: 'sRGB' | 'Linear'
	outputColorSpace?: 'sRGB' | 'Linear'
	// render life time
	lifeTime?: number
	// plugins
	plugins?: ThreePlugin[]
	// event listener
	events?: ThreeEventsObject
	// animate management
	animator?: ThreeAnimatorOptions
	// light management
	lighter?: ThreeLighterOptions
	// camera
	position?: number[]
	near?: number
	far?: number
	fov?: number
}

export { ThreeViewer }
