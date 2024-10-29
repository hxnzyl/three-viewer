import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: '3D Models Viewer',
	description: '3D Models Viewer create by OWen'
}

export default function LayoutDefault({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return <main>{children}</main>
}
