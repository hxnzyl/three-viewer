'use client'

import ThreeViewer from '@/components/three-viewer'
import { ThreeViewerOptions } from '@/components/three-viewer/core/Viewer'
import { ThreeAxesHelper } from '@/components/three-viewer/helpers/AxesHelper'
import { ThreeCameraHelper } from '@/components/three-viewer/helpers/CameraHelper'
import { ThreeGridHelper } from '@/components/three-viewer/helpers/GridHelper'
import { ThreeViewCubeHelper } from '@/components/three-viewer/helpers/ViewCubeHelper'

export default function HomePage() {
	const options: ThreeViewerOptions = {
		plugins: [new ThreeViewCubeHelper(), new ThreeAxesHelper(), new ThreeGridHelper(), new ThreeCameraHelper()]
	}

	return <ThreeViewer url="/models/Cube.gltf" options={options}></ThreeViewer>
}
