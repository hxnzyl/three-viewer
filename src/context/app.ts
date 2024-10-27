import { AppConfig } from '@/types/app'
import { Context, createContext } from 'react'

export const AppContext: Context<AppConfig> = createContext<AppConfig>({} as AppConfig)
