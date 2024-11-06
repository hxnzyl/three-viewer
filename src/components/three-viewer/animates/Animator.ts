import { AnimationAction, AnimationClip, AnimationMixer, Clock, Vector3 } from 'three'
import { ThreePlugin } from '../core/Plugin'
import { ThreeEventDispatcherParams } from '../core/PluginDispatcher'
import { ThreeViewer } from '../core/Viewer'
import { AnyObject } from '../types'
import { extend } from '../utils/extend'
import { ThreeAnimate } from './Animate'

class ThreeAnimator extends ThreePlugin {
	static Options: ThreeAnimatorOptions = {}

	name = 'Animator'
	viewer!: ThreeViewer
	options = {} as Required<ThreeAnimatorOptions>
	clock: Clock
	mixer?: AnimationMixer

	clips: AnimationClip[] = []
	animates: AnyObject<ThreeAnimate, string | number> = {}
	actions: AnyObject<AnimationAction> = {}
	runningActions: string[] = []

	constructor(options?: ThreeAnimatorOptions) {
		super()
		this.clock = new Clock()
		this.setOptions(options)
	}

	initialize(viewer: ThreeViewer): void {
		this.viewer = viewer
	}

	setOptions(options?: ThreeAnimatorOptions) {
		this.options = extend(true, {}, ThreeAnimator.Options, options || {})
	}

	// @overwrite
	render() {
		// update users animates
		for (const key in this.animates) {
			this.animates[key].update(this)
		}
		// from created to current seconds
		this.mixer?.update(this.clock.getDelta())
	}

	// @overwrite
	update({ clips }: ThreeEventDispatcherParams) {
		const { object } = this.viewer
		if (!object) return
		this.clear()
		this.clips = clips || []
		this.actions = {}
		this.runningActions = []
		if (!clips || clips.length == 0) {
			this.mixer = undefined
		} else {
			this.mixer = new AnimationMixer(object)
			// play idle animate
			for (const clip of clips) {
				if (clip.name === 'Idle') {
					this.play(clip)
				}
				this.actions[clip.name] = this.mixer.clipAction(clip)
			}
		}
	}

	animate(animater: ThreeAnimate) {
		animater.reconcile(this)
		this.animates[animater.id] = animater
		return this
	}

	// @overwrite
	show(): void {
		this.playAll()
	}

	// @overwrite
	hide(): void {
		this.pauseAll()
	}

	isRunning(name: string) {
		return this.runningActions.includes(name)
	}

	find(name: string | AnimationClip) {
		return typeof name === 'string' ? this.clips.find((clip) => clip.name === name) : name
	}

	findIfIdle(name: string | AnimationClip) {
		const clip = this.find(name)
		return clip && !this.isRunning(clip.name) ? clip : undefined
	}

	findIfRunning(name: string | AnimationClip) {
		const clip = this.find(name)
		return clip && this.isRunning(clip.name) ? clip : undefined
	}

	play(name: string | AnimationClip, timeScale: number = 1) {
		if (this.mixer) {
			const clip = this.find(name)
			if (clip) {
				this.mixer.clipAction(clip).setEffectiveTimeScale(timeScale).setEffectiveWeight(1).fadeIn(0.2).play()
				this.runningActions.push(clip.name)
				this.viewer.activate()
			}
		}
		return this
	}

	pause(name: string | AnimationClip) {
		if (this.mixer) {
			const clip = this.findIfRunning(name)
			if (clip) {
				this.mixer.clipAction(clip).fadeOut(0.2).stop()
				this.runningActions.splice(this.runningActions.indexOf(clip.name), 1)
				this.runningActions.length || this.viewer.activate()
			}
		}
		return this
	}

	playAll(users?: boolean) {
		if (users) {
			for (const key in this.animates) {
				this.animates[key].start(this)
			}
		} else if (this.mixer) {
			this.runningActions = this.clips.map((clip) => (this.mixer?.clipAction(clip).play(), clip.name))
			this.viewer.activate()
		}
		return this
	}

	pauseAll(users?: boolean) {
		if (users) {
			for (const key in this.animates) {
				this.animates[key].stop(this)
			}
		} else if (this.mixer) {
			this.mixer.stopAllAction()
			this.runningActions = []
			this.viewer.activate()
		}
		return this
	}

	// @overwrite
	clear(users?: boolean) {
		if (users) {
			for (const key in this.animates) {
				this.animates[key].stop()
			}
			this.animates = {}
		} else if (this.mixer) {
			this.mixer.stopAllAction().uncacheRoot(this.mixer.getRoot())
			this.clips = []
			this.actions = {}
			this.runningActions = []
			this.mixer = undefined
		}
	}

	// @overwrite
	dispose() {
		this.clear(true)
		this.clear(false)
	}
}

export interface ThreeAnimatorOptions {
	// @TODO
}

export interface ThreeAnimateOptions {
	position: Vector3
	up?: Vector3
	target?: Vector3
	duration?: number
	autoStart?: boolean
}

export { ThreeAnimator }
