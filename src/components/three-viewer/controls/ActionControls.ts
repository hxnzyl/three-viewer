import { Group, Vector3 } from 'three'
import { ThreeActionAnimate, ThreeActionAnimateOptions } from '../animates/ActionAnimate'
import { ThreePlugin } from '../core/Plugin'
import { ThreeEventDispatcherParams } from '../core/PluginDispatcher'
import { ThreeViewer } from '../core/Viewer'
import ThreeEventUtils, { ThreeKeyboardEventKeys } from '../utils/Event'
import { extend } from '../utils/extend'

class ThreeActionControls extends ThreePlugin {
	static Options: ThreeActionControlsOptions = { ...ThreeActionAnimate.Options }

	name = 'Controls.Action'
	options = {} as Required<ThreeActionControlsOptions>
	object!: Group
	animate!: ThreeActionAnimate
	direction?: ThreeKeyboardEventKeys

	constructor(options?: ThreeActionControlsOptions) {
		super()
		this.setOptions(options)
	}

	initialize(viewer: ThreeViewer): void {
		this.viewer = viewer
		this.animate = new ThreeActionAnimate()
		ThreeEventUtils.addKeyboard({
			viewer,
			keys: ['w', 'a', 's', 'd'],
			press: (event, from, keys) => {
				this.direction = keys.join('') as ThreeKeyboardEventKeys
			}
		})
	}

	setOptions(options?: ThreeActionControlsOptions) {
		this.options = extend(true, {}, ThreeActionControls.Options, options || {})
	}

	capture({ mesh, point }: ThreeEventDispatcherParams) {
		if (this.viewer?.object && !mesh && point) {
			this.object = this.viewer.object
			this.animate.options.position = point
			this.viewer.animator.animate(this.animate)
		}
	}

	render() {
		if (!this.direction) return
		const { object } = this.viewer!
		if (!object) return
		const { position, quaternion } = object
		const { speed } = this.options
		if (this.direction == 'w') {
			position.z -= speed
		} else if (this.direction == 'wa') {
			position.z -= speed
			position.x -= speed
		} else if (this.direction == 'wd') {
			position.z -= speed
			position.x += speed
		} else if (this.direction == 'a') {
			position.x -= speed
		} else if (this.direction == 'as') {
			position.x -= speed
			position.z += speed
		} else if (this.direction == 'aw') {
			position.x -= speed
			position.z -= speed
		} else if (this.direction == 's') {
			position.z += speed
		} else if (this.direction == 'sa') {
			position.z += speed
			position.x -= speed
		} else if (this.direction == 'sd') {
			position.z += speed
			position.x += speed
		} else if (this.direction == 'd') {
			position.x += speed
		} else if (this.direction == 'dw') {
			position.x += speed
			position.z -= speed
		} else if (this.direction == 'ds') {
			position.x += speed
			position.z += speed
		}
	}

	update(params?: ThreeEventDispatcherParams): void {
		this.animate.options.position = new Vector3()
	}

	show(): void {
		throw new Error('Method not implemented.')
	}

	hide(): void {
		throw new Error('Method not implemented.')
	}

	dispose(): void {}
}

export interface ThreeActionControlsOptions extends ThreeActionAnimateOptions {}

export { ThreeActionControls }
