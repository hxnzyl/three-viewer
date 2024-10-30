import { Group, LineBasicMaterial, SkeletonHelper } from 'three'

import { ThreePlugin } from '../../core/Plugin'
import { ThreeViewer } from '../../core/Viewer'
import { AnyObject } from '../../types'
import ThreeMaterialUtils from '../../utils/Material'
import { extend } from '../../utils/extend'

class ThreeSkeletonHelper extends ThreePlugin {
	static Options: ThreeSkeletonHelperOptions = {
		lineWidth: 3
	}

	name = 'Helpers.Skeleton'
	options = {} as Required<ThreeSkeletonHelperOptions>
	private skeletonHelper?: Group

	// @overwrite
	constructor(options?: ThreeSkeletonHelperOptions) {
		super()
		this.setOptions(options)
	}

	// @overwrite
	initialize(viewer: ThreeViewer) {
		this.viewer = viewer
	}

	// @overwrite
	setOptions(options?: ThreeSkeletonHelperOptions) {
		this.options = extend(true, {}, ThreeSkeletonHelper.Options, options || {})
	}

	// @overwrite
	update(group: AnyObject) {
		this.hide()
		const { skeletons } = group
		this.skeletonHelper = new Group()
		for (const skeleton of skeletons) {
			const object = skeleton.bones[0]?.parent
			if (object) {
				const helper = new SkeletonHelper(object)
				const materials = ThreeMaterialUtils.materialToArray<LineBasicMaterial>(helper.material)
				for (const material of materials) {
					material.linewidth = this.options.lineWidth
				}
				this.skeletonHelper.add(helper)
			}
		}
		this.show()
	}

	// @overwrite
	show() {
		if (this.skeletonHelper) {
			this.viewer.scene.add(this.skeletonHelper)
		}
	}

	// @overwrite
	hide() {
		if (this.skeletonHelper) {
			this.viewer.scene.remove(this.skeletonHelper)
		}
	}

	// @overwrite
	resize() {}

	// @overwrite
	dispose() {
		if (this.skeletonHelper) {
			this.hide()
			this.skeletonHelper.clear()
			this.skeletonHelper = undefined
		}
	}
}

export interface ThreeSkeletonHelperOptions {
	lineWidth?: number
}

export { ThreeSkeletonHelper }

