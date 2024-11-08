import { Vector3 } from 'three'
import { ThreeActionAnimate, ThreeActionAnimateOptions } from '../animates/ActionAnimate'
import { ThreePlugin } from '../core/Plugin'
import { ThreeEventDispatcherParams } from '../core/PluginDispatcher'
import { ThreeViewer } from '../core/Viewer'
import { extend } from '../utils/extend'

class ThreeActionControls extends ThreePlugin {
	static Options: ThreeActionControlsOptions = { ...ThreeActionAnimate.Options }

	name = 'Controls.Action'
	options = {} as Required<ThreeActionControlsOptions>
	animate!: ThreeActionAnimate

	constructor(options?: ThreeActionControlsOptions) {
		super()
		this.setOptions(options)
	}

	initialize(viewer: ThreeViewer): void {
		this.viewer = viewer
		this.animate = new ThreeActionAnimate()
	}

	setOptions(options?: ThreeActionControlsOptions) {
		this.options = extend(true, {}, ThreeActionControls.Options, options || {})
	}

	capture({ mesh, point }: ThreeEventDispatcherParams) {
		if (this.viewer && !mesh && point) {
			this.animate.options.position = point
			this.viewer.animator.animate(this.animate)
		}
	}

	render() {}

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
