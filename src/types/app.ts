import { LucideProps } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'

export type LucideIconName = keyof typeof dynamicIconImports

export interface LucideIconProps extends LucideProps {
	name: LucideIconName
}

export type ThemeName = 'dark' | 'light'

export interface Theme {
	code: string
	name: ThemeName
	icon: LucideIconProps['name']
}

export interface NavLink {
	href: string
	text: string
	icon: LucideIconName
}

export interface AppConfig {
	theme: Theme
	[name: string]: any
}
