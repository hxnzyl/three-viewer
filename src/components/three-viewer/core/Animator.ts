import { AnimationAction, AnimationClip, AnimationMixer, Clock, Vector3 } from 'three'
import { Tween } from 'three/examples/jsm/libs/tween.module'
import { AnyObject } from '../types'
import { extend } from '../utils/extend'
import { ThreeAnimate } from './Animate'
import { ThreeViewer } from './Viewer'

class ThreeAnimator {
	static Options: ThreeAnimatorOptions = {}

	name = 'Animator'
	viewer!: ThreeViewer
	options = {} as Required<ThreeAnimatorOptions>
	clock: Clock
	mixer?: AnimationMixer

	tweens: AnyObject<Tween<AnyObject>, string | number> = {}
	clips: AnimationClip[] = []
	actions: AnyObject<AnimationAction> = {}
	runningActions: string[] = []

	constructor(options?: ThreeAnimatorOptions) {
		// super()
		this.clock = new Clock()
		this.setOptions(options)
	}

	initialize(viewer: ThreeViewer): void {
		this.viewer = viewer
	}

	setOptions(options?: ThreeAnimatorOptions) {
		this.options = extend(true, {}, ThreeAnimator.Options, options || {})
	}

	render() {
		// update users animates
		for (const key in this.tweens) {
			this.tweens[key].update()
		}
		// from created to current seconds
		this.mixer?.update(this.clock.getDelta())
	}

	dispose(): void {
		this.removeClips()
		this.tweens = {}
	}

	animate(animater: ThreeAnimate) {
		const reconcile = animater.reconcile(this.viewer)
		if (!reconcile) return

		const { from, to, update, complete } = reconcile
		const { autoStart, duration, easing } = animater.options

		const tween = new Tween(from).to(to, duration).easing(easing)
		const tweenId = tween.getId()
		this.tweens[tweenId] = tween

		tween.onUpdate(update).onComplete((object: AnyObject) => {
			delete this.tweens[tweenId]
			complete && complete(object)
		})

		if (autoStart) {
			tween.start()
		}
	}

	updateClips(clips: AnimationClip[]) {
		const { object } = this.viewer
		if (!object) return
		this.removeClips()
		this.clips = clips
		this.actions = {}
		this.runningActions = []
		if (clips.length == 0) {
			this.mixer = undefined
		} else {
			this.mixer = new AnimationMixer(object)
			// play idle animate
			for (const clip of clips) {
				if (clip.name === 'Idle') {
					this.playClip(clip)
				}
				this.actions[clip.name] = this.mixer.clipAction(clip)
			}
		}
	}

	clipIsRunning(name: string) {
		return this.runningActions.includes(name)
	}

	findClip(name: string | AnimationClip) {
		return typeof name === 'string' ? this.clips.find((clip) => clip.name === name) : name
	}

	findClipIfIdle(name: string | AnimationClip) {
		const clip = this.findClip(name)
		return clip && !this.clipIsRunning(clip.name) ? clip : undefined
	}

	findClipIfRunning(name: string | AnimationClip) {
		const clip = this.findClip(name)
		return clip && this.clipIsRunning(clip.name) ? clip : undefined
	}

	playClip(name: string | AnimationClip) {
		if (this.mixer) {
			const clip = this.findClip(name)
			if (clip) {
				this.mixer.clipAction(clip).reset().play()
				this.runningActions.push(clip.name)
				this.viewer.activate()
			}
		}
	}

	pauseClip(name: string | AnimationClip) {
		if (this.mixer) {
			const clip = this.findClipIfRunning(name)
			if (clip) {
				this.mixer.clipAction(clip).reset().stop()
				this.runningActions.splice(this.runningActions.indexOf(clip.name), 1)
				this.runningActions.length || this.viewer.activate()
			}
		}
	}

	playAllClips() {
		if (this.mixer) {
			this.runningActions = this.clips.map((clip) => (this.mixer?.clipAction(clip).reset().play(), clip.name))
			this.viewer.activate()
		}
	}

	pauseAllClips() {
		if (this.mixer) {
			this.mixer.stopAllAction()
			this.runningActions = []
			this.viewer.activate()
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
