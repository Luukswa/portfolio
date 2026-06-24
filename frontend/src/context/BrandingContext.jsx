import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export const THEMES = {
  standaard: {
    '--primary': '#0d4c92',
    '--primary-dark': '#0a3d78',
    '--primary-light': 'rgba(13,76,146,0.08)',
    '--primary-dim': '#dbeafe',
    '--secondary': '#09afd9',
    '--secondary-light': 'rgba(9,175,217,0.12)',
    '--scrollbar-thumb': 'rgba(13,76,146,0.28)',
    '--sans': "'Barlow', sans-serif",
    '--title': "'Titillium Web', sans-serif",
  },
  genseler: {
    '--primary': '#00bcdf',
    '--primary-dark': '#006684',
    '--primary-light': 'rgba(0,188,223,0.08)',
    '--primary-dim': '#cff4fc',
    '--secondary': '#ed1c24',
    '--secondary-light': 'rgba(237,28,36,0.12)',
    '--scrollbar-thumb': 'rgba(0,188,223,0.28)',
    '--sans': "'Source Sans 3', 'Segoe UI', system-ui, sans-serif",
    '--title': "'Century Gothic', CenturyGothic, AppleGothic, 'Trebuchet MS', sans-serif",
  },
}

function applyTheme(name) {
  const vars = THEMES[name] || THEMES.standaard
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

const DEFAULT = { appName: 'Portfolio', primaryColor: '#0d4c92', logoUrl: '/logo.png', theme: 'standaard' }

const BrandingContext = createContext({ ...DEFAULT, setTheme: () => {} })

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT)

  useEffect(() => {
    fetch('/api/config/branding')
      .then(r => r.json())
      .then(data => {
        document.title = data.appName || DEFAULT.appName
        applyTheme(data.theme || 'standaard')
        setBranding({ ...DEFAULT, ...data })
      })
      .catch(() => {})
  }, [])

  const setTheme = useCallback((name) => {
    applyTheme(name)
    setBranding(b => ({ ...b, theme: name }))
  }, [])

  return (
    <BrandingContext.Provider value={{ ...branding, setTheme }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
