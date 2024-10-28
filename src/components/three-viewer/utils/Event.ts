import { ThreeViewer } from '../core/Viewer'

class ThreeEventUtils {
	static addMouseEventListener(options: ThreeMouseEventOptions) {
		const { viewer, dom, click, move, drag = false, throttle = false } = options
		const manage = { lock: false }
		if (move || click) {
			viewer.listener.push(
				dom,
				'mousedown',
				function down(downEvent: MouseEvent) {
					if (manage.lock) return
					manage.lock = true
					if (!click) return
					const draggable = move && drag && click(downEvent, 'down')
					viewer.activate()
					draggable && dom.addEventListener('mousemove', move, false)
					window.addEventListener(
						'mouseup',
						function up(upEvent: MouseEvent) {
							if (!manage.lock) return
							draggable && dom.removeEventListener('mousemove', move)
							window.removeEventListener('mouseup', up)
							if (downEvent.offsetX == upEvent.offsetX && downEvent.offsetY == upEvent.offsetY) {
								// no move
								click(downEvent, 'click')
							} else {
								// moved
								draggable && click(upEvent, 'up')
							}
							if (!throttle) {
								manage.lock = false
							}
						},
						false
					)
				},
				false
			)
		}
		// only move, and exclude drag
		if (move && !drag) {
			viewer.listener.push(
				dom,
				'mousemove',
				function (moveEvent: MouseEvent) {
					if (manage.lock) return
					viewer.activate()
					move(moveEvent)
				},
				false
			)
		}
		// if throttle then manually release lock
		return throttle ? manage : { lock: false }
	}
}

export interface ThreeMouseEventOptions {
	viewer: ThreeViewer
	dom: HTMLElement
	throttle?: boolean
	click?: false | ((event: MouseEvent, from: 'down' | 'up' | 'click') => void | boolean)
	move?: false | ((event: MouseEvent) => void)
	drag?: boolean
}

export default ThreeEventUtils
