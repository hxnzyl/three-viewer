import { useEffect } from 'react'
import { ThreeViewer, ThreeViewerOptions } from './core/Viewer'

export default function ThreeViewerComponent(props: { url: string; options: ThreeViewerOptions }) {
	useEffect(() => {
		// mounted
		let viewer = new ThreeViewer(props.options)
		viewer.loadUrl(props.url)

		// unmounted
		return () => {
			viewer.dispose()
			viewer = null as any
		}
	}, [props])

	return <div id="three-viewer" className="flex-shrink-0 w-full"></div>
}
