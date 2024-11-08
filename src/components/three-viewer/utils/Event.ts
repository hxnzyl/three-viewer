import { ThreeViewer } from '../core/Viewer'
import { NumberObject } from '../types'
import ThreeVectorUtils from './Vector'

class ThreeEventUtils {
	static addMouse(options: ThreeMouseEventOptions) {
		const { viewer, dom, click, move, prevent, stop, drag = false } = options
		let lock = false
		if (move || click) {
			const onDown = (downEvent: MouseEvent) => {
				prevent && downEvent.preventDefault()
				stop && downEvent.stopPropagation()
				if (lock) return
				lock = true
				if (!click) return
				const downTime = performance.now()
				// Activate Render
				viewer.activate()
				// Draggable mode
				const draggable = move && drag && click(downEvent, 'down')
				draggable && dom.addEventListener('mousemove', move, false)
				const onUp = (upEvent: MouseEvent) => {
					window.removeEventListener('mouseup', onUp)
					draggable && dom.removeEventListener('mousemove', move)
					if (!lock) return
					lock = false
					// click Situation 1: when the interval between down and up is within 200ms
					performance.now() < downTime + 200 ||
					// click Situation 2: when the coordinates of the down and up events are the same
					ThreeVectorUtils.areExpand2Close(downEvent.offsetX, downEvent.offsetY, upEvent.offsetX, upEvent.offsetY)
						? click(downEvent, 'click')
						: draggable && click(upEvent, 'up')
				}
				window.addEventListener('mouseup', onUp, false)
			}
			viewer.listener.push(dom, 'mousedown', onDown, false)
		}
		// only move, and exclude drag
		if (move && !drag) {
			const onMove = (moveEvent: MouseEvent) => {
				if (lock) return
				viewer.activate()
				move(moveEvent)
			}
			viewer.listener.push(dom, 'mousemove', onMove, false)
		}
	}

	static addKeyboard(options: ThreeKeyBoardEventOptions) {
		const { viewer, press, prevent, stop, keys } = options
		const downKeys: NumberObject = {}
		let downTime = 0,
			downKeyS: ThreeKeyboardEventKey[] = [],
			downEvent: KeyboardEvent
		const onDown = (event: KeyboardEvent) => {
			if (keys) {
				if (!keys.includes(event.key as ThreeKeyboardEventKey)) return
				downKeys[event.key] = 1
				downKeyS = Object.keys(downKeys) as ThreeKeyboardEventKey[]
			}
			prevent && event.preventDefault()
			stop && event.stopPropagation()
			press(event, 'down', downKeyS)
			downEvent = event
			downTime = performance.now()
		}
		const onUp = (upEvent: KeyboardEvent) => {
			if (keys) {
				delete downKeys[upEvent.key]
				downKeyS = Object.keys(downKeys) as ThreeKeyboardEventKey[]
			}
			// when the interval between down and up is within 200ms
			if (performance.now() < downTime + 200) {
				press(downEvent, 'press', downKeyS)
			} else {
				press(upEvent, 'up', downKeyS)
			}
		}
		viewer.listener.push(window, 'keydown', onDown, false)
		viewer.listener.push(window, 'keyup', onUp, false)
	}
}

export const ThreeKeyboardEventGroup: string[] = ['wa', 'wd', 'aw', 'as', 'sa', 'sd', 'dw', 'ds']

export interface ThreeMouseEventOptions {
	viewer: ThreeViewer
	dom: HTMLElement
	prevent?: boolean
	stop?: boolean
	click?: (event: MouseEvent, from: 'down' | 'up' | 'click') => void | boolean
	move?: (event: MouseEvent) => void
	drag?: boolean
}

export type ThreeKeyboardEventKey =
	| 'w'
	| 'a'
	| 's'
	| 'd'
	| 'Enter'
	| 'ArrowDown'
	| 'ArrowUp'
	| 'ArrowLeft'
	| 'ArrowRight'
	| ' '

export type ThreeKeyboardEventKeys = ThreeKeyboardEventKey | 'wa' | 'wd' | 'aw' | 'as' | 'sa' | 'sd' | 'dw' | 'ds'

export interface ThreeKeyBoardEventOptions {
	viewer: ThreeViewer
	prevent?: boolean
	stop?: boolean
	press: (event: KeyboardEvent, from: 'down' | 'up' | 'press', keys: ThreeKeyboardEventKey[]) => void | boolean
	keys?: ThreeKeyboardEventKey[]
}

export default ThreeEventUtils
