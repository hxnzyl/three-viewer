'use client'

import ThreeViewer from '@/components/three-viewer'
import { ThreeActionControls } from '@/components/three-viewer/controls/ActionControls'
import { ThreeViewerOptions } from '@/components/three-viewer/core/Viewer'
import { ThreeShineEffect } from '@/components/three-viewer/effects/ShineEffect'
import { ThreeAxesHelper } from '@/components/three-viewer/helpers/AxesHelper'
import { ThreeGUIHelper } from '@/components/three-viewer/helpers/GUIHelper'
import { ThreeGridHelper } from '@/components/three-viewer/helpers/GridHelper'
import { ThreeViewCubeHelper } from '@/components/three-viewer/helpers/ViewCubeHelper'
import { ThreeBackgroundShader } from '@/components/three-viewer/shaders/BackgroundShader'

export default function HomePage() {
	const options: ThreeViewerOptions = {
		plugins: [
			new ThreeGridHelper(),
			new ThreeAxesHelper(),
			new ThreeViewCubeHelper(),
			new ThreeGUIHelper(),
			new ThreeShineEffect(),
			new ThreeBackgroundShader(),
			new ThreeActionControls()
		]
	}

	return <ThreeViewer url="/models/Robot.glb" options={options}></ThreeViewer>
}
