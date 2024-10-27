import LucideIcon from '@/components/icon/LucideIcon'
import { appThemes } from '@/config/app'
import { AppContext } from '@/context/app'
import { useContext } from 'react'

export default function ThemeSelect() {
	const { theme, setTheme } = useContext(AppContext)

	return (
		<div
			className="absolute right-5 bottom-5 cursor-pointer"
			onClick={() => setTheme(appThemes[theme.code === 'dark' ? 0 : 1])}
		>
			{<LucideIcon name={theme.code === 'dark' ? 'sun' : 'moon'} />}
		</div>
	)
}
