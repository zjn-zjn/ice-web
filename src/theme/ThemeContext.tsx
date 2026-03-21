import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemeMode
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
})

const STORAGE_KEY = 'ice-theme'

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
