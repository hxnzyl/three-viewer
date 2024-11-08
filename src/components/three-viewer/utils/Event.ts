import { ThreeViewer } from '../core/Viewer'
import ThreeVectorUtils from './Vector'

class ThreeEventUtils {
	static addMouseEventListener(options: ThreeMouseEventOptions) {
		const { viewer, dom, click, move, prevent, stop, drag = false } = options
		let lock = false
		if (move || click) {
			const onDown = (downEvent: MouseEvent) => {
				const downTime = performance.now()
				prevent && downEvent.preventDefault()
				stop && downEvent.stopPropagation()
				if (lock) return
				lock = true
				if (!click) return
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
					// not moved Situation 1: when the interval between down and up is within 200ms
					performance.now() < downTime + 200 ||
					// not moved Situation 2: when the coordinates of the down and up events are the same
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
}

export interface ThreeMouseEventOptions {
	viewer: ThreeViewer
	dom: HTMLElement
	prevent?: boolean
	stop?: boolean
	click?: false | ((event: MouseEvent, from: 'down' | 'up' | 'click') => void | boolean)
	move?: false | ((event: MouseEvent) => void)
	drag?: boolean
}

export default ThreeEventUtils
