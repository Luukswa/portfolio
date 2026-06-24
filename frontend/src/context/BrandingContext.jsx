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
    '--primary': '#006684',
    '--primary-dark': '#004e63',
    '--primary-light': 'rgba(0,102,132,0.08)',
    '--primary-dim': '#cce9f2',
    '--secondary': '#ed1c24',
    '--secondary-light': 'rgba(237,28,36,0.12)',
    '--scrollbar-thumb': 'rgba(0,102,132,0.28)',
    '--sans': "'Source Sans 3', 'Segoe UI', system-ui, sans-serif",
    '--title': "'Century Gothic', CenturyGothic, AppleGothic, 'Trebuchet MS', sans-serif",
  },
}

function applyTheme(name) {
  const vars = THEMES[name] || THEMES.standaard
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  try { localStorage.setItem('theme', name) } catch (_) {}
}

// Apply cached theme before first render to prevent flash
;(function () {
  try {
    const cached = localStorage.getItem('theme')
    if (cached && THEMES[cached]) {
      const root = document.documentElement
      Object.entries(THEMES[cached]).forEach(([k, v]) => root.style.setProperty(k, v))
    }
  } catch (_) {}
})()

const DEFAULT = { appName: 'Portfolio', primaryColor: '#0d4c92', logoUrl: '', theme: 'standaard' }

const BrandingContext = createContext({ ...DEFAULT, setTheme: () => {}, refreshBranding: () => {} })

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT)

  function load() {
    return fetch('/api/config/branding')
      .then(r => r.json())
      .then(data => {
        document.title = data.appName || DEFAULT.appName
        applyTheme(data.theme || 'standaard')
        setBranding({ ...DEFAULT, ...data })
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const setTheme = useCallback((name) => {
    applyTheme(name)
    setBranding(b => ({ ...b, theme: name }))
  }, [])

  const refreshBranding = useCallback(() => load(), [])

  return (
    <BrandingContext.Provider value={{ ...branding, setTheme, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
