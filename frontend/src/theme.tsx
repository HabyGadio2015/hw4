import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface ThemeState {
  gameDay: boolean
  calm: boolean
  burst: number
  toggleGameDay: () => void
  toggleCalm: () => void
  celebrate: () => void
}

const ThemeContext = createContext<ThemeState | null>(null)

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const saved = window.localStorage.getItem(key)
    return saved === null ? fallback : saved === '1'
  } catch {
    return fallback
  }
}

function saveFlag(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // private browsing: the setting just won't be remembered
  }
}

// Game Day (blue + crimson rivalry look) and Calm mode (no motion). Both are saved in the browser and
// applied as data attributes on <html>, which the CSS reads. Calm starts on for visitors who prefer reduced motion.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [gameDay, setGameDay] = useState(() => readFlag('cc_gameday', false))
  const [calm, setCalm] = useState(() => readFlag('cc_calm', window.matchMedia('(prefers-reduced-motion: reduce)').matches))
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    document.documentElement.dataset.gameday = String(gameDay)
    saveFlag('cc_gameday', gameDay)
  }, [gameDay])

  useEffect(() => {
    document.documentElement.dataset.calm = String(calm)
    saveFlag('cc_calm', calm)
  }, [calm])

  const value = useMemo<ThemeState>(
    () => ({
      gameDay,
      calm,
      burst,
      toggleGameDay: () => {
        if (!gameDay) setBurst((b) => b + 1)
        setGameDay(!gameDay)
      },
      toggleCalm: () => setCalm(!calm),
      celebrate: () => setBurst((b) => b + 1),
    }),
    [gameDay, calm, burst],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
