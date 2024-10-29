'use client'

import '@/assets/globals.css'
import LayoutDefault from '@/components/layout/default'
import { cn } from '@/lib/utils'
import localFont from 'next/font/local'
import { useEffect, useState } from 'react'

const geistSans = localFont({
	src: '../assets/fonts/GeistVF.woff',
	variable: '--font-geist-sans',
	weight: '100 900'
})

const geistMono = localFont({
	src: '../assets/fonts/GeistMonoVF.woff',
	variable: '--font-geist-mono',
	weight: '100 900'
})

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	const [initializeRenderCompleted, setInitializeRenderCompleted] = useState<boolean>(false)

	// 只会在组件首次渲染时执行一次
	useEffect(() => {
		setInitializeRenderCompleted(true)
	}, [])

	return (
		<html lang="en" suppressHydrationWarning>
			<head />
			<body className={cn(`min-w-screen min-h-screen bg-background antialiased`, geistSans.variable, geistMono.variable)}>
				{initializeRenderCompleted && <LayoutDefault>{children}</LayoutDefault>}
			</body>
		</html>
	)
}
