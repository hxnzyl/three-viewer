import { ThreeViewer } from '../core/Viewer'

class ThreeEventUtils {
	static addMouseEventListener(options: ThreeMouseEventOptions) {
		const { viewer, dom, click, move, drag = false } = options
		let lock = false
		if (move || click) {
			const onDown = (downEvent: MouseEvent) => {
				if (lock) return
				lock = true
				if (!click) return
				const draggable = move && drag && click(downEvent, 'down')
				viewer.activate()
				draggable && dom.addEventListener('mousemove', move, false)
				const onUp = (upEvent: MouseEvent) => {
					window.removeEventListener('mouseup', onUp)
					draggable && dom.removeEventListener('mousemove', move)
					if (!lock) return
					// no move, moved
					downEvent.offsetX == upEvent.offsetX && downEvent.offsetY == upEvent.offsetY
						? click(downEvent, 'click')
						: draggable && click(upEvent, 'up')
					lock = false
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
	click?: false | ((event: MouseEvent, from: 'down' | 'up' | 'click') => void | boolean)
	move?: false | ((event: MouseEvent) => void)
	drag?: boolean
}

export default ThreeEventUtils
