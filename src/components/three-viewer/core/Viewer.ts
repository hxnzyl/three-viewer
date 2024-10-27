import { EventListenerQueue } from 'events-ns'
import {
	AmbientLight,
	AnimationAction,
	AnimationClip,
	AnimationMixer,
	Box3,
	Cache,
	Camera,
	Clock,
	Color,
	DirectionalLight,
	Group,
	Light,
	LineBasicMaterial,
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
	PMREMGenerator,
	PerspectiveCamera,
	Raycaster,
	SRGBColorSpace,
	Scene,
	Skeleton,
	SkeletonHelper,
	SkinnedMesh,
	Texture,
	Vector2,
	Vector3,
	WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module'
import { Easing, Tween } from 'three/examples/jsm/libs/tween.module'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { ThreeEnvironment, ThreeEnvironments } from '../config/Environments'
import { AnyObject, NumberObject } from '../types'
import { assertUrl } from '../utils/detect'
import { extend } from '../utils/extend'
import { addMouseEventListener, areVector3Close, materialToArray } from '../utils/three'
import { ThreePlugin } from './Plugin'
import { ThreePluginDispatcher } from './PluginDispatcher'

Cache.enabled = true

class ThreeViewer extends ThreePluginDispatcher {
	static Options: ThreeViewerOptions = {
		// domElement: undefined,
		visibility: 'hidden',
		width: '',
		height: '',
		kiosk: false,
		// 渲染的生命周期(秒)
		renderLifeTime: 3,
		textureColorSpace: 'sRGB',
		outputColorSpace: 'sRGB',
		// 插件
		plugins: [],
		// 相机配置项
		// position: undefined,
		fov: 75,
		near: 0.1,
		far: 1000,
		// 环境光
		ambientColor: 0xffffff,
		ambientIntensity: 2,
		// 平行光
		directNumber: 3,
		directColor: 0xffffff,
		directIntensity: 0.5
	}

	private renderClock: Clock
	private renderTimer?: number
	private renderCount: number = 0
	private renderLookAt: number[][] = []
	private lockRenderTimer?: NodeJS.Timeout

	private renderBinded: () => void
	private activateBinded: () => void
	private inactivateBinded: () => void

	private tween?: Tween<NumberObject>
	private raycaster!: Raycaster

	listener!: EventListenerQueue
	options = {} as Required<ThreeViewerOptions>
	width: number = 0
	height: number = 0
	clips: AnimationClip[] = []
	actions: AnyObject<AnimationAction> = {}
	runningActions: string[] = []
	lights: Light[] = []
	meshes: Mesh[] = []
	morphs: Mesh[] = []
	cameras: Camera[] = []
	skeletons: Skeleton[] = []
	materials: Material[] = []
	skeletonHelpers: SkeletonHelper[] = []

	domElement!: HTMLElement
	renderer!: WebGLRenderer
	controls!: OrbitControls
	camera!: Camera
	scene!: Scene
	environment?: ThreeEnvironment
	object?: Group<Object3DEventMap>
	objectBox3!: Box3
	objectCenter!: Vector3
	objectSize!: Vector3
	objectDistance: number = 0
	mixer?: AnimationMixer

	constructor(options?: ThreeViewerOptions) {
		super()
		this.renderClock = new Clock()
		this.listener = new EventListenerQueue([])
		this.renderBinded = this.render.bind(this)
		this.activateBinded = this.activate.bind(this)
		this.inactivateBinded = this.inactivate.bind(this)
		// 设置参数
		this.setOptions(options)
		// 创建DOM
		this.createDomElement()
		// 设置渲染
		this.setRender()
		// 设置场景
		this.setScene()
		// 设置相机
		this.setCamera()
		// 设置控制器
		this.setControls()
		// 设置反射
		this.setRaycaster()
		// 添加插件
		this.addPlugins(this.options.plugins)
		// 设置事件
		this.setEvent()
		// 添加事件
		this.listener.addEventListener()
	}

	setOptions(options?: ThreeViewerOptions) {
		this.options = extend(true, {}, ThreeViewer.Options, options || {})
	}

	private setEvent() {
		// 点击模型捕获
		addMouseEventListener(
			this,
			this.domElement,
			this.hasPlugin('Effects.Selected') &&
				((event: MouseEvent) => {
					this.dispatchPlugin(
						'capture',
						this.capture(new Vector2((event.clientX / this.width) * 2 - 1, -(event.clientY / this.height) * 2 + 1))
					)
				}),
			(event: MouseEvent) => {
				// 获取鼠标位置
				const X = ((event.clientX / this.width) * 2 - 1) * 100
				const Y = (-(event.clientY / this.height) * 2 + 1) * 100
				// 将相机聚焦到这个点
				const { x, y, z } = this.camera.position
				this.renderLookAt.push([X + x, Y + y, z - 50])
			}
		)
		// tab可见时渲染
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
		// 窗口大小发生变化
		this.listener.push(
			window,
			'resize',
			() => {
				if (!this.updateDomElementSize()) return

				this.activate()

				this.camera.aspect = this.width / this.height
				this.camera.updateProjectionMatrix()
				this.renderer.setSize(this.width, this.height)

				this.dispatchPlugin('onResize')
			},
			false
		)
	}

	//#region Render
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
		this.renderCount = 0

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

		this.renderer.setClearColor(0xffffff, 1)
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(this.width, this.height)

		this.domElement.appendChild(this.renderer.domElement)
	}

	private setControls() {
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		// this.controls = new TrackballControls(this.camera, this.renderer.domElement)
		// this.controls.rotateSpeed = 3
		this.controls.autoRotate = false
		this.controls.screenSpacePanning = true
		// up
		this.controls.minPolarAngle = 0
		// down
		this.controls.maxPolarAngle = Math.PI
		this.listener.push(this.controls, 'change', this.activateBinded, 'controls-change')
	}

	loadUrl(url: string) {
		assertUrl(url)

		const isObj = url.endsWith('.obj')
		const loader = isObj
			? new OBJLoader()
			: new GLTFLoader()
					.setCrossOrigin('anonymous')
					.setDRACOLoader(new DRACOLoader().setDecoderPath('wasm/'))
					.setKTX2Loader(new KTX2Loader().setTranscoderPath('wasm/').detectSupport(this.renderer))
					.setMeshoptDecoder(MeshoptDecoder)

		loader.load(
			url,
			(data: GLTF | Group<Object3DEventMap>) => {
				const dataAsGLTF = data as GLTF
				const dataAsGroup = data as Group<Object3DEventMap>

				const scene: Group<Object3DEventMap> = isObj ? dataAsGroup : dataAsGLTF.scene || dataAsGLTF.scenes[0]

				this.update(scene, data.animations)

				// See: https://github.com/google/draco/issues/349
				// DRACOLoader.releaseDecoderModule();

				this.dispatchEvent({ type: 'loaded', data })
			},
			(data) => {
				this.dispatchEvent({ type: 'progress', data })
			},
			(error: any) => {
				const message = error?.message || error + ''
				if (message.match(/ProgressEvent/)) {
					error.message = 'Unable to retrieve this file. Check JS console and browser network tab.'
				} else if (message.match(/Unexpected token/)) {
					error.message = `Unable to parse file content. Verify that this file is valid. Error: "${message}"`
				} else if (error && error.target && error.target instanceof Image) {
					error.message = 'Missing texture: ' + error.target.src.split('/').pop()
				}
				this.dispatchEvent({ type: 'error', data: error })
			}
		)

		return this
	}

	update(object: Group<Object3DEventMap>, clips: AnimationClip[]) {
		this.hide()

		this.object = object
		this.objectBox3 = new Box3().setFromObject(object)
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

		this.controls.enabled = true

		this.skeletons = []
		this.meshes = []
		this.materials = []
		this.morphs = []
		this.cameras = []
		this.lights = []

		this.object.traverse((node: Object3D<Object3DEventMap>) => {
			// 设置模型生成阴影并接收阴影
			node.castShadow = true
			node.receiveShadow = true
			// 灯光
			if (node instanceof Light) {
				this.lights.push(node)
			}
			// 相机
			else if (node instanceof Camera) {
				node.name = node.name || `ThreeViewer_Camera_${this.cameras.length + 1}`
				this.cameras.push(node)
			}
			// 网格
			else if (node instanceof Mesh) {
				const mesh = node as Mesh
				this.meshes.push(mesh)

				// 网格材料
				materialToArray(mesh.material).forEach((material: Material) => {
					// TODO(https://github.com/mrdoob/three.js/pull/18235): Clean up.
					material.depthWrite = !material.transparent
					// 放射光颜色与放射光贴图 不设置可能导致黑模
					if (material instanceof MeshStandardMaterial || material instanceof MeshPhongMaterial) {
						material.emissive = material.color
						material.emissiveMap = material.emissiveMap || material.map
						this.updateTextureColorSpace(material, this.options.textureColorSpace)
					}
					this.materials.push(material)
				})

				// 变形动画
				if (mesh.morphTargetInfluences) {
					this.morphs.push(mesh)
				}
				// 骨骼
				else if (mesh instanceof SkinnedMesh) {
					this.skeletons.push(mesh.skeleton)
				}
			}
		})

		this.lights.length || this.addLights()

		this.updateClips(clips)

		this.dispatchPlugin('update')

		this.show()

		// 开始渲染
		this.start()
	}

	capture(vector: Vector2) {
		this.raycaster.setFromCamera(vector, this.camera)
		// gltf文件需要深度查找
		// const objects = this.raycaster.intersectObjects(this.scene.children, true)
		const objects = this.raycaster.intersectObject(this.scene, true)
		for (const object3d of objects) {
			if (object3d.object instanceof Mesh) {
				return object3d.object
			}
		}
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
		if (this.renderCount > 0) {
			const lookAt = this.renderLookAt.shift()
			lookAt && this.camera.lookAt(lookAt[0], lookAt[1], lookAt[2])

			this.renderer.render(this.scene, this.camera)

			// from created to current seconds
			const delta = this.renderClock.getDelta()

			this.mixer?.update(delta)
			this.controls?.update()

			this.dispatchPlugin('render')

			this.tween?.update()
		}

		this.renderTimer = requestAnimationFrame(this.renderBinded)
	}

	start() {
		if (this.object && !this.renderTimer) {
			console.info('ThreeBuilder: start.', Date.now())
			this.render()
		}
	}

	pause() {
		if (this.renderTimer) {
			console.info('ThreeBuilder: pause.', Date.now())
			cancelAnimationFrame(this.renderTimer)
			this.renderTimer = 0
		}
	}

	activate() {
		if (this.renderCount++ == 0) console.info('ThreeBuilder: activate.', Date.now())
		// 无论什么情况下都要清除定时器，否则会掉帧
		clearTimeout(this.lockRenderTimer)
		// 有动画运行时不自动禁用
		if (this.runningActions.length > 0) return
		const { renderLifeTime = 1 } = this.options
		this.lockRenderTimer = setTimeout(this.inactivateBinded, renderLifeTime * 1000)
	}

	inactivate() {
		if (this.renderCount > 0) {
			console.info('ThreeBuilder: inactivate.', Date.now())
			clearTimeout(this.lockRenderTimer)
			this.renderCount = 0
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
		// 移除事件
		this.listener.removeAllEventListeners()
		// 销毁插件
		this.dispatchPlugin('dispose')
		// 销毁渲染器
		this.renderer.dispose()
		// 移除渲染器节点
		this.domElement.removeChild(this.renderer.domElement)
		// 释放一些资源（不是必要的，JS会自行回收）
		this.renderer = null as any
	}
	//#endregion Render

	//#region Scene
	private setScene() {
		this.scene = new Scene()
		this.listener.push(this.scene, 'added', this.activateBinded, 'scene-added')
	}

	private setCamera() {
		const { near, far, fov } = this.options
		const aspect = this.width / this.height
		this.camera = new PerspectiveCamera(fov, aspect, near, far)
		this.scene.add(this.camera)
	}

	private setRaycaster() {
		this.raycaster = new Raycaster()
	}

	updateCamera(name: string) {
		// @TODO
	}
	//#endregion Scene

	//#region Plugin
	updateBackground(color1: string | number, color2: string | number) {
		const backShader = this.getPlugin('Shaders.Background')
		if (backShader) {
			backShader.update({ color1: new Color(color1), color2: new Color(color2) })
		} else {
			this.scene.background = new Color(color1)
		}
	}

	updateEnvironment(name: string, background: boolean) {
		this.environment = ThreeEnvironments.find((entry) => entry.name === name)
		if (!this.environment) return
		const { path } = this.environment,
			resolve = (envMap: Texture | null) => {
				const backShader = this.getPlugin('Shaders.Background')
				// 隐藏背景
				if (backShader) !envMap && background ? backShader.show() : backShader.hide()
				// 设置背景
				this.scene.background = background ? envMap : null
				// 设置环境
				this.scene.environment = envMap
			}
		if (path) {
			// 加载环境贴图
			new RGBELoader().load(path, (texture) => {
				// 通过PMREMGenerator将HDR纹理生成立方体贴图，并将其用作背景和环境光照
				const pmremGenerator = new PMREMGenerator(this.renderer)
				pmremGenerator.compileEquirectangularShader()
				const envMap = pmremGenerator.fromEquirectangular(texture).texture
				pmremGenerator.dispose()
				texture.dispose()
				resolve(envMap)
			})
		} else {
			resolve(null)
		}
	}
	//#endregion Plugin

	//#region Animate
	animate(toPosition: Vector3, toUp: Vector3) {
		if (!this.object) return

		const { position, up } = this.camera
		const { target } = this.controls

		// lookAt center
		const toTarget = this.objectCenter.normalize()

		// calculate new position and keep distance
		toPosition.subVectors(toTarget, toPosition.setLength(this.objectDistance))

		// position and up same then return
		if (areVector3Close(position, toPosition) && areVector3Close(up, toUp)) return

		this.controls.enabled = false

		const _this = this

		toUp.normalize()

		this.tween = new Tween({
			x1: position.x,
			y1: position.y,
			z1: position.z,
			x2: up.x,
			y2: up.y,
			z2: up.z,
			x3: target.x,
			y3: target.y,
			z3: target.z
		})

		this.tween.to(
			{
				x1: toPosition.x,
				y1: toPosition.y,
				z1: toPosition.z,
				x2: toUp.x,
				y2: toUp.y,
				z2: toUp.z,
				x3: toTarget.x,
				y3: toTarget.y,
				z3: toTarget.z
			},
			1000
		)

		this.tween.easing(Easing.Sinusoidal.InOut)

		this.tween.onUpdate(function (p) {
			position.x = p.x1
			position.y = p.y1
			position.z = p.z1
			up.x = p.x2
			up.y = p.y2
			up.z = p.z2
			target.x = p.x3
			target.y = p.y3
			target.z = p.z3
			_this.camera.updateMatrixWorld()
		})

		this.tween.onComplete(function () {
			_this.controls.enabled = true
		})

		this.tween.start()
	}

	updateClips(clips: AnimationClip[]) {
		if (this.object) {
			this.removeClips()
			this.clips = clips
			this.actions = {}
			this.runningActions = []
			if (clips.length == 0) {
				this.mixer = undefined
			} else {
				this.mixer = new AnimationMixer(this.object)
				// play idle animate
				for (const clip of clips) {
					if (clip.name === 'Idle') {
						this.playClip(clip)
					}
					this.actions[clip.name] = this.mixer.clipAction(clip)
				}
			}
		}
	}

	playClip(name: string | AnimationClip) {
		if (this.mixer) {
			const clip = typeof name === 'string' ? this.clips.find((clip) => clip.name === name) : name
			if (clip) {
				this.mixer.clipAction(clip).reset().play()
				this.runningActions.push(clip.name)
				this.activate()
			}
		}
	}

	pauseClip(name: string | AnimationClip) {
		if (this.mixer) {
			const clip = typeof name === 'string' ? this.clips.find((clip) => clip.name === name) : name
			if (clip) {
				this.mixer.clipAction(clip).reset().stop()
				this.runningActions.splice(this.runningActions.indexOf(clip.name), 1)
				this.runningActions.length || this.activate()
			}
		}
	}

	playAllClips() {
		if (this.mixer) {
			this.runningActions = this.clips.map((clip) => (this.mixer?.clipAction(clip).reset().play(), clip.name))
			this.activate()
		}
	}

	pauseAllClips() {
		if (this.mixer) {
			this.mixer.stopAllAction()
			this.runningActions = []
			this.activate()
		}
	}

	removeClips() {
		if (this.mixer) {
			this.mixer.stopAllAction().uncacheRoot(this.mixer.getRoot())
			this.clips = []
			this.actions = {}
			this.runningActions = []
			this.mixer = undefined
		}
	}
	//#endregion Animate

	//#region Lights
	private addLights() {
		const { ambientColor, ambientIntensity, directNumber, directColor, directIntensity } = this.options

		// 环境光
		const light1 = new AmbientLight(ambientColor, ambientIntensity)
		light1.name = 'Ambient Light'
		this.scene.add(light1)
		this.lights.push(light1)

		// 平行光
		for (let i = 0; i < directNumber; i++) {
			const light2 = new DirectionalLight(directColor, directIntensity)
			light2.position.set(Math.random() * 10 - 5, Math.random() * 10, Math.random() * 10 - 5)
			light2.name = 'Directional Light ' + (i + 1)
			this.scene.add(light2)
			this.lights.push(light2)
		}
	}

	showLights() {
		this.lights.forEach((light) => (light.visible = true))
	}

	hideLights() {
		this.lights.forEach((light) => (light.visible = false))
	}
	//#endregion Lights

	//#region Display
	private addSkeletonHelpers() {
		this.skeletons.forEach((skeleton) => {
			const object = skeleton.bones[0]?.parent
			if (!object) return
			const helper = new SkeletonHelper(object)
			materialToArray<LineBasicMaterial>(helper.material).forEach((material) => (material.linewidth = 3))
			this.scene?.add(helper)
			this.skeletonHelpers.push(helper)
		})
	}

	private removeSkeletonHelpers() {
		this.skeletonHelpers.forEach((helper) => helper.parent?.remove(helper))
		this.skeletonHelpers = []
	}

	updateWireframe(wireframe: boolean) {
		this.materials.forEach((material) => {
			if (
				// 显示基本材质的线框
				material instanceof MeshBasicMaterial ||
				// 显示基于光照的线框效果
				material instanceof MeshLambertMaterial ||
				// 适用于具有高光和反射的材质，支持线框显示
				material instanceof MeshPhongMaterial ||
				// 现代材质，支持物理渲染，也可以使用线框显示
				material instanceof MeshStandardMaterial ||
				// 与 MeshStandardMaterial 类似，但提供更多的物理特性，也支持线框显示
				material instanceof MeshPhysicalMaterial
			) {
				material.wireframe = wireframe
			}
		})
	}

	updateSkeleton(skeleton: boolean) {
		const hasSkeleton = this.skeletonHelpers.length > 0
		skeleton ? hasSkeleton || this.addSkeletonHelpers() : hasSkeleton && this.removeSkeletonHelpers()
	}

	updateTexturesColorSpace(colorSpace: string) {
		this.materials.forEach((material) => {
			if (
				material instanceof MeshLambertMaterial ||
				material instanceof MeshPhongMaterial ||
				material instanceof MeshStandardMaterial ||
				material instanceof MeshPhysicalMaterial
			) {
				this.updateTextureColorSpace(material, colorSpace)
			}
		})
	}

	updateTextureColorSpace(
		material: MeshLambertMaterial | MeshPhongMaterial | MeshStandardMaterial | MeshPhysicalMaterial,
		colorSpace: string
	) {
		if (material.map) {
			material.map.colorSpace = colorSpace === 'sRGB' ? SRGBColorSpace : LinearSRGBColorSpace
		}
		if (material.emissiveMap) {
			material.emissiveMap.colorSpace = colorSpace === 'sRGB' ? SRGBColorSpace : LinearSRGBColorSpace
		}
		if (material.map || material.emissiveMap) {
			material.needsUpdate = true
		}
	}

	updateOutputColorSpace(colorSpace: string) {
		this.renderer.outputColorSpace = colorSpace === 'sRGB' ? SRGBColorSpace : LinearSRGBColorSpace
		this.materials.forEach((material) => (material.needsUpdate = true))
	}
	//#endregion Display
}

export interface ThreeViewerOptions {
	domElement?: HTMLElement
	visibility?: 'hidden' | 'visible'
	width?: string | number
	height?: string | number
	kiosk?: boolean
	// 渲染的生命周期(秒)
	renderLifeTime?: number
	textureColorSpace?: 'sRGB' | 'Linear'
	outputColorSpace?: 'sRGB' | 'Linear'
	// 插件
	plugins?: ThreePlugin[]
	// 初始定位，默认居中
	position?: []
	near?: number
	// 渲染范围
	far?: number
	fov?: number
	// 环境光
	ambientColor?: number
	ambientIntensity?: number
	// 平行光
	directNumber?: number
	directColor?: number
	directIntensity?: number
}

export { ThreeViewer }