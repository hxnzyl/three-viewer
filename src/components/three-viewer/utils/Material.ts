import { CanvasTexture, Material, Sprite, SpriteMaterial } from 'three'

class ThreeMaterialUtils {
	static materialToArray<T = Material>(materials: Material | Material[]): T[] {
		return Array.isArray(materials) ? (materials as T[]) : [materials as T]
	}

	static createTextMaterial(
		text: string,
		width: number,
		height: number,
		font: string,
		fillStyle: string | CanvasGradient | CanvasPattern
	) {
		const canvas2d = document.createElement('canvas'),
			context2d = canvas2d.getContext('2d')!
		context2d.font = font
		const textMetrics = context2d.measureText(text),
			textWidth = textMetrics.width,
			textAscent = textMetrics.actualBoundingBoxAscent
		canvas2d.width = width
		canvas2d.height = height
		context2d.font = font
		context2d.fillStyle = fillStyle
		context2d.fillText(text, (width - textWidth) / 2, (height + textAscent) / 2)
		const canvasTexture = new CanvasTexture(canvas2d)
		const spriteMaterial = new SpriteMaterial({ map: canvasTexture })
		const sprite = new Sprite(spriteMaterial)
		sprite.renderOrder = 100
		return sprite
	}
}

export default ThreeMaterialUtils
