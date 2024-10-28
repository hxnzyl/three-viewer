'use client'

import ThreeViewer from '@/components/three-viewer'
import { ThreeViewerOptions } from '@/components/three-viewer/core/Viewer'
import { ThreeAxesHelper } from '@/components/three-viewer/helpers/AxesHelper'
import { ThreeViewCubeHelper } from '@/components/three-viewer/helpers/ViewCubeHelper'

export default function HomePage() {
	const options: ThreeViewerOptions = {
		plugins: [new ThreeViewCubeHelper(), new ThreeAxesHelper()]
	}

	return <ThreeViewer url="/models/Cube.gltf" options={options}></ThreeViewer>
}
