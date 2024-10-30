import { Group, PMREMGenerator, Texture, WebGLRenderer } from 'three'
// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { ThreeEventDispatcherParams, ThreePluginDispatcher } from './PluginDispatcher'

class ThreeLoader extends ThreePluginDispatcher {
	loadScene(url: string, resolved: boolean = false) {
		return new Promise<ThreeEventDispatcherParams | null>((resolve, reject) => {
			new GLTFLoader()
				.setCrossOrigin('anonymous')
				.setDRACOLoader(new DRACOLoader().setDecoderPath('/three-viewer/wasm/draco/'))
				.setKTX2Loader(new KTX2Loader().setTranscoderPath('/three-viewer/wasm/basis/'))
				.setMeshoptDecoder(MeshoptDecoder)
				.load(
					url,
					(gltf: GLTF) => {
						const data: ThreeEventDispatcherParams = { group: gltf.scene || gltf.scenes[0], clips: gltf.animations }
						resolve(data)
						this.dispatchEvent({ type: 'onLoadScene', ...data })
					},
					(data) => {
						this.dispatchEvent({ type: 'onProgressScene', data })
					},
					(error) => {
						resolved ? resolve(null) : reject()
						this.dispatchEvent({ type: 'onErrorScene', error })
					}
				)
		})
	}

	loadObject(url: string, resolved: boolean = false) {
		return new Promise<Group | null>((resolve, reject) => {
			new OBJLoader().load(
				url,
				(group: Group) => {
					resolve(group)
					this.dispatchEvent({ type: 'onLoadObject', group })
				},
				(event) => {
					this.dispatchEvent({ type: 'onProgressObject', event })
				},
				(error) => {
					resolved ? resolve(null) : reject()
					this.dispatchEvent({ type: 'onErrorObject', error })
				}
			)
		})
	}

	loadEnvrionment(renderer: WebGLRenderer, url: string, resolved: boolean = false) {
		return new Promise<Texture | null>((resolve, reject) => {
			new RGBELoader().load(
				url,
				(texture) => {
					// Generate cube maps from HDR textures through PMREMGenerator
					// Utilize them as backgrounds and ambient lighting.
					const pmremGenerator = new PMREMGenerator(renderer)
					pmremGenerator.compileEquirectangularShader()
					const envMap = pmremGenerator.fromEquirectangular(texture).texture
					pmremGenerator.dispose()
					texture.dispose()
					this.dispatchEvent({ type: 'onLoadTexture', texture: envMap })
					resolve(envMap)
				},
				(data) => {
					this.dispatchEvent({ type: 'onProgressTexture', data })
				},
				(error) => {
					resolved ? resolve(null) : reject()
					this.dispatchEvent({ type: 'onErrorTexture', error })
				}
			)
		})
	}
}

export { ThreeLoader }
