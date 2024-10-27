import { AppConfig, Theme } from '@/types/app'

export const appThemes: Theme[] = [
	{ name: 'light', code: 'light', icon: 'sun' },
	{ name: 'dark', code: 'dark', icon: 'moon' }
]

export const appConfig: AppConfig = {
	theme: appThemes[0]
}
