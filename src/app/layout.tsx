'use client'

import '@/assets/globals.css'
import LayoutDefault from '@/components/layout/default'
import { AppContext } from '@/context/app'
import localStorage from '@/lib/localStorage'
import { cn } from '@/lib/utils'
import { Theme } from '@/types/app'
import localFont from 'next/font/local'
import { useEffect, useState } from 'react'

const themes: Theme[] = [
	{ name: 'light', code: 'light', icon: 'sun' },
	{ name: 'dark', code: 'dark', icon: 'moon' }
]

const defaultTheme: Theme = JSON.parse(localStorage.getItem('theme') || 'null') || themes[0]

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
	let [theme, setTheme] = useState(defaultTheme)

	// 只会在组件首次渲染时执行一次
	useEffect(() => {
		setInitializeRenderCompleted(true)
	}, [])

	const onSelectTheme = (_theme: Theme) => {
		theme = _theme
		setTheme(_theme)
		localStorage.setItem('theme', JSON.stringify(_theme))
	}

	return (
		<html lang="en" suppressHydrationWarning>
			<head />
			<body
				className={cn(
					`min-h-screen bg-background antialiased`,
					geistSans.variable,
					geistMono.variable,
					initializeRenderCompleted && theme.code
				)}
			>
				<AppContext.Provider value={{ theme, setTheme: onSelectTheme }}>
					{initializeRenderCompleted && <LayoutDefault>{children}</LayoutDefault>}
				</AppContext.Provider>
			</body>
		</html>
	)
}
